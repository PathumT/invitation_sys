import { uiText } from "../i18n/uiText";
import { addDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { tenantCollection, tenantDocument } from "../firebase/firestore";
import { eventInstant } from "../utils/eventTime";
import type { ReminderKind } from "../utils/reminders";
export async function saveReminderPreference(
  eventId: string,
  kind: ReminderKind,
  template: string,
  scheduledFor: string,
  timezone: string,
) {
  if (!eventId || !template.trim() || template.length > 2000)
    throw new Error(uiText("ui.9878dce8fc11"));
  let scheduledAt: Timestamp | null = null;
  if (scheduledFor) {
    const [date, time] = scheduledFor.split("T"),
      instant = eventInstant(date, time, timezone);
    if (instant === null) throw new Error(uiText("ui.433e6437f53d"));
    scheduledAt = Timestamp.fromMillis(instant);
  }
  await setDoc(tenantDocument("reminderPreferences", eventId), {
    kind,
    template,
    scheduledFor,
    timezone,
    scheduledAt,
    deliveryMode: "manual",
    updatedAt: serverTimestamp(),
  });
}
export async function recordReminderPreparation(
  eventId: string,
  guestId: string,
  kind: ReminderKind,
) {
  await addDoc(tenantCollection("reminderPreparations"), {
    eventId,
    guestId,
    kind,
    status: "prepared",
    createdAt: serverTimestamp(),
  });
}
