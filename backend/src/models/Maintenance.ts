import mongoose, { Schema, Document, Model } from 'mongoose';
import { 
  Maintenance as IMaintenance, 
  MaintenanceSeverity, 
  MaintenanceStatus, 
  MaintenanceType 
} from '@rideflow/shared';

export interface IMaintenanceDocument extends Omit<IMaintenance, '_id'>, Document {
  isOpen(): boolean;
  isOverdue(): boolean;
  canBeStarted(): boolean;
  canBeCompleted(): boolean;
  start(staffId: string): Promise<void>;
  complete(actualCost?: number, actualDuration?: number): Promise<void>;
  cancel(reason: string): Promise<void>;
  addPart(name: string, quantity: number, cost: number): Promise<void>;
}

export interface IMaintenanceModel extends Model<IMaintenanceDocument> {
  findByBike(bikeId: string): Promise<IMaintenanceDocument[]>;
  findByStaff(staffId: string): Promise<IMaintenanceDocument[]>;
  findOpen(): Promise<IMaintenanceDocument[]>;
  findOverdue(): Promise<IMaintenanceDocument[]>;
  findBySeverity(severity: MaintenanceSeverity): Promise<IMaintenanceDocument[]>;
  getMaintenanceStats(): Promise<any>;
}

const partUsedSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative'],
  },
}, { _id: false });

const maintenanceSchema = new Schema<IMaintenanceDocument>({
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: [true, 'Bike ID is required'],
  },
  type: {
    type: String,
    enum: Object.values(MaintenanceType.enum),
    required: [true, 'Maintenance type is required'],
  },
  issue: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    minlength: [5, 'Issue description must be at least 5 characters'],
    maxlength: [500, 'Issue description must be at most 500 characters'],
  },
  severity: {
    type: String,
    enum: Object.values(MaintenanceSeverity.enum),
    required: [true, 'Severity is required'],
  },
  status: {
    type: String,
    enum: Object.values(MaintenanceStatus.enum),
    default: 'open',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative'],
  },
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative'],
  },
  estimatedDuration: {
    type: Number,
    min: [0, 'Estimated duration cannot be negative'],
  },
  actualDuration: {
    type: Number,
    min: [0, 'Actual duration cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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
  partsUsed: [partUsedSchema],
  openedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
maintenanceSchema.index({ bikeId: 1, status: 1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ severity: 1, status: 1 });
maintenanceSchema.index({ type: 1 });
maintenanceSchema.index({ openedAt: -1 });
maintenanceSchema.index({ createdAt: -1 });

// Validation
maintenanceSchema.pre('validate', function(this: IMaintenanceDocument) {
  // Validate status transitions
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  if (this.status === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date();
  }

  // Completed maintenance should have actual cost and duration
  if (this.status === 'completed') {
    if (this.actualCost === undefined) {
      this.actualCost = this.estimatedCost || 0;
    }
    if (this.actualDuration === undefined) {
      this.actualDuration = this.estimatedDuration || 1;
    }
  }

  // Cancelled maintenance should have cancellation reason
  if (this.status === 'cancelled' && !this.cancellationReason) {
    this.invalidate('cancellationReason', 'Cancelled maintenance must have a reason');
  }
});

// Instance methods
maintenanceSchema.methods.isOpen = function(this: IMaintenanceDocument): boolean {
  return this.status === 'open';
};

maintenanceSchema.methods.isOverdue = function(this: IMaintenanceDocument): boolean {
  if (this.status !== 'open' && this.status !== 'in_progress') {
    return false;
  }

  const daysSinceOpened = (Date.now() - this.openedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Critical issues are overdue after 1 day, high after 3 days, medium after 7 days, low after 14 days
  const overdueThresholds = {
    critical: 1,
    high: 3,
    medium: 7,
    low: 14,
  };

  return daysSinceOpened > overdueThresholds[this.severity];
};

maintenanceSchema.methods.canBeStarted = function(this: IMaintenanceDocument): boolean {
  return this.status === 'open' && this.assignedTo;
};

maintenanceSchema.methods.canBeCompleted = function(this: IMaintenanceDocument): boolean {
  return this.status === 'in_progress';
};

maintenanceSchema.methods.start = async function(this: IMaintenanceDocument, staffId: string): Promise<void> {
  if (!this.canBeStarted()) {
    throw new Error('Maintenance cannot be started');
  }

  this.status = 'in_progress';
  this.startedAt = new Date();
  this.assignedTo = new mongoose.Types.ObjectId(staffId);
  await this.save();
};

maintenanceSchema.methods.complete = async function(
  this: IMaintenanceDocument, 
  actualCost?: number, 
  actualDuration?: number
): Promise<void> {
  if (!this.canBeCompleted()) {
    throw new Error('Maintenance cannot be completed');
  }

  this.status = 'completed';
  this.completedAt = new Date();
  
  if (actualCost !== undefined) {
    this.actualCost = actualCost;
  }
  
  if (actualDuration !== undefined) {
    this.actualDuration = actualDuration;
  }

  await this.save();

  // Update bike status back to available and set last service date
  const Bike = mongoose.model('Bike');
  await Bike.findByIdAndUpdate(this.bikeId, {
    status: 'available',
    lastServiceAt: new Date(),
  });
};

maintenanceSchema.methods.cancel = async function(this: IMaintenanceDocument, reason: string): Promise<void> {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error('Maintenance cannot be cancelled');
  }

  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  await this.save();

  // Update bike status back to available if it was in maintenance
  const Bike = mongoose.model('Bike');
  const bike = await Bike.findById(this.bikeId);
  if (bike && bike.status === 'maintenance') {
    bike.status = 'available';
    await bike.save();
  }
};

maintenanceSchema.methods.addPart = async function(
  this: IMaintenanceDocument, 
  name: string, 
  quantity: number, 
  cost: number
): Promise<void> {
  this.partsUsed.push({ name, quantity, cost });
  
  // Update actual cost
  const totalPartsCost = this.partsUsed.reduce((total, part) => total + (part.cost * part.quantity), 0);
  this.actualCost = (this.actualCost || 0) + cost * quantity;
  
  await this.save();
};

// Static methods
maintenanceSchema.statics.findByBike = function(this: IMaintenanceModel, bikeId: string): Promise<IMaintenanceDocument[]> {
  return this.find({ bikeId })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

maintenanceSchema.statics.findByStaff = function(this: IMaintenanceModel, staffId: string): Promise<IMaintenanceDocument[]> {
  return this.find({ assignedTo: staffId })
    .populate('bikeId', 'sku make model')
    .sort({ createdAt: -1 });
};

maintenanceSchema.statics.findOpen = function(this: IMaintenanceModel): Promise<IMaintenanceDocument[]> {
  return this.find({ status: 'open' })
    .populate('bikeId', 'sku make model')
    .populate('assignedTo', 'name')
    .sort({ severity: 1, openedAt: 1 }); // Critical first, then by date
};

maintenanceSchema.statics.findOverdue = function(this: IMaintenanceModel): Promise<IMaintenanceDocument[]> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return this.find({
    status: { $in: ['open', 'in_progress'] },
    $or: [
      { severity: 'critical', openedAt: { $lt: oneDayAgo } },
      { severity: 'high', openedAt: { $lt: threeDaysAgo } },
      { severity: 'medium', openedAt: { $lt: sevenDaysAgo } },
      { severity: 'low', openedAt: { $lt: fourteenDaysAgo } },
    ],
  })
    .populate('bikeId', 'sku make model')
    .populate('assignedTo', 'name')
    .sort({ severity: 1, openedAt: 1 });
};

maintenanceSchema.statics.findBySeverity = function(
  this: IMaintenanceModel, 
  severity: MaintenanceSeverity
): Promise<IMaintenanceDocument[]> {
  return this.find({ severity })
    .populate('bikeId', 'sku make model')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });
};

maintenanceSchema.statics.getMaintenanceStats = async function(this: IMaintenanceModel): Promise<any> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCost: { $avg: '$actualCost' },
        avgDuration: { $avg: '$actualDuration' },
      },
    },
  ]);

  const severityStats = await this.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
      },
    },
  ]);

  return { statusStats: stats, severityStats };
};

export const Maintenance = mongoose.model<IMaintenanceDocument, IMaintenanceModel>('Maintenance', maintenanceSchema);
