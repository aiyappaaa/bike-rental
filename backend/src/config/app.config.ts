import { BUSINESS_CONFIG } from '@rideflow/shared';

export interface AppConfig {
  // Business Information
  businessName: string;
  businessLogo: string;
  businessDescription: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  enableHeroRipple: boolean;
  
  // Operating Configuration
  operatingHours: {
    default: { open: string; close: string };
    weekend?: { open: string; close: string };
  };
  
  // Pricing Configuration
  pricing: {
    defaultHourlyRate: number;
    defaultDailyRate: number;
    defaultDeposit: number;
    gstPercent: number;
    lateFeePerHour: number;
    damageDepositPercent: number;
  };
  
  // Surge Pricing
  surgeConfig: {
    enabled: boolean;
    peakHours: number[];
    weekendMultiplier: number;
    peakMultiplier: number;
    highDemandMultiplier: number;
  };
  
  // Booking Policies
  bookingPolicy: {
    minDurationHours: number;
    maxDurationHours: number;
    maxAdvanceBookingDays: number;
    fullRefundHoursBefore: number;
    partialRefundHoursBefore: number;
    partialRefundPercent: number;
  };
  
  // Feature Toggles
  features: {
    emailVerification: boolean;
    otpVerification: boolean;
    oauth: boolean;
    analytics: boolean;
    maintenance: boolean;
    reviews: boolean;
    coupons: boolean;
  };
  
  // Map Configuration
  map: {
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
    clusterRadius: number;
  };
  
  // Social Links
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  
  // Brand Colors
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const appConfig: AppConfig = {
  // Business Information
  businessName: process.env.BUSINESS_NAME || 'RideFlow Bikes',
  businessLogo: process.env.BUSINESS_LOGO || '/logo.png',
  businessDescription: process.env.BUSINESS_DESCRIPTION || 'Premium bike rental service for urban mobility',
  contactEmail: process.env.CONTACT_EMAIL || 'contact@rideflowbikes.com',
  contactPhone: process.env.CONTACT_PHONE || '+91-9876543210',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@rideflowbikes.com',
  
  // Hero Section
  heroTitle: process.env.HERO_TITLE || 'Ride the City, Your Way',
  heroSubtitle: process.env.HERO_SUBTITLE || 'Discover the freedom of cycling with our premium bike rental service. Eco-friendly, convenient, and affordable.',
  heroImages: process.env.HERO_IMAGES?.split(',') || [
    '/hero/hero-1.jpg',
    '/hero/hero-2.jpg',
    '/hero/hero-3.jpg'
  ],
  enableHeroRipple: process.env.ENABLE_HERO_RIPPLE === 'true',
  
  // Operating Configuration
  operatingHours: {
    default: {
      open: process.env.DEFAULT_OPEN_TIME || BUSINESS_CONFIG.DEFAULT_OPERATING_HOURS.open,
      close: process.env.DEFAULT_CLOSE_TIME || BUSINESS_CONFIG.DEFAULT_OPERATING_HOURS.close,
    },
    weekend: process.env.WEEKEND_HOURS ? {
      open: process.env.WEEKEND_OPEN_TIME || '07:00',
      close: process.env.WEEKEND_CLOSE_TIME || '21:00',
    } : undefined,
  },
  
  // Pricing Configuration
  pricing: {
    defaultHourlyRate: Number(process.env.DEFAULT_HOURLY_RATE) || BUSINESS_CONFIG.DEFAULT_HOURLY_RATE,
    defaultDailyRate: Number(process.env.DEFAULT_DAILY_RATE) || BUSINESS_CONFIG.DEFAULT_DAILY_RATE,
    defaultDeposit: Number(process.env.DEFAULT_DEPOSIT) || BUSINESS_CONFIG.DEFAULT_DEPOSIT,
    gstPercent: Number(process.env.GST_PERCENT) || BUSINESS_CONFIG.GST_PERCENT,
    lateFeePerHour: Number(process.env.LATE_FEE_PER_HOUR) || BUSINESS_CONFIG.LATE_FEE_PER_HOUR,
    damageDepositPercent: Number(process.env.DAMAGE_DEPOSIT_PERCENT) || BUSINESS_CONFIG.DAMAGE_DEPOSIT_PERCENT,
  },
  
  // Surge Pricing
  surgeConfig: {
    enabled: process.env.SURGE_PRICING_ENABLED === 'true',
    peakHours: process.env.SURGE_PEAK_HOURS?.split(',').map(Number) || BUSINESS_CONFIG.SURGE_PEAK_HOURS,
    weekendMultiplier: Number(process.env.SURGE_WEEKEND_MULTIPLIER) || BUSINESS_CONFIG.SURGE_WEEKEND_MULTIPLIER,
    peakMultiplier: Number(process.env.SURGE_PEAK_MULTIPLIER) || BUSINESS_CONFIG.SURGE_PEAK_MULTIPLIER,
    highDemandMultiplier: Number(process.env.SURGE_HIGH_DEMAND_MULTIPLIER) || BUSINESS_CONFIG.SURGE_HIGH_DEMAND_MULTIPLIER,
  },
  
  // Booking Policies
  bookingPolicy: {
    minDurationHours: Number(process.env.MIN_BOOKING_DURATION_HOURS) || BUSINESS_CONFIG.MIN_BOOKING_DURATION_HOURS,
    maxDurationHours: Number(process.env.MAX_BOOKING_DURATION_HOURS) || BUSINESS_CONFIG.MAX_BOOKING_DURATION_HOURS,
    maxAdvanceBookingDays: Number(process.env.MAX_ADVANCE_BOOKING_DAYS) || BUSINESS_CONFIG.MAX_ADVANCE_BOOKING_DAYS,
    fullRefundHoursBefore: Number(process.env.FULL_REFUND_HOURS_BEFORE) || BUSINESS_CONFIG.FULL_REFUND_HOURS_BEFORE,
    partialRefundHoursBefore: Number(process.env.PARTIAL_REFUND_HOURS_BEFORE) || BUSINESS_CONFIG.PARTIAL_REFUND_HOURS_BEFORE,
    partialRefundPercent: Number(process.env.PARTIAL_REFUND_PERCENT) || BUSINESS_CONFIG.PARTIAL_REFUND_PERCENT,
  },
  
  // Feature Toggles
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    otpVerification: process.env.ENABLE_OTP_VERIFICATION === 'true',
    oauth: process.env.ENABLE_OAUTH === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    maintenance: process.env.ENABLE_MAINTENANCE !== 'false',
    reviews: process.env.ENABLE_REVIEWS !== 'false',
    coupons: process.env.ENABLE_COUPONS !== 'false',
  },
  
  // Map Configuration
  map: {
    defaultCenter: {
      lat: Number(process.env.MAP_DEFAULT_LAT) || BUSINESS_CONFIG.DEFAULT_MAP_CENTER.lat,
      lng: Number(process.env.MAP_DEFAULT_LNG) || BUSINESS_CONFIG.DEFAULT_MAP_CENTER.lng,
    },
    defaultZoom: Number(process.env.MAP_DEFAULT_ZOOM) || BUSINESS_CONFIG.DEFAULT_MAP_ZOOM,
    clusterRadius: Number(process.env.MAP_CLUSTER_RADIUS) || BUSINESS_CONFIG.STATION_CLUSTER_RADIUS,
  },
  
  // Social Links
  socialLinks: {
    facebook: process.env.SOCIAL_FACEBOOK,
    twitter: process.env.SOCIAL_TWITTER,
    instagram: process.env.SOCIAL_INSTAGRAM,
    linkedin: process.env.SOCIAL_LINKEDIN,
  },
  
  // Brand Colors
  brandColors: {
    primary: process.env.BRAND_COLOR_PRIMARY || '#3B82F6',
    secondary: process.env.BRAND_COLOR_SECONDARY || '#10B981',
    accent: process.env.BRAND_COLOR_ACCENT || '#F59E0B',
    background: process.env.BRAND_COLOR_BACKGROUND || '#FFFFFF',
    text: process.env.BRAND_COLOR_TEXT || '#1F2937',
  },
};
