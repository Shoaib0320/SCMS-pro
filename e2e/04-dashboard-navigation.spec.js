import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from './fixtures/test-constants.js';

test.describe('Dashboard Layout & Navigation', () => {

  test('Super Admin should see dashboard header, sidebar menu, and navigation controls', async ({ page }) => {
    // Login as Super Admin with hydration wait
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(800);

    await page.locator('input#login').fill(TEST_ACCOUNTS.superAdmin.login);
    await page.locator('input#password').fill(TEST_ACCOUNTS.superAdmin.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/super-admin', { timeout: 30000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });

    // Verify main header exists
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 15000 });

    // Verify sidebar exists
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Verify key sidebar navigation items for Super Admin
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Branches')).toBeVisible();
  });

  test('Branch Admin should see campus-specific dashboard elements', async ({ page }) => {
    // Login as Branch Admin with hydration wait
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(800);

    await page.locator('input#login').fill(TEST_ACCOUNTS.branchAdmin.login);
    await page.locator('input#password').fill(TEST_ACCOUNTS.branchAdmin.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/branch-admin', { timeout: 30000 });
    expect(page.url()).toContain('/branch-admin');
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Verify Branch Admin navigation items
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
  });
});
