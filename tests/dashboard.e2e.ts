import { test, expect, type Page } from "@playwright/test";
async function overview(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Hello, Taylor/ }),
  ).toBeVisible();
}
async function statistic(page: Page, label: string, value: string) {
  await expect(
    page
      .locator(".premium-stat")
      .filter({ hasText: label })
      .locator(":scope > strong"),
  ).toHaveText(value);
}
test("premium dashboard uses real data for search, sharing, RSVP activity and confirmed deletion", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(180000);
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Taylor Evently");
  await page
    .getByLabel("Email address")
    .fill(`dashboard-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Taylor/ }),
  ).toBeVisible();
  await statistic(page, "Total Invitations", "0");
  await statistic(page, "Total Guests", "0");
  await expect(page.locator(".notification-dot")).toHaveCount(0);
  await page.getByRole("button", { name: "Recent RSVP notifications" }).click();
  await expect(
    page.getByRole("heading", { name: "All quiet for now" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Share Invitation", exact: true })
    .click();
  await expect(
    page.getByText("A beautiful invitation comes first"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Preview Housewarming template" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Use Template" })
    .click();
  await page.getByRole("button", { name: /Event details/ }).click();
  await expect(page.locator('select[name="eventType"]')).toHaveValue(
    "Housewarming",
  );
  await page.getByLabel("Event title").fill("Taylor's Garden Party");
  await page.getByLabel("Hosted by").fill("Taylor Evently");
  await page.getByLabel("Event date").fill("2026-12-15");
  await page.getByLabel("Start time").fill("17:00");
  await page.getByLabel("Venue name").fill("Rose Garden Hall");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  const eventPath = new URL(page.url()).pathname;
  const guestsPath = eventPath.replace("/edit", "/guests");
  const publicField = page.getByLabel("Invitation link", { exact: true });
  await expect(publicField).toHaveValue(/\/i\//);
  const publicURL = await publicField.inputValue();
  await page.goto(guestsPath);
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page.getByLabel("Guest name").fill("Sam Pending");
  await page
    .getByLabel("WhatsApp number", { exact: true })
    .fill("+94771234567");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await overview(page);
  await statistic(page, "Total Invitations", "1");
  await statistic(page, "Pending RSVPs", "1");
  await page
    .getByRole("button", { name: "Search invitations and guests" })
    .click();
  await page.getByLabel("Search your workspace").fill("rose garden");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: /Taylor's Garden Party/ }),
  ).toBeVisible();
  await page.getByLabel("Search your workspace").fill("Sam Pending");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Sam Pending/ })
    .click();
  await expect(page).toHaveURL(/guests/);
  await overview(page);
  await page
    .getByRole("button", { name: "Share Invitation", exact: true })
    .click();
  await expect(page.getByLabel("Choose an invitation")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByLabel("Invitation link", { exact: true }),
  ).toHaveValue(publicURL);
  await page.getByRole("button", { name: "Close dialog" }).click();
  const context = await browser.newContext();
  const guest = await context.newPage();
  await guest.goto(publicURL);
  await guest.getByLabel("Your name").fill("Jordan Responsive");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: accepted" }),
  ).toBeVisible();
  await statistic(page, "Total Guests", "2");
  await statistic(page, "Accepted RSVPs", "1");
  await expect(page.locator(".response-rate > strong")).toHaveText("50%");
  await expect(
    page
      .locator(".premium-activity-list")
      .getByText("Jordan Responsive", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recent RSVP notifications" }).click();
  await expect(
    page.getByRole("dialog").getByText("Jordan Responsive", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `Dashboard overflow at ${width}`,
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: info.outputPath(`premium-dashboard-${width}.png`),
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await overview(page);
  await expect(page.locator(".premium-welcome")).toHaveCSS("opacity", "1");
  await page.locator(".profile-menu > summary").click();
  await page
    .locator(".profile-dropdown")
    .getByRole("link", { name: "Workspace settings" })
    .click();
  await expect(page).toHaveURL(/settings/);
  await overview(page);
  await page.getByRole("heading", { name: /Hello, Taylor/ }).click();
  await page.keyboard.press("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Search your workspace")
    .fill("a completely unknown invitation");
  await expect(
    page.getByRole("heading", { name: "No matches yet" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const card = page
    .locator(".recent-invitation")
    .filter({ hasText: "Taylor's Garden Party" });
  await card
    .getByLabel("Actions for Taylor's Garden Party", { exact: true })
    .click();
  await card
    .getByRole("button", { name: "Delete invitation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep invitation", exact: true })
    .click();
  await statistic(page, "Total Invitations", "1");
  await card
    .getByLabel("Actions for Taylor's Garden Party", { exact: true })
    .click();
  await card
    .getByRole("button", { name: "Delete invitation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete invitation", exact: true })
    .click();
  await statistic(page, "Total Invitations", "0");
  await guest.reload();
  await expect(
    guest.getByText(/no longer available|revoked|archived|removed/),
  ).toBeVisible();
  await context.close();
  await page.locator(".profile-menu > summary").click();
  await page
    .locator(".profile-dropdown")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
});
