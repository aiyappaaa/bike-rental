import { z } from 'zod';

// Geographic coordinates schema
export const GeoPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90),   // latitude
  ]),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;

// Operating hours schema
export const OperatingHoursSchema = z.object({
  monday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  tuesday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  wednesday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  thursday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  friday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  saturday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
  sunday: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    closed: z.boolean().default(false),
  }),
});

export type OperatingHours = z.infer<typeof OperatingHoursSchema>;

// Station schema
export const StationSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, 'Station name must be at least 2 characters'),
  code: z.string().min(2, 'Station code must be at least 2 characters').max(10, 'Station code must be at most 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  geo: GeoPointSchema,
  openingHours: OperatingHoursSchema,
  images: z.array(z.string().url('Invalid image URL')).default([]),
  active: z.boolean().default(true),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Station = z.infer<typeof StationSchema>;

// Station creation schema
export const StationCreateSchema = StationSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export type StationCreate = z.infer<typeof StationCreateSchema>;

// Station update schema
export const StationUpdateSchema = StationCreateSchema.partial();

export type StationUpdate = z.infer<typeof StationUpdateSchema>;

// Station query schema
export const StationQuerySchema = z.object({
  active: z.boolean().optional(),
  bbox: z.array(z.number()).length(4).optional(), // [minLng, minLat, maxLng, maxLat]
  near: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    maxDistance: z.number().positive().optional(),
  }).optional(),
  search: z.string().optional(),
});

export type StationQuery = z.infer<typeof StationQuerySchema>;
