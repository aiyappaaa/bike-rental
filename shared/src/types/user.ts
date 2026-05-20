import { z } from 'zod';

// User role enum
export const UserRole = z.enum(['user', 'admin', 'staff']);
export type UserRole = z.infer<typeof UserRole>;

// Base user schema
export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)'),
  role: UserRole.default('user'),
  isVerified: z.boolean().default(false),
  favourites: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

// User registration schema
export const UserRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;

// User login schema
export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;

// User profile update schema
export const UserProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)').optional(),
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;

// Password reset schemas
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

// Email verification schema
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type EmailVerification = z.infer<typeof EmailVerificationSchema>;

// Public user schema (for responses)
export const PublicUserSchema = UserSchema.omit({
  phone: true,
}).partial({
  email: true,
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
