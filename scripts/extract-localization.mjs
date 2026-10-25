import ts from "typescript";
import process from "node:process";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(process.cwd());
const write = process.argv.includes("--write");
const localeDir = join(root, "src/i18n/locales");
const languages = ["en", "si", "ta", "es", "fr"];
const resources = Object.fromEntries(
  languages.map((language) => [
    language,
    JSON.parse(readFileSync(join(localeDir, `${language}.json`), "utf8")),
  ]),
);
const byText = new Map(
  Object.entries(resources.en).map(([key, text]) => [text, key]),
);
const catalog = {};
const pendingPath = join(root, "src/i18n/review/pending.json");
const pending = existsSync(pendingPath)
  ? JSON.parse(readFileSync(pendingPath, "utf8"))
  : Object.fromEntries(
      languages
        .filter((language) => language !== "en")
        .map((language) => [language, []]),
    );
const backup = join(root, ".tools", `localization-backup-${Date.now()}`);
const staged = [];
let writtenFiles = 0;
let changed = 0,
  occurrences = 0,
  newKeys = 0;
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "i18n" ? [] : files(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
function readable(text) {
  return /[A-Za-z]/.test(text) && text.trim().length > 0;
}
function compiledValue(snippet, attribute = false) {
  const output = ts.transpileModule(`const value=${snippet};`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ESNext },
  }).outputText;
  const file = ts.createSourceFile(
    "literal.js",
    output,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const call =
    file.statements[0]?.declarationList?.declarations[0]?.initializer;
  const value = attribute
    ? call?.arguments?.[1]?.properties?.[0]?.initializer
    : call?.arguments?.[2];
  return value && ts.isStringLiteral(value) ? value.text : null;
}
function keyFor(text, file, node, kind) {
  let key = byText.get(text);
  if (!key) {
    key = `ui.${createHash("sha256").update(text).digest("hex").slice(0, 12)}`;
    if (resources.en[key] && resources.en[key] !== text)
      throw new Error("Translation key collision.");
    resources.en[key] = text;
    byText.set(text, key);
    newKeys++;
  }
  for (const language of languages)
    if (!(key in resources[language])) {
      resources[language][key] = text;
      if (language !== "en") pending[language].push(key);
    }
  const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
  const location = {
    file: relative(root, file.fileName).replaceAll("\\", "/"),
    line,
    kind,
  };
  if (!catalog[key]) catalog[key] = { english: text, sources: [] };
  catalog[key].sources.push(location);
  occurrences++;
  return key;
}
function renderExpression(node) {
  let current = node,
    parent = node.parent;
  while (
    parent &&
    ts.isConditionalExpression(parent) &&
    (parent.whenTrue === current || parent.whenFalse === current)
  ) {
    current = parent;
    parent = parent.parent;
  }
  if (!parent || !ts.isJsxExpression(parent)) return false;
  return (
    !ts.isJsxAttribute(parent.parent) ||
    ["placeholder", "title", "aria-label", "alt"].includes(
      parent.parent.name.getText(),
    )
  );
}
function messageExpression(node) {
  const parent = node.parent;
  if (
    ts.isNewExpression(parent) &&
    parent.arguments?.[0] === node &&
    /Error$/.test(parent.expression.getText())
  )
    return true;
  if (ts.isCallExpression(parent) && parent.arguments[0] === node) {
    const name = parent.expression.getText();
    return (
      /^toast\.(success|error|info|warning)$/.test(name) ||
      /^set\w*Error$/.test(name)
    );
  }
  if (
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    parent.right === node &&
    /^errors(?:\.|\[)/.test(parent.left.getText())
  )
    return true;
  return (
    ts.isPropertyAssignment(parent) &&
    parent.name.getText() === "message" &&
    parent.initializer === node
  );
}
for (const path of files(join(root, "src"))) {
  const original = readFileSync(path, "utf8");
  const file = ts.createSourceFile(
    path,
    original,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const edits = [];
  function add(node, text, kind, jsx = false, values = "") {
    if (!readable(text)) return;
    const key = keyFor(text, file, node, kind),
      call = `uiText(${JSON.stringify(key)}${values ? `, {${values}}` : ""})`;
    edits.push({
      start: ts.isJsxText(node) ? node.pos : node.getStart(file),
      end: node.end,
      text: jsx ? `{${call}}` : call,
    });
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "uiText" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const key = node.arguments[0].text,
        text = resources.en[key];
      if (typeof text === "string") {
        if (!catalog[key]) catalog[key] = { english: text, sources: [] };
        catalog[key].sources.push({
          file: relative(root, file.fileName).replaceAll("\\", "/"),
          line:
            file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
          kind: "existing",
        });
      }
    }
    if (ts.isJsxText(node)) {
      const text = compiledValue(
        `<span>${original.slice(node.pos, node.end)}</span>`,
      );
      if (text !== null) add(node, text, "jsx-text", true);
      return;
    }
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      ["placeholder", "title", "aria-label", "alt"].includes(
        node.name.getText(file),
      )
    ) {
      const text = compiledValue(
        `<span value=${node.initializer.getText(file)}/>`,
        true,
      );
      if (text !== null) add(node.initializer, text, "attribute", true);
      return;
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      (renderExpression(node) || messageExpression(node))
    ) {
      add(node, node.text, "message");
      return;
    }
    if (
      ts.isTemplateExpression(node) &&
      (renderExpression(node) || messageExpression(node))
    ) {
      let text = node.head.text;
      const values = node.templateSpans
        .map((span, index) => {
          text += `{{value${index}}}${span.literal.text}`;
          return `value${index}: String(${span.expression.getText(file)})`;
        })
        .join(", ");
      add(node, text, "template", false, values);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let next = original,
    last = original.length;
  for (const edit of edits) {
    if (edit.end > last) throw new Error(`Overlapping extraction in ${path}`);
    next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
    last = edit.start;
  }
  if (!/import\s*\{\s*uiText\s*\}\s*from/.test(next)) {
    if (/\b(?:const|let|function)\s+uiText\b/.test(original))
      throw new Error(`Existing uiText identifier in ${path}`);
    let target = relative(
      dirname(path),
      join(root, "src/i18n/uiText"),
    ).replaceAll("\\", "/");
    if (!target.startsWith(".")) target = `./${target}`;
    next = `import { uiText } from ${JSON.stringify(target)};\n${next}`;
  }
  changed++;
  if (write) staged.push({ path, text: next });
}
if (write) {
  const stageJson = (path, value) =>
    staged.push({ path, text: JSON.stringify(value, null, 2) + "\n" });
  for (const language of languages)
    stageJson(join(localeDir, `${language}.json`), resources[language]);
  for (const language of Object.keys(pending))
    pending[language] = [...new Set(pending[language])];
  stageJson(pendingPath, pending);
  const statusPath = join(root, "src/i18n/review/status.json");
  const previousStatus = existsSync(statusPath)
    ? JSON.parse(readFileSync(statusPath, "utf8"))
    : {};
  const status = Object.fromEntries(
    languages.map((language) => [
      language,
      {
        untranslatedKeys: pending[language]?.length || 0,
        reviewed:
          language === "en" ||
          (!pending[language]?.length &&
            previousStatus[language]?.reviewed === true),
      },
    ]),
  );
  stageJson(statusPath, status);
  stageJson(join(root, "src/i18n/review/source-catalog.json"), catalog);
  // Finish parsing and validating every input before touching application files.
  const changes = staged.filter(
    ({ path, text }) =>
      !existsSync(path) || readFileSync(path, "utf8") !== text,
  );
  for (const { path } of changes) {
    if (!existsSync(path)) continue;
    const backupFile = join(backup, relative(root, path));
    mkdirSync(dirname(backupFile), { recursive: true });
    writeFileSync(backupFile, readFileSync(path));
  }
  for (const { path, text } of changes) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, "utf8");
  }
  writtenFiles = changes.length;
}
process.stdout.write(
  JSON.stringify({
    mode: write ? "write" : "dry-run",
    files: changed,
    occurrences,
    newKeys,
    keys: Object.keys(resources.en).length,
    writtenFiles,
    backup: write && writtenFiles ? relative(root, backup) : null,
  }) + "\n",
);

if (process.argv.includes("--check") && changed > 0) process.exitCode = 1;
