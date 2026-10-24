import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimModuleRecovery,
  clearModuleRecovery,
} from "../src/utils/lazyRoute";
const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) || null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  removeItem: (key: string) => {
    values.delete(key);
  },
};
beforeEach(() => values.clear());
describe("lazy route load recovery", () => {
  it("allows one recovery and prevents reload loops", () => {
    const error = new TypeError(
      "Failed to fetch dynamically imported module: /src/pages/Settings.tsx",
    );
    expect(claimModuleRecovery(error, "Settings", storage)).toBe(true);
    expect(claimModuleRecovery(error, "Settings", storage)).toBe(false);
  });
  it("does not reload for application or syntax errors", () => {
    expect(
      claimModuleRecovery(
        new Error("Cannot read properties of undefined"),
        "Settings",
        storage,
      ),
    ).toBe(false);
    expect(
      claimModuleRecovery(
        new SyntaxError("Unexpected token"),
        "Settings",
        storage,
      ),
    ).toBe(false);
  });
  it("recognizes Firefox and Safari module failures", () => {
    for (const message of [
      "error loading dynamically imported module",
      "Importing a module script failed.",
    ]) {
      values.clear();
      expect(
        claimModuleRecovery(new TypeError(message), "Settings", storage),
      ).toBe(true);
    }
  });
  it("resets recovery only after that route has loaded successfully", () => {
    const error = new Error("Failed to fetch dynamically imported module");
    claimModuleRecovery(error, "Settings", storage);
    clearModuleRecovery("Dashboard", storage);
    expect(claimModuleRecovery(error, "Settings", storage)).toBe(false);
    clearModuleRecovery("Settings", storage);
    expect(claimModuleRecovery(error, "Settings", storage)).toBe(true);
  });
  it("preserves the manual fallback when browser storage is unavailable", () => {
    expect(
      claimModuleRecovery(
        new Error("Failed to fetch dynamically imported module"),
        "Settings",
        {
          getItem: vi.fn(() => {
            throw new Error("Storage blocked");
          }),
          setItem: vi.fn(),
        },
      ),
    ).toBe(false);
  });
});
