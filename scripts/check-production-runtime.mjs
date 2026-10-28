import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

// Run against `npm run preview` after a production build. Set
// PLAYWRIGHT_CHANNEL=chrome to use a locally installed Chrome browser.
const baseURL = process.env.PRODUCTION_TEST_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.stack));
  for (const path of ["/login", "/register", "/", "/invitations/new", "/analytics"]) {
    await page.goto(`${baseURL}${path}`);
    await page.locator('input[type="password"]').first().waitFor();
    assert.ok((await page.locator("#root").innerText()).trim(), `${path} rendered blank`);
    assert.match(new URL(page.url()).pathname, /^\/(login|register)$/);
  }
  // Import every built entry, including lazy Canvas, Charts, invitation and
  // Firebase modules. A successful HTTP response alone misses TDZ failures.
  const chunks = (await readdir("dist/assets")).filter((file) => file.endsWith(".js"));
  await page.evaluate(async (files) => {
    for (const file of files) await import(`/assets/${file}`);
  }, chunks);
  assert.deepEqual(errors, [], "Uncaught production JavaScript errors");
  console.log(`Passed: login/register rendering, protected redirects, ${chunks.length} production module imports; no uncaught JavaScript errors.`);
} finally {
  await browser.close();
}
