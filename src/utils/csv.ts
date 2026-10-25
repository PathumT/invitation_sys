import { uiText } from "../i18n/uiText";
import type { Guest } from "../types";
export function parseGuestCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (quoted) throw new Error(uiText("ui.9aa2fb0a8a7e"));
  row.push(value);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error(uiText("ui.2c663947e52f"));
  if (rows.length > 501) throw new Error(uiText("ui.0a6c574f2211"));
  const headers = rows[0].map((value) =>
    value.toLowerCase().replace(/[^a-z]/g, ""),
  );
  const extraFields = {
    firstname: "firstName",
    lastname: "lastName",
    category: "category",
    mealpreference: "mealPreference",
    dietaryrestrictions: "dietaryRestrictions",
    privatenotes: "privateNotes",
  } as const;
  return rows.slice(1).map((row) => {
    const result: Partial<Guest> = {
      name: row[0]?.trim(),
      phoneNumber: row[1]?.trim(),
      email: row[2]?.trim() || "",
      guestCountAllowed: Number(row[3] || 1),
    };
    for (const [header, key] of Object.entries(extraFields)) {
      const index = headers.indexOf(header);
      if (index >= 0) result[key] = row[index]?.trim() || "";
    }
    for (const [header, key] of [
      ["plannedadults", "adultCount"],
      ["plannedchildren", "childCount"],
    ] as const) {
      const index = headers.indexOf(header);
      if (index >= 0) result[key] = Number(row[index] || 0);
    }
    const tagsIndex = headers.indexOf("tags");
    if (tagsIndex >= 0)
      result.tags = (row[tagsIndex] || "").split(";").filter(Boolean);
    return result;
  });
}
