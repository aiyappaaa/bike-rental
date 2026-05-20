// Business constants (configurable)
export const BUSINESS_CONFIG = {
  // Tax and fees
  GST_PERCENT: 18,
  LATE_FEE_PER_HOUR: 50, // INR
  DAMAGE_DEPOSIT_PERCENT: 20, // Percentage of bike daily rate
  
  // Pricing
  DEFAULT_HOURLY_RATE: 25, // INR
  DEFAULT_DAILY_RATE: 200, // INR
  DEFAULT_DEPOSIT: 500, // INR
  
  // Surge pricing
  SURGE_PEAK_HOURS: [8, 9, 10, 17, 18, 19] as readonly number[], // Hours when surge pricing applies
  SURGE_WEEKEND_MULTIPLIER: 1.2,
  SURGE_PEAK_MULTIPLIER: 1.5,
  SURGE_HIGH_DEMAND_MULTIPLIER: 2.0,
  
  // Booking limits
  MIN_BOOKING_DURATION_HOURS: 1,
  MAX_BOOKING_DURATION_HOURS: 168, // 7 days
  MAX_ADVANCE_BOOKING_DAYS: 30,
  
  // Cancellation policy
  FULL_REFUND_HOURS_BEFORE: 24,
  PARTIAL_REFUND_HOURS_BEFORE: 2,
  PARTIAL_REFUND_PERCENT: 50,
  
  // Operating hours
  DEFAULT_OPERATING_HOURS: {
    open: '06:00',
    close: '22:00',
  },
  
  // Currency
  DEFAULT_CURRENCY: 'INR' as const,
  CURRENCY_SYMBOL: '₹',
  
  // Timezone
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File uploads
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGES_PER_UPLOAD: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as readonly string[],
  
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_COMMENT_LENGTH: 10,
  MAX_COMMENT_LENGTH: 1000,
  
  // Rate limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX_REQUESTS: 5,
  
  // JWT
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // Email templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    EMAIL_VERIFICATION: 'email-verification',
    PASSWORD_RESET: 'password-reset',
    BOOKING_CONFIRMATION: 'booking-confirmation',
    BOOKING_REMINDER_24H: 'booking-reminder-24h',
    BOOKING_REMINDER_1H: 'booking-reminder-1h',
    BOOKING_COMPLETION: 'booking-completion',
    BOOKING_CANCELLATION: 'booking-cancellation',
    PAYMENT_SUCCESS: 'payment-success',
    PAYMENT_FAILED: 'payment-failed',
    REFUND_PROCESSED: 'refund-processed',
  },
  
  // Notification preferences
  DEFAULT_NOTIFICATIONS: {
    EMAIL: true,
    SMS: false,
    PUSH: true,
    IN_APP: true,
  },
  
  // Maintenance
  MAINTENANCE_REMINDER_DAYS: 30,
  MAINTENANCE_OVERDUE_DAYS: 45,
  
  // Reviews
  MIN_RATING: 1,
  MAX_RATING: 5,
  
  // Search
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_RESULTS: 50,
  
  // Map
  DEFAULT_MAP_CENTER: {
    lat: 28.6139, // New Delhi
    lng: 77.2090,
  },
  DEFAULT_MAP_ZOOM: 12,
  STATION_CLUSTER_RADIUS: 50,
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    STATIONS: 300, // 5 minutes
    BIKES: 60, // 1 minute
    AVAILABILITY: 30, // 30 seconds
    PRICING: 600, // 10 minutes
    REVIEWS: 1800, // 30 minutes
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic
  BIKE_NOT_AVAILABLE: 'BIKE_NOT_AVAILABLE',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  COUPON_INVALID: 'COUPON_INVALID',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // External services
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR: 'SMS_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR: 'STORAGE_SERVICE_ERROR',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  PAYMENT_SUCCESSFUL: 'Payment processed successfully',
  REVIEW_SUBMITTED: 'Review submitted successfully',
  CONTACT_MESSAGE_SENT: 'Contact message sent successfully',
} as const;
