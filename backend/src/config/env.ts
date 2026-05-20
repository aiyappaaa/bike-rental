export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue as string;
};

/**
 * Check if a feature flag environment variable is enabled (=== 'true')
 */
export const isFeatureEnabled = (key: string): boolean => {
  return process.env[key] === 'true';
};

/**
 * Return allowed CORS origins from env, with sensible defaults for dev.
 */
export const getCorsOrigins = (): string | string[] => {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    return isDevelopment()
      ? ['http://localhost:3000', 'http://localhost:5173']
      : [];
  }
  return origins.split(',').map((o) => o.trim());
};

/**
 * Typed, parsed environment configuration object.
 * All values are read once at startup so that missing vars fail fast.
 */
export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:5000',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
} as const;