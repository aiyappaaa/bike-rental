import { Booking, IBookingDocument } from '@/models/Booking';
import { Bike } from '@/models/Bike';
import { User } from '@/models/User';
import { Coupon } from '@/models/Coupon';
import { pricingService } from './pricingService';
import { availabilityService } from './availabilityService';
import { emailService } from './emailService';
import { logger } from '@/utils/logger';
import { 
  BookingCreate, 
  BookingQuote, 
  BookingQuoteResponse,
  generateBookingNumber,
  validateBookingTime 
} from '@rideflow/shared';
import { ValidationError, ConflictError, NotFoundError } from '@/middleware/errorHandler';

export interface BookingResult {
  booking: IBookingDocument;
  requiresPayment: boolean;
  paymentAmount?: number;
}

class BookingService {
  /**
   * Get pricing quote for a booking
   */
  async getQuote(quoteData: BookingQuote, userId?: string): Promise<BookingQuoteResponse> {
    try {
      // Validate booking time constraints
      const timeValidation = validateBookingTime(quoteData.startAt, quoteData.endAt);
      if (!timeValidation.valid) {
        throw new ValidationError(timeValidation.error!);
      }

      // Check if bike exists and is available
      const bike = await Bike.findById(quoteData.bikeId);
      if (!bike) {
        throw new NotFoundError('Bike not found');
      }

      const isAvailable = await availabilityService.isBikeAvailable(
        quoteData.bikeId,
        quoteData.startAt,
        quoteData.endAt
      );

      if (!isAvailable) {
        throw new ConflictError('Bike is not available for the selected time period');
      }

      // Calculate pricing
      const pricingResult = await pricingService.calculatePricing({
        bikeId: quoteData.bikeId,
        startAt: quoteData.startAt,
        endAt: quoteData.endAt,
        couponCode: quoteData.couponCode,
        userId,
      });

      logger.info(`Quote generated for bike ${quoteData.bikeId}`, {
        bikeId: quoteData.bikeId,
        userId,
        total: pricingResult.pricingBreakdown.total,
        duration: pricingResult.pricingBreakdown.durationHours,
      });

      return {
        bikeId: quoteData.bikeId,
        pricingBreakdown: pricingResult.pricingBreakdown,
        validUntil: pricingResult.validUntil,
      };
    } catch (error) {
      logger.error('Quote generation error:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingCreate, userId: string): Promise<BookingResult> {
    try {
      // Validate booking time constraints
      const timeValidation = validateBookingTime(bookingData.startAt, bookingData.endAt);
      if (!timeValidation.valid) {
        throw new ValidationError(timeValidation.error!);
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify bike exists
      const bike = await Bike.findById(bookingData.bikeId);
      if (!bike) {
        throw new NotFoundError('Bike not found');
      }

      // Check availability
      const isAvailable = await availabilityService.isBikeAvailable(
        bookingData.bikeId,
        bookingData.startAt,
        bookingData.endAt
      );

      if (!isAvailable) {
        throw new ConflictError('Bike is not available for the selected time period');
      }

      // Calculate pricing
      const pricingResult = await pricingService.calculatePricing({
        bikeId: bookingData.bikeId,
        startAt: bookingData.startAt,
        endAt: bookingData.endAt,
        couponCode: bookingData.couponCode,
        userId,
      });

      // Create booking
      const booking = new Booking({
        bookingNo: generateBookingNumber(),
        userId,
        bikeId: bookingData.bikeId,
        stationPickupId: bookingData.stationPickupId,
        stationDropoffId: bookingData.stationDropoffId,
        startAt: bookingData.startAt,
        endAt: bookingData.endAt,
        durationHours: pricingResult.pricingBreakdown.durationHours,
        pricingBreakdown: pricingResult.pricingBreakdown,
        couponCode: bookingData.couponCode,
        notes: bookingData.notes,
        status: 'pending', // Will be confirmed after payment
      });

      await booking.save();

      // Apply coupon usage if used
      if (bookingData.couponCode && pricingResult.pricingBreakdown.discount > 0) {
        const coupon = await Coupon.findByCode(bookingData.couponCode);
        if (coupon) {
          await coupon.incrementUsage();
        }
      }

      logger.info(`Booking created: ${booking.bookingNo}`, {
        bookingId: booking._id,
        userId,
        bikeId: bookingData.bikeId,
        total: pricingResult.pricingBreakdown.total,
      });

      return {
        booking,
        requiresPayment: pricingResult.pricingBreakdown.total > 0,
        paymentAmount: pricingResult.pricingBreakdown.total,
      };
    } catch (error) {
      logger.error('Booking creation error:', error);
      throw error;
    }
  }

  /**
   * Confirm a booking after successful payment
   */
  async confirmBooking(bookingId: string): Promise<IBookingDocument> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('bikeId', 'sku make model')
        .populate('stationPickupId', 'name address')
        .populate('stationDropoffId', 'name address');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'pending') {
        throw new ValidationError('Booking is not in pending status');
      }

      // Update booking status
      booking.status = 'confirmed';
      await booking.save();

      // Send confirmation email
      try {
        await this.sendBookingConfirmationEmail(booking);
      } catch (emailError) {
        logger.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the booking confirmation if email fails
      }

      logger.info(`Booking confirmed: ${booking.bookingNo}`);
      return booking;
    } catch (error) {
      logger.error('Booking confirmation error:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason: string, userId?: string): Promise<IBookingDocument> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('bikeId', 'sku make model');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Check if user has permission to cancel (if userId provided)
      if (userId && booking.userId._id.toString() !== userId) {
        throw new ValidationError('You can only cancel your own bookings');
      }

      if (!booking.canBeCancelled()) {
        throw new ValidationError('Booking cannot be cancelled');
      }

      // Calculate refund amount
      const refundAmount = pricingService.calculateRefundAmount(booking);

      // Cancel the booking
      await booking.cancel(reason);
      booking.refundAmount = refundAmount;
      await booking.save();

      logger.info(`Booking cancelled: ${booking.bookingNo}`, {
        bookingId,
        reason,
        refundAmount,
      });

      return booking;
    } catch (error) {
      logger.error('Booking cancellation error:', error);
      throw error;
    }
  }

  /**
   * Start a booking (bike pickup)
   */
  async startBooking(bookingId: string, staffId?: string): Promise<IBookingDocument> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('bikeId', 'sku make model')
        .populate('stationPickupId', 'name');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'confirmed') {
        throw new ValidationError('Booking must be confirmed to start');
      }

      // Check if it's time to start the booking (within 1 hour of start time)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - booking.startAt.getTime()) / (1000 * 60 * 60);
      
      if (timeDiff > 1) {
        throw new ValidationError('Booking can only be started within 1 hour of the scheduled time');
      }

      // Start the booking
      await booking.markAsStarted();

      logger.info(`Booking started: ${booking.bookingNo}`, {
        bookingId,
        staffId,
        actualStartTime: booking.actualStartAt,
      });

      return booking;
    } catch (error) {
      logger.error('Booking start error:', error);
      throw error;
    }
  }

  /**
   * Complete a booking (bike return)
   */
  async completeBooking(bookingId: string, staffId?: string): Promise<IBookingDocument> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email')
        .populate('bikeId', 'sku make model')
        .populate('stationDropoffId', 'name');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'active') {
        throw new ValidationError('Booking must be active to complete');
      }

      // Complete the booking
      await booking.markAsCompleted();

      // Send completion email
      try {
        await this.sendBookingCompletionEmail(booking);
      } catch (emailError) {
        logger.error('Failed to send booking completion email:', emailError);
      }

      logger.info(`Booking completed: ${booking.bookingNo}`, {
        bookingId,
        staffId,
        actualEndTime: booking.actualEndAt,
        lateFee: booking.pricingBreakdown.lateFee,
      });

      return booking;
    } catch (error) {
      logger.error('Booking completion error:', error);
      throw error;
    }
  }

  /**
   * Get user's booking history
   */
  async getUserBookings(userId: string, page: number = 1, limit: number = 20): Promise<{
    bookings: IBookingDocument[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [bookings, total] = await Promise.all([
        Booking.find({ userId })
          .populate('bikeId', 'sku make model type images')
          .populate('stationPickupId', 'name code address')
          .populate('stationDropoffId', 'name code address')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Booking.countDocuments({ userId })
      ]);

      const pages = Math.ceil(total / limit);

      return { bookings, total, pages };
    } catch (error) {
      logger.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation email
   */
  private async sendBookingConfirmationEmail(booking: any): Promise<void> {
    // Implementation would depend on email service
    // This is a placeholder for the email sending logic
    logger.info(`Sending booking confirmation email for ${booking.bookingNo}`);
  }

  /**
   * Send booking completion email
   */
  private async sendBookingCompletionEmail(booking: any): Promise<void> {
    // Implementation would depend on email service
    // This is a placeholder for the email sending logic
    logger.info(`Sending booking completion email for ${booking.bookingNo}`);
  }
}

export const bookingService = new BookingService();
