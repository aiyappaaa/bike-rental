import { Router } from 'express';
import { bookingService } from '@/services/bookingService';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation';
import { authenticate, requireStaff, requireBookingAccess } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  BookingQuoteSchema,
  BookingCreateSchema,
  BookingQuerySchema,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  z 
} from '@rideflow/shared';

const router = Router();

// Booking ID parameter validation
const BookingParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
});

// Booking number parameter validation
const BookingNumberParamsSchema = z.object({
  bookingNo: z.string().regex(/^RFB-\d{8}-\d{4}$/, 'Invalid booking number format'),
});

// Cancel booking schema
const CancelBookingSchema = z.object({
  reason: z.string().min(5, 'Cancellation reason must be at least 5 characters'),
});

/**
 * @route   POST /api/v1/bookings/quote
 * @desc    Get pricing quote for a booking
 * @access  Public (with optional auth for coupon validation)
 */
router.post('/quote',
  validateBody(BookingQuoteSchema),
  asyncHandler(async (req: any, res) => {
    const userId = req.user?._id?.toString();
    const quote = await bookingService.getQuote(req.body, userId);
    
    res.json({
      success: true,
      data: quote,
    });
  })
);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/',
  authenticate,
  validateBody(BookingCreateSchema),
  asyncHandler(async (req: any, res) => {
    const result = await bookingService.createBooking(req.body, req.user._id);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: result.booking,
        requiresPayment: result.requiresPayment,
        paymentAmount: result.paymentAmount,
      },
    });
  })
);

/**
 * @route   GET /api/v1/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/',
  authenticate,
  validateQuery(BookingQuerySchema),
  asyncHandler(async (req: any, res) => {
    const { page, limit } = req.query;
    const result = await bookingService.getUserBookings(req.user._id, page, limit);
    
    res.json({
      success: true,
      data: result.bookings,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  })
);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (own bookings) / Staff (all bookings)
 */
router.get('/:id',
  authenticate,
  requireBookingAccess,
  validateParams(BookingParamsSchema),
  asyncHandler(async (req, res) => {
    const { Booking } = await import('@/models/Booking');
    
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('bikeId', 'sku make model type images')
      .populate('stationPickupId', 'name code address')
      .populate('stationDropoffId', 'name code address')
      .populate('paymentId');
    
    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  })
);

/**
 * @route   GET /api/v1/bookings/number/:bookingNo
 * @desc    Get booking by booking number
 * @access  Private (own bookings) / Staff (all bookings)
 */
router.get('/number/:bookingNo',
  authenticate,
  validateParams(BookingNumberParamsSchema),
  asyncHandler(async (req: any, res) => {
    const { Booking } = await import('@/models/Booking');
    
    const booking = await Booking.findByBookingNumber(req.params.bookingNo);
    
    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Check if user has access to this booking
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  })
);

/**
 * @route   POST /api/v1/bookings/:id/confirm
 * @desc    Confirm booking after payment
 * @access  Private (payment webhook) / Staff
 */
router.post('/:id/confirm',
  authenticate,
  validateParams(BookingParamsSchema),
  asyncHandler(async (req, res) => {
    const booking = await bookingService.confirmBooking(req.params.id);
    
    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  })
);

/**
 * @route   POST /api/v1/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (own bookings) / Staff (all bookings)
 */
router.post('/:id/cancel',
  authenticate,
  requireBookingAccess,
  validateParams(BookingParamsSchema),
  validateBody(CancelBookingSchema),
  asyncHandler(async (req: any, res) => {
    const userId = req.user.role === 'admin' || req.user.role === 'staff' 
      ? undefined 
      : req.user._id.toString();
    
    const booking = await bookingService.cancelBooking(
      req.params.id, 
      req.body.reason, 
      userId
    );
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  })
);

/**
 * @route   POST /api/v1/bookings/:id/start
 * @desc    Start a booking (bike pickup)
 * @access  Staff/Admin
 */
router.post('/:id/start',
  authenticate,
  requireStaff,
  validateParams(BookingParamsSchema),
  asyncHandler(async (req: any, res) => {
    const booking = await bookingService.startBooking(req.params.id, req.user._id);
    
    res.json({
      success: true,
      message: 'Booking started successfully',
      data: booking,
    });
  })
);

/**
 * @route   POST /api/v1/bookings/:id/complete
 * @desc    Complete a booking (bike return)
 * @access  Staff/Admin
 */
router.post('/:id/complete',
  authenticate,
  requireStaff,
  validateParams(BookingParamsSchema),
  asyncHandler(async (req: any, res) => {
    const booking = await bookingService.completeBooking(req.params.id, req.user._id);
    
    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: booking,
    });
  })
);

/**
 * @route   GET /api/v1/bookings/admin/all
 * @desc    Get all bookings (admin view)
 * @access  Staff/Admin
 */
router.get('/admin/all',
  authenticate,
  requireStaff,
  validateQuery(BookingQuerySchema),
  asyncHandler(async (req, res) => {
    const { Booking } = await import('@/models/Booking');
    const { page, limit, status, startDate, endDate, sortBy, sortOrder } = req.query as any;
    
    const query: any = {};
    
    // Add filters
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startAt = {};
      if (startDate) query.startAt.$gte = new Date(startDate);
      if (endDate) query.startAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('bikeId', 'sku make model')
        .populate('stationPickupId', 'name code')
        .populate('stationDropoffId', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: bookings,
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
 * @route   GET /api/v1/bookings/admin/active
 * @desc    Get all active bookings
 * @access  Staff/Admin
 */
router.get('/admin/active',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const { Booking } = await import('@/models/Booking');
    const activeBookings = await Booking.findActiveBookings();
    
    res.json({
      success: true,
      data: activeBookings,
    });
  })
);

/**
 * @route   GET /api/v1/bookings/admin/overdue
 * @desc    Get all overdue bookings
 * @access  Staff/Admin
 */
router.get('/admin/overdue',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const { Booking } = await import('@/models/Booking');
    const overdueBookings = await Booking.findOverdueBookings();
    
    res.json({
      success: true,
      data: overdueBookings,
    });
  })
);

export default router;
