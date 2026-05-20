import { format, parseISO, addHours, addDays, differenceInHours, differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { BUSINESS_CONFIG } from '../constants';

/**
 * Get the current date in the default timezone
 */
export const getCurrentDate = (): Date => {
  return utcToZonedTime(new Date(), BUSINESS_CONFIG.DEFAULT_TIMEZONE);
};

/**
 * Convert a date to the default timezone
 */
export const toDefaultTimezone = (date: Date): Date => {
  return utcToZonedTime(date, BUSINESS_CONFIG.DEFAULT_TIMEZONE);
};

/**
 * Convert a date from the default timezone to UTC
 */
export const fromDefaultTimezone = (date: Date): Date => {
  return zonedTimeToUtc(date, BUSINESS_CONFIG.DEFAULT_TIMEZONE);
};

/**
 * Format a date for display
 */
export const formatDate = (date: Date, formatString: string = 'PPP'): string => {
  const zonedDate = toDefaultTimezone(date);
  return formatTz(zonedDate, formatString, { timeZone: BUSINESS_CONFIG.DEFAULT_TIMEZONE });
};

/**
 * Format a date and time for display
 */
export const formatDateTime = (date: Date, formatString: string = 'PPP p'): string => {
  return formatDate(date, formatString);
};

/**
 * Format time only
 */
export const formatTime = (date: Date, formatString: string = 'p'): string => {
  return formatDate(date, formatString);
};

/**
 * Parse an ISO date string to Date object
 */
export const parseISODate = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Add hours to a date
 */
export const addHoursToDate = (date: Date, hours: number): Date => {
  return addHours(date, hours);
};

/**
 * Add days to a date
 */
export const addDaysToDate = (date: Date, days: number): Date => {
  return addDays(date, days);
};

/**
 * Calculate duration in hours between two dates
 */
export const calculateDurationHours = (startDate: Date, endDate: Date): number => {
  return differenceInHours(endDate, startDate);
};

/**
 * Calculate duration in minutes between two dates
 */
export const calculateDurationMinutes = (startDate: Date, endDate: Date): number => {
  return differenceInMinutes(endDate, startDate);
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return isAfter(date, getCurrentDate());
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  return isBefore(date, getCurrentDate());
};

/**
 * Get start of day for a date
 */
export const getStartOfDay = (date: Date): Date => {
  return startOfDay(toDefaultTimezone(date));
};

/**
 * Get end of day for a date
 */
export const getEndOfDay = (date: Date): Date => {
  return endOfDay(toDefaultTimezone(date));
};

/**
 * Check if current time is within operating hours
 */
export const isWithinOperatingHours = (operatingHours: { open: string; close: string; closed?: boolean }): boolean => {
  if (operatingHours.closed) {
    return false;
  }

  const now = getCurrentDate();
  const currentTime = format(now, 'HH:mm');
  
  return currentTime >= operatingHours.open && currentTime <= operatingHours.close;
};

/**
 * Check if a time is during peak hours
 */
export const isPeakHour = (date: Date): boolean => {
  const hour = toDefaultTimezone(date).getHours();
  return BUSINESS_CONFIG.SURGE_PEAK_HOURS.includes(hour);
};

/**
 * Check if a date is on weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = toDefaultTimezone(date).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date: Date): string => {
  const now = getCurrentDate();
  const diffMinutes = differenceInMinutes(date, now);
  
  if (Math.abs(diffMinutes) < 1) {
    return 'just now';
  }
  
  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0 
      ? `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`
      : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) === 1 ? '' : 's'} ago`;
  }
  
  const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
  if (diffHours < 24) {
    return diffMinutes > 0
      ? `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`
      : `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return diffMinutes > 0
    ? `in ${diffDays} day${diffDays === 1 ? '' : 's'}`
    : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

/**
 * Validate booking time constraints
 */
export const validateBookingTime = (startAt: Date, endAt: Date): { valid: boolean; error?: string } => {
  const now = getCurrentDate();
  const durationHours = calculateDurationHours(startAt, endAt);
  const advanceDays = Math.ceil(differenceInHours(startAt, now) / 24);

  if (isPastDate(startAt)) {
    return { valid: false, error: 'Start time cannot be in the past' };
  }

  if (endAt <= startAt) {
    return { valid: false, error: 'End time must be after start time' };
  }

  if (durationHours < BUSINESS_CONFIG.MIN_BOOKING_DURATION_HOURS) {
    return { valid: false, error: `Minimum booking duration is ${BUSINESS_CONFIG.MIN_BOOKING_DURATION_HOURS} hour(s)` };
  }

  if (durationHours > BUSINESS_CONFIG.MAX_BOOKING_DURATION_HOURS) {
    return { valid: false, error: `Maximum booking duration is ${BUSINESS_CONFIG.MAX_BOOKING_DURATION_HOURS} hours` };
  }

  if (advanceDays > BUSINESS_CONFIG.MAX_ADVANCE_BOOKING_DAYS) {
    return { valid: false, error: `Cannot book more than ${BUSINESS_CONFIG.MAX_ADVANCE_BOOKING_DAYS} days in advance` };
  }

  return { valid: true };
};
