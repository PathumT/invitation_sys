import { describe, it, expect } from "vitest";
import {
  initialMiniSite,
  miniSiteError,
  secureWebsite,
  videoEmbed,
} from "../src/utils/miniSite";
describe("optional event websites", () => {
  it("retains old invitations and provides a valid default website", () => {
    expect(miniSiteError()).toBe("");
    expect(miniSiteError(initialMiniSite())).toBe("");
  });
  it("rejects unsafe links and credentials", () => {
    for (const value of [
      "javascript:alert(1)",
      "http://example.com",
      "https://user:pass@example.com",
    ])
      expect(secureWebsite(value)).toBe("");
    expect(secureWebsite("https://example.com")).toBe("https://example.com/");
  });
  it("uses allowlisted non-autoplay video embeds", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(videoEmbed("https://vimeo.com/123456")).toBe(
      "https://player.vimeo.com/video/123456",
    );
    expect(
      videoEmbed("https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ"),
    ).toBe("");
  });
  it("validates section order, content bounds and registry URLs", () => {
    const site = initialMiniSite();
    expect(miniSiteError({ ...site, sections: ["rsvp", "rsvp"] })).not.toBe("");
    expect(
      miniSiteError({
        ...site,
        registry: [{ url: "javascript:alert(1)", title: "Gift" }],
      }),
    ).not.toBe("");
    expect(
      miniSiteError({ ...site, faq: [{ question: "Q", answer: "" }] }),
    ).not.toBe("");
  });
});
