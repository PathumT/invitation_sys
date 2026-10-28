import { uiText } from "../src/i18n/uiText";
import en from "../src/i18n/locales/en.json";
import { describe, it, expect } from "vitest";
import {
  formatCalendarDate,
  formatClockTime,
  formatNumber,
} from "../src/i18n/format";
import { i18n } from "../src/i18n";
import { authSchema } from "../src/utils/authValidation";
describe("reviewed English formatting", () => {
  it("formats calendar dates without shifting them to the viewer timezone", () => {
    expect(formatCalendarDate("2026-12-15")).toBe("15 December 2026");
    expect(formatCalendarDate("2026-12-15", true)).toBe(
      "Tuesday, 15 December 2026",
    );
    expect(formatCalendarDate("2026-02-30")).toBe("2026-02-30");
  });
  it("preserves the existing English 12-hour clock and rejects malformed times", () => {
    expect(formatClockTime("00:00")).toBe("12:00 AM");
    expect(formatClockTime("17:05")).toBe("5:05 PM");
    expect(formatClockTime("25:99")).toBe("25:99");
  });
  it("keeps unreviewed requested locales in English, including numbers", () => {
    for (const language of ["si", "ta", "es", "fr"]) {
      expect(formatNumber(12345.5, language)).toBe("12,345.5");
      expect(formatCalendarDate("2026-12-15", false, language)).toBe(
        "15 December 2026",
      );
    }
    expect(formatNumber(NaN)).toBe("\u2014");
  });
  it("sources account validation messages from the active dictionary", () => {
    const result = authSchema(true).safeParse({
      name: "A",
      email: "bad",
      password: "short",
      confirm: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.find((issue) => issue.path[0] === "email")?.message,
      ).toBe(i18n.t("validation.email"));
      expect(
        result.error.issues.find((issue) => issue.path[0] === "confirm")
          ?.message,
      ).toBe(i18n.t("validation.passwordMismatch"));
    }
  });
});

describe("extracted UI copy", () => {
  it("preserves literal invitation binding instructions", () => {
    const [key, text] = Object.entries(en).find(([, text]) =>
      text.includes("{{guestName}}"),
    )!;
    expect(uiText(key)).toBe(text);
  });
  it("does not evaluate translation syntax introduced by user values", () => {
    const [key, text] = Object.entries(en).find(
      ([, text]) => text.includes("{{value0}}") && !text.includes("{{value1}}"),
    )!;
    const value = "<Guest> {{hostName}} $t(nav.settings)";
    expect(uiText(key, { value0: value })).toBe(
      text.replaceAll("{{value0}}", value),
    );
  });
});
