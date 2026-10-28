import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import en from "../src/i18n/locales/en.json";
import pending from "../src/i18n/review/pending.json";
import status from "../src/i18n/review/status.json";
import catalog from "../src/i18n/review/source-catalog.json";
import { activeLocale, localeCatalog } from "../src/i18n/localePolicy";
describe("translation review handoff", () => {
  it("preflights all source files before writing an extraction", () => {
    const toolRoot = realpathSync(resolve(".tools"));
    const fixture = mkdtempSync(join(toolRoot, "localization-preflight-"));
    const first = join(fixture, "src/a.tsx");
    const original = "export const First = () => <p>First message</p>;";
    try {
      mkdirSync(join(fixture, "src/i18n/locales"), { recursive: true });
      for (const code of ["en", "si", "ta", "es", "fr"])
        writeFileSync(join(fixture, `src/i18n/locales/${code}.json`), "{}");
      writeFileSync(first, original);
      writeFileSync(
        join(fixture, "src/z.tsx"),
        "const uiText = 1; export const Last = () => <p>Last message</p>;",
      );
      expect(() =>
        execFileSync(
          process.execPath,
          [resolve("scripts/extract-localization.mjs"), "--write"],
          { cwd: fixture, stdio: "pipe" },
        ),
      ).toThrow();
      expect(readFileSync(first, "utf8")).toBe(original);
      expect(
        readFileSync(join(fixture, "src/i18n/locales/en.json"), "utf8"),
      ).toBe("{}");
    } finally {
      const target = realpathSync(fixture);
      if (target.startsWith(toolRoot + sep))
        rmSync(target, { recursive: true });
    }
  });
  it("does not activate a pending language when approval flags are changed alone", () => {
    const language = localeCatalog.find((locale) => locale.code === "fr")!;
    const originalFlag = language.reviewed,
      originalReview = { ...status.fr };
    try {
      Object.assign(language, { reviewed: true });
      Object.assign(status.fr, { reviewed: true });
      expect(activeLocale("fr")).toBe("en");
    } finally {
      Object.assign(language, { reviewed: originalFlag });
      Object.assign(status.fr, originalReview);
    }
  });
  it("records unreviewed placeholder counts without activating draft locales", () => {
    for (const language of ["si", "ta", "es", "fr"] as const) {
      expect(status[language].untranslatedKeys).toBe(pending[language].length);
      expect(status[language].reviewed).toBe(false);
      expect(pending[language].every((key) => Object.hasOwn(en, key))).toBe(
        true,
      );
      expect(activeLocale(language)).toBe("en");
    }
  });
  it("provides source context without runtime user values or absolute workstation paths", () => {
    for (const [key, entry] of Object.entries(catalog)) {
      expect(entry.english).toBe(en[key as keyof typeof en]);
      expect(entry.sources.length).toBeGreaterThan(0);
      expect(
        entry.sources.every(
          (source) => source.file.startsWith("src/") && source.line > 0,
        ),
      ).toBe(true);
    }
  });
  it("can rerun the extractor without rewriting localized application code", () => {
    const report = JSON.parse(
      execFileSync(
        process.execPath,
        ["scripts/extract-localization.mjs", "--check"],
        { encoding: "utf8" },
      ),
    );
    expect(report.files).toBe(0);
    expect(report.newKeys).toBe(0);
  });
});
