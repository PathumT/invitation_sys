import { uiText } from "../i18n/uiText";
import type { Invitation, Guest } from "../types";
import { interpolate } from "./index";
export const reminderTemplates = {
  invitation:
    "Hello {{guestName}}, you are invited to {{eventTitle}} on {{eventDate}} at {{eventTime}}. Venue: {{venueName}}. View your invitation: {{invitationLink}}",
  rsvp: "Hello {{guestName}}, a little reminder to respond to {{eventTitle}}. Please accept or decline here: {{invitationLink}}",
  event:
    "Hello {{guestName}}, we look forward to seeing you at {{eventTitle}} on {{eventDate}} at {{eventTime}}, {{venueName}}. Your invitation: {{invitationLink}}",
  venue:
    "Hello {{guestName}}, here are the venue details for {{eventTitle}}: {{venueName}}. View the location and invitation: {{invitationLink}}",
  thanks:
    "Thank you, {{guestName}}, for being part of {{eventTitle}}. We loved celebrating with you! {{invitationLink}}",
};
export type ReminderKind = keyof typeof reminderTemplates;
export function reminderText(
  template: string,
  event: Invitation,
  guest: Guest,
  url: string,
) {
  const bindings = { ...event, invitationLink: url };
  return interpolate(template, bindings, guest.name);
}
export function manualWhatsApp(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 8 || digits.length > 15)
    throw new Error(uiText("ui.b9094cb6f16b"));
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
