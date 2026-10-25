import { describe, expect, it } from "vitest";
import en from "../src/i18n/locales/en.json";
import si from "../src/i18n/locales/si.json";
import ta from "../src/i18n/locales/ta.json";
import es from "../src/i18n/locales/es.json";
import fr from "../src/i18n/locales/fr.json";
import { activeLocale, i18n, localeCatalog } from "../src/i18n";
import { categories, starterTemplates } from "../src/services/templateCatalog";
describe("reviewed language activation", () => {
  it("prepares matching nonempty translation keys for five locales", () => {
    for (const resource of [si, ta, es, fr]) {
      expect(Object.keys(resource).sort()).toEqual(Object.keys(en).sort());
      expect(
        Object.values(resource).every(
          (value) => !!value.trim() && !value.includes("\uFFFD"),
        ),
      ).toBe(true);
    }
  });
  it("keeps every unreviewed or unknown locale in English", () => {
    for (const locale of [
      ...localeCatalog.map((item) => item.code),
      "unknown",
      undefined,
    ])
      expect(activeLocale(locale)).toBe("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("rsvp.accept")).toBe("Accept Invitation");
  });
});
describe("expanded occasion catalog", () => {
  it("has a real reusable design for every advertised occasion", () => {
    for (const category of categories)
      expect(
        starterTemplates.some(
          (template) =>
            template.category === category &&
            template.design.elements.length > 0,
        ),
      ).toBe(true);
    expect(new Set(starterTemplates.map((item) => item.id)).size).toBe(
      starterTemplates.length,
    );
    expect(starterTemplates.find((item) => item.id === "starter-0")?.name).toBe(
      "The botanical edit",
    );
  });
});
