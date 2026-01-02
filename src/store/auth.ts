/**
 * @module store/auth
 * Zustand store for global authentication state.
 * Stores user profile data from login response.
 * Does NOT store tokens (httpOnly cookies handled by browser).
 */
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { LoginSuccessData } from '@/types/api';

interface AuthState {
  user: LoginSuccessData | null;
  isAuthenticated: boolean;
  setUser: (user: LoginSuccessData) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: true }, false, 'auth/setUser'),
        clearUser: () => set({ user: null, isAuthenticated: false }, false, 'auth/clearUser'),
      }),
      {
        name: 'auth-storage', // localStorage key
        // Only persist user data, not tokens (we don't have them anyway)
      }
    ),
    {
      name: 'AuthStore', // Name shown in Redux DevTools
      enabled: import.meta.env.DEV, // Only enable in development
    }
  )
);
