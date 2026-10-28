import { invitationImageDesign } from "./invitationImageDesign";
import { uiText } from "../i18n/uiText";
import Konva from "konva";
import { roundedInvitationCanvas } from "./roundedInvitationCanvas";
import type { Design, Invitation } from "../types";
import { interpolate } from "./index";
import { invitationFont } from "./invitationFont";
import { fitInvitationText } from "./fitInvitationText";

export async function downloadInvitationImage(design: Design, event: Invitation, guest: string) {
  design = invitationImageDesign({ ...event, design }, uiText("ui.78ba2a6d9b97"));
  await document.fonts.ready;
  const container = document.createElement("div");
  const stage = new Konva.Stage({ container, width: 480, height: 720 });
  try {
    const layer = new Konva.Layer();
    stage.add(layer);
    layer.add(new Konva.Rect({ width: 480, height: 720, fill: design.background,
      ...(design.gradient ? {
        fillPriority: "linear-gradient",
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 400, y: 600 },
        fillLinearGradientColorStops: [0, design.gradient.start, 1, design.gradient.end],
      } : {}),
    }));
    const images = await Promise.all(design.elements.map(async (el) => {
      if (el.type !== "image" || !el.src) return undefined;
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = el.src;
      await image.decode();
      return image;
    }));
    design.elements.forEach((el, index) => {
      const props = { x: el.x, y: el.y, width: el.width, height: el.height,
        rotation: el.rotation, opacity: el.opacity ?? 1, fill: el.fill,
        shadowColor: el.shadowColor, shadowBlur: el.shadowBlur,
        shadowOffsetX: el.shadowOffsetX, shadowOffsetY: el.shadowOffsetY };
      if (el.type === "image" && images[index]) {
        const image = images[index]!;
        layer.add(new Konva.Image({ ...props, image, ...(el.crop ? { crop: {
          x: image.naturalWidth * el.crop.x / 100, y: image.naturalHeight * el.crop.y / 100,
          width: image.naturalWidth * el.crop.width / 100, height: image.naturalHeight * el.crop.height / 100,
        } } : {}) }));
      } else if (el.type === "rect") layer.add(new Konva.Rect(props));
      else if (el.type === "text") {
        const text = interpolate(el.text || "", event, guest);
        layer.add(new Konva.Text({ ...props, text, fontFamily: invitationFont(el.fontFamily),
          fontSize: fitInvitationText(el, text), align: el.align, lineHeight: 1.15 }));
      }
    });
    const canvas = roundedInvitationCanvas(stage.toCanvas({ pixelRatio: 3 }));
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!(blob instanceof Blob)) throw new Error(uiText("ui.db41f0494a50"));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(event.title || "invitation").replace(/[<>:"/\\|?*]/g, "-")}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } finally {
    stage.destroy();
  }
}
