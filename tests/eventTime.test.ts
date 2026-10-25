import { initialMiniSite } from "../src/utils/miniSite";
import { describe, expect, it } from "vitest";
import { eventInstant, countdownParts } from "../src/utils/eventTime";
import {
  deadlineInstant,
  publishedSnapshot,
} from "../src/utils/publishedSnapshot";
import type { Invitation } from "../src/types";
describe("timezone-aware public invitations", () => {
  it("resolves event time independently of the viewer timezone", () => {
    expect(eventInstant("2026-10-25", "09:00", "Asia/Colombo")).toBe(
      Date.parse("2026-10-25T03:30:00Z"),
    );
    expect(eventInstant("2026-07-01", "09:00", "America/New_York")).toBe(
      Date.parse("2026-07-01T13:00:00Z"),
    );
    expect(eventInstant("2026-10-25", "09:00", "invalid")).toBeNull();
  });
  it("clamps an elapsed countdown", () => {
    expect(countdownParts(1000, 2000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      ended: true,
    });
    expect(countdownParts(90061000, 0)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
      ended: false,
    });
  });
  it("publishes a server-enforceable deadline and strips the private share reference", () => {
    const event = {
      publicShareId: "private",
      rsvpDeadline: "2026-10-25T09:00",
      timezone: "Asia/Colombo",
    } as Invitation;
    const result = publishedSnapshot(event);
    expect(result.rsvpDeadlineAt?.toMillis()).toBe(
      Date.parse("2026-10-25T03:30:00Z"),
    );
    expect(result).not.toHaveProperty("publicShareId");
    expect(event.publicShareId).toBe("private");
    expect(publishedSnapshot({} as Invitation).rsvpDeadlineAt).toBeNull();
  });
  it("rejects impossible dates and malformed deadline values", () => {
    for (const value of ["2026-02-30T09:00", "bad", "2026-10-25T25:00"]) {
      const event = {
        rsvpDeadline: value,
        timezone: "Asia/Colombo",
      } as Invitation;
      expect(deadlineInstant(event)).toBeNaN();
      expect(() => publishedSnapshot(event)).toThrow();
    }
  });
});

it("never publishes private or hidden gallery metadata", () => {
  const event = {
    site: {
      ...initialMiniSite(),
      photos: [
        {
          url: "https://example.com/private",
          caption: "Private note",
          visibility: "private" as const,
        },
        {
          url: "https://example.com/public",
          caption: "Public",
          visibility: "public" as const,
        },
      ],
    },
  } as Invitation;
  expect(publishedSnapshot(event).site?.photos).toEqual([
    event.site!.photos[1],
  ]);
  expect(event.site?.photos).toHaveLength(2);
  expect(
    publishedSnapshot({
      ...event,
      site: { ...event.site!, sections: ["intro"] },
    }).site?.photos,
  ).toEqual([]);
  expect(
    publishedSnapshot({ ...event, site: { ...event.site!, enabled: false } }),
  ).not.toHaveProperty("site");
});
