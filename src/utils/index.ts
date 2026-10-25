import { uiText } from "../i18n/uiText";
import { formatCalendarDate, formatClockTime } from "../i18n/format";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Invitation } from "../types";
export function normalizePhone(value: string) {
  const phone = parsePhoneNumberFromString(value);
  if (!phone?.isValid()) throw new Error(uiText("ui.70230b9110d1"));
  return phone.number;
}
export function mapsUrl(url: string, lat = "", lng = "", address = "") {
  if (lat || lng) {
    if (
      !lat ||
      !lng ||
      !Number.isFinite(+lat) ||
      !Number.isFinite(+lng) ||
      Math.abs(+lat) > 90 ||
      Math.abs(+lng) > 180
    )
      throw new Error(uiText("ui.a5b309b35df8"));
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  if (url) {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      ![
        "google.com",
        "www.google.com",
        "maps.google.com",
        "maps.app.goo.gl",
        "goo.gl",
      ].includes(u.hostname) ||
      ((u.hostname === "goo.gl" ||
        u.hostname === "google.com" ||
        u.hostname === "www.google.com") &&
        !/^\/maps(?:\/|$)/.test(u.pathname)) ||
      u.username !== "" ||
      u.password !== ""
    )
      throw new Error(uiText("ui.633d57c1d2b9"));
    return u.href;
  }
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "";
}
export function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export function shareUrl(id: string, hostName = "") {
  const host = hostName
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const base = (import.meta.env.VITE_APP_URL || window.location.origin)
    .trim()
    .replace(/\/+$/, "");
  return `${base}/i/${id}${host ? `/${encodeURIComponent(host)}` : ""}`;
}
export function whatsappUrl(
  phone: string,
  name: string,
  event: Invitation,
  id: string,
) {
  const message = `Hello ${name}!\n\nYou are warmly invited to ${event.title}.\n\nDate: ${event.eventDate}\nTime: ${event.eventTime} (${event.timezone})\nVenue: ${event.venueName}\n\nView your personal invitation:\n${shareUrl(id, event.hostName)}\n\nPlease confirm your attendance. Thank you!`;
  return `https://wa.me/${normalizePhone(phone).slice(1)}?text=${encodeURIComponent(message)}`;
}
export function interpolate(
  text: string,
  event: Partial<Invitation>,
  guest = "Your guest",
) {
  if (
    event.design?.presentation === "grand-opening" &&
    text.trim() === "{{venueName}}" &&
    event.venueName?.trim()
  ) {
    text = `📍 ${text}`;
  }
  const eventDate = event.eventDate
    ? formatCalendarDate(event.eventDate)
    : event.eventDate;
  const eventTime = event.eventTime
    ? formatClockTime(event.eventTime)
    : event.eventTime;
  const values = {
    ...event,
    eventDate,
    eventTime,
    eventTitle: event.title,
    guestName: guest,
  };
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    String(values[key as keyof typeof values] ?? match),
  );
}
export function download(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
