import { i18n } from "./index";
import { activeLocale } from "./localePolicy";
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const clockFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();
function language(requested?: string) {
  return activeLocale(requested ?? i18n.resolvedLanguage ?? i18n.language);
}
function intlLocale(requested?: string) {
  const current = language(requested);
  return current === "en" ? "en-GB" : current;
}
export function formatNumber(value: number, requested?: string) {
  if (!Number.isFinite(value)) return "\u2014";
  const locale = intlLocale(requested);
  if (!numberFormats.has(locale))
    numberFormats.set(locale, new Intl.NumberFormat(locale));
  return numberFormats.get(locale)!.format(value);
}
export function formatCalendarDate(
  value: string,
  weekday = false,
  requested?: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return value;
  const locale = intlLocale(requested),
    key = `${locale}:${weekday}`;
  if (!dateFormats.has(key))
    dateFormats.set(
      key,
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(weekday ? { weekday: "long" as const } : {}),
        timeZone: "UTC",
      }),
    );
  return dateFormats.get(key)!.format(date);
}
export function formatClockTime(value: string, requested?: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;
  const date = new Date(`2000-01-01T${value}:00Z`),
    locale = intlLocale(requested);
  if (!clockFormats.has(locale))
    clockFormats.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        ...(language(requested) === "en" ? { hour12: true } : {}),
        timeZone: "UTC",
      }),
    );
  const formatter = clockFormats.get(locale)!;
  if (language(requested) !== "en") return formatter.format(date);
  const parts = formatter.formatToParts(date),
    part = (type: string) =>
      parts.find((item) => item.type === type)?.value || "";
  return `${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}
