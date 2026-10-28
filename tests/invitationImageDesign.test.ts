import { describe, expect, it } from "vitest";
import { invitationImageDesign } from "../src/utils/invitationImageDesign";
import { grandOpeningTemplate } from "../src/services/grandOpeningTemplate";
import type { Invitation } from "../src/types";

const event = { design: grandOpeningTemplate.design, contactNumber: "+94 77 123 4567" } as Invitation;

describe("invitation image contact", () => {
  it("adds the host contact directly under the address without changing the saved design", () => {
    const design = invitationImageDesign(event, "Contact host · ");
    const contact = design.elements.at(-1)!;
    const address = design.elements.find((el) => el.id === "address")!;
    expect(contact.text).toBe("Contact host · +94 77 123 4567");
    expect(contact.y).toBe(address.y + address.height + 3);
    expect(contact.x).toBe(address.x);
    expect(contact.fill).toBe(address.fill);
    expect(contact.y + contact.height).toBeLessThan(720);
    // The hardware artwork starts below this area: keep the whole contact line
    // on the clear blue background, with venue and address above it.
    expect(contact.y + contact.height).toBeLessThanOrEqual(626);
    const venue = design.elements.find((el) => el.id === "venue")!;
    expect(venue.y + venue.height).toBeLessThanOrEqual(address.y);
    expect(event.design.elements.some((el) => el.id === contact.id)).toBe(false);
  });
  it("omits missing contact information and preserves existing contact elements", () => {
    expect(invitationImageDesign({ ...event, contactNumber: "" }, "Contact host · ")).toBe(event.design);
    const design = { ...event.design, elements: [...event.design.elements, { ...event.design.elements[1], text: "{{contactNumber}}" }] };
    expect(invitationImageDesign({ ...event, design }, "Contact host · ")).toBe(design);
  });
  it("can be applied by both preview and export without duplicating the contact", () => {
    const design = invitationImageDesign(event, "Contact host · ");
    expect(invitationImageDesign({ ...event, design }, "Contact host · ")).toBe(design);
    expect(design.elements.filter((el) => el.id === "download-host-contact")).toHaveLength(1);
  });
});
