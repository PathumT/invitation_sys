import type { Design, Invitation } from "../types";

export function invitationImageDesign(event: Invitation, contactLabel: string): Design {
  const design = event.design;
  if (!event.contactNumber?.trim() || design.elements.some((el) => (el.id === "download-host-contact" || el.text?.includes("{{contactNumber}}")))) return design;
  const address = design.elements.find((el) => el.type === "text" && el.text?.includes("{{venueAddress}}"));
  if (!address) return design;
  const opening = design.presentation === "grand-opening";
  const imageAddress = opening
    ? { ...address, y: address.y - 20, height: 16 }
    : address;
  const elements = design.elements.map((el) => {
    if (el === address) return imageAddress;
    if (opening && el.type === "text" && el.text?.includes("{{venueName}}"))
      return { ...el, y: el.y - 10, height: 24 };
    return el;
  });
  return {
    ...design,
    elements: [...elements, {
      ...imageAddress,
      id: "download-host-contact",
      text: `${contactLabel}${event.contactNumber}`,
      y: imageAddress.y + imageAddress.height + 3,
      height: Math.max(18, address.fontSize * 1.3),
      fontSize: Math.min(address.fontSize, 12),
      shadowColor: "#000000",
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
    }],
  };
}
