import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  mapsUrl,
  normalizePhone,
  interpolate,
  token,
  whatsappUrl,
  shareUrl,
} from "../src/utils";
import { parseGuestCSV } from "../src/utils/csv";
import { useEditorStore } from "../src/hooks/editorStore";
import { starterTemplates } from "../src/services/templateService";
import type { Invitation } from "../src/types";
beforeAll(() => {
  vi.stubEnv("VITE_APP_URL", "https://inviteflow.test");
  Object.defineProperty(globalThis, "window", {
    value: { location: { origin: "https://inviteflow.test" } },
    configurable: true,
  });
});
describe("WhatsApp and personal links", () => {
  it("adds a safe host name segment while retaining legacy links", () => {
    expect(shareUrl("abc", "Pathum Thennakoon")).toBe("https://inviteflow.test/i/abc/pathum-thennakoon");
    expect(shareUrl("abc", " H & K / Construction? ")).toBe("https://inviteflow.test/i/abc/h-k-construction");
    expect(shareUrl("abc", "   ")).toBe("https://inviteflow.test/i/abc");
    expect(shareUrl("abc")).toBe("https://inviteflow.test/i/abc");
  });
  it("normalizes international phone numbers", () => {
    expect(normalizePhone("+94 77 123 4567")).toBe("+94771234567");
    expect(() => normalizePhone("123")).toThrow();
  });
  it("encodes a personalized message and opaque link", () => {
    const url = new URL(
      whatsappUrl(
        "+94 77 123 4567",
        "Sarah & Sam",
        {
          title: "Garden & friends",
          eventDate: "2026-12-15",
          eventTime: "17:00",
          timezone: "Asia/Colombo",
          venueName: "Garden",
        } as Invitation,
        "a".repeat(48),
      ),
    );
    expect(url.pathname).toBe("/94771234567");
    expect(url.searchParams.get("text")).toContain("Sarah & Sam");
    expect(url.searchParams.get("text")).toContain(
      "https://inviteflow.test/i/" + "a".repeat(48),
    );
  });
  it("creates independent 192-bit share IDs", () => {
    const a = token(),
      b = token();
    expect(a).toMatch(/^[a-f0-9]{48}$/);
    expect(a).not.toBe(b);
  });
});
describe("Maps", () => {
  it("encodes address and coordinate searches", () => {
    expect(mapsUrl("", "", "", "A & B")).toContain("A%20%26%20B");
    expect(mapsUrl("", "6.9", "79.8")).toContain("6.9%2C79.8");
  });
  it("accepts only HTTPS Google Maps destinations", () => {
    expect(mapsUrl("https://maps.app.goo.gl/abc")).toContain("maps.app.goo.gl");
    for (const url of [
      "javascript:alert(1)",
      "https://google.com.evil.test/maps",
      "https://evil.test",
      "http://google.com/maps",
      "https://goo.gl/evil",
    ])
      expect(() => mapsUrl(url)).toThrow();
  });
  it("rejects invalid coordinates", () => {
    expect(() => mapsUrl("", "91", "10")).toThrow();
    expect(() => mapsUrl("", "6", "")).toThrow();
  });
});
describe("design persistence and history", () => {
  it("loads, edits, serializes, reloads, undoes and redoes a design", () => {
    useEditorStore.getState().reset(starterTemplates[0].design);
    const original = useEditorStore.getState().design;
    const changed = {
      ...original,
      elements: original.elements.map((e, i) =>
        i === 0 ? { ...e, text: "A new beginning" } : e,
      ),
    };
    useEditorStore.getState().set(changed);
    expect(useEditorStore.getState().design.elements[0].text).toBe(
      "A new beginning",
    );
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().design).toEqual(original);
    useEditorStore.getState().redo();
    const json = JSON.stringify(useEditorStore.getState().design);
    useEditorStore.getState().reset(JSON.parse(json));
    expect(useEditorStore.getState().design).toEqual(changed);
  });
  it("keeps template variables linked to event details", () =>
    expect(
      interpolate(
        "{{eventTitle}} at {{venueName}} for {{guestName}}",
        { title: "Our day", venueName: "Grand Ballroom" },
        "Sarah",
      ),
    ).toBe("Our day at Grand Ballroom for Sarah"));
});
describe("CSV", () => {
  it("supports quoted names, commas and escaped quotes", () =>
    expect(
      parseGuestCSV(
        'name,phone,email,allowed\r\n"Smith, ""Alex""",+94771234567,,2',
      )[0],
    ).toEqual({
      name: 'Smith, "Alex"',
      phoneNumber: "+94771234567",
      email: "",
      guestCountAllowed: 2,
    }));
  it("rejects incomplete CSV", () =>
    expect(() => parseGuestCSV('name,phone\n"unclosed')).toThrow());
});
