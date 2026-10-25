import type { Invitation, Guest } from "../types";
export interface ReportFilters {
  eventId: string;
  from: string;
  to: string;
  category: string;
}
export function reportData(
  events: Invitation[],
  guests: Guest[],
  filters: ReportFilters,
) {
  const selected = events.filter(
    (event) =>
      (!filters.eventId || event.id === filters.eventId) &&
      (!filters.from || event.eventDate >= filters.from) &&
      (!filters.to || event.eventDate <= filters.to),
  );
  const ids = new Set(selected.map((event) => event.id));
  const rows = guests.filter(
    (guest) =>
      ids.has(guest.invitationId) &&
      (!filters.category || (guest.category || "Other") === filters.category),
  );
  return {
    events: selected,
    guests: rows,
    expected: rows
      .filter((guest) => guest.rsvpStatus === "accepted")
      .reduce((sum, guest) => sum + (guest.attendeesCount || 0), 0),
    checkedIn: rows
      .filter((guest) => guest.checkedInAt)
      .reduce((sum, guest) => sum + (guest.checkedInCount || 1), 0),
    sharingInitiated: rows.filter((guest) => guest.shareStatus === "initiated")
      .length,
  };
}
export function reportCSV(events: Invitation[], guests: Guest[]) {
  const rows: unknown[][] = [
    [
      "Event",
      "Guest",
      "Category",
      "RSVP",
      "Attendees",
      "Sharing initiated",
      "Responded at",
      "Checked in at",
      "Checked-in attendees",
    ],
    ...guests.map((guest) => [
      events.find((event) => event.id === guest.invitationId)?.title,
      guest.name,
      guest.category || "Other",
      guest.rsvpStatus,
      guest.attendeesCount,
      guest.shareStatus === "initiated" ? "Yes" : "No",
      guest.respondedAt?.toDate?.().toISOString() || "",
      guest.checkedInAt?.toDate?.().toISOString() || "",
      guest.checkedInAt ? guest.checkedInCount || 1 : 0,
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value ?? "")
              .replace(/^[=+@-]/, "'$&")
              .replace(/"/g, '""')}"`,
        )
        .join(","),
    )
    .join("\r\n");
}
