import mongoose, { Schema, Document, Model } from 'mongoose';
import { 
  Payment as IPayment, 
  PaymentProvider, 
  PaymentStatus, 
  PaymentMethod, 
  Currency,
  RefundInfo 
} from '@rideflow/shared';

export interface IPaymentDocument extends Omit<IPayment, '_id'>, Document {
  isSuccessful(): boolean;
  canBeRefunded(): boolean;
  getTotalRefunded(): number;
  addRefund(refundInfo: RefundInfo): Promise<void>;
  markAsSuccessful(method: PaymentMethod): Promise<void>;
  markAsFailed(reason: string): Promise<void>;
}

export interface IPaymentModel extends Model<IPaymentDocument> {
  findByOrderId(orderId: string): Promise<IPaymentDocument | null>;
  findByPaymentIntentId(paymentIntentId: string): Promise<IPaymentDocument | null>;
  findByBooking(bookingId: string): Promise<IPaymentDocument[]>;
  findSuccessfulPayments(): Promise<IPaymentDocument[]>;
  findFailedPayments(): Promise<IPaymentDocument[]>;
}

const refundInfoSchema = new Schema<RefundInfo>({
  refundId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'succeeded', 'failed'], 
    required: true 
  },
  processedAt: { type: Date },
  failureReason: { type: String },
}, { _id: false });

const paymentSchema = new Schema<IPaymentDocument>({
  provider: {
    type: String,
    enum: Object.values(PaymentProvider.enum),
    required: [true, 'Payment provider is required'],
  },
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
  },
  paymentIntentId: {
    type: String,
    sparse: true, // Allows multiple null values
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    enum: Object.values(Currency.enum),
    default: 'INR',
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus.enum),
    default: 'pending',
  },
  method: {
    type: String,
    enum: Object.values(PaymentMethod.enum),
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  capturedAt: {
    type: Date,
  },
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters'],
  },
  refunds: [refundInfoSchema],
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ paymentIntentId: 1 }, { sparse: true });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ capturedAt: -1 });

// Validation
paymentSchema.pre('validate', function(this: IPaymentDocument) {
  // Stripe payments should have paymentIntentId
  if (this.provider === 'stripe' && this.status !== 'pending' && !this.paymentIntentId) {
    this.invalidate('paymentIntentId', 'Stripe payments must have a payment intent ID');
  }

  // Successful payments should have capture time and method
  if (this.status === 'succeeded' && !this.capturedAt) {
    this.capturedAt = new Date();
  }

  if (this.status === 'succeeded' && !this.method) {
    this.invalidate('method', 'Successful payments must have a payment method');
  }

  // Failed payments should have failure reason
  if (this.status === 'failed' && !this.failureReason) {
    this.invalidate('failureReason', 'Failed payments must have a failure reason');
  }
});

// Instance methods
paymentSchema.methods.isSuccessful = function(this: IPaymentDocument): boolean {
  return this.status === 'succeeded';
};

paymentSchema.methods.canBeRefunded = function(this: IPaymentDocument): boolean {
  if (!this.isSuccessful()) {
    return false;
  }

  const totalRefunded = this.getTotalRefunded();
  return totalRefunded < this.amount;
};

paymentSchema.methods.getTotalRefunded = function(this: IPaymentDocument): number {
  return this.refunds
    .filter(refund => refund.status === 'succeeded')
    .reduce((total, refund) => total + refund.amount, 0);
};

paymentSchema.methods.addRefund = async function(this: IPaymentDocument, refundInfo: RefundInfo): Promise<void> {
  const totalRefunded = this.getTotalRefunded();
  
  if (totalRefunded + refundInfo.amount > this.amount) {
    throw new Error('Refund amount exceeds available balance');
  }

  this.refunds.push(refundInfo);
  await this.save();
};

paymentSchema.methods.markAsSuccessful = async function(
  this: IPaymentDocument, 
  method: PaymentMethod
): Promise<void> {
  this.status = 'succeeded';
  this.method = method;
  this.capturedAt = new Date();
  this.failureReason = undefined;
  await this.save();

  // Update associated booking status
  const Booking = mongoose.model('Booking');
  await Booking.findByIdAndUpdate(this.bookingId, { status: 'confirmed' });
};

paymentSchema.methods.markAsFailed = async function(this: IPaymentDocument, reason: string): Promise<void> {
  this.status = 'failed';
  this.failureReason = reason;
  this.capturedAt = undefined;
  await this.save();

  // Update associated booking status
  const Booking = mongoose.model('Booking');
  await Booking.findByIdAndUpdate(this.bookingId, { status: 'cancelled' });
};

// Static methods
paymentSchema.statics.findByOrderId = function(this: IPaymentModel, orderId: string): Promise<IPaymentDocument | null> {
  return this.findOne({ orderId })
    .populate('bookingId', 'bookingNo startAt endAt')
    .populate('userId', 'name email');
};

paymentSchema.statics.findByPaymentIntentId = function(
  this: IPaymentModel, 
  paymentIntentId: string
): Promise<IPaymentDocument | null> {
  return this.findOne({ paymentIntentId })
    .populate('bookingId', 'bookingNo startAt endAt')
    .populate('userId', 'name email');
};

paymentSchema.statics.findByBooking = function(this: IPaymentModel, bookingId: string): Promise<IPaymentDocument[]> {
  return this.find({ bookingId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.findSuccessfulPayments = function(this: IPaymentModel): Promise<IPaymentDocument[]> {
  return this.find({ status: 'succeeded' })
    .populate('bookingId', 'bookingNo')
    .populate('userId', 'name email')
    .sort({ capturedAt: -1 });
};

paymentSchema.statics.findFailedPayments = function(this: IPaymentModel): Promise<IPaymentDocument[]> {
  return this.find({ status: 'failed' })
    .populate('bookingId', 'bookingNo')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

export const Payment = mongoose.model<IPaymentDocument, IPaymentModel>('Payment', paymentSchema);
