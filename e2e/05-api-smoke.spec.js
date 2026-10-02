import { test, expect } from '@playwright/test';
import { API_ROUTES, TEST_ACCOUNTS } from './fixtures/test-constants.js';

test.describe('End-to-End API Smoke & Contract Tests', () => {

  test('GET /api/auth/admin-details should return 200 and list of admin contacts safely', async ({ request }) => {
    const res = await request.get(API_ROUTES.ADMIN_DETAILS);
    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('success', true);
    expect(Array.isArray(json.data)).toBe(true);

    if (json.data.length > 0) {
      const firstAdmin = json.data[0];
      expect(firstAdmin).toHaveProperty('role');
      expect(firstAdmin).toHaveProperty('email');
    }
  });

  test('POST /api/auth/login should reject empty payload with 400 Bad Request', async ({ request }) => {
    const res = await request.post(API_ROUTES.LOGIN, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  test('POST /api/auth/login should reject incorrect password with 401 Unauthorized', async ({ request }) => {
    const res = await request.post(API_ROUTES.LOGIN, {
      data: {
        login: TEST_ACCOUNTS.superAdmin.login,
        password: 'IncorrectPassword_SafeE2ETest!',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([401, 400]).toContain(res.status());
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  test('POST /api/auth/login should authenticate valid Super Admin and return JWT accessToken', async ({ request }) => {
    const res = await request.post(API_ROUTES.LOGIN, {
      data: {
        login: TEST_ACCOUNTS.superAdmin.login,
        password: TEST_ACCOUNTS.superAdmin.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json).toHaveProperty('accessToken');
    expect(json.user).toHaveProperty('role', TEST_ACCOUNTS.superAdmin.roleName);
  });

  test('GET /api/users/profile should reject unauthenticated request without token', async ({ request }) => {
    const res = await request.get(API_ROUTES.PROFILE);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/users/profile should return current user profile with valid Bearer token', async ({ request }) => {
    // 1. Acquire token
    const loginRes = await request.post(API_ROUTES.LOGIN, {
      data: {
        login: TEST_ACCOUNTS.superAdmin.login,
        password: TEST_ACCOUNTS.superAdmin.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    const loginJson = await loginRes.json();
    const token = loginJson.accessToken;
    expect(token).toBeTruthy();

    // 2. Fetch profile
    const profileRes = await request.get(API_ROUTES.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(profileRes.status()).toBe(200);
    const profileJson = await profileRes.json();
    expect(profileJson.success).toBe(true);
    expect(profileJson.user).toBeDefined();
    expect(profileJson.user.email).toBe(TEST_ACCOUNTS.superAdmin.login);
  });
});
