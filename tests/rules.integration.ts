import { migrateV1 } from "../scripts/migrations/v1-upgrade.mjs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it } from "vitest";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getBytes, listAll } from "firebase/storage";
let env: RulesTestEnvironment;
const share = "a".repeat(48);
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-inviteflow",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      host: "127.0.0.1",
      port: 9199,
      rules: readFileSync("storage.rules", "utf8"),
    },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "tenants/alice/invitations/event"), {
      title: "Our day",
      status: "published",
      design: { background: "#fff", elements: [] },
    });
    await setDoc(doc(db, "publicInvitations", share), {
      ownerUid: "alice",
      invitationId: "event",
      guestId: "guest",
      guestDisplayName: "Sarah",
      guestCountAllowed: 2,
      publishedSnapshot: { title: "Our day" },
      status: "active",
      createdAt: serverTimestamp(),
    });
  });
}, 30000);
afterAll(async () => {
  await env?.cleanup();
});
describe("Tenant isolation", () => {
  it("allows invitation CRUD for its owner", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const r = doc(db, "tenants/alice/invitations/new");
    await assertSucceeds(
      setDoc(r, { title: "Birthday", status: "draft", design: {} }),
    );
    await assertSucceeds(updateDoc(r, { title: "New title" }));
    await assertSucceeds(getDoc(r));
    await assertSucceeds(deleteDoc(r));
  });
  it("denies cross-tenant reads and writes", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(db, "tenants/alice/invitations/event")));
    await assertFails(
      setDoc(doc(db, "tenants/alice/invitations/attack"), {
        title: "Attack",
        status: "draft",
        design: {},
      }),
    );
    await assertFails(getDocs(collection(db, "tenants/alice/invitations")));
  });
  it("allows guest creation and editing only to the owner", async () => {
    const a = env.authenticatedContext("alice").firestore(),
      b = env.authenticatedContext("bob").firestore();
    const path = "tenants/alice/invitations/event/guests/new";
    await assertSucceeds(
      setDoc(doc(a, path), {
        name: "Sarah",
        phoneNumber: "+94771234567",
        guestCountAllowed: 2,
      }),
    );
    await assertSucceeds(updateDoc(doc(a, path), { name: "Sam" }));
    await assertFails(getDoc(doc(b, path)));
    await assertFails(updateDoc(doc(b, path), { name: "Attack" }));
  });
  it("prevents changing tenant/profile ownership", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(db, "tenants/alice"), {
        name: "Bad",
        ownerId: "bob",
        createdAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(db, "users/alice"), {
        name: "Alice",
        email: "alice@example.test",
        tenantId: "alice",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(doc(db, "users/alice"), { tenantId: "bob" }));
  });
});
describe("Public capabilities", () => {
  it("supports separate named responses on an open link without exposing the response list", async () => {
    const id = "b".repeat(48),
      a = env.authenticatedContext("alice").firestore(),
      guest = env.unauthenticatedContext().firestore();
    await assertSucceeds(
      setDoc(doc(a, "publicInvitations", id), {
        mode: "open",
        ownerUid: "alice",
        invitationId: "event",
        guestId: "",
        guestDisplayName: "",
        guestCountAllowed: 1,
        publishedSnapshot: { title: "Our day" },
        status: "active",
        createdAt: serverTimestamp(),
      }),
    );
    for (const [key, name, status] of [
      ["c".repeat(48), "Sam", "accepted"],
      ["d".repeat(48), "Alex", "declined"],
    ])
      await assertSucceeds(
        setDoc(doc(guest, "publicInvitations", id, "response", key), {
          respondentName: name,
          rsvpStatus: status,
          attendeesCount: status === "accepted" ? 1 : 0,
          respondedAt: serverTimestamp(),
        }),
      );
    await assertFails(
      getDocs(collection(guest, "publicInvitations", id, "response")),
    );
    await assertFails(
      getDocs(
        collection(
          env.authenticatedContext("bob").firestore(),
          "publicInvitations",
          id,
          "response",
        ),
      ),
    );
    await assertSucceeds(
      getDocs(collection(a, "publicInvitations", id, "response")),
    );
    await assertFails(
      setDoc(doc(guest, "publicInvitations", id, "response", "current"), {
        respondentName: "Sam",
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(a, "publicInvitations", id), { status: "revoked" }),
    );
    await assertFails(
      setDoc(doc(guest, "publicInvitations", id, "response", "e".repeat(48)), {
        respondentName: "Taylor",
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondedAt: serverTimestamp(),
      }),
    );
  });
  it("requires a real name and only accept or decline for new responses", async () => {
    const r = doc(
      env.unauthenticatedContext().firestore(),
      "publicInvitations",
      share,
      "response/current",
    );
    const payload = {
      rsvpStatus: "accepted",
      attendeesCount: 1,
      respondedAt: serverTimestamp(),
    };
    await assertFails(setDoc(r, payload));
    for (const respondentName of ["", "   ", 123, "a".repeat(161)])
      await assertFails(setDoc(r, { ...payload, respondentName }));
    await assertFails(
      setDoc(r, {
        ...payload,
        respondentName: "Sarah",
        rsvpStatus: "maybe",
        attendeesCount: 0,
      }),
    );
    await assertFails(
      setDoc(r, { ...payload, respondentName: "Sarah", attendeesCount: 2 }),
    );
    await assertSucceeds(
      setDoc(r, { ...payload, respondentName: "Sarah Lee" }),
    );
  });
  it("allows direct active invitation reads but denies all listing", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "publicInvitations", share)));
    await assertFails(getDocs(collection(db, "publicInvitations")));
    await assertFails(
      getDocs(collection(db, "publicInvitations", share, "response")),
    );
  });
  it("accepts RSVPs and response changes without counter writes", async () => {
    const db = env.unauthenticatedContext().firestore(),
      r = doc(db, "publicInvitations", share, "response/current");
    await assertSucceeds(
      setDoc(r, {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(r, {
        rsvpStatus: "declined",
        attendeesCount: 0,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(r, {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
  });
  it("rejects invalid status, counts, timestamps, IDs and unexpected fields", async () => {
    const db = env.unauthenticatedContext().firestore(),
      r = doc(db, "publicInvitations", share, "response/current");
    for (const d of [
      { rsvpStatus: "invalid", attendeesCount: 1 },
      { rsvpStatus: "accepted", attendeesCount: 3 },
      { rsvpStatus: "accepted", attendeesCount: -1 },
      { rsvpStatus: "accepted", attendeesCount: 1.5 },
      { rsvpStatus: "declined", attendeesCount: 1 },
      { rsvpStatus: "accepted", attendeesCount: 1, title: "Attack" },
    ])
      await assertFails(
        setDoc(r, {
          ...d,
          respondentName: "Sarah",
          respondedAt: serverTimestamp(),
        }),
      );
    await assertFails(
      setDoc(r, {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: new Date(0),
      }),
    );
    await assertFails(
      setDoc(doc(db, "publicInvitations", share, "response/evil"), {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
  });
  it("denies public private-record and ownership edits", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(
      updateDoc(doc(db, "publicInvitations", share), { ownerUid: "attacker" }),
    );
    await assertFails(
      updateDoc(doc(db, "publicInvitations", share), {
        publishedSnapshot: { title: "Attack" },
      }),
    );
    await assertFails(
      updateDoc(doc(db, "tenants/alice/invitations/event"), {
        title: "Attack",
      }),
    );
    await assertFails(getDoc(doc(db, "tenants/alice/invitations/event")));
  });
  it("does not let an owner transfer a share", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(
      updateDoc(doc(db, "publicInvitations", share), { ownerUid: "bob" }),
    );
  });
  it("revocation blocks reads and responses", async () => {
    const db = env.authenticatedContext("alice").firestore(),
      guest = env.unauthenticatedContext().firestore();
    await assertSucceeds(
      updateDoc(doc(db, "publicInvitations", share), { status: "revoked" }),
    );
    await assertFails(getDoc(doc(guest, "publicInvitations", share)));
    await assertFails(
      setDoc(doc(guest, "publicInvitations", share, "response/current"), {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "publicInvitations", share), { status: "active" }),
    );
  });
  it("archiving the source event blocks even a stale active snapshot", async () => {
    const db = env.authenticatedContext("alice").firestore(),
      guest = env.unauthenticatedContext().firestore();
    await updateDoc(doc(db, "tenants/alice/invitations/event"), {
      status: "archived",
    });
    await assertFails(getDoc(doc(guest, "publicInvitations", share)));
    await assertFails(
      setDoc(doc(guest, "publicInvitations", share, "response/current"), {
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondentName: "Sarah",
        respondedAt: serverTimestamp(),
      }),
    );
    await updateDoc(doc(db, "tenants/alice/invitations/event"), {
      status: "published",
    });
  });
});
describe("Storage", () => {
  it("accepts owner images and rejects cross-tenant reads/writes, listing, bad types and oversized uploads", async () => {
    const a = env.authenticatedContext("alice").storage(),
      b = env.authenticatedContext("bob").storage(),
      guest = env.unauthenticatedContext().storage();
    const path = "tenants/alice/templates/art";
    await assertSucceeds(
      uploadBytes(ref(a, path), new Uint8Array([1, 2, 3]), {
        contentType: "image/png",
      }),
    );
    await assertFails(
      uploadBytes(ref(b, path), new Uint8Array([1]), {
        contentType: "image/png",
      }),
    );
    await assertFails(getBytes(ref(b, path)));
    await assertFails(getBytes(ref(guest, path)));
    await assertFails(listAll(ref(a, "tenants/alice/templates")));
    await assertFails(
      uploadBytes(ref(a, "tenants/alice/templates/bad"), new Uint8Array([1]), {
        contentType: "text/html",
      }),
    );
    await assertFails(
      uploadBytes(
        ref(a, "tenants/alice/templates/big"),
        new Uint8Array(5 * 1024 * 1024),
        { contentType: "image/png" },
      ),
    );
  }, 30000);
});

describe("Upgrade security boundaries", () => {
  it("enforces deadlines on anonymous creates and updates while preserving legacy links", async () => {
    const owner = env.authenticatedContext("alice").firestore();
    const visitor = env.unauthenticatedContext().firestore();
    const id = "e".repeat(48);
    const publicRef = doc(owner, "publicInvitations", id);
    await assertSucceeds(
      setDoc(publicRef, {
        ownerUid: "alice",
        invitationId: "event",
        guestId: "deadline-guest",
        guestDisplayName: "",
        guestCountAllowed: 1,
        publishedSnapshot: {
          rsvpDeadlineAt: Timestamp.fromMillis(Date.now() + 3600000),
        },
        status: "active",
        createdAt: serverTimestamp(),
      }),
    );
    const response = doc(
      visitor,
      "publicInvitations",
      id,
      "response",
      "current",
    );
    const payload = () => ({
      respondentName: "Alex",
      rsvpStatus: "accepted",
      attendeesCount: 1,
      respondedAt: serverTimestamp(),
    });
    await assertSucceeds(setDoc(response, payload()));
    await assertSucceeds(
      updateDoc(publicRef, {
        publishedSnapshot: { rsvpDeadlineAt: Timestamp.fromMillis(1000) },
      }),
    );
    await assertFails(setDoc(response, payload()));
    await assertSucceeds(
      deleteDoc(doc(owner, "publicInvitations", id, "response", "current")),
    );
    await assertFails(setDoc(response, payload()));
    await assertSucceeds(
      updateDoc(publicRef, { publishedSnapshot: { title: "Legacy" } }),
    );
    await assertSucceeds(setDoc(response, payload()));
    await assertFails(
      updateDoc(doc(visitor, "publicInvitations", id), {
        publishedSnapshot: {},
      }),
    );
  });
  it("isolates saved versions and favorites between tenants", async () => {
    const alice = env.authenticatedContext("alice").firestore(),
      bob = env.authenticatedContext("bob").firestore();
    const path = "tenants/alice/invitations/event/versions/checkpoint";
    await assertSucceeds(
      setDoc(doc(alice, path), {
        design: { elements: [] },
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(doc(bob, path)));
    await assertFails(updateDoc(doc(alice, path), { design: {} }));
    await assertFails(
      setDoc(doc(bob, "tenants/alice/templatePreferences/test"), {
        favorite: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice, "tenants/alice/templatePreferences/test"), {
        favorite: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("permits bounded owner audio uploads and rejects cross-tenant or disguised files", async () => {
    const alice = env.authenticatedContext("alice").storage(),
      bob = env.authenticatedContext("bob").storage(),
      visitor = env.unauthenticatedContext().storage();
    const path = "tenants/alice/invitations/event/audio-test";
    await assertSucceeds(
      uploadBytes(ref(alice, path), new Uint8Array(8), {
        contentType: "audio/mpeg",
      }),
    );
    await assertFails(
      uploadBytes(ref(bob, path), new Uint8Array(8), {
        contentType: "audio/mpeg",
      }),
    );
    await assertFails(
      uploadBytes(ref(visitor, path), new Uint8Array(8), {
        contentType: "audio/mpeg",
      }),
    );
    await assertFails(
      uploadBytes(ref(alice, path), new Uint8Array(8), {
        contentType: "text/html",
      }),
    );
    await assertFails(
      uploadBytes(ref(alice, path), new Uint8Array(10 * 1024 * 1024), {
        contentType: "audio/mpeg",
      }),
    );
  });
});

describe("Authenticated organizer check-in", () => {
  it("restricts check-in metadata to the owner with a server timestamp", async () => {
    const alice = env.authenticatedContext("alice").firestore(),
      bob = env.authenticatedContext("bob").firestore(),
      visitor = env.unauthenticatedContext().firestore();
    const path = "tenants/alice/invitations/event/guests/arrival";
    await assertSucceeds(
      setDoc(doc(alice, path), {
        name: "Guest",
        phoneNumber: "",
        guestCountAllowed: 1,
      }),
    );
    await assertFails(
      updateDoc(doc(visitor, path), {
        checkedInAt: serverTimestamp(),
        checkedInBy: "alice",
      }),
    );
    await assertFails(
      updateDoc(doc(bob, path), {
        checkedInAt: serverTimestamp(),
        checkedInBy: "bob",
      }),
    );
    await assertFails(
      updateDoc(doc(alice, path), {
        checkedInAt: Timestamp.fromMillis(1000),
        checkedInBy: "alice",
      }),
    );
    await assertFails(
      updateDoc(doc(alice, path), {
        checkedInAt: serverTimestamp(),
        checkedInBy: "bob",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice, path), {
        checkedInAt: serverTimestamp(),
        checkedInBy: "alice",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice, path), { name: "Updated guest" }),
    );
    await assertFails(getDoc(doc(visitor, path)));
  });
});

describe("Public custom RSVP schemas", () => {
  it("enforces required fields, supported types, choices, bounds and locked responses", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      visitor = env.unauthenticatedContext().firestore();
    const id = "f".repeat(48),
      publicRef = doc(owner, "publicInvitations", id);
    const questions = {
      q0: { label: "Note", type: "text", required: true },
      q1: { label: "Parking", type: "yesno", required: true },
      q2: {
        label: "Meal",
        type: "single",
        required: true,
        options: ["A", "B"],
      },
      q3: {
        label: "Activities",
        type: "multiple",
        required: true,
        options: ["A", "B"],
      },
      q4: { label: "Number", type: "number", required: true, min: 1, max: 5 },
      q5: {
        label: "Diet",
        type: "dietary",
        required: true,
        options: ["None", "Vegan"],
      },
    };
    await assertSucceeds(
      setDoc(publicRef, {
        ownerUid: "alice",
        invitationId: "event",
        guestId: "forms",
        guestDisplayName: "",
        guestCountAllowed: 1,
        publishedSnapshot: { rsvpQuestions: questions },
        status: "active",
        createdAt: serverTimestamp(),
      }),
    );
    const response = doc(
      visitor,
      "publicInvitations",
      id,
      "response",
      "current",
    );
    const payload = () => ({
      respondentName: "Guest",
      rsvpStatus: "accepted",
      attendeesCount: 1,
      respondedAt: serverTimestamp(),
    });
    const answers = {
      q0: "Hello",
      q1: false,
      q2: "A",
      q3: ["A", "B"],
      q4: 3,
      q5: "Vegan",
    };
    await assertFails(setDoc(response, payload()));
    for (const [key, value] of Object.entries({
      q0: " ",
      q1: "false",
      q2: "Unknown",
      q3: ["A", "A"],
      q4: 6,
      q5: "Unknown",
      q6: "extra",
    }))
      await assertFails(
        setDoc(response, {
          ...payload(),
          answers: { ...answers, [key]: value },
        }),
      );
    await assertSucceeds(setDoc(response, { ...payload(), answers }));
    await assertSucceeds(
      updateDoc(publicRef, {
        publishedSnapshot: {
          rsvpQuestions: questions,
          allowResponseChanges: false,
        },
      }),
    );
    await assertFails(setDoc(response, { ...payload(), answers }));
    await assertSucceeds(
      deleteDoc(doc(owner, "publicInvitations", id, "response", "current")),
    );
    await assertSucceeds(
      setDoc(response, {
        ...payload(),
        rsvpStatus: "declined",
        attendeesCount: 0,
      }),
    );
  });
});

describe("Hidden website RSVP", () => {
  it("disables response writes when the published website hides its RSVP section", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      visitor = env.unauthenticatedContext().firestore(),
      id = "1".repeat(48);
    const share = doc(owner, "publicInvitations", id),
      response = doc(visitor, "publicInvitations", id, "response", "current");
    await assertSucceeds(
      setDoc(share, {
        ownerUid: "alice",
        invitationId: "event",
        guestId: "website",
        guestDisplayName: "",
        guestCountAllowed: 1,
        publishedSnapshot: { site: { enabled: true, sections: ["intro"] } },
        status: "active",
        createdAt: serverTimestamp(),
      }),
    );
    const payload = () => ({
      respondentName: "Guest",
      rsvpStatus: "accepted",
      attendeesCount: 1,
      respondedAt: serverTimestamp(),
    });
    await assertFails(setDoc(response, payload()));
    await assertSucceeds(
      updateDoc(share, {
        publishedSnapshot: {
          site: { enabled: true, sections: ["intro", "rsvp"] },
        },
      }),
    );
    await assertSucceeds(setDoc(response, payload()));
    await assertSucceeds(
      updateDoc(share, {
        publishedSnapshot: { site: { enabled: true, sections: ["intro"] } },
      }),
    );
    await assertFails(setDoc(response, payload()));
  });
});

describe("Manual reminder records", () => {
  it("isolates reminder schedules and only records preparation, not delivery claims", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      other = env.authenticatedContext("bob").firestore(),
      visitor = env.unauthenticatedContext().firestore();
    const path = "tenants/alice/reminderPreferences/event";
    const preference = {
      kind: "rsvp",
      template: "Hello",
      scheduledFor: "",
      timezone: "Asia/Colombo",
      scheduledAt: null,
      deliveryMode: "manual",
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(owner, path), preference));
    await assertFails(getDoc(doc(other, path)));
    await assertFails(getDoc(doc(visitor, path)));
    await assertFails(
      setDoc(doc(owner, path), { ...preference, deliveryMode: "automatic" }),
    );
    const log = "tenants/alice/reminderPreparations/test",
      data = {
        eventId: "event",
        guestId: "guest",
        kind: "rsvp",
        status: "prepared",
        createdAt: serverTimestamp(),
      };
    await assertSucceeds(setDoc(doc(owner, log), data));
    await assertFails(
      setDoc(doc(owner, "tenants/alice/reminderPreparations/fake"), {
        ...data,
        status: "delivered",
      }),
    );
    await assertFails(setDoc(doc(other, log), data));
    await assertFails(updateDoc(doc(owner, log), { status: "sent" }));
  });
});

describe("Reserved team and billing authorization", () => {
  it("prevents client role elevation and paid entitlement activation", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      bob = env.authenticatedContext("bob").firestore();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "tenants/alice/members/bob"), {
        role: "viewer",
        status: "active",
      });
      await setDoc(
        doc(context.firestore(), "tenants/alice/entitlements/current"),
        { plan: "free", status: "active" },
      );
    });
    await assertSucceeds(getDoc(doc(bob, "tenants/alice/members/bob")));
    await assertFails(
      updateDoc(doc(bob, "tenants/alice/members/bob"), { role: "owner" }),
    );
    await assertFails(
      setDoc(doc(owner, "tenants/alice/members/new"), { role: "admin" }),
    );
    await assertFails(
      setDoc(doc(owner, "tenants/alice/entitlements/current"), {
        plan: "business",
        status: "active",
      }),
    );
    await assertSucceeds(
      getDoc(doc(owner, "tenants/alice/entitlements/current")),
    );
    await assertFails(getDoc(doc(bob, "tenants/alice/entitlements/current")));
    await assertFails(getDoc(doc(bob, "tenants/alice/invitations/event")));
  });
  it("isolates branding and rejects malformed colors or ownership changes", async () => {
    const owner = env.authenticatedContext("brand-owner").firestore(),
      bob = env.authenticatedContext("bob").firestore(),
      path = "tenants/brand-owner";
    await assertSucceeds(
      setDoc(doc(owner, path), {
        name: "Studio",
        ownerId: "brand-owner",
        createdAt: serverTimestamp(),
      }),
    );
    const branding = {
      displayName: "Studio",
      logoUrl: "",
      primaryColor: "#14513d",
      accentColor: "#c58b3e",
      footerText: "Our gatherings",
    };
    await assertSucceeds(updateDoc(doc(owner, path), { branding }));
    await assertFails(
      updateDoc(doc(owner, path), {
        branding: { ...branding, primaryColor: "red" },
      }),
    );
    await assertFails(updateDoc(doc(bob, path), { branding }));
    await assertFails(updateDoc(doc(owner, path), { ownerId: "bob" }));
  });
});
describe("Versioned migration emulator compatibility", () => {
  it("retains the same public token and recorded response after a design-version update", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      visitor = env.unauthenticatedContext().firestore(),
      id = "2".repeat(48);
    const original = {
      invitations: [
        {
          id: "migration-event",
          title: "Keep this event",
          status: "published",
          design: { background: "#fff", elements: [] },
        },
      ],
      publicInvitations: [
        {
          id,
          publishedSnapshot: {
            title: "Keep this event",
            design: { background: "#fff", elements: [] },
          },
        },
      ],
    };
    await assertSucceeds(
      setDoc(
        doc(owner, "tenants/alice/invitations/migration-event"),
        original.invitations[0],
      ),
    );
    await assertSucceeds(
      setDoc(doc(owner, "publicInvitations", id), {
        ownerUid: "alice",
        invitationId: "migration-event",
        guestId: "guest",
        guestDisplayName: "Guest",
        guestCountAllowed: 1,
        publishedSnapshot: original.publicInvitations[0].publishedSnapshot,
        status: "active",
        createdAt: serverTimestamp(),
      }),
    );
    const response = doc(
      visitor,
      "publicInvitations",
      id,
      "response",
      "current",
    );
    await assertSucceeds(
      setDoc(response, {
        respondentName: "Guest",
        rsvpStatus: "accepted",
        attendeesCount: 1,
        respondedAt: serverTimestamp(),
      }),
    );
    const upgraded = migrateV1(original);
    await assertSucceeds(
      updateDoc(doc(owner, "tenants/alice/invitations/migration-event"), {
        design: upgraded.invitations[0].design,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(owner, "publicInvitations", id), {
        publishedSnapshot: upgraded.publicInvitations[0].publishedSnapshot,
      }),
    );
    await assertSucceeds(getDoc(doc(visitor, "publicInvitations", id)));
    await assertSucceeds(getDoc(response));
  });
});

describe("Owner manual arrival override", () => {
  it("keeps override reasons private and bounds the actual arrival count", async () => {
    const owner = env.authenticatedContext("alice").firestore(),
      visitor = env.unauthenticatedContext().firestore(),
      path = "tenants/alice/invitations/event/guests/manual";
    await assertSucceeds(
      setDoc(doc(owner, path), {
        name: "Guest",
        phoneNumber: "",
        guestCountAllowed: 2,
      }),
    );
    const update = {
      checkedInAt: serverTimestamp(),
      checkedInBy: "alice",
      checkedInCount: 2,
      checkedInOverrideReason: "Verified at the door",
    };
    await assertFails(updateDoc(doc(visitor, path), update));
    await assertFails(
      updateDoc(doc(owner, path), { ...update, checkedInCount: 3 }),
    );
    await assertFails(
      updateDoc(doc(owner, path), {
        ...update,
        checkedInOverrideReason: "x".repeat(301),
      }),
    );
    await assertSucceeds(updateDoc(doc(owner, path), update));
    await assertFails(getDoc(doc(visitor, path)));
  });
});
