import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  MONGODB_TEST_URI: z.string().optional(),

  // JWT Secrets
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT access secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),

  // Payment Gateways
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Image Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Maps
  MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Admin Configuration
  ADMIN_EMAILS: z.string().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Feature Toggles
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_OTP_VERIFICATION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_OAUTH: z.string().transform(val => val === 'true').default('false'),
  ENABLE_HERO_RIPPLE: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),

  // Analytics
  GA4_MEASUREMENT_ID: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('5'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate and parse environment variables
let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export { env };

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

export const getCorsOrigins = (): string[] => {
  return env.CORS_ORIGINS.split(',').map(origin => origin.trim());
};

export const getAdminEmails = (): string[] => {
  return env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];
};

export const isFeatureEnabled = (feature: keyof Pick<EnvConfig, 
  'ENABLE_EMAIL_VERIFICATION' | 
  'ENABLE_OTP_VERIFICATION' | 
  'ENABLE_OAUTH' | 
  'ENABLE_HERO_RIPPLE' | 
  'ENABLE_ANALYTICS'
>): boolean => {
  return env[feature];
};

// Payment gateway configuration
export const getPaymentConfig = () => ({
  razorpay: {
    enabled: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
  },
  stripe: {
    enabled: !!(env.STRIPE_PUBLISHABLE_KEY && env.STRIPE_SECRET_KEY),
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
});

// Storage configuration
export const getStorageConfig = () => ({
  cloudinary: {
    enabled: !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
  s3: {
    enabled: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
  },
});

// Email configuration
export const getEmailConfig = () => ({
  enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  from: {
    email: env.FROM_EMAIL || env.SMTP_USER,
    name: env.FROM_NAME || 'RideFlow Bikes',
  },
});
