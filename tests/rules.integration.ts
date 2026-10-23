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
