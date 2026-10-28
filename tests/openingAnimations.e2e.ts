import { test, expect } from "@playwright/test";
const styles = [
  ["classic-envelope", "Classic Envelope", ".classic-envelope"],
  ["luxury-golden", "Luxury Golden", ".golden-frame"],
  ["floral-bloom", "Floral Bloom", ".floral-branch"],
  ["royal-curtain", "Royal Curtain", ".velvet-panel"],
  ["modern-minimal", "Modern Minimal", ".minimal-line"],
];
test("five real previews persist to public links and keep RSVP accessible", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(240000);
  page.setDefaultTimeout(20000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Opening Owner");
  await page
    .getByLabel("Email address")
    .fill(`opening-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Opening/ }),
  ).toBeVisible({ timeout: 20000 });
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: /Event details/ }).click();
  await page.getByLabel("Event title").fill("A Beautiful Beginning");
  await page.getByLabel("Hosted by").fill("Opening Owner");
  await page.getByLabel(/^Event date/).fill("2026-12-15");
  await page.getByLabel(/^Start time/).fill("17:00");
  await page.getByLabel("Venue name").fill("Garden Hall");
  await expect(page.locator(".opening-option")).toHaveCount(5);
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  const guest = await guestContext.newPage();
  let url = "";
  for (const [key, name, scene] of styles) {
    await page.getByRole("button", { name: /Event details/ }).click();
    await page
      .getByRole("button", { name: `Play Preview: ${name}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(`.opening-${key}`)).toHaveAttribute(
      "data-phase",
      "running",
    );
    await expect(dialog.locator(scene).first()).toBeVisible();
    // Capture an actual intermediate frame, not the static selection thumbnail.
    await page.waitForTimeout(key === "modern-minimal" ? 1100 : 2000);
    await dialog.screenshot({
      path: testInfo.outputPath(`${key}-preview.png`),
    });
    await expect(
      dialog.getByText("Your invitation is revealed", { exact: true }),
    ).toBeVisible({ timeout: 6500 });
    await dialog
      .getByRole("button", { name: "Replay animation", exact: true })
      .click();
    await expect(dialog.locator(`.opening-${key}`)).toBeVisible();
    await dialog
      .getByRole("button", { name: "Skip Animation", exact: true })
      .click();
    await expect(
      dialog.getByText("Your invitation is revealed", { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Select Animation: ${name}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: `Select Animation: ${name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: /^(Publish|Republish)$/, exact: true })
      .click();
    await expect(
      page.getByLabel("Invitation link", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByLabel("Invitation link", { exact: true }),
    ).toHaveValue(/\/i\/[a-f0-9]{48}\//);
    url = await page
      .getByLabel("Invitation link", { exact: true })
      .inputValue();
    await guest.goto(url);
    const opening = guest.locator(`.opening-${key}`);
    await expect(opening).toHaveAttribute("data-phase", "idle");
    await expect(
      guest.getByRole("button", { name: "Accept Invitation", exact: true }),
    ).toHaveCount(0);
    await expect(guest.locator("audio[autoplay]")).toHaveCount(0);
    await guest
      .getByRole("button", { name: "Open Invitation", exact: true })
      .click();
    await expect(opening).toHaveAttribute("data-phase", "running");
    await expect(
      guest.getByRole("button", { name: "Open Invitation", exact: true }),
    ).toHaveCount(0);
    await expect(
      guest.getByRole("button", { name: "Accept Invitation", exact: true }),
    ).toBeVisible({ timeout: 6500 });
    await expect(guest.getByText("Garden Hall", { exact: true })).toBeVisible();
    expect(
      await guest.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 844, height: 390 },
    ]) {
      await guest.setViewportSize(viewport);
      await guest.reload();
      await expect(
        guest.getByRole("button", { name: "Open Invitation", exact: true }),
      ).toBeVisible();
      expect(
        await guest.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (viewport.width === 320)
        await guest.screenshot({
          path: testInfo.outputPath(`${key}-mobile.png`),
        });
      await guest
        .getByRole("button", { name: "Skip Animation", exact: true })
        .click();
      await expect(guest.locator(".opening-content")).toBeFocused();
      await expect(
        guest.getByRole("button", { name: "Accept Invitation", exact: true }),
      ).toBeVisible();
    }
    await guest.setViewportSize({ width: 390, height: 844 });
  }
  await page.reload();
  await page.getByRole("button", { name: /Event details/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Select Animation: Modern Minimal",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  // Reduced motion bypasses the opening and exposes the existing public content.
  await guest.emulateMedia({ reducedMotion: "reduce" });
  await guest.reload();
  await expect(guest.locator(".invitation-opening")).toHaveCount(0);
  await guest.getByLabel("Your name", { exact: true }).fill("Happy Guest");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(guest.getByText(/Your response: accepted/)).toBeVisible();
  await guest.emulateMedia({ reducedMotion: "no-preference" });
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await guest.setViewportSize(viewport);
    await guest.reload();
    await expect(
      guest.getByRole("button", { name: "Skip Animation", exact: true }),
    ).toBeVisible();
    expect(
      await guest.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await guest
      .getByRole("button", { name: "Skip Animation", exact: true })
      .click();
    await expect(
      guest.getByRole("button", { name: "Accept Invitation", exact: true }),
    ).toBeVisible();
  }
  // A failed lazy chunk must reveal the invitation rather than trap a guest.
  await guest.route("**/MinimalRevealAnimation.tsx*", (route) => route.abort());
  await guest.reload();
  await expect(
    guest.getByRole("button", { name: "Accept Invitation", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(guest.locator(".invitation-opening")).toHaveCount(0);
  await guestContext.close();
});
