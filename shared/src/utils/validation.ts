import { BUSINESS_CONFIG } from '../constants';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (E.164 format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < BUSINESS_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${BUSINESS_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > BUSINESS_CONFIG.MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${BUSINESS_CONFIG.MAX_PASSWORD_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate name
 */
export const isValidName = (name: string): boolean => {
  return name.length >= BUSINESS_CONFIG.MIN_NAME_LENGTH && 
         name.length <= BUSINESS_CONFIG.MAX_NAME_LENGTH &&
         /^[a-zA-Z\s]+$/.test(name);
};

/**
 * Validate SKU format
 */
export const isValidSKU = (sku: string): boolean => {
  // SKU should be alphanumeric with optional hyphens/underscores
  const skuRegex = /^[A-Z0-9_-]{3,20}$/i;
  return skuRegex.test(sku);
};

/**
 * Validate station code format
 */
export const isValidStationCode = (code: string): boolean => {
  // Station code should be alphanumeric, 2-10 characters
  const codeRegex = /^[A-Z0-9]{2,10}$/i;
  return codeRegex.test(code);
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    // Simple URL validation using regex
    const urlPattern = /^https?:\/\/.+/;
    return urlPattern.test(url);
  } catch {
    return false;
  }
};

/**
 * Validate image file type
 */
export const isValidImageType = (mimeType: string): boolean => {
  return BUSINESS_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType);
};

/**
 * Validate file size
 */
export const isValidFileSize = (sizeInBytes: number, maxSizeMB: number = BUSINESS_CONFIG.MAX_IMAGE_SIZE_MB): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
};

/**
 * Validate booking number format
 */
export const isValidBookingNumber = (bookingNo: string): boolean => {
  // Booking number format: RFB-YYYYMMDD-XXXX
  const bookingRegex = /^RFB-\d{8}-\d{4}$/;
  return bookingRegex.test(bookingNo);
};

/**
 * Generate booking number
 */
export const generateBookingNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `RFB-${dateStr}-${random}`;
};

/**
 * Validate coupon code format
 */
export const isValidCouponCode = (code: string): boolean => {
  // Coupon code should be alphanumeric, 3-20 characters
  const codeRegex = /^[A-Z0-9]{3,20}$/i;
  return codeRegex.test(code);
};

/**
 * Validate rating value
 */
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && 
         rating >= BUSINESS_CONFIG.MIN_RATING && 
         rating <= BUSINESS_CONFIG.MAX_RATING;
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate hex color code
 */
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate search query
 */
export const isValidSearchQuery = (query: string): boolean => {
  const sanitized = sanitizeString(query);
  return sanitized.length >= BUSINESS_CONFIG.SEARCH_MIN_LENGTH;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: number, limit: number): { valid: boolean; error?: string } => {
  if (!Number.isInteger(page) || page < 1) {
    return { valid: false, error: 'Page must be a positive integer' };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > BUSINESS_CONFIG.MAX_PAGE_SIZE) {
    return { valid: false, error: `Limit must be between 1 and ${BUSINESS_CONFIG.MAX_PAGE_SIZE}` };
  }

  return { valid: true };
};

/**
 * Validate sort parameters
 */
export const validateSort = (sortBy: string, sortOrder: string, allowedFields: string[]): { valid: boolean; error?: string } => {
  if (!allowedFields.includes(sortBy)) {
    return { valid: false, error: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}` };
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return { valid: false, error: 'Sort order must be either "asc" or "desc"' };
  }

  return { valid: true };
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate: Date, endDate: Date): { valid: boolean; error?: string } => {
  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }

  return { valid: true };
};
