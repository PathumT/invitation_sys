import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import { activeLocale } from "./localePolicy";
export { activeLocale, localeCatalog, localeIsReady } from "./localePolicy";
// Do not use browser detection or persisted locale values to activate unreviewed translations.
export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  lng: activeLocale(),
  fallbackLng: "en",
  supportedLngs: ["en"],
  resources: { en: { translation: en } },
  keySeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});

function syncDocumentLanguage() {
  if (typeof document !== "undefined")
    document.documentElement.lang = activeLocale(
      i18n.resolvedLanguage || i18n.language,
    );
}
i18n.on("languageChanged", syncDocumentLanguage);
syncDocumentLanguage();
