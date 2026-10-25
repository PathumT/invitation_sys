import { publishedMedia } from "./miniSite";
export interface TenantBrand {
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
}
export const defaultTenantBrand: TenantBrand = {
  displayName: "Evently Invitations",
  logoUrl: "",
  primaryColor: "#004b3d",
  accentColor: "#c58b3e",
  footerText: "Made for moments that matter.",
};
export function tenantBrandError(value: TenantBrand) {
  if (
    !value ||
    ![
      value.displayName,
      value.logoUrl,
      value.primaryColor,
      value.accentColor,
      value.footerText,
    ].every((item) => typeof item === "string")
  )
    return "Choose valid workspace branding.";
  if (
    !value.displayName.trim() ||
    value.displayName.length > 160 ||
    value.footerText.length > 160
  )
    return "Use a display name and footer of up to 160 characters.";
  if (
    !/^#[a-f0-9]{6}$/i.test(value.primaryColor) ||
    !/^#[a-f0-9]{6}$/i.test(value.accentColor)
  )
    return "Choose valid brand colors.";
  if (value.logoUrl && !publishedMedia(value.logoUrl))
    return "Choose a secure uploaded logo.";
  return "";
}
export function brandHover(color: string) {
  return (
    "#" +
    [1, 3, 5]
      .map((index) =>
        Math.round(parseInt(color.slice(index, index + 2), 16) * 0.75)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
