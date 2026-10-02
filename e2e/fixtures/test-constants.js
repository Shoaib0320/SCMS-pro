/**
 * Safe Test Constants and Configuration for Live SCMS Pro Project
 *
 * SAFETY NOTICE:
 * All test accounts below are read-only / standard demo users.
 * Under no circumstances should test specs run DROP, DELETE, or destructive mutations on live data.
 */

export const TEST_ACCOUNTS = {
  superAdmin: {
    login: process.env.TEST_SUPERADMIN_EMAIL || 'admin@coaching.com',
    password: process.env.TEST_SUPERADMIN_PASSWORD || 'Admin@123',
    roleName: 'SUPER_ADMIN',
    expectedPath: '/super-admin',
  },
  branchAdmin: {
    login: process.env.TEST_BRANCHADMIN_EMAIL || 'admin@scmspro.com',
    password: process.env.TEST_BRANCHADMIN_PASSWORD || 'admin@c12',
    roleName: 'BRANCH_ADMIN',
    expectedPath: '/branch-admin',
  },
  teacher: {
    login: process.env.TEST_TEACHER_EMAIL || 'sajoodali@gmail.com',
    password: process.env.TEST_TEACHER_PASSWORD || '111111',
    roleName: 'TEACHER',
    expectedPath: '/teacher',
  },
  studentDemo: {
    login: 'student@demo.test',
    password: 'Password123!',
    roleName: 'STUDENT',
  },
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  PRIVACY_POLICY: '/privacy-policy',
  DELETE_ACCOUNT_POLICY: '/delete-account-policy',
  SUPER_ADMIN: '/super-admin',
  BRANCH_ADMIN: '/branch-admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  UNAUTHORIZED: '/unauthorized',
};

export const API_ROUTES = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  ADMIN_DETAILS: '/api/auth/admin-details',
  PROFILE: '/api/users/profile',
};
