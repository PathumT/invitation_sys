import type { Invitation } from "../types";
import { mapsUrl } from "./index";
import { parsePhoneNumberFromString } from "libphonenumber-js";
export type EventErrors = Partial<Record<keyof Invitation, string>>;
export function validateInvitation(e: Invitation): EventErrors {
  const errors: EventErrors = {};
  for (const [key, label] of [
    ["title", "Event title"],
    ["hostName", "Host name"],
    ["venueName", "Venue name"],
  ] as const) {
    if (!e[key].trim()) errors[key] = `${label} is required.`;
    else if (e[key].trim().length > 160)
      errors[key] = `${label} must be 160 characters or fewer.`;
  }
  const date = new Date(`${e.eventDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(e.eventDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== e.eventDate
  )
    errors.eventDate = "Enter a valid event date.";
  const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if (!validTime(e.eventTime)) errors.eventTime = "Enter a valid start time.";
  if (
    e.endTime &&
    (!validTime(e.endTime) ||
      (validTime(e.eventTime) && e.endTime <= e.eventTime))
  )
    errors.endTime =
      "End time must be later than start time on the event date.";
  try {
    if (!e.timezone.trim()) throw new Error();
    new Intl.DateTimeFormat("en", { timeZone: e.timezone });
  } catch {
    errors.timezone = "Enter a valid timezone, such as Asia/Colombo.";
  }
  if (e.googleMapsUrl.trim()) {
    try {
      mapsUrl(e.googleMapsUrl.trim());
    } catch {
      errors.googleMapsUrl =
        "Enter a secure Google Maps link (https://maps.google.com or https://maps.app.goo.gl/?).";
    }
  }
  if (e.latitude || e.longitude) {
    if (
      !e.latitude.trim() ||
      !Number.isFinite(+e.latitude) ||
      Math.abs(+e.latitude) > 90
    )
      errors.latitude =
        "Enter latitude between -90 and 90; both coordinates are required.";
    if (
      !e.longitude.trim() ||
      !Number.isFinite(+e.longitude) ||
      Math.abs(+e.longitude) > 180
    )
      errors.longitude =
        "Enter longitude between -180 and 180; both coordinates are required.";
  }
  if (
    e.contactNumber.trim() &&
    !parsePhoneNumberFromString(
      e.contactNumber.trim(),
      e.timezone === "Asia/Colombo" ? "LK" : undefined,
    )?.isValid()
  )
    errors.contactNumber =
      "Enter a valid contact number; include the country code (for example +94).";
  for (const key of ["message", "notes"] as const)
    if (e[key].length > 2000) errors[key] = "Use 2,000 characters or fewer.";
  return errors;
}
