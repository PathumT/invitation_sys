import { describe, expect, it } from "vitest";
import {
  openingStyles,
  resolveOpeningStyle,
} from "../src/components/invitations/opening/openingStyles";
import type { AnimationPreset } from "../src/types";
describe("saved invitation opening styles", () => {
  it.each(openingStyles)(
    "retains the exact saved $key selection",
    ({ key, duration }) => {
      expect(resolveOpeningStyle(key)).toBe(key);
      expect(duration).toBeGreaterThanOrEqual(2500);
      expect(duration).toBeLessThanOrEqual(4000);
    },
  );
  it("preserves old saved animation values without migrating documents", () => {
    expect(resolveOpeningStyle("envelope")).toBe("classic-envelope");
    expect(resolveOpeningStyle("floral")).toBe("floral-bloom");
    for (const old of ["elegant", "particles", "confetti"] as const)
      expect(resolveOpeningStyle(old)).toBe("luxury-golden");
    for (const old of ["fade", "reveal", "slide"] as const)
      expect(resolveOpeningStyle(old)).toBe("modern-minimal");
  });
  it("leaves invitations without an animation immediately readable", () => {
    expect(resolveOpeningStyle()).toBeNull();
    expect(resolveOpeningStyle("none")).toBeNull();
    expect(
      resolveOpeningStyle("unknown-future-style" as AnimationPreset),
    ).toBeNull();
  });
});
