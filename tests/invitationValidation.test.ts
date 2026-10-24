import { describe, it, expect } from "vitest";
import { validateInvitation } from "../src/utils/invitationValidation";
import type { Invitation } from "../src/types";
const valid = {
  title: "Opening",
  hostName: "Host",
  venueName: "Hall",
  eventDate: "2026-10-25",
  eventTime: "09:00",
  endTime: "10:00",
  timezone: "Asia/Colombo",
  googleMapsUrl: "",
  latitude: "",
  longitude: "",
  contactNumber: "0762332155",
  message: "Welcome",
  notes: "",
} as Invitation;
describe("invitation detail validation", () => {
  it("accepts valid details and Sri Lankan local phone numbers", () =>
    expect(validateInvitation(valid)).toEqual({}));
  it("rejects whitespace-only required names", () =>
    expect(
      validateInvitation({
        ...valid,
        title: "  ",
        hostName: " ",
        venueName: " ",
      }),
    ).toMatchObject({
      title: expect.any(String),
      hostName: expect.any(String),
      venueName: expect.any(String),
    }));
  it("rejects impossible dates, times and timezones", () =>
    expect(
      validateInvitation({
        ...valid,
        eventDate: "2026-02-30",
        eventTime: "25:00",
        timezone: "invalid",
      }),
    ).toMatchObject({
      eventDate: expect.any(String),
      eventTime: expect.any(String),
      timezone: expect.any(String),
    }));
  it("rejects end time before or equal to start", () => {
    for (const endTime of ["08:00", "09:00"])
      expect(validateInvitation({ ...valid, endTime }).endTime).toBeTruthy();
  });
  it("validates maps even when coordinates are present", () =>
    expect(
      validateInvitation({
        ...valid,
        googleMapsUrl: "https://evil.test",
        latitude: "6.9",
        longitude: "79.8",
      }).googleMapsUrl,
    ).toBeTruthy());
  it("requires both coordinates in range", () => {
    expect(
      validateInvitation({ ...valid, latitude: "91", longitude: "181" }),
    ).toMatchObject({
      latitude: expect.any(String),
      longitude: expect.any(String),
    });
    expect(
      validateInvitation({ ...valid, latitude: "6.9" }).longitude,
    ).toBeTruthy();
  });
  it("rejects invalid optional phone numbers and allows blank optional fields", () => {
    expect(
      validateInvitation({ ...valid, contactNumber: "123" }).contactNumber,
    ).toBeTruthy();
    expect(
      validateInvitation({ ...valid, contactNumber: "", endTime: "" }),
    ).toEqual({});
  });
});
