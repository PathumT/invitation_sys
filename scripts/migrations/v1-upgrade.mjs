import process from "node:process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export function migrateV1(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Expected an offline workspace JSON export.");
  if (
    input.schemaVersion !== undefined &&
    input.schemaVersion !== 0 &&
    input.schemaVersion !== 1
  )
    throw new Error("Unsupported export version.");
  const result = globalThis.structuredClone(input);
  if (result.schemaVersion === 1) return result;
  function upgradeDesign(record) {
    if (
      !record ||
      typeof record !== "object" ||
      typeof record.id !== "string" ||
      !record.id
    )
      throw new Error("Every invitation must retain its ID.");
    if (record.design && typeof record.design === "object")
      record.design = { ...record.design, version: record.design.version ?? 1 };
    return record;
  }
  if (result.invitations) {
    if (!Array.isArray(result.invitations))
      throw new Error("Invalid invitation export.");
    result.invitations = result.invitations.map(upgradeDesign);
  }
  if (result.publicInvitations) {
    if (!Array.isArray(result.publicInvitations))
      throw new Error("Invalid public invitation export.");
    result.publicInvitations = result.publicInvitations.map((record) => {
      if (typeof record.id !== "string" || !record.id)
        throw new Error("Every public link must retain its ID.");
      if (record.publishedSnapshot?.design)
        record.publishedSnapshot.design = {
          ...record.publishedSnapshot.design,
          version: record.publishedSnapshot.design.version ?? 1,
        };
      return record;
    });
  }
  result.schemaVersion = 1;
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2),
      rollback = args[0] === "--rollback";
    if (rollback) args.shift();
    const [inputPath, outputPath] = args;
    if (!inputPath)
      throw new Error(
        "Usage: node scripts/migrations/v1-upgrade.mjs [--rollback] input.json [new-output.json]",
      );
    const original = readFileSync(resolve(inputPath), "utf8"),
      snapshot = JSON.parse(original),
      next = rollback ? snapshot : migrateV1(snapshot);
    if (outputPath) {
      const output = resolve(outputPath),
        backup = `${output}.backup.json`;
      if (
        output === resolve(inputPath) ||
        existsSync(output) ||
        existsSync(backup)
      )
        throw new Error(
          "Output and backup must be new files; the input is never overwritten.",
        );
      writeFileSync(backup, original, { flag: "wx" });
      writeFileSync(
        output,
        rollback ? original : JSON.stringify(next, null, 2) + "\n",
        { flag: "wx" },
      );
    }
    process.stdout.write(
      JSON.stringify({
        mode: outputPath ? "local export written" : "dry run",
        schemaVersion: next.schemaVersion || 0,
        invitations: next.invitations?.length || 0,
        publicLinks: next.publicInvitations?.length || 0,
        changed: JSON.stringify(snapshot) !== JSON.stringify(next),
      }) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
