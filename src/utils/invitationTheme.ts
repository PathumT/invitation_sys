import type { Design } from "../types";
export function readableInk(color: string) {
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return "#253f35";
  const rgb = [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
    ? "#253f35"
    : "#faf7ef";
}
export function invitationTheme(design: Design) {
  const ink = readableInk(design.background);
  const accent =
    design.palette?.accent || (ink === "#253f35" ? "#315f50" : "#e2c68b");
  return {
    "--card-paper": design.background,
    "--card-ink": ink,
    "--card-accent": accent,
    "--card-button-ink": readableInk(accent),
  };
}
