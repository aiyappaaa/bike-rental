import { z } from 'zod';

// Bike type enum
export const BikeType = z.enum(['city', 'mountain', 'road', 'e-bike', 'scooter']);
export type BikeType = z.infer<typeof BikeType>;

// Bike status enum
export const BikeStatus = z.enum(['available', 'rented', 'maintenance', 'inactive']);
export type BikeStatus = z.infer<typeof BikeStatus>;

// Bike size enum
export const BikeSize = z.enum(['XS', 'S', 'M', 'L', 'XL']);
export type BikeSize = z.infer<typeof BikeSize>;

// Bike schema
export const BikeSchema = z.object({
  _id: z.string().optional(),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  make: z.string().min(2, 'Make must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  type: BikeType,
  gears: z.number().int().min(1).max(30),
  size: BikeSize,
  color: z.string().min(2, 'Color must be at least 2 characters'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  dailyRate: z.number().positive('Daily rate must be positive'),
  deposit: z.number().min(0, 'Deposit cannot be negative'),
  status: BikeStatus.default('available'),
  stationId: z.string().min(1, 'Station ID is required'),
  odometer: z.number().min(0, 'Odometer cannot be negative').default(0),
  batteryLevel: z.number().min(0).max(100).optional(), // For e-bikes
  lastServiceAt: z.date().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Bike = z.infer<typeof BikeSchema>;

// Bike creation schema
export const BikeCreateSchema = BikeSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export type BikeCreate = z.infer<typeof BikeCreateSchema>;

// Bike update schema
export const BikeUpdateSchema = BikeCreateSchema.partial();

export type BikeUpdate = z.infer<typeof BikeUpdateSchema>;

// Bike query schema
export const BikeQuerySchema = z.object({
  type: BikeType.optional(),
  stationId: z.string().optional(),
  status: BikeStatus.optional(),
  size: BikeSize.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minGears: z.coerce.number().int().positive().optional(),
  maxGears: z.coerce.number().int().positive().optional(),
  isEBike: z.coerce.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['price', 'rating', 'newest', 'name']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type BikeQuery = z.infer<typeof BikeQuerySchema>;

// Bike availability check schema
export const BikeAvailabilitySchema = z.object({
  stationId: z.string().optional(),
  type: BikeType.optional(),
  startAt: z.date(),
  endAt: z.date(),
});

export type BikeAvailability = z.infer<typeof BikeAvailabilitySchema>;

// Bike with availability info
export const BikeWithAvailabilitySchema = BikeSchema.extend({
  isAvailable: z.boolean(),
  nextAvailableAt: z.date().optional(),
});

export type BikeWithAvailability = z.infer<typeof BikeWithAvailabilitySchema>;
