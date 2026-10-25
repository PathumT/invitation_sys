import { test, expect } from "@playwright/test";
test("populated reminder queues fit phones with long guest names", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Reminder Reviewer");
  await page
    .getByLabel("Email address")
    .fill(`reminder-mobile-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Reminder/ }),
  ).toBeVisible();
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Community Evening");
  await page.getByLabel("Hosted by").fill("Community Host");
  await page.getByLabel(/^Event date/).fill("2026-12-15");
  await page.getByLabel(/^Start time/).fill("17:00");
  await page.getByLabel("Venue name").fill("Community Hall");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make it yours.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Add guests & share", exact: true })
    .click();
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page
    .getByLabel("Guest name", { exact: true })
    .fill("Samantha and Alexander with their family");
  await page
    .getByLabel("WhatsApp number", { exact: true })
    .fill("+94771234567");
  await page.getByLabel("Allowed attendees", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/reminders");
  await page
    .getByLabel(/^Reminder event/)
    .selectOption({ label: "Community Evening" });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", {
        name: "Prepare message for Samantha and Alexander with their family",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
  }
  await page.goto("/check-in");
  await page
    .getByRole("button", {
      name: "Manual override for Samantha and Alexander with their family",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Override reason", exact: true })
    .fill("Organizer verified the arriving household at the door.");
  await page.getByLabel("Actual arriving attendees", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Confirm manual check-in", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "checked in successfully" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Guest check-in", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: "Checked in", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("pending - Checked in", { exact: false }),
  ).toBeVisible();
});
