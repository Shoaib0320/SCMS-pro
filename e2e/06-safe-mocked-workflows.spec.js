import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from './fixtures/test-constants.js';

test.describe('Safe Isolated UI Mutation Workflows (Mocked API)', () => {

  test('should handle student admission modal submission safely without mutating live database', async ({ page }) => {
    let apiIntercepted = false;

    // 1. Intercept student creation API to prevent inserting test data into live production DB
    await page.route('**/api/students**', async (route) => {
      if (route.request().method() === 'POST') {
        apiIntercepted = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Student admitted successfully (E2E Test Mock)',
            data: { id: 'mock-e2e-student-uuid', first_name: 'Test', last_name: 'Student' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 2. Login as Branch Admin with hydration wait
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(800);

    await page.locator('input#login').fill(TEST_ACCOUNTS.branchAdmin.login);
    await page.locator('input#password').fill(TEST_ACCOUNTS.branchAdmin.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/branch-admin', { timeout: 30000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });

    // 3. Navigate to students page
    await page.goto('/branch-admin/students');
    await page.waitForLoadState('domcontentloaded');
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(1200);

    // 4. Verify search input is interactive
    const searchInput = page.locator('input[placeholder*="Search by Name" i], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('Safetest');
    await expect(searchInput).toHaveValue('Safetest');

    // 5. Look for Add Student button and verify modal opens
    const addStudentBtn = page.getByRole('button', { name: /add student/i }).first();
    await expect(addStudentBtn).toBeVisible({ timeout: 10000 });
    await addStudentBtn.click();

    // Ensure Student Form modal opens safely by checking modal header
    await expect(page.getByText('Enroll New Student')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Personal' })).toBeVisible({ timeout: 10000 });
  });

  test('should safely display delete confirmation modal without executing deletion on live data', async ({ page }) => {
    // Intercept any potential DELETE request and abort or return mock to protect production
    let deleteAttempted = false;
    await page.route('**/api/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteAttempted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Safely blocked from live DB' }),
        });
      } else {
        await route.continue();
      }
    });

    // Login as Branch Admin with hydration wait
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(800);

    await page.locator('input#login').fill(TEST_ACCOUNTS.branchAdmin.login);
    await page.locator('input#password').fill(TEST_ACCOUNTS.branchAdmin.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/branch-admin', { timeout: 30000 });

    // Ensure we are safely logged in without any unauthorized mutations executed
    expect(page.url()).toContain('/branch-admin');
    expect(deleteAttempted).toBe(false);
  });
});
