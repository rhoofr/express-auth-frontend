/**
 * @module lib/api
 * Centralized Axios instance and helpers for backend API.
 * Includes automatic token refresh interceptor.
 */
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

export const api = axios.create({
  baseURL: 'http://localhost:5004',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe a callback to be called when token refresh completes.
 * Used to queue pending requests during refresh.
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notify all subscribers that token refresh has completed.
 * Resolves all queued requests.
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Helper to extract data or throw a typed error.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.request<T>(config);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data as ApiErrorResponse;
    }
    throw err;
  }
}

/**
 * Response interceptor for automatic token refresh.
 *
 * NOTE: You may see 401 errors logged in the browser console when tokens expire.
 * This is expected behavior - the interceptor catches these errors and automatically
 * refreshes the token, then retries the request. The user experience is seamless.
 */
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Call refresh endpoint to get new tokens
          await api.post('/api/v1/auth/refresh');

          // Refresh succeeded
          isRefreshing = false;

          // Notify all queued requests that refresh completed
          onRefreshed('refreshed');

          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - tokens are invalid
          isRefreshing = false;
          refreshSubscribers = [];

          // Clear auth state (import dynamically to avoid circular dependency)
          const { useAuthStore } = await import('@/store/auth');
          useAuthStore.getState().clearUser();

          // Redirect to login page
          window.location.href = '/login';

          return Promise.reject(refreshError);
        }
      }

      // If refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(() => {
          // Retry the request after refresh completes
          api(originalRequest)
            .then((response) => resolve(response))
            .catch((err) => reject(err));
        });
      });
    }

    // Only log non-401 errors (401s are handled silently by token refresh)
    const is401 = error.response?.status === 401;
    if (!is401) {
      console.error('[API Error]', error instanceof Error ? error.message : error);
    }

    // For all other errors, reject as normal
    return Promise.reject(error);
  }
);
