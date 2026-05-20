import mongoose, { Schema, Document, Model } from 'mongoose';
import { Booking as IBooking, BookingStatus, PricingBreakdown } from '@rideflow/shared';
import { generateBookingNumber } from '@rideflow/shared';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {
  canBeCancelled(): boolean;
  calculateRefundAmount(): number;
  isActive(): boolean;
  isOverdue(): boolean;
  getLateFeeAmount(): number;
  markAsStarted(): Promise<void>;
  markAsCompleted(): Promise<void>;
  cancel(reason: string): Promise<void>;
}

export interface IBookingModel extends Model<IBookingDocument> {
  findByBookingNumber(bookingNo: string): Promise<IBookingDocument | null>;
  findByUser(userId: string): Promise<IBookingDocument[]>;
  findActiveBookings(): Promise<IBookingDocument[]>;
  findOverdueBookings(): Promise<IBookingDocument[]>;
  findConflictingBookings(bikeId: string, startAt: Date, endAt: Date): Promise<IBookingDocument[]>;
}

const pricingBreakdownSchema = new Schema<PricingBreakdown>({
  baseAmount: { type: Number, required: true, min: 0 },
  hourlyRate: { type: Number, required: true, min: 0 },
  dailyRate: { type: Number, required: true, min: 0 },
  durationHours: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, required: true, min: 0, max: 100 },
  gstAmount: { type: Number, required: true, min: 0 },
  deposit: { type: Number, required: true, min: 0 },
  lateFee: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  surgeMultiplier: { type: Number, default: 1, min: 1 },
  surgeAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const bookingSchema = new Schema<IBookingDocument>({
  bookingNo: {
    type: String,
    required: [true, 'Booking number is required'],
    unique: true,
    match: [/^RFB-\d{8}-\d{4}$/, 'Invalid booking number format'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: [true, 'Bike ID is required'],
  },
  stationPickupId: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Pickup station ID is required'],
  },
  stationDropoffId: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Dropoff station ID is required'],
  },
  startAt: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endAt: {
    type: Date,
    required: [true, 'End time is required'],
  },
  actualStartAt: {
    type: Date,
  },
  actualEndAt: {
    type: Date,
  },
  durationHours: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0.5, 'Minimum duration is 0.5 hours'],
  },
  pricingBreakdown: {
    type: pricingBreakdownSchema,
    required: [true, 'Pricing breakdown is required'],
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus.enum),
    default: 'pending',
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
  },
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters'],
  },
  cancelledAt: {
    type: Date,
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
  },
  refundedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
bookingSchema.index({ bookingNo: 1 }, { unique: true });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ bikeId: 1, status: 1 });
bookingSchema.index({ stationPickupId: 1 });
bookingSchema.index({ stationDropoffId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startAt: 1, endAt: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ paymentId: 1 });

// Compound indexes for conflict checking
bookingSchema.index({ bikeId: 1, startAt: 1, endAt: 1, status: 1 });

// Validation
bookingSchema.pre('validate', function(this: IBookingDocument) {
  if (this.endAt <= this.startAt) {
    this.invalidate('endAt', 'End time must be after start time');
  }

  if (this.actualStartAt && this.actualEndAt && this.actualEndAt <= this.actualStartAt) {
    this.invalidate('actualEndAt', 'Actual end time must be after actual start time');
  }
});

// Pre-save middleware to generate booking number
bookingSchema.pre('save', function(this: IBookingDocument, next) {
  if (this.isNew && !this.bookingNo) {
    this.bookingNo = generateBookingNumber();
  }
  next();
});

// Instance methods
bookingSchema.methods.canBeCancelled = function(this: IBookingDocument): boolean {
  if (this.status !== 'confirmed' && this.status !== 'pending') {
    return false;
  }

  // Can't cancel if booking has already started
  if (this.actualStartAt || new Date() >= this.startAt) {
    return false;
  }

  return true;
};

bookingSchema.methods.calculateRefundAmount = function(this: IBookingDocument): number {
  if (!this.canBeCancelled()) {
    return 0;
  }

  const hoursUntilStart = (this.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const totalPaid = this.pricingBreakdown.total;

  // Full refund if cancelled 24+ hours before
  if (hoursUntilStart >= 24) {
    return totalPaid;
  }

  // Partial refund if cancelled 2+ hours before
  if (hoursUntilStart >= 2) {
    return totalPaid * 0.5; // 50% refund
  }

  // No refund if cancelled less than 2 hours before
  return 0;
};

bookingSchema.methods.isActive = function(this: IBookingDocument): boolean {
  return this.status === 'active';
};

bookingSchema.methods.isOverdue = function(this: IBookingDocument): boolean {
  if (this.status !== 'active') {
    return false;
  }

  return new Date() > this.endAt;
};

bookingSchema.methods.getLateFeeAmount = function(this: IBookingDocument): number {
  if (!this.isOverdue()) {
    return 0;
  }

  const hoursLate = Math.ceil((Date.now() - this.endAt.getTime()) / (1000 * 60 * 60));
  return hoursLate * 50; // ₹50 per hour late fee
};

bookingSchema.methods.markAsStarted = async function(this: IBookingDocument): Promise<void> {
  this.status = 'active';
  this.actualStartAt = new Date();
  await this.save();

  // Update bike status
  const Bike = mongoose.model('Bike');
  await Bike.findByIdAndUpdate(this.bikeId, { status: 'rented' });
};

bookingSchema.methods.markAsCompleted = async function(this: IBookingDocument): Promise<void> {
  this.status = 'completed';
  this.actualEndAt = new Date();

  // Calculate late fee if overdue
  if (this.isOverdue()) {
    this.pricingBreakdown.lateFee = this.getLateFeeAmount();
    this.pricingBreakdown.total += this.pricingBreakdown.lateFee;
  }

  await this.save();

  // Update bike status back to available
  const Bike = mongoose.model('Bike');
  await Bike.findByIdAndUpdate(this.bikeId, { status: 'available' });
};

bookingSchema.methods.cancel = async function(this: IBookingDocument, reason: string): Promise<void> {
  if (!this.canBeCancelled()) {
    throw new Error('Booking cannot be cancelled');
  }

  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.refundAmount = this.calculateRefundAmount();

  await this.save();

  // If there's a refund amount, process it
  if (this.refundAmount > 0 && this.paymentId) {
    // This would trigger refund processing
    // Implementation depends on payment service
  }
};

// Static methods
bookingSchema.statics.findByBookingNumber = function(
  this: IBookingModel,
  bookingNo: string
): Promise<IBookingDocument | null> {
  return this.findOne({ bookingNo })
    .populate('userId', 'name email phone')
    .populate('bikeId', 'sku make model type images')
    .populate('stationPickupId', 'name code address')
    .populate('stationDropoffId', 'name code address')
    .populate('paymentId');
};

bookingSchema.statics.findByUser = function(this: IBookingModel, userId: string): Promise<IBookingDocument[]> {
  return this.find({ userId })
    .populate('bikeId', 'sku make model type images')
    .populate('stationPickupId', 'name code address')
    .populate('stationDropoffId', 'name code address')
    .sort({ createdAt: -1 });
};

bookingSchema.statics.findActiveBookings = function(this: IBookingModel): Promise<IBookingDocument[]> {
  return this.find({ status: 'active' })
    .populate('userId', 'name email phone')
    .populate('bikeId', 'sku make model')
    .populate('stationPickupId', 'name code')
    .populate('stationDropoffId', 'name code');
};

bookingSchema.statics.findOverdueBookings = function(this: IBookingModel): Promise<IBookingDocument[]> {
  return this.find({
    status: 'active',
    endAt: { $lt: new Date() },
  })
    .populate('userId', 'name email phone')
    .populate('bikeId', 'sku make model');
};

bookingSchema.statics.findConflictingBookings = function(
  this: IBookingModel,
  bikeId: string,
  startAt: Date,
  endAt: Date
): Promise<IBookingDocument[]> {
  return this.find({
    bikeId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
    ],
  });
};

export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', bookingSchema);
