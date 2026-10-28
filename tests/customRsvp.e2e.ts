import { test, expect } from "@playwright/test";
test("custom RSVP questions validate, save privately to the response, and lock changes", async ({
  page,
  browser,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Forms Host");
  await page
    .getByLabel("Email address")
    .fill(`forms-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Hello, Forms/ }),
  ).toBeVisible();
  await page.goto("/invitations/new");
  await page.getByRole("button", { name: "2 Event details" }).click();
  await page.getByLabel("Event title").fill("Custom RSVP Celebration");
  await page.getByLabel("Hosted by").fill("Forms Host");
  await page.getByLabel(/^Event date/).fill("2026-12-15");
  await page.getByLabel(/^Start time/).fill("17:00");
  await page.getByLabel("Venue name").fill("Garden Hall");
  await page
    .getByRole("button", { name: "Add RSVP question", exact: true })
    .click();
  const first = page.getByRole("group", { name: "Question 1", exact: true });
  await first
    .getByLabel("Question label", { exact: true })
    .fill("Meal preference");
  await first.getByLabel(/^Question type/).selectOption("single");
  await first
    .getByRole("textbox", { name: "Choices (one per line)", exact: true })
    .fill("Standard\nVegetarian");
  await first.getByLabel("Required when accepting", { exact: true }).check();
  await page
    .getByRole("button", { name: "Add RSVP question", exact: true })
    .click();
  const second = page.getByRole("group", { name: "Question 2", exact: true });
  await second
    .getByLabel("Question label", { exact: true })
    .fill("Parking needed");
  await second.getByLabel(/^Question type/).selectOption("yesno");
  await second.getByLabel("Required when accepting", { exact: true }).check();
  await page
    .getByLabel("Allow guests to change their response", { exact: true })
    .uncheck();
  await page
    .getByLabel("Confirmation message", { exact: true })
    .fill("Your place is confirmed. See you there!");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(
    /\/i\/[a-f0-9]{48}\//,
  );
  const url = await page
    .getByLabel("Invitation link", { exact: true })
    .inputValue();
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    guest = await context.newPage();
  await guest.goto(url);
  await guest.getByLabel("Your name", { exact: true }).fill("Response Guest");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(guest.getByRole("alert")).toHaveCount(2);
  await guest.getByLabel(/^Meal preference/).selectOption("Vegetarian");
  await guest.getByLabel(/^Parking needed/).selectOption("false");
  await guest
    .getByRole("button", { name: "Accept Invitation", exact: true })
    .click();
  await expect(
    guest.getByText("Your response: accepted.", { exact: false }),
  ).toBeVisible();
  await expect(
    guest.getByRole("button", { name: "Accept Invitation", exact: true }),
  ).toBeDisabled();
  await expect(
    guest.getByRole("button", { name: "Decline Invitation", exact: true }),
  ).toBeDisabled();
  await guest.reload();
  await expect(guest.getByLabel(/^Meal preference/)).toHaveValue("Vegetarian");
  await expect(guest.getByLabel(/^Parking needed/)).toHaveValue("false");
  await expect(guest.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await guest.screenshot({
    path: "test-results/upgrade-custom-rsvp-mobile.png",
    fullPage: true,
  });
  await page.goto("/guests");
  await page
    .getByRole("button", {
      name: "View response from Response Guest",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Vegetarian", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("No", { exact: true }),
  ).toBeVisible();
  await context.close();
});
