import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '@/models/User';
import { jwtService, JWTPayload } from '@/utils/jwt';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { UserRole } from '@rideflow/shared';

export interface AuthenticatedRequest extends Request {
  user: IUserDocument;
  token: string;
}

/**
 * Middleware to authenticate user using JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify the token
    const payload: JWTPayload = jwtService.verifyAccessToken(token);

    // Find the user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user account is locked
    if (user.isAccountLocked()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    // Check if user is verified (if email verification is enabled)
    if (process.env.ENABLE_EMAIL_VERIFICATION === 'true' && !user.isVerified) {
      throw new AuthenticationError('Email not verified');
    }

    // Attach user and token to request
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(user.role as UserRole)) {
        throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorize('admin');

/**
 * Middleware to check if user is staff or admin
 */
export const requireStaff = authorize('staff', 'admin');

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admin can access any resource
      if (user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
      
      if (!resourceUserId) {
        throw new AuthorizationError('Resource user ID not found');
      }

      if (user._id.toString() !== resourceUserId) {
        throw new AuthorizationError('Access denied. You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload: JWTPayload = jwtService.verifyAccessToken(token);
        const user = await User.findById(payload.userId);
        
        if (user && !user.isAccountLocked()) {
          (req as AuthenticatedRequest).user = user;
          (req as AuthenticatedRequest).token = token;
        }
      } catch (error) {
        // Ignore token errors in optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate refresh token
 */
export const validateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    // Verify the refresh token
    const payload: JWTPayload = jwtService.verifyRefreshToken(refreshToken);

    // Find the user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if refresh token exists in user's token list
    if (!user.refreshTokens.includes(refreshToken)) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Attach user and refresh token to request
    (req as AuthenticatedRequest).user = user;
    req.body.refreshToken = refreshToken;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can perform action on booking
 */
export const requireBookingAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const bookingId = req.params.bookingId || req.params.id;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admin and staff can access any booking
    if (user.role === 'admin' || user.role === 'staff') {
      return next();
    }

    // Regular users can only access their own bookings
    const Booking = require('@/models/Booking').Booking;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new AuthorizationError('Booking not found');
    }

    if (booking.userId.toString() !== user._id.toString()) {
      throw new AuthorizationError('Access denied. You can only access your own bookings');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would typically use a more sophisticated rate limiting strategy
  // For now, we rely on the global rate limiter configured in app.ts
  next();
};
