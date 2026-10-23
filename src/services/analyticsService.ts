import type { Guest } from "../types";
export function guestStatistics(guests: Guest[]) {
  return {
    total: guests.length,
    accepted: guests.filter((g) => g.rsvpStatus === "accepted").length,
    declined: guests.filter((g) => g.rsvpStatus === "declined").length,
    maybe: guests.filter((g) => g.rsvpStatus === "maybe").length,
    pending: guests.filter((g) => g.rsvpStatus === "pending").length,
    sharingInitiated: guests.filter((g) => g.shareStatus === "initiated")
      .length,
    attendees: guests.reduce(
      (n, g) => n + (g.rsvpStatus === "accepted" ? g.attendeesCount : 0),
      0,
    ),
  };
}
