import { test, expect, type Page, type TestInfo } from "@playwright/test";
const sizes = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
];
async function checkLayout(page: Page, name: string, info: TestInfo) {
  await page.evaluate(() => document.fonts.ready);
  const width = page.viewportSize()!.width;
  expect
    .soft(
      await page.evaluate(() =>
        Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
      ),
      `${name} overflows at ${width}px`,
    )
    .toBeLessThanOrEqual(width + 1);
  if ([320, 390, 1440].includes(width))
    await page.screenshot({
      path: info.outputPath(`${name}-${width}.png`),
      fullPage: true,
    });
}
async function signup(page: Page, info: TestInfo) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Alex Responsive");
  await page
    .getByLabel("Email address")
    .fill(`responsive-${info.project.name}-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Alex/ }),
  ).toBeVisible();
}
test("registration layout, validation, password controls and Google signup", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const path of ["/register", "/login"]) {
      await page.goto(path);
      await expect(
        page.getByRole("button", { name: "Continue with Google" }),
      ).toBeVisible();
      await checkLayout(page, path.slice(1), info);
      const primary = page.locator(
        "form > button[type=submit], form > .button.primary",
      );
      expect(
        await primary.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("#auth-name-error")).toBeVisible();
  await expect(page.locator("#auth-email-error")).toBeVisible();
  await expect(page.locator("#auth-password-error")).toBeVisible();
  await page.locator('input[name="name"]').fill("Alex Morgan");
  await page.locator('input[name="email"]').fill("alex@example.test");
  await page.locator('input[name="password"]').fill("StrongPassword123!");
  await page.locator('input[name="confirm"]').fill("WrongPassword123!");
  await expect(page.locator("#auth-confirm-error")).toBeVisible();
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.locator('input[name="password"]')).toHaveAttribute(
    "type",
    "text",
  );
  await expect(page.locator('input[name="confirm"]')).toHaveAttribute(
    "type",
    "password",
  );
  await page
    .getByRole("button", { name: "Show confirm password", exact: true })
    .click();
  await expect(page.locator('input[name="confirm"]')).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(page.locator('input[name="password"]')).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/register");
  await page
    .context()
    .route(
      /^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
      (route) => route.abort(),
    );
  const opening = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const popup = await opening;
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup
    .locator("#email-input")
    .fill(`google-signup-${info.project.name}-${Date.now()}@example.test`);
  await popup.locator("#display-name-input").fill("Google Responsive");
  await popup.locator("#sign-in").click();
  await expect(
    page.getByRole("heading", { name: /Hello, Google/ }),
  ).toBeVisible({ timeout: 20000 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Hello, Google/ }),
  ).toBeVisible({ timeout: 20000 });
});
test("all workspace screens, editor, dialogs, sharing and public RSVP are responsive", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 390, height: 844 });
  await signup(page, info);
  for (const path of ["/invitations", "/guests", "/analytics"]) {
    await page.goto(path);
    await expect(page.locator(".page-heading h1")).toBeVisible({
      timeout: 20000,
    });
    await checkLayout(page, `empty-${path.slice(1)}`, info);
  }
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: /Event details/ }).click();
  await page
    .getByRole("button", { name: "Customize invitation", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByLabel("Event title")
    .fill("A beautiful celebration with our family and friends");
  await page
    .getByLabel("Hosted by")
    .fill("Alex and Jordan with their family and friends");
  await page.getByLabel("Event date").fill("2026-12-15");
  await page.getByLabel("Start time").fill("17:00");
  await page
    .getByLabel("Venue name")
    .fill("The Garden Celebration Hall and Reception Venue");
  await page
    .getByLabel("Venue address")
    .fill("123 Long Garden Road, Kurunegala, Sri Lanka");
  await page
    .getByLabel("Google Maps link")
    .fill("https://maps.app.goo.gl/example");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  const editPath = new URL(page.url()).pathname;
  const guestPath = editPath.replace("/edit", "/guests");
  const shareField = page.getByLabel("Invitation link", { exact: true });
  await expect(shareField).toHaveValue(/\/i\/[a-f0-9]{48}\/alex-and-jordan/);
  const sharedURL = await shareField.inputValue();
  await page.goto(guestPath);
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page
    .getByLabel("Guest name")
    .fill("Samantha and Alexander with their family");
  await page
    .getByLabel("WhatsApp number", { exact: true })
    .fill("+94771234567");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const path of [
      "/",
      "/invitations",
      "/templates",
      "/guests",
      "/analytics",
      "/settings",
      "/check-in",
      "/reminders",
      "/plans",
      guestPath,
    ]) {
      await page.goto(path);
      await expect(page.locator(".page-heading h1")).toBeVisible({
        timeout: 20000,
      });
      await checkLayout(
        page,
        path === guestPath ? "event-guests" : path.slice(1) || "dashboard",
        info,
      );
    }
    if (size.width <= 760) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Close menu", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open menu", exact: true }),
      ).toBeFocused();
    }
    await page.getByRole("button", { name: "Add guest", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", { name: "Save guest", exact: true })
      .scrollIntoViewIfNeeded();
    await checkLayout(page, "guest-dialog", info);
    const bounds = await page.getByRole("dialog").boundingBox();
    expect.soft(bounds!.width).toBeLessThanOrEqual(size.width);
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.goto(editPath);
    await page.getByRole("button", { name: /Choose a design/ }).click();
    await checkLayout(page, "wizard-designs", info);
    await page.getByRole("button", { name: /Event details/ }).click();
    await checkLayout(page, "wizard-details", info);
    await page
      .getByRole("button", { name: "Customize invitation", exact: true })
      .click();
    await expect(page.locator("canvas")).toBeVisible();
    await checkLayout(page, "wizard-editor", info);
    const canvas = await page.locator("canvas").boundingBox();
    expect
      .soft(canvas!.width, `Canvas readable at ${size.width}`)
      .toBeGreaterThanOrEqual(Math.min(200, size.width - 80));
    if (size.width === 390) {
      await page.getByRole("button", { name: "Text", exact: true }).click();
      await page
        .getByLabel("Text content")
        .fill("You are invited to celebrate with us");
      await page.getByLabel("width", { exact: true }).fill("300");
      await expect(page.getByLabel("width", { exact: true })).toHaveValue(
        "300",
      );
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "PNG", exact: true }).click();
      expect((await download).suggestedFilename()).toMatch(/\.png$/);
    }
    await page.getByRole("button", { name: /Preview & share/ }).click();
    await expect(
      page.getByLabel("Invitation link", { exact: true }),
    ).not.toHaveValue("");
    await checkLayout(page, "wizard-preview", info);
  }
  const context = await browser.newContext();
  const guest = await context.newPage();
  await guest.goto(sharedURL);
  await expect(guest.getByLabel("Your name")).toBeVisible();
  for (const size of sizes) {
    await guest.setViewportSize(size);
    await checkLayout(guest, "public-invitation", info);
    for (const name of ["Accept Invitation", "Decline Invitation"]) {
      const button = guest.getByRole("button", { name, exact: true });
      expect(
        await button.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    }
  }
  await guest.setViewportSize({ width: 390, height: 844 });
  await guest.getByLabel("Your name").fill("Responsive Guest");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: accepted" }),
  ).toBeVisible();
  await guest
    .getByRole("button", { name: "Decline Invitation", exact: true })
    .click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: declined" }),
  ).toBeVisible();
  await guest.reload();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: declined" }),
  ).toBeVisible();
  await context.close();
  await page.goto(guestPath);
  await expect(
    page.getByText("Responsive Guest", { exact: true }),
  ).toBeVisible();
});
