import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("rendered navigation, service and offers panels, keyboard and discovery links", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".brand-loader")).toHaveCount(0, {
    timeout: 20000,
  });
  await expect(
    page.getByRole("heading", {
      name: "Beyond Properties. Beyond Expectations.",
    }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const mobile = testInfo.project.name !== "desktop";
  if (mobile)
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  const services = nav.getByRole("button", {
    name: "Our Services",
    exact: true,
  });
  await services.click();
  await expect(services).toHaveAttribute("aria-expanded", "true");
  const servicePanel = mobile
    ? page.locator("#mega-services")
    : page.getByRole("region", { name: "Our Services", exact: true });
  await expect(
    servicePanel.getByText("REAL ESTATE SERVICES", { exact: true }),
  ).toBeVisible();
  await expect(
    servicePanel.getByText("CONSTRUCTION & DEVELOPMENT", { exact: true }),
  ).toBeVisible();
  await expect(
    servicePanel.getByRole("link", { name: /Property Management/ }),
  ).toBeVisible();
  await expect(
    servicePanel.getByRole("link", { name: /Property Renovation/ }),
  ).toBeVisible();
  await expect
    .poll(() => servicePanel.evaluate((el) => +getComputedStyle(el).opacity))
    .toBeGreaterThan(0.99);
  if (!mobile) {
    await expect(servicePanel).toHaveCSS("opacity", "1", { timeout: 10000 });
    await expect
      .poll(
        () =>
          servicePanel
            .getByRole("link", { name: /Property Management/ })
            .evaluate((el) => +getComputedStyle(el).opacity),
        { timeout: 10000 },
      )
      .toBeGreaterThan(0.99);
  }
  fs.mkdirSync("work/qa", { recursive: true });
  await page.screenshot({
    path: `work/qa/${testInfo.project.name}-services.png`,
    fullPage: false,
  });
  if (mobile) {
    await services.click();
    await expect(services).toHaveAttribute("aria-expanded", "false");
  } else {
    await page.keyboard.press("Escape");
    await expect(services).toHaveAttribute("aria-expanded", "false");
    await expect(services).toBeFocused();
    await services.focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      servicePanel.getByRole("link", { name: /Property Sale/ }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
  }
  const offers = nav.getByRole("button", { name: "Offers", exact: true });
  await offers.click();
  await expect(offers).toHaveAttribute("aria-expanded", "true");
  const offersPanel = mobile
    ? page.locator("#mega-offers")
    : page.getByRole("region", { name: "Offers and property discovery" });
  await expect(
    offersPanel.getByRole("link", { name: /Rental Opportunities/ }),
  ).toBeVisible();
  if (!mobile) await expect(offersPanel).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: `work/qa/${testInfo.project.name}-offers.png`,
    fullPage: false,
  });
  await offersPanel.getByRole("link", { name: /Rental Opportunities/ }).click();
  await expect(page).toHaveURL(/rent-property/);
  await expect(
    page.getByRole("heading", { name: /Find where you belong/ }),
  ).toBeVisible();
  await expect(nav.locator('[aria-expanded="true"]')).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});
test("actual hero and image layout, outside dismissal, reduced motion", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  });
  await page.goto("/");
  await expect(page.locator(".brand-loader")).toHaveCount(0, {
    timeout: 20000,
  });
  const brand = page.locator(".header .brand");
  await expect(brand).toBeVisible();
  const image = brand.locator("img");
  if (await image.count()) {
    const dimensions = await image.evaluate((el) => ({
      width: el.naturalWidth,
      height: el.naturalHeight,
      renderWidth: el.getBoundingClientRect().width,
      renderHeight: el.getBoundingClientRect().height,
    }));
    expect(dimensions.width / dimensions.height).toBeGreaterThan(1.8);
    expect(
      Math.abs(
        dimensions.width / dimensions.height -
          dimensions.renderWidth / dimensions.renderHeight,
      ),
    ).toBeLessThan(0.02);
  } else {
    await expect(brand.locator(".brand-fallback")).toHaveText(
      "M. Star Associates",
    );
  }
  await expect(page.locator(".film-media img").first()).toBeVisible();
  await expect(page.locator(".architecture-stage")).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "work/qa/desktop-hero.png" });
    await page
      .getByRole("button", { name: "Our Services", exact: true })
      .click();
    await page.locator(".mega-backdrop").click({ position: { x: 20, y: 650 } });
    await expect(
      page.getByRole("button", { name: "Our Services", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".film-hero")).toBeVisible();
  await expect(page.locator(".architecture-stage")).toHaveCount(0);
  if (testInfo.project.name === "mobile")
    await page.screenshot({ path: "work/qa/mobile-hero-reduced.png" });
  expect(
    await page.getByRole("button", { name: /Request Edits/i }).count(),
  ).toBe(0);
});

test("every menu destination resolves and latest listings applies its sort", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "The shared route map is checked once.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".brand-loader")).toHaveCount(0);
  const targets = new Set(["/", "/projects", "/about", "/contact"]);
  for (const name of ["Properties", "Our Services", "Offers"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const links = await page
      .locator(".mega-panel a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    links.forEach((link) => targets.add(link));
    await page.keyboard.press("Escape");
  }
  for (const target of targets) {
    await page.goto(target);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(
      page.getByText("This page is not part of our collection.", {
        exact: true,
      }),
    ).toHaveCount(0);
  }
  await page.goto("/properties?sort=newest");
  await expect(
    page
      .getByRole("combobox")
      .filter({ has: page.locator('option[value="newest"]') }),
  ).toHaveValue("newest");
});
