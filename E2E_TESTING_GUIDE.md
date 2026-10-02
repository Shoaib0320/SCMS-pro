# End-to-End (E2E) Testing Guide for SCMS Pro

This document outlines the End-to-End (E2E) test suite architecture, safety policies, and execution commands for the SCMS Pro Coaching Management System.

---

## 1. Safety Policy on Live Environments

> [!CAUTION]
> **Zero Live-Database Mutation Policy**
> The project connects directly to a live PostgreSQL database (NeonDB). Under no circumstances should test specs run `DROP`, `TRUNCATE`, `DELETE`, or insert fake test entities into the database.

To guarantee complete safety on the live project:
1. **Read-Only Verification:** Endpoints and pages are tested strictly with read-only assertions and existing authentic read-only roles (Super Admin, Branch Admin).
2. **Network Interception (`page.route`):** All UI mutation flows (e.g., student enrollment form submissions, delete confirmation modals) are intercepted at the Playwright network level. The browser receives mocked JSON success/error responses so the full client UI is tested without touching live database tables.
3. **Automatic Dev Overlay Suppression:** During automated test runs, Next.js internal development overlays (`nextjs-portal`) are suppressed via CSS injection to prevent pointer interception without modifying production bundles.

---

## 2. Test Suites Overview

The test files reside in [`e2e/`](./e2e):

| Suite | File | Tests | Purpose |
|---|---|---|---|
| **01. Landing & Public** | [`e2e/01-landing-and-public.spec.js`](./e2e/01-landing-and-public.spec.js) | 5 | Verifies landing page rendering, branding, navigation links, Privacy Policy, Account Deletion Policy, and mobile viewport responsive behavior. |
| **02. Auth & Session** | [`e2e/02-auth-flows.spec.js`](./e2e/02-auth-flows.spec.js) | 6 | Tests required credential validation, password min-length checks, invalid credential error handling, student mobile-only restriction, successful Super Admin login, and clean session logout. |
| **03. RBAC & Route Guards** | [`e2e/03-rbac-route-guards.spec.js`](./e2e/03-rbac-route-guards.spec.js) | 4 | Tests unauthenticated redirects to `/login` for `/super-admin`, `/branch-admin`, and `/teacher`, plus cross-role boundary enforcement (Branch Admin blocked from `/super-admin`). |
| **04. Dashboard Navigation** | [`e2e/04-dashboard-navigation.spec.js`](./e2e/04-dashboard-navigation.spec.js) | 2 | Verifies Super Admin and Branch Admin dashboard layouts, header profile, and sidebar navigation menus. |
| **05. API Smoke & Contracts** | [`e2e/05-api-smoke.spec.js`](./e2e/05-api-smoke.spec.js) | 6 | API contract tests for `/api/auth/admin-details` (200), `/api/auth/login` (400 on empty, 401 on bad password, 200 on valid credentials), and `/api/users/profile` (401 without token, 200 with Bearer token). |
| **06. Safe Mocked Workflows** | [`e2e/06-safe-mocked-workflows.spec.js`](./e2e/06-safe-mocked-workflows.spec.js) | 2 | Validates student search, the multi-tab Student Enrollment modal, and deletion confirmation dialogs in isolated safety using Playwright request mocking. |

---

## 3. Running the Tests

Ensure the local Next.js dev server is running (`npm run dev`), or let Playwright start it automatically via `playwright.config.js`.

### Run All Tests Headless (Default)
```bash
npm run test:e2e
```

### Run Tests with Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Browser (Visible Window)
```bash
npm run test:e2e:headed
```

### View HTML Test Report
```bash
npm run test:e2e:report
```

### Run a Single Specific Suite
```bash
npx playwright test e2e/01-landing-and-public.spec.js
npx playwright test e2e/02-auth-flows.spec.js
npx playwright test e2e/03-rbac-route-guards.spec.js
npx playwright test e2e/04-dashboard-navigation.spec.js
npx playwright test e2e/05-api-smoke.spec.js
npx playwright test e2e/06-safe-mocked-workflows.spec.js
```

---

## 4. Configuration Highlights

File: [`playwright.config.js`](./playwright.config.js)
- **Engine:** Google Chrome (`channel: 'chrome'`) utilizing the local browser binary without requiring external CDN downloads.
- **Workers:** Sequential execution (`workers: 1`) to ensure stable, predictable interaction with the database.
- **Artifacts:** Automatic trace capture on retry and screenshot/video retention on failures in `playwright-report/` and `test-results/`.
- **Server Reuse:** `reuseExistingServer: true` automatically attaches to any active Next.js dev server on port 3000.

---

## 5. Key Improvements Implemented

1. **API Client 401 Interceptor Guard ([`src/lib/api-client.js`](./src/lib/api-client.js)):**
   - Previously, a 401 response on `/api/auth/login` triggered an infinite refresh-token retry loop and forced a window reload (`window.location.href = '/login'`), discarding error messages.
   - Auth routes (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`) are now properly excluded from the automatic refresh redirect, allowing error banners (e.g. "Invalid credentials") to render gracefully in the UI.
2. **React 19 Hydration Synchronization:**
   - In Next.js 16 with React 19, test steps ensure client-side hydration has completed prior to form interactions to prevent premature native form submits.
