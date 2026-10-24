import type { Guest, Invitation } from "../types";
export function dashboardSummary(events: Invitation[], guests: Guest[]) {
  const accepted = guests.filter((g) => g.rsvpStatus === "accepted").length;
  const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
  const maybe = guests.filter((g) => g.rsvpStatus === "maybe").length;
  const pending = guests.length - accepted - declined - maybe;
  const responded = accepted + declined + maybe;
  return {
    invitations: events.length,
    total: guests.length,
    accepted,
    declined,
    maybe,
    pending,
    responded,
    responseRate: guests.length
      ? Math.round((responded / guests.length) * 100)
      : 0,
  };
}
export function responseActivity(guests: Guest[]) {
  return guests
    .filter(
      (g) =>
        g.respondedAt &&
        ["accepted", "declined", "maybe"].includes(g.rsvpStatus),
    )
    .sort(
      (a, b) =>
        (b.respondedAt.seconds || 0) - (a.respondedAt.seconds || 0) ||
        (b.respondedAt.nanoseconds || 0) - (a.respondedAt.nanoseconds || 0),
    );
}
export function searchWorkspace(
  query: string,
  events: Invitation[],
  guests: Guest[],
) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return { events: [], guests: [] };
  const includes = (value = "") => value.toLocaleLowerCase().includes(term);
  return {
    events: events.filter((e) =>
      [e.title, e.hostName, e.venueName, e.eventType].some(includes),
    ),
    guests: guests.filter((g) =>
      [g.name, g.respondentName || "", g.email, g.phoneNumber].some(includes),
    ),
  };
}
export function eventDate(value: string) {
  if (!value) return "Date to be confirmed";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(parsed)
    : "Date to be confirmed";
}
export function activityDate(value: Guest["respondedAt"]) {
  const parsed =
    value?.toDate?.() ||
    (typeof value?.seconds === "number"
      ? new Date(value.seconds * 1000)
      : null);
  return parsed && Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed)
    : "Just updated";
}
