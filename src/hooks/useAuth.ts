/**
 * @module hooks/useAuth
 * React Query hooks for authentication endpoints, with react-hot-toast integration.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useQueryErrorToast } from '@/hooks/useQueryErrorToast';
import { useAuthStore } from '@/store/auth';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  RegisterRequest,
  LoginRequest,
  LoginSuccessResponse,
  TwoFactorRequiredResponse,
  ApiErrorResponse,
  ResendConfirmationRequest,
  ConfirmTwoFactorRequest,
  RequestPasswordReset,
  ResetPassword,
  ChangePasswordRequest,
  ValidateResetTokenResponse,
  SessionsResponse,
} from '@/types/api';

const BASE = API_ENDPOINTS.AUTH;

function getErrorMessage(error: ApiErrorResponse | { error: string; meta?: { retryAfterSeconds?: number } }) {
  // Handle rate limit error format (error is a string)
  if (typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error.error;
  }

  // Handle standard API error format (error.error.message)
  if (typeof error === 'object' && 'error' in error && typeof error.error === 'object' && error.error !== null) {
    return error.error.message || 'An unknown error occurred';
  }

  return 'An unknown error occurred';
}

// Register
export function useRegister() {
  const toast = useToast();
  return useMutation<LoginSuccessResponse, ApiErrorResponse, RegisterRequest>({
    mutationFn: (data) =>
      request<LoginSuccessResponse>({
        url: `${BASE}/register`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Login (may return 2FA required or login success)
export function useLogin() {
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation<LoginSuccessResponse | TwoFactorRequiredResponse, ApiErrorResponse, LoginRequest>({
    mutationFn: (data) =>
      request<LoginSuccessResponse | TwoFactorRequiredResponse>({
        url: `${BASE}/login`,
        method: 'POST',
        data,
      }),
    onSuccess: (response) => {
      // Check if this is a full login success (has email field in data)
      if ('data' in response && response.data && 'email' in response.data) {
        // Full login success - update store
        setUser(response.data);
        toast.success(response.message);
      }
      // If it's 2FA required, don't update store yet - will be handled by confirm2fa
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Confirm 2FA
export function useConfirm2fa() {
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation<LoginSuccessResponse, ApiErrorResponse, ConfirmTwoFactorRequest>({
    mutationFn: (data) =>
      request<LoginSuccessResponse>({
        url: `${BASE}/confirm-2fa`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
        toast.success(data.message);
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Refresh token
export function useRefreshToken() {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation<LoginSuccessResponse, ApiErrorResponse, void>({
    mutationFn: () =>
      request<LoginSuccessResponse>({
        url: `${BASE}/refresh`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
      }
    },
  });
}

// Logout current session
export function useLogout() {
  const toast = useToast();
  const clearUser = useAuthStore((state) => state.clearUser);
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, void>({
    mutationFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/logout`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      clearUser();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Logout all sessions
export function useLogoutAll() {
  const toast = useToast();
  const clearUser = useAuthStore((state) => state.clearUser);
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, void>({
    mutationFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/logout-all`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      clearUser();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// List sessions (query)
export function useSessions() {
  const query = useQuery<SessionsResponse, ApiErrorResponse>({
    queryKey: ['sessions'],
    queryFn: () =>
      request<SessionsResponse>({
        url: `${BASE}/sessions`,
        method: 'GET',
      }),
  });
  useQueryErrorToast(query.error);
  return query;
}

// Request password reset
export function useRequestPasswordReset() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, RequestPasswordReset>({
    mutationFn: (data) =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/request-password-reset`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Validate reset token (query)
export function useValidateResetToken(token: string) {
  const query = useQuery<ValidateResetTokenResponse, ApiErrorResponse>({
    queryKey: ['validate-reset-token', token],
    queryFn: () =>
      request<ValidateResetTokenResponse>({
        url: `${BASE}/validate-reset-token`,
        method: 'GET',
        params: { token },
      }),
    enabled: !!token,
  });
  useQueryErrorToast(query.error);
  return query;
}

// Reset password
export function useResetPassword() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, ResetPassword>({
    mutationFn: (data) =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/reset-password`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Change password
export function useChangePassword() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, ChangePasswordRequest>({
    mutationFn: (data) =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/change-password`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Resend confirmation email
export function useResendConfirmation() {
  const toast = useToast();
  return useMutation<
    { success: true; message: string; requestId?: string },
    ApiErrorResponse,
    ResendConfirmationRequest
  >({
    mutationFn: (data) =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/resend-confirmation`,
        method: 'POST',
        data,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Confirm email (query)
export function useConfirmEmail(token: string) {
  const toast = useToast();
  const query = useQuery<{ success: true; message: string; requestId?: string }, ApiErrorResponse>({
    queryKey: ['confirm-email', token],
    queryFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/confirm-email`,
        method: 'GET',
        params: { token },
      }),
    enabled: !!token,
  });
  useQueryErrorToast(query.error);
  if (query.isSuccess && query.data) {
    toast.success(query.data.message);
  }
  return query;
}

// Enable 2FA
export function useEnable2fa() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, void>({
    mutationFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/2fa/enable`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Disable 2FA
export function useDisable2fa() {
  const toast = useToast();
  return useMutation<{ success: true; message: string; requestId?: string }, ApiErrorResponse, void>({
    mutationFn: () =>
      request<{ success: true; message: string; requestId?: string }>({
        url: `${BASE}/2fa/disable`,
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
