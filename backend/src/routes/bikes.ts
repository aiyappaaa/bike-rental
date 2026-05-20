import { Router } from 'express';
import { Bike } from '@/models/Bike';
import { availabilityService } from '@/services/availabilityService';
import { validateQuery, validateParams, validateBody } from '@/middleware/validation';
import { authenticate, requireStaff, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  BikeQuerySchema,
  BikeCreateSchema,
  BikeUpdateSchema,
  HTTP_STATUS,
  z 
} from '@rideflow/shared';

const router = Router();

// Bike ID parameter validation
const BikeParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bike ID'),
});

// Availability query schema
const AvailabilityQuerySchema = z.object({
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().transform(str => new Date(str)),
  stationId: z.string().optional(),
  bikeType: z.enum(['city', 'mountain', 'road', 'e-bike', 'scooter']).optional(),
});

/**
 * @route   GET /api/v1/bikes
 * @desc    Get all bikes with filters
 * @access  Public
 */
router.get('/',
  validateQuery(BikeQuerySchema),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { 
      page, 
      limit, 
      stationId, 
      type, 
      status, 
      minPrice, 
      maxPrice, 
      search,
      sortBy, 
      sortOrder 
    } = req.query as any;
    
    const query: any = {};
    
    // Add filters
    if (stationId) query.stationId = stationId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (minPrice || maxPrice) {
      query.hourlyRate = {};
      if (minPrice) query.hourlyRate.$gte = minPrice;
      if (maxPrice) query.hourlyRate.$lte = maxPrice;
    }
    
    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    const [bikes, total] = await Promise.all([
      Bike.find(query)
        .populate('stationId', 'name code address')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Bike.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: bikes,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  })
);

/**
 * @route   GET /api/v1/bikes/available
 * @desc    Get available bikes for a time period
 * @access  Public
 */
router.get('/available',
  validateQuery(AvailabilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { startAt, endAt, stationId, bikeType } = req.query as any;
    
    const availableBikes = await availabilityService.findAvailableBikes({
      startAt,
      endAt,
      stationId,
      bikeType,
    });
    
    // Filter to only return actually available bikes
    const onlyAvailable = availableBikes.filter(bike => bike.isAvailable);
    
    res.json({
      success: true,
      data: onlyAvailable,
      meta: {
        totalFound: availableBikes.length,
        availableCount: onlyAvailable.length,
      },
    });
  })
);

/**
 * @route   GET /api/v1/bikes/search
 * @desc    Search bikes by text
 * @access  Public
 */
router.get('/search',
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }
    
    const bikes = await Bike.searchBikes(q);
    
    res.json({
      success: true,
      data: bikes,
    });
  })
);

/**
 * @route   GET /api/v1/bikes/:id
 * @desc    Get bike by ID
 * @access  Public
 */
router.get('/:id',
  validateParams(BikeParamsSchema),
  asyncHandler(async (req, res) => {
    const bike = await Bike.findById(req.params.id)
      .populate('stationId', 'name code address geo');
    
    if (!bike) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Bike not found',
      });
    }

    res.json({
      success: true,
      data: bike,
    });
  })
);

/**
 * @route   GET /api/v1/bikes/:id/availability
 * @desc    Check bike availability for a time period
 * @access  Public
 */
router.get('/:id/availability',
  validateParams(BikeParamsSchema),
  validateQuery(z.object({
    startAt: z.string().transform(str => new Date(str)),
    endAt: z.string().transform(str => new Date(str)),
  })),
  asyncHandler(async (req, res) => {
    const { startAt, endAt } = req.query as any;
    
    const isAvailable = await availabilityService.isBikeAvailable(
      req.params.id,
      startAt,
      endAt
    );
    
    res.json({
      success: true,
      data: {
        bikeId: req.params.id,
        isAvailable,
        period: { startAt, endAt },
      },
    });
  })
);

/**
 * @route   POST /api/v1/bikes
 * @desc    Create a new bike
 * @access  Staff/Admin
 */
router.post('/',
  authenticate,
  requireStaff,
  validateBody(BikeCreateSchema),
  asyncHandler(async (req, res) => {
    const bike = new Bike(req.body);
    await bike.save();
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Bike created successfully',
      data: bike,
    });
  })
);

/**
 * @route   PUT /api/v1/bikes/:id
 * @desc    Update a bike
 * @access  Staff/Admin
 */
router.put('/:id',
  authenticate,
  requireStaff,
  validateParams(BikeParamsSchema),
  validateBody(BikeUpdateSchema),
  asyncHandler(async (req, res) => {
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!bike) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Bike not found',
      });
    }

    res.json({
      success: true,
      message: 'Bike updated successfully',
      data: bike,
    });
  })
);

/**
 * @route   PATCH /api/v1/bikes/:id/status
 * @desc    Update bike status
 * @access  Staff/Admin
 */
router.patch('/:id/status',
  authenticate,
  requireStaff,
  validateParams(BikeParamsSchema),
  validateBody(z.object({
    status: z.enum(['available', 'rented', 'maintenance', 'inactive']),
    reason: z.string().optional(),
  })),
  asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Bike not found',
      });
    }

    // If marking for maintenance, create maintenance record
    if (status === 'maintenance' && reason) {
      await bike.markForMaintenance(reason);
    } else {
      bike.status = status;
      await bike.save();
    }

    res.json({
      success: true,
      message: 'Bike status updated successfully',
      data: bike,
    });
  })
);

/**
 * @route   PATCH /api/v1/bikes/:id/battery
 * @desc    Update e-bike battery level
 * @access  Staff/Admin
 */
router.patch('/:id/battery',
  authenticate,
  requireStaff,
  validateParams(BikeParamsSchema),
  validateBody(z.object({
    batteryLevel: z.number().min(0).max(100),
  })),
  asyncHandler(async (req, res) => {
    const { batteryLevel } = req.body;
    
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Bike not found',
      });
    }

    if (bike.type !== 'e-bike') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Only e-bikes have battery levels',
      });
    }

    await bike.updateBatteryLevel(batteryLevel);

    res.json({
      success: true,
      message: 'Battery level updated successfully',
      data: bike,
    });
  })
);

/**
 * @route   DELETE /api/v1/bikes/:id
 * @desc    Deactivate a bike
 * @access  Staff/Admin
 */
router.delete('/:id',
  authenticate,
  requireStaff,
  validateParams(BikeParamsSchema),
  asyncHandler(async (req, res) => {
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    
    if (!bike) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Bike not found',
      });
    }

    res.json({
      success: true,
      message: 'Bike deactivated successfully',
      data: bike,
    });
  })
);

export default router;
