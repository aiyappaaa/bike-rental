import { User, IUserDocument } from '@/models/User';
import { jwtService, TokenPair } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { 
  UserRegistration, 
  UserLogin, 
  ForgotPassword, 
  ResetPassword,
  EmailVerification 
} from '@rideflow/shared';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} from '@/middleware/errorHandler';
import { emailService } from './emailService';
import { isFeatureEnabled } from '@/config/env';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: UserRegistration): Promise<{ user: IUserDocument; tokens?: TokenPair }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email.toLowerCase() },
          { phone: userData.phone }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email.toLowerCase()) {
          throw new ConflictError('Email already registered');
        }
        if (existingUser.phone === userData.phone) {
          throw new ConflictError('Phone number already registered');
        }
      }

      // Create new user
      const user = new User({
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        password: userData.password,
        isVerified: !isFeatureEnabled('ENABLE_EMAIL_VERIFICATION'),
      });

      await user.save();

      // Generate email verification token if email verification is enabled
      if (isFeatureEnabled('ENABLE_EMAIL_VERIFICATION')) {
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        await emailService.sendEmailVerification(user.email, user.name, verificationToken);
        
        logger.info(`User registered: ${user.email} - Email verification required`);
        return { user };
      } else {
        // Generate tokens if email verification is disabled
        const tokens = jwtService.generateTokenPair({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        });

        // Store refresh token
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        logger.info(`User registered and logged in: ${user.email}`);
        return { user, tokens };
      }
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: UserLogin): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    try {
      // Find user by email
      const user = await User.findByEmail(loginData.email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if email is verified
      if (isFeatureEnabled('ENABLE_EMAIL_VERIFICATION') && !user.isVerified) {
        throw new AuthenticationError('Please verify your email before logging in');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store refresh token and update last login
      user.refreshTokens.push(tokens.refreshToken);
      user.lastLoginAt = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ tokens: TokenPair }> {
    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Check if refresh token exists in user's token list
      if (!user.refreshTokens.includes(refreshToken)) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Replace old refresh token with new one
      const tokenIndex = user.refreshTokens.indexOf(refreshToken);
      user.refreshTokens[tokenIndex] = tokens.refreshToken;
      await user.save();

      logger.info(`Tokens refreshed for user: ${user.email}`);
      return { tokens };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();

      logger.info(`User logged out: ${user.email}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Clear all refresh tokens
      user.refreshTokens = [];
      await user.save();

      logger.info(`User logged out from all devices: ${user.email}`);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(verificationData: EmailVerification): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    try {
      const user = await User.findByEmailVerificationToken(verificationData.token);
      if (!user) {
        throw new AuthenticationError('Invalid or expired verification token');
      }

      // Mark user as verified
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await emailService.sendEmailVerification(user.email, user.name, verificationToken);

      logger.info(`Email verification resent to: ${user.email}`);
    } catch (error) {
      logger.error('Resend email verification error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(forgotData: ForgotPassword): Promise<void> {
    try {
      const user = await User.findOne({ email: forgotData.email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not
        logger.info(`Password reset requested for non-existent email: ${forgotData.email}`);
        return;
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await emailService.sendPasswordReset(user.email, user.name, resetToken);

      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(resetData: ResetPassword): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    try {
      const user = await User.findByPasswordResetToken(resetData.token);
      if (!user) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Update password
      user.password = resetData.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      // Clear all refresh tokens (logout from all devices)
      user.refreshTokens = [];
      
      await user.save();

      // Generate new tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
