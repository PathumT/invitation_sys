import { uiText } from "../i18n/uiText";
import { guestProfile } from "../utils/guestProfile";
import { publishedSnapshot } from "../utils/publishedSnapshot";
import {
  addDoc,
  doc,
  writeBatch,
  serverTimestamp,
  updateDoc,
  runTransaction,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  tenantCollection,
  tenantDocument,
  tenantId,
} from "../firebase/firestore";
import type { Guest, Invitation } from "../types";
import { token, normalizePhone } from "../utils";
export async function saveGuest(eventId: string, guest: Partial<Guest>) {
  const payload = {
    ...guestProfile(guest),
    name: guest.name,
    phoneNumber: normalizePhone(guest.phoneNumber || ""),
    email: guest.email || "",
    guestCountAllowed: Number(guest.guestCountAllowed),
  };
  if (
    !payload.name?.trim() ||
    !Number.isInteger(payload.guestCountAllowed) ||
    payload.guestCountAllowed < 1 ||
    payload.guestCountAllowed > 20
  )
    throw new Error(uiText("ui.aef338c84f5e"));
  const duplicates = await getDocs(
    query(
      tenantCollection("invitations", eventId, "guests"),
      where("phoneNumber", "==", payload.phoneNumber),
    ),
  );
  if (
    duplicates.docs.length &&
    !duplicates.docs.some((record) => record.id === guest.id)
  )
    throw new Error(uiText("ui.6c4e672c44a7"));
  if (guest.id) {
    await updateDoc(
      tenantDocument("invitations", eventId, "guests", guest.id),
      payload,
    );
    if (guest.shareId)
      await updateDoc(doc(db, "publicInvitations", guest.shareId), {
        guestDisplayName: payload.name,
        guestCountAllowed: payload.guestCountAllowed,
      });
    return guest.id;
  }
  return (
    await addDoc(tenantCollection("invitations", eventId, "guests"), {
      ...payload,
      invitationId: eventId,
      shareStatus: "not-shared",
      rsvpStatus: "pending",
      attendeesCount: 0,
      createdAt: serverTimestamp(),
    })
  ).id;
}
export async function publishGuest(event: Invitation, guest: Guest) {
  if (event.status !== "published") throw new Error(uiText("ui.9fc702f359cd"));
  if (guest.shareId) return guest.shareId;
  const id = token();
  const b = writeBatch(db);
  b.set(doc(db, "publicInvitations", id), {
    ownerUid: tenantId(),
    invitationId: event.id,
    guestId: guest.id,
    guestDisplayName: guest.name,
    guestCountAllowed: guest.guestCountAllowed,
    publishedSnapshot: publishedSnapshot(event),
    status: "active",
    createdAt: serverTimestamp(),
  });
  b.update(tenantDocument("invitations", event.id, "guests", guest.id), {
    shareId: id,
  });
  await b.commit();
  return id;
}
export async function revokeGuest(
  eventId: string,
  guest: Guest,
  remove = false,
) {
  await runTransaction(db, async (transaction) => {
    const response = guest.shareId
      ? await transaction.get(
          doc(db, "publicInvitations", guest.shareId, "response", "current"),
        )
      : null;
    if (guest.shareId)
      transaction.update(doc(db, "publicInvitations", guest.shareId), {
        status: "revoked",
      });
    const ref = tenantDocument("invitations", eventId, "guests", guest.id);
    if (remove) transaction.delete(ref);
    else
      transaction.update(ref, {
        shareId: "",
        shareStatus: "not-shared",
        ...(response?.exists() ? response.data() : {}),
      });
  });
}
export const markShared = (eventId: string, id: string) =>
  updateDoc(tenantDocument("invitations", eventId, "guests", id), {
    shareStatus: "initiated",
  });

export async function tagGuests(guests: Guest[], tags: string[]) {
  for (const guest of guests) {
    if (guest.source === "public") continue;
    const profile = guestProfile({
      ...guest,
      tags: [...(guest.tags || []), ...tags],
    });
    await updateDoc(
      tenantDocument("invitations", guest.invitationId, "guests", guest.id),
      { tags: profile.tags },
    );
  }
}
