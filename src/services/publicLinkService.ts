import { uiText } from "../i18n/uiText";
import { publishedSnapshot } from "../utils/publishedSnapshot";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { tenantDocument, tenantId } from "../firebase/firestore";
import { token } from "../utils";
import type { Invitation } from "../types";
export async function ensurePublicLink(event: Invitation) {
  if (!event.id) throw new Error(uiText("ui.b0f71cf0b75d"));
  const ownerUid = tenantId();
  return runTransaction(db, async (tx) => {
    const ref = tenantDocument("invitations", event.id);
    const record = await tx.get(ref);
    if (!record.exists() || record.data().status !== "published")
      throw new Error(uiText("ui.bf2f28985c03"));
    if (record.data().publicShareId)
      return record.data().publicShareId as string;
    const id = token();
    const snapshot = publishedSnapshot({
      ...record.data(),
      id: event.id,
    } as Invitation);
    tx.set(doc(db, "publicInvitations", id), {
      mode: "open",
      ownerUid,
      invitationId: event.id,
      guestId: "",
      guestDisplayName: "",
      guestCountAllowed: 1,
      publishedSnapshot: snapshot,
      status: "active",
      createdAt: serverTimestamp(),
    });
    tx.update(ref, { publicShareId: id });
    return id;
  });
}
export function responseToken(shareId: string, renew = false) {
  const key = `inviteflow-response:${shareId}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (!renew && existing && /^[a-f0-9]{48}$/.test(existing)) return existing;
    const id = token();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return token();
  }
}
