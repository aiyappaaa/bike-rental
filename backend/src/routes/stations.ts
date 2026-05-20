import { Router } from 'express';
import { Station } from '@/models/Station';
import { availabilityService } from '@/services/availabilityService';
import { validateQuery, validateParams } from '@/middleware/validation';
import { authenticate, requireStaff, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  StationQuerySchema, 
  HTTP_STATUS,
  z 
} from '@rideflow/shared';

const router = Router();

// Station ID parameter validation
const StationParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid station ID'),
});

// Coordinates query schema
const CoordinatesQuerySchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  radius: z.string().transform(Number).optional(),
});

// Availability query schema
const AvailabilityQuerySchema = z.object({
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().transform(str => new Date(str)),
});

/**
 * @route   GET /api/v1/stations
 * @desc    Get all active stations
 * @access  Public
 */
router.get('/',
  validateQuery(StationQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = req.query as any;
    
    const query: any = { active: true };
    
    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    const [stations, total] = await Promise.all([
      Station.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Station.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: stations,
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
 * @route   GET /api/v1/stations/nearby
 * @desc    Get stations near coordinates
 * @access  Public
 */
router.get('/nearby',
  validateQuery(CoordinatesQuerySchema),
  asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000 } = req.query as any;
    
    const stations = await Station.findNearby([lng, lat], radius);
    
    res.json({
      success: true,
      data: stations,
    });
  })
);

/**
 * @route   GET /api/v1/stations/:id
 * @desc    Get station by ID
 * @access  Public
 */
router.get('/:id',
  validateParams(StationParamsSchema),
  asyncHandler(async (req, res) => {
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Station not found',
      });
    }

    res.json({
      success: true,
      data: station,
    });
  })
);

/**
 * @route   GET /api/v1/stations/:id/availability
 * @desc    Get real-time availability for a station
 * @access  Public
 */
router.get('/:id/availability',
  validateParams(StationParamsSchema),
  asyncHandler(async (req, res) => {
    const availability = await availabilityService.getCurrentStationAvailability(req.params.id);
    
    res.json({
      success: true,
      data: availability,
    });
  })
);

/**
 * @route   GET /api/v1/stations/:id/availability/period
 * @desc    Get availability for a specific time period
 * @access  Public
 */
router.get('/:id/availability/period',
  validateParams(StationParamsSchema),
  validateQuery(AvailabilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { startAt, endAt } = req.query as any;
    
    const availability = await availabilityService.getStationAvailability(
      req.params.id,
      startAt,
      endAt
    );
    
    res.json({
      success: true,
      data: availability,
    });
  })
);

/**
 * @route   GET /api/v1/stations/:id/bikes
 * @desc    Get all bikes at a station
 * @access  Public
 */
router.get('/:id/bikes',
  validateParams(StationParamsSchema),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { Bike } = await import('@/models/Bike');
    
    const bikes = await Bike.findByStation(req.params.id);
    
    res.json({
      success: true,
      data: bikes,
    });
  })
);

/**
 * @route   POST /api/v1/stations
 * @desc    Create a new station
 * @access  Staff/Admin
 */
router.post('/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const station = new Station(req.body);
    await station.save();
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Station created successfully',
      data: station,
    });
  })
);

/**
 * @route   PUT /api/v1/stations/:id
 * @desc    Update a station
 * @access  Staff/Admin
 */
router.put('/:id',
  authenticate,
  requireStaff,
  validateParams(StationParamsSchema),
  asyncHandler(async (req, res) => {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!station) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Station not found',
      });
    }

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: station,
    });
  })
);

/**
 * @route   DELETE /api/v1/stations/:id
 * @desc    Deactivate a station
 * @access  Staff/Admin
 */
router.delete('/:id',
  authenticate,
  requireStaff,
  validateParams(StationParamsSchema),
  asyncHandler(async (req, res) => {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!station) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Station not found',
      });
    }

    res.json({
      success: true,
      message: 'Station deactivated successfully',
      data: station,
    });
  })
);

export default router;
