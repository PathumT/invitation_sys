import { test, expect } from "@playwright/test";
test("advanced design exports, checkpoints, envelope and deadline remain usable on phones", async ({
  page,
  browser,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Upgrade Owner");
  await page
    .getByLabel("Email address")
    .fill(`upgrade-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Upgrade/ }),
  ).toBeVisible();
  await page.goto("/templates");
  await page.getByLabel("Search templates", { exact: true }).fill("botanical");
  await expect(page.locator(".template-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await page.getByLabel("Favorites only", { exact: true }).check();
  await expect(page.locator(".template-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clone", exact: true }).click();
  await expect(
    page.getByText("Private template cloned.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Favorites only", { exact: true }).uncheck();
  await expect(page.locator(".template-card")).toHaveCount(2);
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Upgrade Celebration");
  await page.getByLabel("Hosted by").fill("Upgrade Owner");
  await page.getByLabel(/^Event date/).fill("2026-12-15");
  await page.getByLabel(/^Start time/).fill("17:00");
  await page.getByLabel("Venue name").fill("Garden Hall");
  await page.getByLabel(/^RSVP deadline/).fill("2020-01-01T09:00");
  await page.getByLabel(/^Dress code/).fill("Smart casual");
  await page.getByLabel(/^Event website/).fill("https://example.com");
  await page.getByLabel("Show event countdown").check();
  await page
    .getByRole("button", {
      name: "Select Animation: Classic Envelope",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Customize invitation" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  const fonts = await page.evaluate(async () => [
    (await document.fonts.load('16px "Noto Sans Sinhala"', "\u0d85")).length,
    (await document.fonts.load('16px "Noto Sans Tamil"', "\u0b85")).length,
  ]);
  expect(fonts.every((count) => count > 0)).toBe(true);
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Text content", exact: true })
    .fill("Special note: {{dressCode}} / {{hostName}}");
  for (const [label, extension] of [
    ["JPEG", "jpg"],
    ["PDF", "pdf"],
  ]) {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: label, exact: true }).click();
    expect((await download).suggestedFilename()).toBe(
      `Upgrade Celebration.${extension}`,
    );
  }
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  await expect(
    page.getByRole("heading", { name: "Make it yours.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Make it yours/ }).click();
  await page
    .getByRole("button", { name: "Save checkpoint", exact: true })
    .click();
  await expect(
    page.getByText("Design checkpoint saved.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "4 Preview & share" }).click();
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(
    /\/i\/[a-f0-9]{48}\//,
  );
  const url = await page
    .getByLabel("Invitation link", { exact: true })
    .inputValue();
  const guestContext = await browser.newContext({
    viewport: { width: 320, height: 740 },
    reducedMotion: "no-preference",
  });
  const guest = await guestContext.newPage();
  await guest.goto(url);
  await guest
    .getByRole("button", { name: "Open Invitation", exact: true })
    .click();
  await expect(
    guest.getByText("The RSVP deadline has passed. Please contact your host.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    guest.getByRole("button", { name: "Accept Invitation" }),
  ).toBeDisabled();
  await expect(
    guest.getByText("Special note: Smart casual / Upgrade Owner", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(guest.getByText("Dress code:", { exact: false })).toBeVisible();
  await expect(guest.getByRole("timer")).toBeVisible();
  await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", 320);
  await guest.screenshot({
    path: "test-results/upgrade-public-mobile.png",
    fullPage: true,
  });
  await guestContext.close();
});
