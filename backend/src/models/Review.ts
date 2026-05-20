import mongoose, { Schema, Document, Model } from 'mongoose';
import { Review as IReview } from '@rideflow/shared';

export interface IReviewDocument extends Omit<IReview, '_id'>, Document {
  canBeEditedBy(userId: string): boolean;
  canBeDeleted(): boolean;
}

export interface IReviewModel extends Model<IReviewDocument> {
  findByBike(bikeId: string): Promise<IReviewDocument[]>;
  findByUser(userId: string): Promise<IReviewDocument[]>;
  getAverageRating(bikeId: string): Promise<number>;
  getRatingDistribution(bikeId: string): Promise<Record<number, number>>;
  findVisible(): Promise<IReviewDocument[]>;
}

const reviewSchema = new Schema<IReviewDocument>({
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
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer',
    },
  },
  comment: {
    type: String,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment must be at most 1000 characters'],
    trim: true,
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
  visible: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
reviewSchema.index({ bikeId: 1, visible: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true }); // One review per booking
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ visible: 1, createdAt: -1 });

// Validation
reviewSchema.pre('validate', function(this: IReviewDocument) {
  // Limit number of images
  if (this.images && this.images.length > 5) {
    this.invalidate('images', 'Maximum 5 images allowed');
  }
});

// Ensure one review per booking
reviewSchema.index({ bookingId: 1 }, { unique: true });

// Instance methods
reviewSchema.methods.canBeEditedBy = function(this: IReviewDocument, userId: string): boolean {
  return this.userId.toString() === userId;
};

reviewSchema.methods.canBeDeleted = function(this: IReviewDocument): boolean {
  // Reviews can be deleted within 24 hours of creation
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
};

// Static methods
reviewSchema.statics.findByBike = function(this: IReviewModel, bikeId: string): Promise<IReviewDocument[]> {
  return this.find({ bikeId, visible: true })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findByUser = function(this: IReviewModel, userId: string): Promise<IReviewDocument[]> {
  return this.find({ userId })
    .populate('bikeId', 'sku make model images')
    .populate('bookingId', 'bookingNo startAt endAt')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.getAverageRating = async function(this: IReviewModel, bikeId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { bikeId: new mongoose.Types.ObjectId(bikeId), visible: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
  ]);

  return result.length > 0 ? Math.round(result[0].averageRating * 10) / 10 : 0;
};

reviewSchema.statics.getRatingDistribution = async function(
  this: IReviewModel, 
  bikeId: string
): Promise<Record<number, number>> {
  const result = await this.aggregate([
    { $match: { bikeId: new mongoose.Types.ObjectId(bikeId), visible: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.forEach(item => {
    distribution[item._id] = item.count;
  });

  return distribution;
};

reviewSchema.statics.findVisible = function(this: IReviewModel): Promise<IReviewDocument[]> {
  return this.find({ visible: true })
    .populate('userId', 'name')
    .populate('bikeId', 'sku make model')
    .sort({ createdAt: -1 });
};

export const Review = mongoose.model<IReviewDocument, IReviewModel>('Review', reviewSchema);
