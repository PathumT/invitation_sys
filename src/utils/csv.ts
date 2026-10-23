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
  if (quoted) throw new Error("CSV contains an unclosed quote.");
  row.push(value);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2)
    throw new Error("CSV needs a header and at least one guest.");
  if (rows.length > 501) throw new Error("Import up to 500 guests at a time.");
  return rows
    .slice(1)
    .map((r) => ({
      name: r[0]?.trim(),
      phoneNumber: r[1]?.trim(),
      email: r[2]?.trim() || "",
      guestCountAllowed: Number(r[3] || 1),
    }));
}
