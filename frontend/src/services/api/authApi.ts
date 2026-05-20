// Temporary types to fix import issues
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

interface UserLogin {
  email: string;
  password: string;
}

interface ForgotPassword {
  email: string;
}

interface ResetPassword {
  token: string;
  password: string;
}

interface EmailVerification {
  token: string;
}

import { api } from './client';

// Temporary ApiResponse type to fix import issues
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

export interface RegisterResponse {
  user: User;
  tokens?: TokenPair; // Optional if email verification is required
}

export interface RefreshTokenResponse {
  tokens: TokenPair;
}

export interface ProfileResponse {
  user: User;
}

export const authApi = {
  // Authentication endpoints
  login: (credentials: UserLogin): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', credentials),

  register: (userData: UserRegistration): Promise<ApiResponse<RegisterResponse>> =>
    api.post('/auth/register', userData),

  logout: (refreshToken: string): Promise<ApiResponse<void>> =>
    api.post('/auth/logout', { refreshToken }),

  logoutAll: (): Promise<ApiResponse<void>> =>
    api.post('/auth/logout-all'),

  refreshToken: (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> =>
    api.post('/auth/refresh', { refreshToken }),

  // Email verification
  verifyEmail: (data: EmailVerification): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/verify-email', data),

  resendVerification: (email: string): Promise<ApiResponse<void>> =>
    api.post('/auth/resend-verification', { email }),

  // Password reset
  forgotPassword: (data: ForgotPassword): Promise<ApiResponse<void>> =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPassword): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/reset-password', data),

  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  // Profile
  getProfile: (): Promise<ApiResponse<ProfileResponse>> =>
    api.get('/auth/me'),
};
