import { describe, it, expect } from "vitest";
import { guestProfile } from "../src/utils/guestProfile";
import { parseGuestCSV } from "../src/utils/csv";
describe("private guest planning", () => {
  it("normalizes tags and preserves private planning separately from RSVP counts", () =>
    expect(
      guestProfile({
        guestCountAllowed: 3,
        adultCount: 2,
        childCount: 1,
        tags: ["Family", " Family ", ""],
        privateNotes: "Private",
      }),
    ).toMatchObject({
      adultCount: 2,
      childCount: 1,
      tags: ["Family"],
      privateNotes: "Private",
    }));
  it("rejects counts beyond the invitation allowance and oversized notes", () => {
    expect(() =>
      guestProfile({ guestCountAllowed: 1, adultCount: 2 }),
    ).toThrow();
    expect(() =>
      guestProfile({ guestCountAllowed: 1, childCount: -1 }),
    ).toThrow();
    expect(() =>
      guestProfile({ guestCountAllowed: 1, privateNotes: "x".repeat(2001) }),
    ).toThrow();
  });
  it("imports optional private columns while retaining legacy first columns", () =>
    expect(
      parseGuestCSV(
        "Name,Phone,Email,Allowed attendees,Category,Planned adults,Planned children,Private notes,Tags\nAlex,+94771234567,,3,Family,2,1,Private,Family;Evening",
      )[0],
    ).toMatchObject({
      name: "Alex",
      guestCountAllowed: 3,
      category: "Family",
      adultCount: 2,
      childCount: 1,
      privateNotes: "Private",
      tags: ["Family", "Evening"],
    }));
});
