import { uiText } from "../i18n/uiText";
import { publishedSnapshot } from "../utils/publishedSnapshot";
import {
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { tenantCollection, tenantDocument } from "../firebase/firestore";
import type { Invitation } from "../types";
import { revokeGuest } from "./guestService";
import { mapsUrl } from "../utils";
export async function saveInvitation(event: Invitation) {
  if (!event.title.trim()) throw new Error(uiText("ui.b0ab622c4fdb"));
  try {
    new Intl.DateTimeFormat("en", { timeZone: event.timezone });
  } catch {
    throw new Error(uiText("ui.e2746e65aed9"));
  }
  const { id, ...data } = event;
  const payload = {
    ...data,
    googleMapsUrl: mapsUrl(
      event.googleMapsUrl,
      event.latitude,
      event.longitude,
      event.venueAddress,
    ),
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await updateDoc(tenantDocument("invitations", id), payload);
    return id;
  }
  return (
    await addDoc(tenantCollection("invitations"), {
      ...payload,
      createdAt: serverTimestamp(),
    })
  ).id;
}
export async function deleteInvitation(id: string) {
  const guests = await getDocs(tenantCollection("invitations", id, "guests"));
  for (const g of guests.docs)
    await revokeGuest(id, { id: g.id, ...g.data() } as any, true);
  await deleteDoc(tenantDocument("invitations", id));
}
export async function refreshPublished(event: Invitation) {
  const current = await getDoc(tenantDocument("invitations", event.id));
  const publicShareId = current.data()?.publicShareId;
  if (publicShareId) {
    const snapshot = publishedSnapshot(event);
    await updateDoc(doc(db, "publicInvitations", publicShareId), {
      publishedSnapshot: snapshot,
      status: event.status === "published" ? "active" : "revoked",
    });
  }
  const guests = await getDocs(
    tenantCollection("invitations", event.id, "guests"),
  );
  for (let i = 0; i < guests.docs.length; i += 400) {
    const b = writeBatch(db);
    for (const g of guests.docs.slice(i, i + 400)) {
      const data = g.data();
      if (data.shareId)
        b.update(doc(db, "publicInvitations", data.shareId), {
          publishedSnapshot: publishedSnapshot(event),
          status: event.status === "published" ? "active" : "revoked",
        });
    }
    await b.commit();
  }
}
