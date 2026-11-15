import { test, expect } from "@playwright/test";

test("photographic homepage keeps search, saved properties, detail and inquiry working", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".film-hero")).toBeVisible();
  await expect(page.locator(".architecture-stage")).toHaveCount(0);
  const search = page.getByRole("region", { name: "Find a property" });
  await search.getByLabel("Property location").selectOption("DHA Phase 8");
  await search.getByLabel("Property type").selectOption("House");
  await search.getByLabel("Price range").selectOption("200000000");
  await search
    .getByRole("button", { name: "Find Your Property", exact: true })
    .click();
  await expect(page).toHaveURL(/properties\?/);
  const card = page
    .locator(".property-card")
    .filter({ hasText: "The Palm Residence" })
    .first();
  await card
    .getByRole("button", { name: "Save property", exact: true })
    .click();
  await expect(
    card.getByRole("button", { name: "Unsave property", exact: true }),
  ).toBeVisible();
  await card
    .getByRole("link", { name: "View The Palm Residence", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("The Palm Residence");
  await page
    .getByRole("button", { name: "Request Information", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill("Preview Visitor");
  await dialog.locator('input[name="phone"]').fill("+923001234567");
  await dialog.locator('input[name="email"]').fill("preview@example.com");
  await dialog
    .locator('textarea[name="message"]')
    .fill(
      "I would like to discuss a suitable residence and arrange a viewing.",
    );
  await dialog.locator('input[type="checkbox"]').check();
  const invalid = await dialog
    .locator("form")
    .evaluate((form) =>
      [...form.elements]
        .filter((el) => el.willValidate && !el.validity.valid)
        .map((el) => ({ name: el.name, message: el.validationMessage })),
    );
  expect(invalid).toEqual([]);
  let payload;
  await page.route("**/api/leads", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true, reference: "MS-PREVIEW-001" } });
  });
  await dialog
    .getByRole("button", { name: "Begin the Conversation", exact: true })
    .click();
  await expect.poll(() => payload, { timeout: 10000 }).toBeTruthy();
  await expect(dialog.locator(".form-success")).toBeVisible();
  expect(payload.property_id || payload.property).toBe("MS-D01");
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
});

test("directed motion changes the photo mask, supports pause and cleans up on navigation", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Motion behavior checked once; layouts checked at each size.",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".film-hero")).toBeVisible();
  await page
    .getByRole("button", { name: "Pause ambient motion", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume ambient motion", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => scrollTo({ top: 500, behavior: "instant" }));
  await expect
    .poll(() =>
      page
        .locator(".film-shot-secondary")
        .evaluate((el) => getComputedStyle(el).clipPath),
    )
    .not.toBe("inset(0% 0% 0% 100%)");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About Us", exact: true })
    .click();
  await expect(page.locator(".film-hero-runway")).toHaveCount(0);
  await expect(page.locator("main h1")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".film-hero")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Pause ambient motion", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".film-shot-secondary")).toBeHidden();
});
