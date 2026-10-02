import { test, expect } from '@playwright/test';
import { ROUTES } from './fixtures/test-constants.js';

test.describe('Public Pages & Landing Flow', () => {

  test('should load the landing page with branding and key sections', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    // Verify document title or main brand heading
    await expect(page).toHaveTitle(/Adamjee/i);

    // Verify brand name in Navbar
    const brandTitle = page.locator('header').getByText('Adamjee Coaching').first();
    await expect(brandTitle).toBeVisible();

    // Verify main navigation links exist in navbar
    const homeLink = page.locator('header').getByRole('link', { name: 'Home' }).first();
    await expect(homeLink).toBeVisible();

    const featuresLink = page.locator('header').getByRole('link', { name: 'Features' }).first();
    await expect(featuresLink).toBeVisible();

    // Verify Login button exists in header
    const loginBtn = page.locator('header').getByRole('link', { name: /login/i }).first();
    await expect(loginBtn).toBeVisible();
  });

  test('should navigate from landing page to login page when clicking Login button', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const loginBtn = page.locator('header').getByRole('link', { name: /login/i }).first();
    await loginBtn.click();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // Verify login card is present
    await expect(page.getByText('Adamjee Coaching')).toBeVisible();
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should render Privacy Policy page without errors', async ({ page }) => {
    await page.goto(ROUTES.PRIVACY_POLICY);
    await expect(page.locator('body')).toContainText(/privacy policy/i);
  });

  test('should render Delete Account Policy page without errors', async ({ page }) => {
    await page.goto(ROUTES.DELETE_ACCOUNT_POLICY);
    await expect(page.locator('body')).toContainText(/delete.*account|policy/i);
  });

  test('should display mobile menu toggle on smaller viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.HOME);

    const mobileToggle = page.locator('header button[aria-label="Toggle navigation"]');
    await expect(mobileToggle).toBeVisible();

    // Click to open mobile navigation menu
    await mobileToggle.click();
    await expect(page.locator('header').getByRole('link', { name: 'Home' }).first()).toBeVisible();
  });
});
