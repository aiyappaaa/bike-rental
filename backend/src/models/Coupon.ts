import mongoose, { Schema, Document, Model } from 'mongoose';
import { Coupon as ICoupon, CouponType, BikeType } from '@rideflow/shared';

export interface ICouponDocument extends Omit<ICoupon, '_id'>, Document {
  isValid(): boolean;
  isValidForUser(userId: string): boolean;
  isValidForBikeType(bikeType: BikeType): boolean;
  canBeUsed(): boolean;
  calculateDiscount(amount: number): number;
  incrementUsage(): Promise<void>;
}

export interface ICouponModel extends Model<ICouponDocument> {
  findByCode(code: string): Promise<ICouponDocument | null>;
  findActiveForUser(userId: string): Promise<ICouponDocument[]>;
  findExpiringSoon(days?: number): Promise<ICouponDocument[]>;
}

const couponSchema = new Schema<ICouponDocument>({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code must be at most 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code must contain only letters and numbers'],
  },
  type: {
    type: String,
    enum: Object.values(CouponType.enum),
    required: [true, 'Coupon type is required'],
  },
  value: {
    type: Number,
    required: [true, 'Coupon value is required'],
    min: [0, 'Coupon value cannot be negative'],
  },
  minAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum amount cannot be negative'],
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
  },
  startsAt: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endsAt: {
    type: Date,
    required: [true, 'End date is required'],
  },
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1'],
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative'],
  },
  allowedUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  allowedBikeTypes: [{
    type: String,
    enum: Object.values(BikeType.enum),
  }],
  active: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, startsAt: 1, endsAt: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ allowedUserIds: 1 });
couponSchema.index({ allowedBikeTypes: 1 });
couponSchema.index({ createdAt: -1 });

// Validation
couponSchema.pre('validate', function(this: ICouponDocument) {
  if (this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'End date must be after start date');
  }

  if (this.type === 'percent' && this.value > 100) {
    this.invalidate('value', 'Percentage discount cannot exceed 100%');
  }

  if (this.usageLimit && this.usedCount > this.usageLimit) {
    this.invalidate('usedCount', 'Used count cannot exceed usage limit');
  }
});

// Instance methods
couponSchema.methods.isValid = function(this: ICouponDocument): boolean {
  if (!this.active) {
    return false;
  }

  const now = new Date();
  if (now < this.startsAt || now > this.endsAt) {
    return false;
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return false;
  }

  return true;
};

couponSchema.methods.isValidForUser = function(this: ICouponDocument, userId: string): boolean {
  if (!this.isValid()) {
    return false;
  }

  // If allowedUserIds is empty, coupon is valid for all users
  if (this.allowedUserIds.length === 0) {
    return true;
  }

  return this.allowedUserIds.some(id => id.toString() === userId);
};

couponSchema.methods.isValidForBikeType = function(this: ICouponDocument, bikeType: BikeType): boolean {
  if (!this.isValid()) {
    return false;
  }

  // If allowedBikeTypes is empty, coupon is valid for all bike types
  if (this.allowedBikeTypes.length === 0) {
    return true;
  }

  return this.allowedBikeTypes.includes(bikeType);
};

couponSchema.methods.canBeUsed = function(this: ICouponDocument): boolean {
  return this.isValid();
};

couponSchema.methods.calculateDiscount = function(this: ICouponDocument, amount: number): number {
  if (!this.isValid() || amount < this.minAmount) {
    return 0;
  }

  let discount = 0;

  if (this.type === 'percent') {
    discount = (amount * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply maximum discount limit if set
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  // Discount cannot exceed the amount
  return Math.min(discount, amount);
};

couponSchema.methods.incrementUsage = async function(this: ICouponDocument): Promise<void> {
  this.usedCount += 1;
  await this.save();
};

// Static methods
couponSchema.statics.findByCode = function(this: ICouponModel, code: string): Promise<ICouponDocument | null> {
  return this.findOne({ code: code.toUpperCase() });
};

couponSchema.statics.findActiveForUser = function(this: ICouponModel, userId: string): Promise<ICouponDocument[]> {
  const now = new Date();
  
  return this.find({
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    $or: [
      { allowedUserIds: { $size: 0 } },
      { allowedUserIds: userId },
    ],
    $expr: {
      $or: [
        { $eq: ['$usageLimit', null] },
        { $lt: ['$usedCount', '$usageLimit'] },
      ],
    },
  }).sort({ value: -1 });
};

couponSchema.statics.findExpiringSoon = function(this: ICouponModel, days: number = 7): Promise<ICouponDocument[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    active: true,
    endsAt: { $gte: now, $lte: futureDate },
  }).sort({ endsAt: 1 });
};

export const Coupon = mongoose.model<ICouponDocument, ICouponModel>('Coupon', couponSchema);
