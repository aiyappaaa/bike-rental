import { z } from 'zod';
import { BikeType } from './bike';

// Coupon type enum
export const CouponType = z.enum(['percent', 'flat']);
export type CouponType = z.infer<typeof CouponType>;

// Base coupon schema without refinements
const BaseCouponSchema = z.object({
  _id: z.string().optional(),
  code: z.string().min(3, 'Coupon code must be at least 3 characters').max(20, 'Coupon code must be at most 20 characters'),
  type: CouponType,
  value: z.number().positive('Coupon value must be positive'),
  minAmount: z.number().min(0, 'Minimum amount cannot be negative').default(0),
  maxDiscount: z.number().positive('Maximum discount must be positive').optional(),
  startsAt: z.date(),
  endsAt: z.date(),
  usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
  usedCount: z.number().int().min(0, 'Used count cannot be negative').default(0),
  allowedUserIds: z.array(z.string()).default([]), // Empty array means all users
  allowedBikeTypes: z.array(BikeType).default([]), // Empty array means all bike types
  active: z.boolean().default(true),
  description: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Coupon schema with refinements
export const CouponSchema = BaseCouponSchema.refine(
  (data) => data.endsAt > data.startsAt,
  {
    message: 'End date must be after start date',
    path: ['endsAt'],
  }
).refine(
  (data) => data.type !== 'percent' || data.value <= 100,
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  }
);

export type Coupon = z.infer<typeof CouponSchema>;

// Coupon creation schema
export const CouponCreateSchema = BaseCouponSchema.omit({
  _id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => data.endsAt > data.startsAt,
  {
    message: 'End date must be after start date',
    path: ['endsAt'],
  }
).refine(
  (data) => data.type !== 'percent' || data.value <= 100,
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  }
);

export type CouponCreate = z.infer<typeof CouponCreateSchema>;

// Coupon update schema
export const CouponUpdateSchema = BaseCouponSchema.omit({
  _id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type CouponUpdate = z.infer<typeof CouponUpdateSchema>;

// Coupon validation schema
export const CouponValidationSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  userId: z.string().min(1, 'User ID is required'),
  bikeType: BikeType,
  amount: z.number().positive('Amount must be positive'),
});

export type CouponValidation = z.infer<typeof CouponValidationSchema>;

// Coupon validation response schema
export const CouponValidationResponseSchema = z.object({
  valid: z.boolean(),
  coupon: CouponSchema.optional(),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  error: z.string().optional(),
});

export type CouponValidationResponse = z.infer<typeof CouponValidationResponseSchema>;

// Coupon query schema
export const CouponQuerySchema = z.object({
  active: z.boolean().optional(),
  type: CouponType.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'code', 'value', 'endsAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CouponQuery = z.infer<typeof CouponQuerySchema>;
