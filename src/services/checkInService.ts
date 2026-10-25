import { uiText } from "../i18n/uiText";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { tenantDocument, tenantId } from "../firebase/firestore";
export function invitationToken(value: string) {
  if (/^[a-f0-9]{48}$/.test(value.trim())) return value.trim();
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    const match = url.pathname.match(/^\/i\/([a-f0-9]{48})(?:\/[^/]+)?\/?$/);
    if (match) return match[1];
  } catch {
    /* Show a useful error without echoing a private URL. */
  }
  throw new Error(uiText("ui.8fd948ad411a"));
}
export async function checkInGuest(eventId: string, guestId: string) {
  const uid = tenantId();
  return runTransaction(db, async (transaction) => {
    const guestRef = tenantDocument("invitations", eventId, "guests", guestId);
    const [guest, event] = await Promise.all([
      transaction.get(guestRef),
      transaction.get(tenantDocument("invitations", eventId)),
    ]);
    if (
      !guest.exists() ||
      !event.exists() ||
      event.data().status !== "published"
    )
      throw new Error(uiText("ui.321b00856a31"));
    if (guest.data().checkedInAt)
      return { name: guest.data().name as string, duplicate: true };
    const shareId = guest.data().shareId;
    if (!shareId) throw new Error(uiText("ui.de3aca9b69df"));
    const [share, response] = await Promise.all([
      transaction.get(doc(db, "publicInvitations", shareId)),
      transaction.get(
        doc(db, "publicInvitations", shareId, "response", "current"),
      ),
    ]);
    if (
      !share.exists() ||
      share.data().ownerUid !== uid ||
      share.data().status !== "active" ||
      share.data().guestId !== guestId ||
      share.data().invitationId !== eventId
    )
      throw new Error(uiText("ui.c5bb1f674a1c"));
    if (!response.exists() || response.data().rsvpStatus !== "accepted")
      throw new Error(uiText("ui.d3c398089aa1"));
    transaction.update(guestRef, {
      checkedInAt: serverTimestamp(),
      checkedInBy: uid,
      checkedInCount: response.data().attendeesCount,
    });
    return { name: guest.data().name as string, duplicate: false };
  });
}
export async function checkInInvitation(value: string) {
  const uid = tenantId(),
    token = invitationToken(value);
  return runTransaction(db, async (transaction) => {
    const share = await transaction.get(doc(db, "publicInvitations", token));
    if (!share.exists() || share.data().ownerUid !== uid)
      throw new Error(uiText("ui.b10ece7051d4"));
    if (share.data().mode === "open" || !share.data().guestId)
      throw new Error(uiText("ui.d16e94b4cfa5"));
    return {
      eventId: share.data().invitationId as string,
      guestId: share.data().guestId as string,
    };
  }).then((target) => checkInGuest(target.eventId, target.guestId));
}

export async function manualCheckInGuest(
  eventId: string,
  guestId: string,
  reason: string,
  count: number,
) {
  const uid = tenantId();
  if (
    !reason.trim() ||
    reason.trim().length > 300 ||
    !Number.isInteger(count) ||
    count < 1
  )
    throw new Error(uiText("ui.ec1bd131f994"));
  return runTransaction(db, async (transaction) => {
    const ref = tenantDocument("invitations", eventId, "guests", guestId);
    const [guest, event] = await Promise.all([
      transaction.get(ref),
      transaction.get(tenantDocument("invitations", eventId)),
    ]);
    if (
      !guest.exists() ||
      !event.exists() ||
      event.data().status !== "published"
    )
      throw new Error(uiText("ui.518090593f92"));
    if (guest.data().checkedInAt)
      return { name: guest.data().name as string, duplicate: true };
    if (count > guest.data().guestCountAllowed)
      throw new Error(uiText("ui.623af4a9aefe"));
    transaction.update(ref, {
      checkedInAt: serverTimestamp(),
      checkedInBy: uid,
      checkedInCount: count,
      checkedInOverrideReason: reason.trim(),
    });
    return { name: guest.data().name as string, duplicate: false };
  });
}
