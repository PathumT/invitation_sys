import { fromZonedTime } from "date-fns-tz";
export function eventInstant(date: string, time: string, timezone: string) {
  if (!date || !time || !timezone) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    const result = fromZonedTime(`${date}T${time}`, timezone).getTime();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
export function countdownParts(target: number, now: number) {
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining / 3600) % 24,
    minutes: Math.floor(remaining / 60) % 60,
    seconds: remaining % 60,
    ended: target <= now,
  };
}
