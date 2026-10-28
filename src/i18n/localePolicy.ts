import reviewStatus from "./review/status.json";
export const localeCatalog = [
  { code: "en", name: "English", reviewed: true },
  { code: "si", name: "Sinhala", reviewed: false },
  { code: "ta", name: "Tamil", reviewed: false },
  { code: "es", name: "Spanish", reviewed: false },
  { code: "fr", name: "French", reviewed: false },
] as const;
export function localeIsReady(requested: string) {
  const locale = localeCatalog.find((locale) => locale.code === requested);
  return !!(
    locale?.reviewed &&
    reviewStatus[locale.code].reviewed &&
    reviewStatus[locale.code].untranslatedKeys === 0
  );
}
export function activeLocale(requested?: string) {
  const locale = localeCatalog.find((locale) => locale.code === requested);
  return locale && localeIsReady(locale.code) ? locale.code : "en";
}
