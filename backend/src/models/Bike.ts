import mongoose, { Schema, Document, Model } from 'mongoose';
import { Bike as IBike, BikeType, BikeStatus, BikeSize } from '@rideflow/shared';

export interface IBikeDocument extends Omit<IBike, '_id'>, Document {
  isAvailable(): boolean;
  isAvailableForPeriod(startAt: Date, endAt: Date): Promise<boolean>;
  needsMaintenance(): boolean;
  updateOdometer(distance: number): Promise<void>;
  updateBatteryLevel(level: number): Promise<void>;
  markForMaintenance(reason: string): Promise<void>;
}

export interface IBikeModel extends Model<IBikeDocument> {
  findBySKU(sku: string): Promise<IBikeDocument | null>;
  findAvailable(stationId?: string, type?: BikeType): Promise<IBikeDocument[]>;
  findByStation(stationId: string): Promise<IBikeDocument[]>;
  findNeedingMaintenance(): Promise<IBikeDocument[]>;
  searchBikes(query: string): Promise<IBikeDocument[]>;
}

const bikeSchema = new Schema<IBikeDocument>({
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'SKU must be at least 3 characters'],
    maxlength: [20, 'SKU must be at most 20 characters'],
    match: [/^[A-Z0-9_-]+$/, 'SKU must contain only letters, numbers, hyphens, and underscores'],
  },
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true,
    minlength: [2, 'Make must be at least 2 characters'],
    maxlength: [50, 'Make must be at most 50 characters'],
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    minlength: [2, 'Model must be at least 2 characters'],
    maxlength: [50, 'Model must be at most 50 characters'],
  },
  type: {
    type: String,
    enum: Object.values(BikeType.enum),
    required: [true, 'Bike type is required'],
  },
  gears: {
    type: Number,
    required: [true, 'Number of gears is required'],
    min: [1, 'Bike must have at least 1 gear'],
    max: [30, 'Bike cannot have more than 30 gears'],
  },
  size: {
    type: String,
    enum: Object.values(BikeSize.enum),
    required: [true, 'Bike size is required'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    minlength: [2, 'Color must be at least 2 characters'],
    maxlength: [30, 'Color must be at most 30 characters'],
  },
  images: [{
    type: String,
    required: true,
    validate: {
      validator: function(url: string) {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid image URL',
    },
  }],
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate cannot be negative'],
  },
  dailyRate: {
    type: Number,
    required: [true, 'Daily rate is required'],
    min: [0, 'Daily rate cannot be negative'],
  },
  deposit: {
    type: Number,
    required: [true, 'Deposit is required'],
    min: [0, 'Deposit cannot be negative'],
  },
  status: {
    type: String,
    enum: Object.values(BikeStatus.enum),
    default: 'available',
  },
  stationId: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Station ID is required'],
  },
  odometer: {
    type: Number,
    default: 0,
    min: [0, 'Odometer cannot be negative'],
  },
  batteryLevel: {
    type: Number,
    min: [0, 'Battery level cannot be negative'],
    max: [100, 'Battery level cannot exceed 100'],
    validate: {
      validator: function(this: IBikeDocument, value: number) {
        // Only e-bikes should have battery level
        return this.type !== 'e-bike' || (value !== undefined && value !== null);
      },
      message: 'E-bikes must have a battery level',
    },
  },
  lastServiceAt: {
    type: Date,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
}, {
  timestamps: true,
});

// Indexes
bikeSchema.index({ sku: 1 }, { unique: true });
bikeSchema.index({ stationId: 1, status: 1 });
bikeSchema.index({ type: 1, status: 1 });
bikeSchema.index({ status: 1 });
bikeSchema.index({ hourlyRate: 1 });
bikeSchema.index({ dailyRate: 1 });
bikeSchema.index({ size: 1 });
bikeSchema.index({ tags: 1 });
bikeSchema.index({ make: 'text', model: 'text', color: 'text' }); // Text search
bikeSchema.index({ createdAt: -1 });
bikeSchema.index({ lastServiceAt: 1 });

// Validation
bikeSchema.pre('validate', function(this: IBikeDocument) {
  // Ensure images array has at least one image
  if (!this.images || this.images.length === 0) {
    this.invalidate('images', 'At least one image is required');
  }

  // Validate battery level for e-bikes
  if (this.type === 'e-bike' && (this.batteryLevel === undefined || this.batteryLevel === null)) {
    this.invalidate('batteryLevel', 'E-bikes must have a battery level');
  }

  // Non e-bikes shouldn't have battery level
  if (this.type !== 'e-bike' && this.batteryLevel !== undefined) {
    this.batteryLevel = undefined;
  }
});

// Instance methods
bikeSchema.methods.isAvailable = function(this: IBikeDocument): boolean {
  return this.status === 'available';
};

bikeSchema.methods.isAvailableForPeriod = async function(
  this: IBikeDocument,
  startAt: Date,
  endAt: Date
): Promise<boolean> {
  if (!this.isAvailable()) {
    return false;
  }

  const Booking = mongoose.model('Booking');
  
  // Check for overlapping bookings
  const overlappingBooking = await Booking.findOne({
    bikeId: this._id,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
    ],
  });

  return !overlappingBooking;
};

bikeSchema.methods.needsMaintenance = function(this: IBikeDocument): boolean {
  if (!this.lastServiceAt) {
    return true; // Never serviced
  }

  const daysSinceService = (Date.now() - this.lastServiceAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceService > 30; // Needs service every 30 days
};

bikeSchema.methods.updateOdometer = async function(this: IBikeDocument, distance: number): Promise<void> {
  this.odometer += distance;
  await this.save();
};

bikeSchema.methods.updateBatteryLevel = async function(this: IBikeDocument, level: number): Promise<void> {
  if (this.type === 'e-bike') {
    this.batteryLevel = Math.max(0, Math.min(100, level));
    await this.save();
  }
};

bikeSchema.methods.markForMaintenance = async function(this: IBikeDocument, reason: string): Promise<void> {
  this.status = 'maintenance';
  await this.save();

  // Create maintenance record
  const Maintenance = mongoose.model('Maintenance');
  await Maintenance.create({
    bikeId: this._id,
    type: 'repair',
    issue: reason,
    severity: 'medium',
  });
};

// Static methods
bikeSchema.statics.findBySKU = function(this: IBikeModel, sku: string): Promise<IBikeDocument | null> {
  return this.findOne({ sku: sku.toUpperCase() });
};

bikeSchema.statics.findAvailable = function(
  this: IBikeModel,
  stationId?: string,
  type?: BikeType
): Promise<IBikeDocument[]> {
  const query: any = { status: 'available' };
  
  if (stationId) {
    query.stationId = stationId;
  }
  
  if (type) {
    query.type = type;
  }

  return this.find(query).populate('stationId', 'name code address');
};

bikeSchema.statics.findByStation = function(this: IBikeModel, stationId: string): Promise<IBikeDocument[]> {
  return this.find({ stationId }).populate('stationId', 'name code address');
};

bikeSchema.statics.findNeedingMaintenance = function(this: IBikeModel): Promise<IBikeDocument[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      { lastServiceAt: { $lt: thirtyDaysAgo } },
      { lastServiceAt: { $exists: false } },
      { status: 'maintenance' },
    ],
  }).populate('stationId', 'name code');
};

bikeSchema.statics.searchBikes = function(this: IBikeModel, query: string): Promise<IBikeDocument[]> {
  return this.find({
    $text: { $search: query },
    status: 'available',
  }).populate('stationId', 'name code address');
};

export const Bike = mongoose.model<IBikeDocument, IBikeModel>('Bike', bikeSchema);
