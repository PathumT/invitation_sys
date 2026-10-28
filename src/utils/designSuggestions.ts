import type { Invitation } from "../types";
export function occasionMessage(event: Partial<Invitation>) {
  const title = event.title?.trim() || "our celebration";
  if (event.eventType === "Wedding")
    return `Together with our families, we invite you to celebrate ${title}. Your presence will make our day even more special.`;
  if (
    ["Grand Opening", "Store Opening", "Product Launch"].includes(
      event.eventType || "",
    )
  )
    return `You are cordially invited to ${title}. Join us as we open a new chapter and celebrate this special beginning together.`;
  if (
    event.eventType === "Conference" ||
    event.eventType === "Corporate Event" ||
    event.eventType === "Corporate"
  )
    return `Join us for ${title}, an opportunity to connect, share ideas and spend meaningful time together. We look forward to welcoming you.`;
  return `We would love for you to join us for ${title}. Come share good company, happy moments and a celebration to remember.`;
}
