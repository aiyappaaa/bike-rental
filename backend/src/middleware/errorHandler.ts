import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS, ERROR_CODES } from '@rideflow/shared';
import { logger } from '@/utils/logger';
import { isDevelopment } from '@/config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
    this.name = 'RateLimitError';
  }
}

const handleZodError = (error: ZodError) => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    code: ERROR_CODES.VALIDATION_ERROR,
    message: 'Validation failed',
    errors,
  };
};

const handleMongooseError = (error: any) => {
  if (error.name === 'ValidationError') {
    const errors = error.errors ? Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    })) : [];

    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      errors,
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.INVALID_INPUT,
      message: `Invalid ${error.path}: ${error.value}`,
    };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      message: `${field} already exists`,
    };
  }

  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Database error occurred',
  };
};

const handleJWTError = (error: any) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.TOKEN_INVALID,
      message: 'Invalid token',
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.TOKEN_EXPIRED,
      message: 'Token expired',
    };
  }

  return {
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    code: ERROR_CODES.INVALID_CREDENTIALS,
    message: 'Authentication failed',
  };
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let code = error.code || ERROR_CODES.INTERNAL_ERROR;
  let message = error.message || 'Internal server error';
  let errors: Array<{ field: string; message: string }> | undefined;

  // Handle specific error types
  if (error instanceof ZodError) {
    const handled = handleZodError(error);
    statusCode = handled.statusCode;
    code = handled.code;
    message = handled.message;
    errors = handled.errors;
  } else if (error.name?.includes('Mongoose') || error.name === 'ValidationError' || error.name === 'CastError') {
    const handled = handleMongooseError(error);
    statusCode = handled.statusCode;
    code = handled.code;
    message = handled.message;
    errors = handled.errors;
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('TokenExpired')) {
    const handled = handleJWTError(error);
    statusCode = handled.statusCode;
    code = handled.code;
    message = handled.message;
  }

  // Log error
  logger.error(`${req.method} ${req.path} - ${message}`, {
    statusCode,
    code,
    stack: isDevelopment() ? error.stack : undefined,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?.id,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(errors && { errors }),
    ...(isDevelopment() && { stack: error.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
