import type { AnimationPreset } from "../../../types";
export type OpeningStyle =
  | "classic-envelope"
  | "luxury-golden"
  | "floral-bloom"
  | "royal-curtain"
  | "modern-minimal";
export const openingStyles: {
  key: OpeningStyle;
  name: string;
  description: string;
  duration: number;
  action: string;
  symbol: string;
}[] = [
  {
    key: "classic-envelope",
    name: "Classic Envelope",
    description: "A wax-sealed letter, opened just for you.",
    duration: 3500,
    action: "Break the seal",
    symbol: "envelope",
  },
  {
    key: "luxury-golden",
    name: "Luxury Golden",
    description: "Golden light and a little evening magic.",
    duration: 3500,
    action: "Reveal your invitation",
    symbol: "sparkles",
  },
  {
    key: "floral-bloom",
    name: "Floral Bloom",
    description: "A garden grows around your celebration.",
    duration: 4000,
    action: "Let it bloom",
    symbol: "flower",
  },
  {
    key: "royal-curtain",
    name: "Royal Curtain",
    description: "The stage is set for something wonderful.",
    duration: 3500,
    action: "Raise the curtain",
    symbol: "crown",
  },
  {
    key: "modern-minimal",
    name: "Modern Minimal",
    description: "Thoughtful typography. A beautifully quiet entrance.",
    duration: 2500,
    action: "Discover the occasion",
    symbol: "line",
  },
];
export function resolveOpeningStyle(
  value?: AnimationPreset,
): OpeningStyle | null {
  if (openingStyles.some((style) => style.key === value))
    return value as OpeningStyle;
  if (value === "envelope") return "classic-envelope";
  if (value === "floral") return "floral-bloom";
  if (value === "elegant" || value === "particles" || value === "confetti")
    return "luxury-golden";
  if (value === "reveal" || value === "fade" || value === "slide")
    return "modern-minimal";
  return null;
}
export interface OpeningAnimationProps {
  title: string;
  hostName?: string;
  running: boolean;
}
