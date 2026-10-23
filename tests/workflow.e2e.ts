import { test, expect } from "@playwright/test";
test("Google sign-in provisions a workspace and persists the session", async ({ page }) => {
  // The emulator widget's optional CDN styling must not delay its inline login script.
  await page.context().route(/^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
    (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.goto("/login");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const popup = await popupPromise;
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup.locator("#email-input").fill(`google-${Date.now()}@example.test`);
  await popup.locator("#display-name-input").fill("Google Guest");
  await popup.locator("#sign-in").click();
  await expect(page.getByRole("heading", { name: /Hello, Google/ })).toBeVisible();
  await expect(page.getByText("Google Guest workspace", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Hello, Google/ })).toBeVisible();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});
test("register → design → publish → guest → RSVP → live dashboard → isolation → logout", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  const email = `alex-${Date.now()}@example.test`;
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/invitations");
  await expect(page).toHaveURL(/login/);
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page.getByLabel("Confirm password").fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Alex/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Template library/ }).click();
  await expect(page.locator(".template-card")).toHaveCount(9);
  await page
    .locator(".template-art img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({
    path: "test-results/template-gallery.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Create invitation", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Garden Celebration");
  await page.getByLabel("Hosted by").fill("Alex & Jordan");
  await page.getByLabel("Event date").fill("2026-12-15");
  await page.getByLabel("Start time").fill("17:00");
  await page.getByLabel("Venue name").fill("Royal Garden");
  await page.getByLabel("Venue address").fill("Colombo");
  await page.getByRole("button", { name: "Customize invitation" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByLabel("Text content").fill("A wonderful evening");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Garden Celebration.png");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  await expect(
    page.getByRole("button", { name: "Republish", exact: true }),
  ).toBeVisible();
  const editURL = page.url();
  await page.reload();
  await page.getByRole("button", { name: /Make it yours/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "4 Preview & share" }).click();
  await expect(
    page.getByText("A wonderful evening", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add guests & share" }).click();
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page.getByLabel("Guest name").fill("Sarah Smith");
  await page
    .getByLabel("WhatsApp number", { exact: true })
    .fill("+94771234567");
  await page.getByLabel("Allowed attendees").fill("2");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByText("Sarah Smith", { exact: true })).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy link for Sarah Smith" }).click();
  await expect(
    page.getByText("Personal invitation link copied."),
  ).toBeVisible();
  // Read the copied capability; the guest uses a fresh unauthenticated browser.
  const url = await page.evaluate(() => navigator.clipboard.readText());
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const guest = await guestContext.newPage();
  await guest.goto(url);
  await expect(
    guest.getByRole("heading", { name: /Sarah Smith/ }),
  ).toBeVisible();
  const invitation = guest.getByRole("article", {
    name: "Garden Celebration invitation card",
  });
  await expect(invitation).toHaveCount(1);
  await expect(
    invitation.getByRole("button", { name: "Accept Invitation" }),
  ).toBeVisible();
  await expect(
    invitation.getByRole("link", { name: "View Location on Google Maps" }),
  ).toBeVisible();
  await expect(guest.locator(".guest-layout")).toHaveCount(0);
  await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await expect(
    guest.getByRole("link", { name: "View Location on Google Maps" }),
  ).toHaveAttribute("href", /google.com/);
  await expect(guest.getByLabel("How many will be joining?")).toHaveCount(0);
  await expect(
    guest.getByRole("button", { name: "Maybe", exact: true }),
  ).toHaveCount(0);
  await guest.getByLabel("Your name").fill("   ");
  await guest.getByRole("button", { name: "Accept Invitation" }).click();
  await expect(guest.getByRole("alert")).toContainText(
    "Please enter your name",
  );
  await guest.getByLabel("Your name").fill("Sarah Lee");
  await guest.screenshot({
    path: "test-results/guest-mobile.png",
    fullPage: true,
  });
  await guest.setViewportSize({ width: 1280, height: 900 });
  await expect(invitation).toHaveCSS("max-width", "640px");
  expect((await invitation.boundingBox())!.height).toBeLessThan(950);
  await guest.screenshot({
    path: "test-results/guest-desktop.png",
    fullPage: true,
  });
  await guest.setViewportSize({ width: 390, height: 844 });
  expect((await invitation.boundingBox())!.height).toBeLessThan(1000);
  for (const width of [320, 768, 1440]) {
    await guest.setViewportSize({ width, height: 900 });
    await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", width);
    const button = invitation.getByRole("button", {
      name: "Accept Invitation",
    });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await guest.setViewportSize({ width: 390, height: 844 });
  await guest.getByRole("button", { name: "Accept Invitation" }).click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: accepted" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "accepted", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("RSVP name: Sarah Lee", { exact: true }),
  ).toBeVisible();
  await guest.reload();
  await expect(guest.getByLabel("Your name")).toHaveValue("Sarah Lee");
  await guest
    .getByRole("button", { name: "Decline Invitation", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "declined", exact: true }),
  ).toBeVisible();
  await guest.getByRole("button", { name: "Accept Invitation" }).click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "Accepted" })
      .locator("strong"),
  ).toHaveText("1");
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".sidebar")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, -244, 0)",
  );
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(editURL.replace("/edit", "/guests"));
  await page
    .getByRole("button", { name: "Revoke link for Sarah Smith" })
    .click();
  await expect(page.getByText(/Link revoked/)).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "accepted", exact: true }),
  ).toBeVisible();
  await guest.reload();
  await expect(
    guest.getByText(/no longer available|couldn’t open/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /Hello, Alex/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Hello, Alex/ }),
  ).toBeVisible();
  await guestContext.close();
  expect(errors).toEqual([]);
});

test("private workspace, custom artwork, settings, guest edits and deletion", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Jamie Rivera");
  await page
    .getByLabel("Email address")
    .fill(`jamie-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page.getByLabel("Confirm password").fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Jamie/ }),
  ).toBeVisible();
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "Total guests" })
      .locator("strong"),
  ).toHaveText("0");
  await expect(
    page.getByRole("heading", { name: "Garden Celebration", exact: true }),
  ).toHaveCount(0);
  const image = await page.screenshot();
  await page.getByRole("link", { name: /Template library/ }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "original-art.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.getByText("Your private template is ready.")).toBeVisible();
  const card = page
    .locator(".template-card")
    .filter({ hasText: "original-art" });
  await card.getByRole("button", { name: "Use template" }).click();
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Private occasion");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  const eventURL = page.url();
  await page.goto(eventURL.replace("/edit", "/guests"));
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page.getByLabel("Guest name").fill("Morgan Lee");
  await page
    .getByLabel("WhatsApp number", { exact: true })
    .fill("+94771234567");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByText("Morgan Lee", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Morgan Lee", exact: true })
    .click();
  await page.getByLabel("Guest name").fill("Morgan Taylor");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByText("Morgan Taylor", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Morgan Taylor", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove guest", exact: true })
    .click();
  await expect(page.getByText("Morgan Taylor", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Full name").fill("Jamie Green");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await page.getByLabel("Workspace name").fill("Gathering studio");
  await page
    .getByRole("button", { name: "Save workspace", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Workspace name")).toHaveValue(
    "Gathering studio",
  );
  await expect(page.getByLabel("Full name")).toHaveValue("Jamie Green");
  await page.getByRole("link", { name: "My invitations", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Private occasion", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete invitation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Private occasion", exact: true }),
  ).toHaveCount(0);
});

test("one public link accepts independent visitors and shows every response to the host", async ({
  page,
  browser,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (
          window as typeof window & { lastSharedInvitation?: ShareData }
        ).lastSharedInvitation = data;
      },
    }),
  );
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Open Host");
  await page
    .getByLabel("Email address")
    .fill(`open-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page.getByLabel("Confirm password").fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Open/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Create invitation", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "4 Preview & share" }).click();
  const sharePanel = page.getByRole("region", {
    name: "Share your invitation",
  });
  await expect(
    sharePanel.getByRole("button", { name: "Copy public link" }),
  ).toBeDisabled();
  await expect(
    sharePanel.getByRole("button", { name: "Share invitation", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Event details", exact: true }).click();
  await page.getByLabel("Event title").fill("Open Celebration");
  await page.getByLabel("Hosted by").fill("Open Host");
  await page.getByLabel("Event date").fill("2026-12-15");
  await page.getByLabel("Start time").fill("17:00");
  await page.getByLabel("Venue name").fill("The Garden");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  const editURL = page.url();
  await expect(sharePanel).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy public link", exact: true })
    .click();
  await expect(
    page.getByText("Public invitation link copied. Anyone can respond."),
  ).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(
    url,
  );
  await expect(
    sharePanel.getByRole("link", { name: "Open invitation", exact: true }),
  ).toHaveAttribute("href", url);
  await expect(
    sharePanel.getByRole("link", { name: "WhatsApp", exact: true }),
  ).toHaveAttribute(
    "href",
    `https://wa.me/?text=${encodeURIComponent(`You’re invited to Open Celebration!\n2026-12-15 at 17:00\nThe Garden\n\nView the invitation and RSVP:\n${url}`)}`,
  );
  await sharePanel
    .getByRole("button", { name: "Share invitation", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { lastSharedInvitation?: ShareData })
            .lastSharedInvitation?.url,
      ),
    )
    .toBe(url);
  const contexts = [];
  for (const [name, choice] of [
    ["Sam Guest", "Accept Invitation"],
    ["Alex Guest", "Decline Invitation"],
  ]) {
    const context = await browser.newContext();
    contexts.push(context);
    const guest = await context.newPage();
    await guest.goto(url);
    await expect(guest.getByLabel("Your name")).toHaveValue("");
    await guest.getByLabel("Your name").fill(name);
    await guest.getByRole("button", { name: choice, exact: true }).click();
    await expect(
      guest.getByRole("status").filter({ hasText: "Your response:" }),
    ).toBeVisible();
    await expect(guest.getByText(/This is your preview/)).toHaveCount(0);
    await guest.reload();
    await expect(guest.getByLabel("Your name")).toHaveValue(name);
  }
  await page.goto(editURL.replace("/edit", "/guests"));
  await expect(page.getByText("Sam Guest", { exact: true })).toBeVisible();
  await expect(page.getByText("Alex Guest", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "accepted", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: "declined", exact: true }),
  ).toHaveCount(1);
  await page.goto(editURL.replace("/edit", "/preview"));
  await expect(page).toHaveURL(url);
  for (const context of contexts) await context.close();
});

test("Grand Opening custom template uses the event form, exports PNG, and renders on mobile", async ({
  page,
  browser,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Opening Host");
  await page
    .getByLabel("Email address")
    .fill(`hardware-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page.getByLabel("Confirm password").fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Opening/ }),
  ).toBeVisible();
  await page.goto("/invitations/new?template=grand-opening-hardware");
  await page.getByRole("button", { name: "2 Event details" }).click();
  await expect(
    page.getByRole("combobox", { name: "Occasion", exact: true }),
  ).toHaveValue("Grand Opening");
  await page.getByLabel("Event title").fill("Grand Hardware");
  await page.getByLabel("Hosted by").fill("Builders Company");
  await page
    .getByLabel("A message for your guests")
    .fill("Join us for our new store opening.");
  await page.getByLabel("Event date").fill("2026-12-20");
  await page.getByLabel("Start time").fill("09:30");
  await page.getByLabel("Venue name").fill("Kurunegala showroom");
  await page.getByLabel("Venue address").fill("12 Main Street, Kurunegala");
  await page.getByRole("button", { name: "Customize invitation" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  await (await downloaded).saveAs("test-results/grand-opening-export.png");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/invitations\/.*\/edit/);
  await page.getByRole("button", { name: "4 Preview & share" }).click();
  await expect(
    page
      .locator(".grand-opening-invitation")
      .getByText("Grand Hardware", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".grand-opening-invitation")).toContainText(
    "Builders Company",
  );
  await expect(page.locator(".grand-opening-invitation")).toContainText(
    "12 Main Street, Kurunegala",
  );
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy public link", exact: true })
    .click();
  await expect(
    page.getByText("Public invitation link copied. Anyone can respond."),
  ).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    guest = await context.newPage();
  await guest.goto(url);
  await expect(
    guest.getByText("Grand Hardware", { exact: true }),
  ).toBeVisible();
  await expect(guest.locator(".invitation-artwork-first")).toBeVisible();
  await expect(guest.getByText("View invitation artwork", { exact: true })).toHaveCount(0);
  expect(await guest.locator(".invitation-sheet").evaluate((card) => {
    const artwork = card.querySelector(".invitation-artwork-first");
    const rsvp = card.querySelector(".rsvp-section");
    return !!artwork && !!rsvp && !!(artwork.compareDocumentPosition(rsvp) & Node.DOCUMENT_POSITION_FOLLOWING)
      && rsvp === card.querySelector(".guest-content")?.lastElementChild;
  })).toBe(true);
  await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await guest.screenshot({
    path: "test-results/grand-opening-mobile.png",
    fullPage: true,
  });
  await guest.setViewportSize({ width: 1280, height: 900 });
  await guest.screenshot({
    path: "test-results/grand-opening-desktop.png",
    fullPage: true,
  });
  await guest.getByLabel("Your name").fill("Opening Guest");
  await guest.getByRole("button", { name: "Accept Invitation" }).click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Your response: accepted" }),
  ).toBeVisible();
  await context.close();
});
