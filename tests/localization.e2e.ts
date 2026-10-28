import { test, expect } from "@playwright/test";
test("reviewed-copy updates preserve form state and draft locales stay disabled", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Locale Reviewer");
  await page.evaluate(async () => {
    const { i18n } = await import(
      /* @vite-ignore */ new URL("/src/i18n/index.ts", location.origin).href
    );
    i18n.addResource("en", "translation", "auth.fullName", "Your full name");
    i18n.emit("languageChanged", "en");
  });
  await expect(page.getByLabel("Your full name", { exact: true })).toHaveValue(
    "Locale Reviewer",
  );
  await page
    .getByLabel("Email address")
    .fill(`locale-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Locale/ }),
  ).toBeVisible({ timeout: 20000 });
  await page.goto("/plans");
  await page.evaluate(async () => {
    const { i18n } = await import(
      /* @vite-ignore */ new URL("/src/i18n/index.ts", location.origin).href
    );
    const entries = i18n.getResourceBundle("en", "translation") as Record<
      string,
      string
    >;
    const key = Object.keys(entries).find(
      (key) => entries[key] === "Checkout unavailable",
    );
    if (!key) throw new Error("Missing extracted checkout label");
    i18n.addResource("en", "translation", key, "Billing is not enabled");
    i18n.emit("languageChanged", "en");
  });
  await expect(
    page.getByRole("button", { name: "Billing is not enabled", exact: true }),
  ).toHaveCount(4);
  await page.goto("/settings?lang=fr");
  await expect(
    page.getByRole("combobox", { name: "Interface language", exact: true }),
  ).toHaveValue("en");
  for (const language of ["Sinhala", "Tamil", "Spanish", "French"])
    await expect(
      page.getByRole("option", {
        name: `${language} - pending review`,
        exact: true,
      }),
    ).toHaveJSProperty("disabled", true);
});
