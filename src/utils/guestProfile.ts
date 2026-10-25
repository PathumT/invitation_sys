import { uiText } from "../i18n/uiText";
import type { Guest } from "../types";
export const guestCategories = [
  "Family",
  "Friends",
  "VIP",
  "Colleagues",
  "Other",
];
export function guestProfile(guest: Partial<Guest>) {
  const profile = {
    reminderOptOut: guest.reminderOptOut === true,
    firstName: guest.firstName?.trim() || "",
    lastName: guest.lastName?.trim() || "",
    category: guest.category?.trim() || "Other",
    adultCount: guest.adultCount ?? 0,
    childCount: guest.childCount ?? 0,
    mealPreference: guest.mealPreference?.trim() || "",
    dietaryRestrictions: guest.dietaryRestrictions?.trim() || "",
    privateNotes: guest.privateNotes?.trim() || "",
    tags: [
      ...new Set((guest.tags || []).map((tag) => tag.trim()).filter(Boolean)),
    ],
  };
  for (const value of [
    profile.firstName,
    profile.lastName,
    profile.category,
    profile.mealPreference,
  ])
    if (value.length > 160) throw new Error(uiText("ui.e59d36dca3b3"));
  if (
    profile.dietaryRestrictions.length > 500 ||
    profile.privateNotes.length > 2000
  )
    throw new Error(uiText("ui.3a89f9e8b5ca"));
  if (profile.tags.length > 20 || profile.tags.some((tag) => tag.length > 32))
    throw new Error(uiText("ui.759985038d1a"));
  if (
    ![profile.adultCount, profile.childCount].every(
      (count) => Number.isInteger(count) && count >= 0,
    ) ||
    profile.adultCount + profile.childCount > Number(guest.guestCountAllowed)
  )
    throw new Error(uiText("ui.8a054d4e673b"));
  return profile;
}
