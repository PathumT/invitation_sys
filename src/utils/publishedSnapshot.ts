import { uiText } from "../i18n/uiText";
import { Timestamp } from "firebase/firestore";
import type { Invitation } from "../types";
import { eventInstant } from "./eventTime";
export function deadlineInstant(event: Invitation): number | null {
  if (!event.rsvpDeadline) return null;
  const [date, time] = event.rsvpDeadline.split("T");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "")
  )
    return NaN;
  const calendarDate = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== date
  )
    return NaN;
  return eventInstant(date, time, event.timezone) ?? NaN;
}
export function publishedSnapshot(event: Invitation) {
  const snapshot = { ...event };
  delete snapshot.publicShareId;
  if (snapshot.site?.enabled) {
    const site = snapshot.site;
    snapshot.site = {
      ...site,
      photos: site.sections.includes("photos")
        ? site.photos.filter((photo) => photo.visibility !== "private")
        : [],
      videos: site.sections.includes("videos") ? site.videos : [],
      registry: site.sections.includes("registry") ? site.registry : [],
      faq: site.sections.includes("faq") ? site.faq : [],
      schedule: site.sections.includes("schedule") ? site.schedule : [],
    };
  } else delete snapshot.site;
  const deadline = deadlineInstant(event);
  if (deadline !== null && !Number.isFinite(deadline))
    throw new Error(uiText("ui.81473af118e0"));
  return {
    ...snapshot,
    rsvpDeadlineAt: deadline === null ? null : Timestamp.fromMillis(deadline),
  };
}
