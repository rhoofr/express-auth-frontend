/**
 * @module lib/constants
 * Centralized application constants and configuration values.
 */

/**
 * Base URL for the backend API.
 * In production, this should be set via environment variable.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';

/**
 * Public API endpoints that should not trigger token refresh.
 */
export const PUBLIC_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/confirm-email',
  '/api/v1/auth/resend-confirmation',
  '/api/v1/auth/request-password-reset',
  '/api/v1/auth/validate-reset-token',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/confirm-2fa',
] as const;

/**
 * API endpoint prefixes grouped by feature.
 */
export const API_ENDPOINTS = {
  AUTH: '/api/v1/auth',
  MESSAGES: '/api/v1/messages',
  HEALTH: '/health',
  METRICS: '/metrics',
} as const;

/**
 * Toast notification default duration (milliseconds).
 */
export const TOAST_DURATION = 2000;

/**
 * Toast notification position.
 */
export const TOAST_POSITION = 'top-right' as const;

/**
 * Default page title.
 */
export const APP_TITLE = 'Express Auth Frontend';

/**
 * Route paths.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  MESSAGES: '/messages',
  MESSAGES_NEW: '/messages/new',
  MESSAGES_DETAIL: '/messages/:id',
  MESSAGES_EDIT: '/messages/:id/edit',
  FORBIDDEN: '/forbidden',
} as const;

export const messageTypes = ['error', 'securityLog', 'systemLog', 'authLog', 'success', 'validationLog'] as const;
export const messageCategories = ['security', 'auth', 'user', 'validation', 'system'] as const;
