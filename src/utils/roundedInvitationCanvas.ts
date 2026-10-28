import { uiText } from "../i18n/uiText";

/** Round the actual exported pixels, preserving full resolution and card size. */
export function roundedInvitationCanvas(source: HTMLCanvasElement, opaque = false) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(uiText("ui.db41f0494a50"));
  // JPEG has no alpha channel, so use white outside its rounded card.
  if (opaque) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, canvas.width / 30);
  context.clip();
  context.drawImage(source, 0, 0);
  return canvas;
}
