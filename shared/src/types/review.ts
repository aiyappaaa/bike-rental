import { z } from 'zod';

// Review schema
export const ReviewSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  bikeId: z.string().min(1, 'Bike ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').optional(),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').default([]),
  visible: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Review = z.infer<typeof ReviewSchema>;

// Review creation schema
export const ReviewCreateSchema = z.object({
  bikeId: z.string().min(1, 'Bike ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').optional(),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').default([]),
});

export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;

// Review update schema
export const ReviewUpdateSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').optional(),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional(),
  visible: z.boolean().optional(),
});

export type ReviewUpdate = z.infer<typeof ReviewUpdateSchema>;

// Review query schema
export const ReviewQuerySchema = z.object({
  bikeId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  visible: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ReviewQuery = z.infer<typeof ReviewQuerySchema>;

// Review statistics schema
export const ReviewStatsSchema = z.object({
  totalReviews: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  ratingDistribution: z.object({
    1: z.number().int().min(0),
    2: z.number().int().min(0),
    3: z.number().int().min(0),
    4: z.number().int().min(0),
    5: z.number().int().min(0),
  }),
});

export type ReviewStats = z.infer<typeof ReviewStatsSchema>;
