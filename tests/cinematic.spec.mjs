import { test, expect } from "@playwright/test";

test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "Lifecycle checks run once; responsive layouts are swept separately.",
  );
});

test("reduced-motion villa renders once, resizes and releases its canvas on route changes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".architecture-stage")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Explore in 3D", exact: true })
    .click();
  const stage = page.locator(".architecture-stage");
  await expect(stage).toHaveClass(/ready/, { timeout: 60000 });
  const host = page.locator(".architecture-canvas");
  await expect
    .poll(() => host.getAttribute("data-villa-time"), { timeout: 60000 })
    .toBe("9.00");
  await page.waitForTimeout(300);
  expect(await host.getAttribute("data-villa-time")).toBe("9.00");
  await expect(
    page.getByRole("dialog", { name: "Explore in 3D", exact: true }),
  ).toHaveAttribute("aria-modal", "true");
  await expect
    .poll(
      () =>
        host.evaluate((el) =>
          Math.abs(
            el.querySelector("canvas").width -
              el.clientWidth * Math.min(devicePixelRatio, 1.6),
          ),
        ),
      { timeout: 60000 },
    )
    .toBeLessThan(2);
  await page.keyboard.press("Escape");
  await expect(stage).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Explore in 3D", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About Us", exact: true })
    .click();
  await expect(page.locator(".architecture-canvas canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("cinematic reveal advances, pause freezes it and camera presets remain available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 760 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "deviceMemory", { get: () => 2 }),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".architecture-stage")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Explore in 3D", exact: true })
    .click();
  const host = page.locator(".architecture-canvas");
  await expect(page.locator(".architecture-stage")).toHaveClass(/ready/, {
    timeout: 60000,
  });
  await expect
    .poll(async () => +(await host.getAttribute("data-villa-time")), {
      timeout: 60000,
    })
    .toBeGreaterThan(1);
  await page
    .getByRole("button", { name: "Pause architectural tour", exact: true })
    .click();
  await page.waitForTimeout(200);
  const frozen = await host.getAttribute("data-villa-time");
  await page.waitForTimeout(350);
  expect(await host.getAttribute("data-villa-time")).toBe(frozen);
  await page
    .getByRole("button", { name: "Play architectural tour", exact: true })
    .click();
  await expect
    .poll(async () => +(await host.getAttribute("data-villa-time")), {
      timeout: 60000,
    })
    .toBeGreaterThan(+frozen);
  await page.getByRole("button", { name: "Courtyard", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Courtyard", exact: true }),
  ).toHaveClass(/selected/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
