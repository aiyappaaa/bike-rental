import { z } from 'zod';

// Payment provider enum
export const PaymentProvider = z.enum(['razorpay', 'stripe', 'cash']);
export type PaymentProvider = z.infer<typeof PaymentProvider>;

// Payment status enum
export const PaymentStatus = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// Payment method enum
export const PaymentMethod = z.enum([
  'card',
  'upi',
  'netbanking',
  'wallet',
  'cash',
  'bank_transfer'
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

// Currency enum
export const Currency = z.enum(['INR', 'USD', 'EUR']);
export type Currency = z.infer<typeof Currency>;

// Refund info schema
export const RefundInfoSchema = z.object({
  refundId: z.string(),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().optional(),
  status: z.enum(['pending', 'succeeded', 'failed']),
  processedAt: z.date().optional(),
  failureReason: z.string().optional(),
});

export type RefundInfo = z.infer<typeof RefundInfoSchema>;

// Payment schema
export const PaymentSchema = z.object({
  _id: z.string().optional(),
  provider: PaymentProvider,
  orderId: z.string().min(1, 'Order ID is required'),
  paymentIntentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: Currency.default('INR'),
  status: PaymentStatus.default('pending'),
  method: PaymentMethod.optional(),
  bookingId: z.string().min(1, 'Booking ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  capturedAt: z.date().optional(),
  failureReason: z.string().optional(),
  refunds: z.array(RefundInfoSchema).default([]),
  metadata: z.record(z.string()).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Payment = z.infer<typeof PaymentSchema>;

// Payment creation schema
export const PaymentCreateSchema = z.object({
  provider: PaymentProvider,
  amount: z.number().positive('Amount must be positive'),
  currency: Currency.default('INR'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  metadata: z.record(z.string()).default({}),
});

export type PaymentCreate = z.infer<typeof PaymentCreateSchema>;

// Payment verification schema (Razorpay)
export const RazorpayVerificationSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
});

export type RazorpayVerification = z.infer<typeof RazorpayVerificationSchema>;

// Stripe payment intent confirmation schema
export const StripeConfirmationSchema = z.object({
  payment_intent_id: z.string().min(1, 'Payment intent ID is required'),
  payment_method_id: z.string().optional(),
});

export type StripeConfirmation = z.infer<typeof StripeConfirmationSchema>;

// Refund request schema
export const RefundRequestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive('Refund amount must be positive').optional(),
  reason: z.string().optional(),
});

export type RefundRequest = z.infer<typeof RefundRequestSchema>;

// Payment query schema
export const PaymentQuerySchema = z.object({
  userId: z.string().optional(),
  bookingId: z.string().optional(),
  provider: PaymentProvider.optional(),
  status: PaymentStatus.optional(),
  method: PaymentMethod.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount', 'capturedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;
