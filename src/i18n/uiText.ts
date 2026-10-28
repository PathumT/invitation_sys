import { i18n } from "./index";
/** Local resources only; no interface text or values are sent to translation services. */
export function uiText(key: string, values?: Record<string, unknown>): string {
  return String(
    i18n.t(key, {
      ...values,
      interpolation: values
        ? { escapeValue: false, skipOnVariables: true }
        : { escapeValue: false, prefix: "\u0001", suffix: "\u0002" },
    }),
  );
}
