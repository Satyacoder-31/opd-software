import { expect, test } from "@playwright/test";

/**
 * Core OPD smoke coverage.
 * Full authenticated flow needs E2E_EMAIL / E2E_PASSWORD for a seeded clinic user.
 */
test.describe("public auth surfaces", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Dr Orthos", { exact: true }).first()).toBeVisible();
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

  async function signIn(page: import("@playwright/test").Page) {
    await page.goto("/login");
    await page.locator('input[name="email"], input[type="email"]').fill(email!);
    await page.locator('input[name="password"], input[type="password"]').fill(password!);
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/(queue|patients|settings)/);
  }

  test("register → queue → consult path is reachable", async ({ page }) => {
    await signIn(page);

    await page.goto("/patients/new");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();

    await page.goto("/queue");
    await expect(page.getByRole("heading", { name: /queue/i })).toBeVisible();
  });

  test("consultation workspace tabs and complete visit controls render", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto("/queue");

    const openButton = page.getByRole("link", { name: /open/i }).first();
    const startButton = page
      .getByRole("button", { name: /start consultation/i })
      .first();

    if (await openButton.isVisible().catch(() => false)) {
      await openButton.click();
    } else if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    } else {
      test.skip(true, "No queued consultation available for workspace smoke.");
      return;
    }

    await page.waitForURL(/\/consultations\//);
    await expect(
      page.getByRole("heading", { name: /consultation workspace|visit summary/i })
    ).toBeVisible();

    const isWorkspace = await page
      .getByRole("heading", { name: /consultation workspace/i })
      .isVisible()
      .catch(() => false);

    if (!isWorkspace) {
      await expect(page.getByRole("tab", { name: /consultation/i })).toBeVisible();
      return;
    }

    await expect(page.getByRole("tab", { name: /^consultation$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^prescription$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^investigations$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^documents$/i })).toBeVisible();

    await page.getByRole("tab", { name: /^prescription$/i }).click();
    await expect(page.getByRole("button", { name: /add medicine/i })).toBeVisible();

    await page.getByRole("tab", { name: /^investigations$/i }).click();
    await expect(page.getByLabel(/lab results/i)).toBeVisible();

    await expect(
      page.getByRole("button", { name: /save draft/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /complete visit/i }).first()
    ).toBeVisible();
  });

  test("settings overview links to dedicated pages", async ({ page }) => {
    await signIn(page);
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("link", { name: /clinic profile/i })).toBeVisible();

    await page.getByRole("link", { name: /staff & access/i }).click();
    await expect(page).toHaveURL(/\/settings\/staff$/);
    await expect(page.getByRole("heading", { name: /staff & access/i })).toBeVisible();

    await page.getByRole("link", { name: /invite staff/i }).click();
    await expect(page).toHaveURL(/\/settings\/staff\/invite$/);
    await expect(page.getByRole("heading", { name: /invite staff/i })).toBeVisible();

    await page.getByRole("link", { name: /back to staff/i }).click();
    await expect(page).toHaveURL(/\/settings\/staff$/);
  });

  test("legacy settings routes redirect", async ({ page }) => {
    await signIn(page);

    await page.goto("/settings/edit");
    await expect(page).toHaveURL(/\/settings\/clinic$/);

    await page.goto("/settings/invite");
    await expect(page).toHaveURL(/\/settings\/staff\/invite$/);
  });

  test("billing hub is reachable", async ({ page }) => {
    await signIn(page);

    await page.goto("/billing");
    const onBilling = /\/billing\/?(\?|$)/.test(page.url());
    if (onBilling) {
      await expect(page.getByRole("heading", { name: /^billing$/i })).toBeVisible();
      await expect(page.getByLabel(/search/i)).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/queue/);
    }
  });
});
