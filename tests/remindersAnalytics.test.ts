import { describe, it, expect } from "vitest";
import {
  reminderText,
  reminderTemplates,
  manualWhatsApp,
} from "../src/utils/reminders";
import { reportData, reportCSV } from "../src/utils/analyticsReport";
import type { Invitation, Guest } from "../src/types";
describe("manual reminder personalization", () => {
  it("binds names and opaque invitation URLs without claiming delivery", () => {
    const event = {
        title: "Garden",
        eventDate: "2026-12-15",
        eventTime: "17:00",
        venueName: "Hall",
      } as Invitation,
      guest = { name: "Alex" } as Guest;
    const text = reminderText(
      reminderTemplates.rsvp,
      event,
      guest,
      "https://example.com/i/token",
    );
    expect(text).toContain("Alex");
    expect(text).toContain("Garden");
    expect(text).toContain("https://example.com/i/token");
    expect(
      new URL(manualWhatsApp("+94771234567", text)).searchParams.get("text"),
    ).toBe(text);
  });
  it("rejects a missing contact number", () =>
    expect(() => manualWhatsApp("", "Message")).toThrow());
});
describe("truthful analytics reports", () => {
  const events = [
    { id: "a", title: "A", eventDate: "2026-12-15" },
    { id: "b", title: "B", eventDate: "2027-01-01" },
  ] as Invitation[];
  const guests = [
    {
      id: "1",
      invitationId: "a",
      name: "=FORMULA",
      category: "Family",
      rsvpStatus: "accepted",
      attendeesCount: 2,
      shareStatus: "initiated",
      checkedInAt: { toDate: () => new Date("2026-12-15T12:00:00Z") },
      checkedInCount: 1,
    },
    {
      id: "2",
      invitationId: "b",
      name: "B",
      category: "Friends",
      rsvpStatus: "pending",
      attendeesCount: 0,
    },
  ] as Guest[];
  it("applies event-date and category filters with separate expected and actual arrival counts", () => {
    const report = reportData(events, guests, {
      eventId: "",
      from: "2026-12-01",
      to: "2026-12-31",
      category: "Family",
    });
    expect(report.guests).toHaveLength(1);
    expect(report.expected).toBe(2);
    expect(report.checkedIn).toBe(1);
    expect(report.sharingInitiated).toBe(1);
  });
  it("escapes spreadsheet formulas in owner-exported CSV", () => {
    expect(reportCSV(events, guests)).toContain("'=FORMULA");
    expect(reportCSV(events, guests)).toContain("Checked-in attendees");
  });
});
