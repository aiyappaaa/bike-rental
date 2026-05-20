import { z } from 'zod';

// Contact message type enum
export const ContactMessageType = z.enum(['general', 'support', 'corporate', 'feedback']);
export type ContactMessageType = z.infer<typeof ContactMessageType>;

// Notification type enum
export const NotificationType = z.enum(['email', 'sms', 'inapp', 'push']);
export type NotificationType = z.infer<typeof NotificationType>;

// Notification status enum
export const NotificationStatus = z.enum(['pending', 'sent', 'delivered', 'failed']);
export type NotificationStatus = z.infer<typeof NotificationStatus>;

// Contact message schema
export const ContactMessageSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)').optional(),
  type: ContactMessageType,
  subject: z.string().min(5, 'Subject must be at least 5 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  handled: z.boolean().default(false),
  handledBy: z.string().optional(),
  handledAt: z.date().optional(),
  response: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ContactMessage = z.infer<typeof ContactMessageSchema>;

// Contact message creation schema
export const ContactMessageCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format)').optional(),
  type: ContactMessageType,
  subject: z.string().min(5, 'Subject must be at least 5 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactMessageCreate = z.infer<typeof ContactMessageCreateSchema>;

// Notification schema
export const NotificationSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: NotificationType,
  templateId: z.string().min(1, 'Template ID is required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  payload: z.record(z.any()).default({}),
  status: NotificationStatus.default('pending'),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  failureReason: z.string().optional(),
  retryCount: z.number().int().min(0).default(0),
  maxRetries: z.number().int().min(0).default(3),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Inventory log action enum
export const InventoryLogAction = z.enum(['check-in', 'check-out', 'transfer', 'maintenance']);
export type InventoryLogAction = z.infer<typeof InventoryLogAction>;

// Inventory log schema
export const InventoryLogSchema = z.object({
  _id: z.string().optional(),
  bikeId: z.string().min(1, 'Bike ID is required'),
  fromStationId: z.string().optional(),
  toStationId: z.string().optional(),
  action: InventoryLogAction,
  staffId: z.string().min(1, 'Staff ID is required'),
  bookingId: z.string().optional(),
  maintenanceId: z.string().optional(),
  note: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

export type InventoryLog = z.infer<typeof InventoryLogSchema>;

// API response wrapper schema
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    errors: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })).optional(),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().min(0),
      pages: z.number().int().min(0),
    }).optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Sort schema
export const SortSchema = z.object({
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type Sort = z.infer<typeof SortSchema>;
