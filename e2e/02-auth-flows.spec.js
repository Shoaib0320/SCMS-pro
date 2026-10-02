import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from './fixtures/test-constants.js';

test.describe('Authentication & Authorization Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(ROUTES.LOGIN);
    await page.locator('input#login').waitFor({ state: 'visible', timeout: 15000 });
    // Suppress Next.js dev overlay from intercepting pointer events
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });
    // Allow Next.js / React 19 hydration to settle
    await page.waitForTimeout(800);
  });

  test('should display validation error when submitting empty credentials', async ({ page }) => {
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await signInBtn.click();

    // Verify client validation error
    const errorAlert = page.locator('text=Login ID and password are required');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test('should display validation error when password is less than 6 characters', async ({ page }) => {
    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill('user@coaching.com');
    await passwordInput.fill('123');
    await signInBtn.click();

    // Verify minimum length error
    const errorAlert = page.locator('text=Password must be at least 6 characters');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test('should display error message on invalid credentials without corrupting state', async ({ page }) => {
    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill('nonexistent.safe.test@scmspro.test');
    await passwordInput.fill('InvalidPassword999!');
    await signInBtn.click();

    // Verify error banner is rendered gracefully from backend response
    const errorBox = page.locator('.bg-red-50').or(page.getByText('Invalid credentials')).or(page.getByText('Login failed')).first();
    await expect(errorBox).toBeVisible({ timeout: 15000 });
  });

  test('should block web login for student role and advise mobile app download', async ({ page }) => {
    // Intercept login API safely to simulate a student account without altering live DB
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'mock-student-id',
            first_name: 'Test',
            last_name: 'Student',
            role: 'STUDENT',
          },
          accessToken: 'mock-student-token-e2e',
        }),
      });
    });

    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill('student@test.com');
    await passwordInput.fill('123456');
    await signInBtn.click();

    // Verify student restriction message appears
    await expect(page.getByText('You can only login from the Mobile App')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /download it/i })).toBeVisible({ timeout: 10000 });
  });

  test('should successfully log in as Super Admin and redirect to /super-admin', async ({ page }) => {
    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill(TEST_ACCOUNTS.superAdmin.login);
    await passwordInput.fill(TEST_ACCOUNTS.superAdmin.password);
    await signInBtn.click();

    // Expect navigation to Super Admin dashboard
    await page.waitForURL('**/super-admin', { timeout: 30000 });
    expect(page.url()).toContain(TEST_ACCOUNTS.superAdmin.expectedPath);

    // Verify token was stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('should successfully log out and clear authenticated session', async ({ page }) => {
    // 1. Login as Super Admin first
    const loginInput = page.locator('input#login');
    const passwordInput = page.locator('input#password');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });

    await loginInput.fill(TEST_ACCOUNTS.superAdmin.login);
    await passwordInput.fill(TEST_ACCOUNTS.superAdmin.password);
    await signInBtn.click();

    await page.waitForURL('**/super-admin', { timeout: 30000 });

    // Suppress Next.js dev overlay on dashboard page as well
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; pointer-events: none !important; }' });

    // 2. Open the user profile dropdown in header
    const profileDropdownTrigger = page.locator('header').locator('button:has(.lucide-chevron-down)').first();
    await profileDropdownTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await profileDropdownTrigger.click({ force: true });

    // 3. Click the Sign Out button inside dropdown
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    await signOutBtn.waitFor({ state: 'visible', timeout: 5000 });
    await signOutBtn.click({ force: true });

    // 4. Expect redirect back to login page
    await page.waitForURL('**/login', { timeout: 20000 });
    expect(page.url()).toContain('/login');

    // 5. Verify token was cleared from localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });
});
