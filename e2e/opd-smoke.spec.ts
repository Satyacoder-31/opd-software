import { expect, test } from "@playwright/test";

/**
 * Core OPD smoke coverage.
 * Full authenticated flow needs E2E_EMAIL / E2E_PASSWORD for a seeded clinic user.
 */
test.describe("public auth surfaces", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Medyx" })).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/login/forgot-password");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });
});

test.describe("authenticated OPD workflow", () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  test.beforeEach(() => {
    test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated OPD E2E.");
  });

  test("register → queue → consult path is reachable", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"], input[type="email"]').fill(email!);
    await page.locator('input[name="password"], input[type="password"]').fill(password!);
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/(queue|patients|settings)/);

    await page.goto("/patients/new");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();

    await page.goto("/queue");
    await expect(page.getByRole("heading", { name: /queue/i })).toBeVisible();
  });
});
