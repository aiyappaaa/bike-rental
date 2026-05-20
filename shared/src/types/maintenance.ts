import { z } from 'zod';

// Maintenance severity enum
export const MaintenanceSeverity = z.enum(['low', 'medium', 'high', 'critical']);
export type MaintenanceSeverity = z.infer<typeof MaintenanceSeverity>;

// Maintenance status enum
export const MaintenanceStatus = z.enum(['open', 'in_progress', 'completed', 'cancelled']);
export type MaintenanceStatus = z.infer<typeof MaintenanceStatus>;

// Maintenance type enum
export const MaintenanceType = z.enum([
  'routine',
  'repair',
  'inspection',
  'cleaning',
  'battery_replacement',
  'tire_replacement',
  'brake_adjustment',
  'gear_adjustment',
  'chain_replacement',
  'other'
]);
export type MaintenanceType = z.infer<typeof MaintenanceType>;

// Maintenance schema
export const MaintenanceSchema = z.object({
  _id: z.string().optional(),
  bikeId: z.string().min(1, 'Bike ID is required'),
  type: MaintenanceType,
  issue: z.string().min(5, 'Issue description must be at least 5 characters'),
  severity: MaintenanceSeverity,
  status: MaintenanceStatus.default('open'),
  assignedTo: z.string().optional(), // Staff member ID
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  actualCost: z.number().min(0, 'Actual cost cannot be negative').optional(),
  estimatedDuration: z.number().positive('Estimated duration must be positive').optional(), // in hours
  actualDuration: z.number().positive('Actual duration must be positive').optional(), // in hours
  notes: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  partsUsed: z.array(z.object({
    name: z.string().min(1, 'Part name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    cost: z.number().min(0, 'Cost cannot be negative'),
  })).default([]),
  openedAt: z.date().default(() => new Date()),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Maintenance = z.infer<typeof MaintenanceSchema>;

// Maintenance creation schema
export const MaintenanceCreateSchema = z.object({
  bikeId: z.string().min(1, 'Bike ID is required'),
  type: MaintenanceType,
  issue: z.string().min(5, 'Issue description must be at least 5 characters'),
  severity: MaintenanceSeverity,
  assignedTo: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  estimatedDuration: z.number().positive('Estimated duration must be positive').optional(),
  notes: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
});

export type MaintenanceCreate = z.infer<typeof MaintenanceCreateSchema>;

// Maintenance update schema
export const MaintenanceUpdateSchema = z.object({
  type: MaintenanceType.optional(),
  issue: z.string().min(5, 'Issue description must be at least 5 characters').optional(),
  severity: MaintenanceSeverity.optional(),
  status: MaintenanceStatus.optional(),
  assignedTo: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  actualCost: z.number().min(0, 'Actual cost cannot be negative').optional(),
  estimatedDuration: z.number().positive('Estimated duration must be positive').optional(),
  actualDuration: z.number().positive('Actual duration must be positive').optional(),
  notes: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  partsUsed: z.array(z.object({
    name: z.string().min(1, 'Part name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    cost: z.number().min(0, 'Cost cannot be negative'),
  })).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().optional(),
});

export type MaintenanceUpdate = z.infer<typeof MaintenanceUpdateSchema>;

// Maintenance query schema
export const MaintenanceQuerySchema = z.object({
  bikeId: z.string().optional(),
  type: MaintenanceType.optional(),
  severity: MaintenanceSeverity.optional(),
  status: MaintenanceStatus.optional(),
  assignedTo: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'openedAt', 'severity', 'estimatedCost']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type MaintenanceQuery = z.infer<typeof MaintenanceQuerySchema>;
