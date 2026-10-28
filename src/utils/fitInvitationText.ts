import Konva from "konva";
import type { DesignElement } from "../types";
import { invitationFont } from "./invitationFont";

/** Use the same wrapping and line height for the HTML card and canvas export. */
export function fitInvitationText(element: DesignElement, text: string) {
  if (element.type !== "text" || !text || typeof document === "undefined") return element.fontSize;
  const node = new Konva.Text({
    text, width: Math.max(1, element.width),
    fontFamily: invitationFont(element.fontFamily),
    fontSize: element.fontSize, lineHeight: 1.15, wrap: "word",
  });
  let size = element.fontSize;
  while (node.height() > element.height && size > 1) {
    size = Math.max(1, size - 0.5);
    node.fontSize(size);
  }
  node.destroy();
  return size;
}
