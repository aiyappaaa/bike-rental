import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api/authApi';

// User interface matching the backend User model response shape
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: TokenPair) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, tokens } = response.data;
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(userData);
          const { user, tokens } = response.data;
          
          if (tokens) {
            // Auto-login if email verification is disabled
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Email verification required
            set({
              user,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { tokens } = get();
        try {
          if (tokens?.refreshToken) {
            await authApi.logout(tokens.refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refreshToken(tokens.refreshToken);
          const newTokens = response.data.tokens;
          
          set({ tokens: newTokens });
        } catch (error) {
          // Refresh failed, clear auth
          get().clearAuth();
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (tokens: TokenPair) => {
        set({ tokens, isAuthenticated: true });
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return;
        }

        try {
          const response = await authApi.getProfile();
          const user = response.data.user;
          
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await get().refreshToken();
            // Retry getting profile
            const response = await authApi.getProfile();
            const user = response.data.user;
            
            set({
              user,
              isAuthenticated: true,
            });
          } catch (refreshError) {
            // Both failed, clear auth
            get().clearAuth();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
