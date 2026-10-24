import { describe, expect, it } from "vitest";
import {
  dashboardSummary,
  responseActivity,
  searchWorkspace,
  eventDate,
} from "../src/utils/dashboard";
import type { Guest, Invitation } from "../src/types";
const events = [
  {
    id: "one",
    title: "Garden celebration",
    hostName: "Alex",
    venueName: "Rose Hall",
    eventType: "Wedding",
  },
] as Invitation[];
const guests = [
  {
    id: "1",
    invitationId: "one",
    name: "Sam",
    email: "sam@example.test",
    phoneNumber: "+94771234567",
    rsvpStatus: "accepted",
    respondedAt: { seconds: 20, nanoseconds: 0 },
  },
  {
    id: "2",
    invitationId: "one",
    name: "Jordan",
    respondentName: "Jordy",
    email: "",
    phoneNumber: "",
    rsvpStatus: "declined",
    respondedAt: { seconds: 30, nanoseconds: 1 },
  },
  {
    id: "3",
    invitationId: "one",
    name: "Riley",
    email: "",
    phoneNumber: "",
    rsvpStatus: "pending",
  },
  {
    id: "4",
    invitationId: "one",
    name: "Kim",
    email: "",
    phoneNumber: "",
    rsvpStatus: "maybe",
    respondedAt: { seconds: 30, nanoseconds: 2 },
  },
] as Guest[];
describe("real workspace dashboard data", () => {
  it("handles empty workspaces without invented totals or percentages", () =>
    expect(dashboardSummary([], [])).toEqual({
      invitations: 0,
      total: 0,
      accepted: 0,
      declined: 0,
      maybe: 0,
      pending: 0,
      responded: 0,
      responseRate: 0,
    }));
  it("derives all counts and percentages from actual records", () =>
    expect(dashboardSummary(events, guests)).toEqual({
      invitations: 1,
      total: 4,
      accepted: 1,
      declined: 1,
      maybe: 1,
      pending: 1,
      responded: 3,
      responseRate: 75,
    }));
  it("sorts real responses newest first and excludes pending guests", () =>
    expect(responseActivity(guests).map((g) => g.id)).toEqual(["4", "2", "1"]));
  it("searches invitation fields and guest identity/contact fields", () => {
    expect(searchWorkspace(" rose hall ", events, guests).events).toHaveLength(
      1,
    );
    expect(searchWorkspace("JORDY", events, guests).guests[0].id).toBe("2");
    expect(searchWorkspace("sam@example", events, guests).guests[0].id).toBe(
      "1",
    );
    expect(searchWorkspace("9477", events, guests).guests[0].id).toBe("1");
    expect(searchWorkspace("", events, guests)).toEqual({
      events: [],
      guests: [],
    });
    expect(searchWorkspace("unknown", events, guests)).toEqual({
      events: [],
      guests: [],
    });
  });
  it("handles missing and invalid event dates", () => {
    expect(eventDate("")).toBe("Date to be confirmed");
    expect(eventDate("invalid")).toBe("Date to be confirmed");
  });
});
