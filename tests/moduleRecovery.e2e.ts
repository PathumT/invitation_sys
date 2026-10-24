import { test, expect } from "@playwright/test";
test("a transient lazy page failure reloads once and recovers", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/src/pages/Login.tsx", (route) =>
    ++requests === 1 ? route.abort("failed") : route.continue(),
  );
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible({ timeout: 15000 });
  expect(requests).toBe(2);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("evently-module-recovery:Login"),
    ),
  ).toBeNull();
  const settings = await page.evaluate(async () => {
    const modulePath = "/src/pages/Settings.tsx";
    return typeof (await import(modulePath)).default;
  });
  expect(settings).toBe("function");
});
test("persistent module failures stop reloading and allow manual recovery", async ({
  page,
}) => {
  let requests = 0;
  let fail = true;
  await page.route("**/src/pages/Login.tsx", (route) => {
    requests++;
    return fail ? route.abort("failed") : route.continue();
  });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "We hit a little snag." }),
  ).toBeVisible({ timeout: 15000 });
  expect(requests).toBe(2);
  fail = false;
  await page
    .getByRole("button", { name: "Reload Evently Invitations" })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible({ timeout: 15000 });
  expect(requests).toBe(3);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("evently-module-recovery:Login"),
    ),
  ).toBeNull();
});
