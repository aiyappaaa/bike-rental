import mongoose, { Schema, Document, Model } from 'mongoose';
import { Station as IStation, GeoPoint, OperatingHours } from '@rideflow/shared';

export interface IStationDocument extends Omit<IStation, '_id'>, Document {
  getCurrentAvailableBikes(): Promise<number>;
  isOperatingNow(): boolean;
  getOperatingHoursForDay(day: string): { open: string; close: string; closed: boolean };
}

export interface IStationModel extends Model<IStationDocument> {
  findByCode(code: string): Promise<IStationDocument | null>;
  findNearby(coordinates: [number, number], maxDistance?: number): Promise<IStationDocument[]>;
  findWithinBounds(bounds: [number, number, number, number]): Promise<IStationDocument[]>;
  findActive(): Promise<IStationDocument[]>;
}

const geoPointSchema = new Schema<GeoPoint>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(coordinates: number[]) {
        return coordinates.length === 2 &&
               coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
               coordinates[1] >= -90 && coordinates[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges',
    },
  },
}, { _id: false });

const operatingHoursSchema = new Schema<OperatingHours>({
  monday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  tuesday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  wednesday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  thursday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  friday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  saturday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
  sunday: {
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closed: { type: Boolean, default: false },
  },
}, { _id: false });

const stationSchema = new Schema<IStationDocument>({
  name: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
    minlength: [2, 'Station name must be at least 2 characters'],
    maxlength: [100, 'Station name must be at most 100 characters'],
  },
  code: {
    type: String,
    required: [true, 'Station code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Station code must be at least 2 characters'],
    maxlength: [10, 'Station code must be at most 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Station code must contain only letters and numbers'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [5, 'Address must be at least 5 characters'],
    maxlength: [200, 'Address must be at most 200 characters'],
  },
  geo: {
    type: geoPointSchema,
    required: [true, 'Geographic coordinates are required'],
  },
  openingHours: {
    type: operatingHoursSchema,
    required: [true, 'Operating hours are required'],
  },
  images: [{
    type: String,
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
  active: {
    type: Boolean,
    default: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Station capacity is required'],
    min: [1, 'Station capacity must be at least 1'],
    max: [100, 'Station capacity cannot exceed 100'],
  },
}, {
  timestamps: true,
});

// Indexes
stationSchema.index({ code: 1 }, { unique: true });
stationSchema.index({ 'geo': '2dsphere' }); // Geospatial index for location queries
stationSchema.index({ active: 1 });
stationSchema.index({ name: 'text', address: 'text' }); // Text search index
stationSchema.index({ createdAt: -1 });

// Instance methods
stationSchema.methods.getCurrentAvailableBikes = async function(this: IStationDocument): Promise<number> {
  const Bike = mongoose.model('Bike');
  return await Bike.countDocuments({
    stationId: this._id,
    status: 'available',
  });
};

stationSchema.methods.isOperatingNow = function(this: IStationDocument): boolean {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()] as keyof OperatingHours;
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const dayHours = this.openingHours[currentDay];
  
  if (dayHours.closed) {
    return false;
  }
  
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
};

stationSchema.methods.getOperatingHoursForDay = function(this: IStationDocument, day: string) {
  const dayKey = day.toLowerCase() as keyof OperatingHours;
  return this.openingHours[dayKey] || this.openingHours.monday;
};

// Static methods
stationSchema.statics.findByCode = function(this: IStationModel, code: string): Promise<IStationDocument | null> {
  return this.findOne({ code: code.toUpperCase() });
};

stationSchema.statics.findNearby = function(
  this: IStationModel,
  coordinates: [number, number],
  maxDistance: number = 5000
): Promise<IStationDocument[]> {
  return this.find({
    active: true,
    geo: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: maxDistance,
      },
    },
  });
};

stationSchema.statics.findWithinBounds = function(
  this: IStationModel,
  bounds: [number, number, number, number]
): Promise<IStationDocument[]> {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  return this.find({
    active: true,
    geo: {
      $geoWithin: {
        $box: [[minLng, minLat], [maxLng, maxLat]],
      },
    },
  });
};

stationSchema.statics.findActive = function(this: IStationModel): Promise<IStationDocument[]> {
  return this.find({ active: true }).sort({ name: 1 });
};

export const Station = mongoose.model<IStationDocument, IStationModel>('Station', stationSchema);
