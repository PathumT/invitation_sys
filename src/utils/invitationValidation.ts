import { uiText } from "../i18n/uiText";
import { miniSiteError } from "./miniSite";
import { questionSchemaError } from "./rsvpQuestions";
import { deadlineInstant } from "./publishedSnapshot";
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
    if (!e[key].trim())
      errors[key] = uiText("ui.5c28851944ef", { value0: String(label) });
    else if (e[key].trim().length > 160)
      errors[key] = uiText("ui.1d141bd9b87b", { value0: String(label) });
  }
  const date = new Date(`${e.eventDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(e.eventDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== e.eventDate
  )
    errors.eventDate = uiText("ui.277083310fd1");
  const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if (!validTime(e.eventTime)) errors.eventTime = uiText("ui.8a5eaf7b4acf");
  if (
    e.endTime &&
    (!validTime(e.endTime) ||
      (validTime(e.eventTime) && e.endTime <= e.eventTime))
  )
    errors.endTime = uiText("ui.ec124da8b3e0");
  try {
    if (!e.timezone.trim()) throw new Error();
    new Intl.DateTimeFormat("en", { timeZone: e.timezone });
  } catch {
    errors.timezone = uiText("ui.e2746e65aed9");
  }
  if (e.googleMapsUrl.trim()) {
    try {
      mapsUrl(e.googleMapsUrl.trim());
    } catch {
      errors.googleMapsUrl = uiText("ui.985fec4eba2e");
    }
  }
  if (e.latitude || e.longitude) {
    if (
      !e.latitude.trim() ||
      !Number.isFinite(+e.latitude) ||
      Math.abs(+e.latitude) > 90
    )
      errors.latitude = uiText("ui.3500fa80ac0e");
    if (
      !e.longitude.trim() ||
      !Number.isFinite(+e.longitude) ||
      Math.abs(+e.longitude) > 180
    )
      errors.longitude = uiText("ui.15a08ee925f5");
  }
  if (
    e.contactNumber.trim() &&
    !parsePhoneNumberFromString(
      e.contactNumber.trim(),
      e.timezone === "Asia/Colombo" ? "LK" : undefined,
    )?.isValid()
  )
    errors.contactNumber = uiText("ui.45fe1249f6db");
  for (const key of ["message", "notes"] as const)
    if (e[key].length > 2000) errors[key] = uiText("ui.8c6283ed9ee9");
  if (e.rsvpDeadline && !Number.isFinite(deadlineInstant(e)))
    errors.rsvpDeadline = uiText("ui.81473af118e0");
  if (e.eventWebsite?.trim()) {
    try {
      const url = new URL(e.eventWebsite);
      if (url.protocol !== "https:" || url.username || url.password)
        throw new Error();
    } catch {
      errors.eventWebsite = uiText("ui.97fb26c54e69");
    }
  }
  const questionError = questionSchemaError(e.rsvpQuestions);
  if (questionError) errors.rsvpQuestions = questionError;
  if ((e.confirmationMessage?.length || 0) > 300)
    errors.confirmationMessage = uiText("ui.9fd21af1973d");
  const siteError = miniSiteError(e.site);
  if (siteError) errors.site = siteError;
  return errors;
}
