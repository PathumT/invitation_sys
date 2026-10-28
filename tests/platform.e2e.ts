import { test, expect } from "@playwright/test";
test("workspace branding persists while paid checkout and team activation remain unavailable", async ({
  page,
  browserName,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Brand Owner");
  await page
    .getByLabel("Email address")
    .fill(`brand-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Brand/ }),
  ).toBeVisible();
  await page.goto("/settings");
  await expect(
    page.getByRole("button", { name: "Save branding", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Brand display name", { exact: true })
    .fill("Garden Studio");
  await page
    .getByLabel("Workspace footer", { exact: true })
    .fill("Made for our community");
  await page
    .getByRole("button", { name: "Save branding", exact: true })
    .click();
  await expect(page.locator(".tenant-wordmark")).toHaveText("Garden Studio");
  await expect(page.locator(".app-footer")).toContainText(
    "Made for our community",
  );
  await page.reload();
  await expect(page.locator(".tenant-wordmark")).toHaveText("Garden Studio");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export browser diagnostics", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "evently-browser-diagnostics.json",
  );
  await expect(
    page.getByText("Team invitations are not enabled", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View future plans", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Checkout unavailable", exact: true }),
  ).toHaveCount(4);
  for (const button of await page
    .getByRole("button", { name: "Checkout unavailable", exact: true })
    .all())
    await expect(button).toBeDisabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
  }
  await page.goto("/analytics");
  await expect(
    page.getByRole("heading", {
      name: "A little insight. A better gathering.",
      exact: true,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".topbar")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export report CSV", exact: true }),
  ).not.toBeVisible();
  const printArea = await page.locator(".analytics-report").boundingBox();
  expect(printArea!.x).toBeLessThan(20);
  await page.screenshot({
    path: test.info().outputPath("analytics-print.png"),
    fullPage: true,
  });
  if (browserName === "chromium")
    await page.pdf({
      path: test.info().outputPath("analytics-print.pdf"),
      format: "A4",
      printBackground: true,
    });
});
