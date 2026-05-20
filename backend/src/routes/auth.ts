import { Router } from 'express';
import { authService } from '@/services/authService';
import { validateBody } from '@/middleware/validation';
import { authenticate, validateRefreshToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  UserRegistrationSchema, 
  UserLoginSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema,
  EmailVerificationSchema,
  SUCCESS_MESSAGES,
  HTTP_STATUS 
} from '@rideflow/shared';
import { z } from 'zod';

const router = Router();

// Change password schema
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Resend verification schema
const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateBody(UserRegistrationSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    
    if (result.tokens) {
      // Email verification disabled - user is logged in
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } else {
      // Email verification enabled - verification email sent
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: result.user,
        },
      });
    }
  })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validateBody(UserLoginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.USER_LOGGED_IN,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  })
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  validateRefreshToken,
  asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      await authService.logout(req.user._id, refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout user from all devices
 * @access  Private
 */
router.post('/logout-all',
  authenticate,
  asyncHandler(async (req: any, res) => {
    await authService.logoutAll(req.user._id);
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  })
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email',
  validateBody(EmailVerificationSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.EMAIL_VERIFIED,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  })
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification',
  validateBody(ResendVerificationSchema),
  asyncHandler(async (req, res) => {
    await authService.resendEmailVerification(req.body.email);
    
    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  })
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  validateBody(ForgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  validateBody(ResetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  })
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated users)
 * @access  Private
 */
router.post('/change-password',
  authenticate,
  validateBody(ChangePasswordSchema),
  asyncHandler(async (req: any, res) => {
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req: any, res) => {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  })
);

export default router;
