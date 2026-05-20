import { z } from 'zod';

// Booking status enum
export const BookingStatus = z.enum([
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'refunded'
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

// Pricing breakdown schema
export const PricingBreakdownSchema = z.object({
  baseAmount: z.number().min(0, 'Base amount cannot be negative'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  dailyRate: z.number().positive('Daily rate must be positive'),
  durationHours: z.number().positive('Duration must be positive'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  gstPercent: z.number().min(0).max(100, 'GST percent must be between 0 and 100'),
  gstAmount: z.number().min(0, 'GST amount cannot be negative'),
  deposit: z.number().min(0, 'Deposit cannot be negative'),
  lateFee: z.number().min(0, 'Late fee cannot be negative').default(0),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  surgeMultiplier: z.number().min(1, 'Surge multiplier must be at least 1').default(1),
  surgeAmount: z.number().min(0, 'Surge amount cannot be negative').default(0),
  total: z.number().min(0, 'Total cannot be negative'),
});

export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;

// Booking schema
export const BookingSchema = z.object({
  _id: z.string().optional(),
  bookingNo: z.string().min(1, 'Booking number is required'),
  userId: z.string().min(1, 'User ID is required'),
  bikeId: z.string().min(1, 'Bike ID is required'),
  stationPickupId: z.string().min(1, 'Pickup station ID is required'),
  stationDropoffId: z.string().min(1, 'Dropoff station ID is required'),
  startAt: z.date(),
  endAt: z.date(),
  actualStartAt: z.date().optional(),
  actualEndAt: z.date().optional(),
  durationHours: z.number().positive('Duration must be positive'),
  pricingBreakdown: PricingBreakdownSchema,
  status: BookingStatus.default('pending'),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  cancelledAt: z.date().optional(),
  refundAmount: z.number().min(0, 'Refund amount cannot be negative').optional(),
  refundedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Booking = z.infer<typeof BookingSchema>;

// Booking creation schema
export const BookingCreateSchema = z.object({
  bikeId: z.string().min(1, 'Bike ID is required'),
  stationPickupId: z.string().min(1, 'Pickup station ID is required'),
  stationDropoffId: z.string().min(1, 'Dropoff station ID is required'),
  startAt: z.date(),
  endAt: z.date(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.endAt > data.startAt,
  {
    message: 'End time must be after start time',
    path: ['endAt'],
  }
);

export type BookingCreate = z.infer<typeof BookingCreateSchema>;

// Booking quote schema (accepts date strings from frontend)
export const BookingQuoteSchema = z.object({
  bikeId: z.string().min(1, 'Bike ID is required'),
  stationPickupId: z.string().min(1, 'Pickup station ID is required'),
  stationDropoffId: z.string().min(1, 'Dropoff station ID is required'),
  startAt: z.string().transform((str) => new Date(str)),
  endAt: z.string().transform((str) => new Date(str)),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.endAt > data.startAt,
  {
    message: 'End time must be after start time',
    path: ['endAt'],
  }
);
export type BookingQuote = z.infer<typeof BookingQuoteSchema>;

// Booking quote response schema
export const BookingQuoteResponseSchema = z.object({
  bikeId: z.string(),
  pricingBreakdown: PricingBreakdownSchema,
  validUntil: z.date(),
});

export type BookingQuoteResponse = z.infer<typeof BookingQuoteResponseSchema>;

// Booking update schema
export const BookingUpdateSchema = z.object({
  status: BookingStatus.optional(),
  actualStartAt: z.date().optional(),
  actualEndAt: z.date().optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;

// Booking query schema
export const BookingQuerySchema = z.object({
  userId: z.string().optional(),
  bikeId: z.string().optional(),
  stationPickupId: z.string().optional(),
  stationDropoffId: z.string().optional(),
  status: BookingStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'startAt', 'endAt', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BookingQuery = z.infer<typeof BookingQuerySchema>;
