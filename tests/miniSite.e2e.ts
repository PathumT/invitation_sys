import { test, expect } from "@playwright/test";
test("optional event website publishes ordered sections, host photos and working RSVP", async ({
  page,
  browser,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Website Host");
  await page
    .getByLabel("Email address")
    .fill(`website-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Website/ }),
  ).toBeVisible();
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Our Event Website");
  await page.getByLabel("Hosted by").fill("Website Host");
  await page.getByLabel(/^Event date/).fill("2026-12-15");
  await page.getByLabel(/^Start time/).fill("17:00");
  await page.getByLabel("Venue name").fill("Garden Hall");
  await page.getByLabel("Use an event mini-website", { exact: true }).check();
  await page
    .getByRole("button", { name: "Add schedule item", exact: true })
    .click();
  await page.getByLabel("Schedule time", { exact: true }).fill("5:00 PM");
  await page
    .getByLabel("Schedule activity", { exact: true })
    .fill("Welcome and refreshments");
  await page
    .getByRole("button", { name: "Move schedule up", exact: true })
    .click();
  await page.getByRole("button", { name: "Add faq item", exact: true }).click();
  await page
    .getByLabel("FAQ question", { exact: true })
    .fill("Is parking available?");
  await page
    .getByLabel("FAQ answer", { exact: true })
    .fill("Yes, beside the hall.");
  await page
    .getByRole("button", { name: "Add registry item", exact: true })
    .click();
  await page
    .getByLabel("Registry name", { exact: true })
    .fill("Our gift registry");
  await page
    .getByLabel("Registry website", { exact: true })
    .fill("https://example.com/registry");
  await page
    .getByRole("button", { name: "Add videos item", exact: true })
    .click();
  await page
    .getByLabel("Video title", { exact: true })
    .fill("A welcome from us");
  await page
    .getByLabel("YouTube or Vimeo link", { exact: true })
    .fill("https://youtu.be/dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  await expect(
    page.getByRole("heading", { name: "Make it yours.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page
    .getByLabel("Add event photo", { exact: true })
    .setInputFiles({
      name: "event-photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.getByLabel("Photo caption", { exact: true })).toBeVisible();
  await page
    .getByLabel("Photo caption", { exact: true })
    .fill("A celebration to remember");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(
    /\/i\/[a-f0-9]{48}\//,
  );
  const url = await page
    .getByLabel("Invitation link", { exact: true })
    .inputValue();
  await page
    .getByRole("button", { name: "Mobile preview", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mobile preview", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    guest = await context.newPage();
  await guest.goto(url);
  await expect(
    guest.getByRole("article", { name: "Our Event Website event website" }),
  ).toBeVisible();
  await expect(
    guest.getByText("Welcome and refreshments", { exact: true }),
  ).toBeVisible();
  await expect(
    guest.getByRole("link", { name: "Our gift registry", exact: true }),
  ).toHaveAttribute("href", "https://example.com/registry");
  await expect(
    guest.getByRole("button", {
      name: "Play video: A welcome from us",
      exact: true,
    }),
  ).toBeVisible();
  await expect(guest.locator(".site-video iframe")).toHaveCount(0);
  await guest.getByText("Is parking available?", { exact: true }).click();
  await expect(
    guest.getByText("Yes, beside the hall.", { exact: true }),
  ).toBeVisible();
  await expect(
    guest.getByRole("img", { name: "A celebration to remember", exact: true }),
  ).toBeVisible();
  const order = await guest
    .locator(".mini-site-section")
    .evaluateAll((sections) =>
      sections.map((section) => section.getAttribute("aria-label")),
    );
  expect(order.indexOf("schedule")).toBeLessThan(order.indexOf("venue"));
  for (const width of [320, 390, 768, 1440]) {
    await guest.setViewportSize({ width, height: 900 });
    await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", width);
  }
  await guest.getByLabel("Your name", { exact: true }).fill("Website Guest");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(
    guest.getByText("Your response: accepted.", { exact: false }),
  ).toBeVisible();
  await guest.setViewportSize({ width: 390, height: 844 });
  await guest.screenshot({
    path: "test-results/upgrade-event-website-mobile.png",
    fullPage: true,
  });
  await context.close();
});
