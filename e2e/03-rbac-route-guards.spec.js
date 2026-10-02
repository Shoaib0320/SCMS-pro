import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from './fixtures/test-constants.js';

test.describe('Role-Based Access Control (RBAC) & Route Protection', () => {

  test('unauthenticated visitor accessing /super-admin should be redirected to /login', async ({ page }) => {
    // Ensure clean state (no token)
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    await page.goto(ROUTES.SUPER_ADMIN);
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated visitor accessing /branch-admin should be redirected to /login', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    await page.goto(ROUTES.BRANCH_ADMIN);
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated visitor accessing /teacher should be redirected to /login', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    await page.goto(ROUTES.TEACHER);
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('branch admin user accessing super-admin route should be blocked with unauthorized redirection', async ({ page }) => {
    // Navigate to login with hydration wait
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    await page.waitForTimeout(800);
    
    // Fill Branch Admin credentials
    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill(TEST_ACCOUNTS.branchAdmin.login);
    await passwordInput.fill(TEST_ACCOUNTS.branchAdmin.password);
    await signInBtn.click();

    // Verify redirect to /branch-admin dashboard
    await page.waitForURL('**/branch-admin', { timeout: 30000 });
    expect(page.url()).toContain('/branch-admin');

    // Attempt to navigate to Super Admin restricted URL
    await page.goto(ROUTES.SUPER_ADMIN);

    // Should be blocked and redirected away from super-admin (to /unauthorized or /login)
    await page.waitForURL((url) => !url.pathname.includes('/super-admin'), { timeout: 20000 });
    expect(page.url()).not.toContain('/super-admin');
  });
});
