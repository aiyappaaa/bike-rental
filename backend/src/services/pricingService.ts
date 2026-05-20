import { 
  PricingBreakdown, 
  BikeType,
  isWeekend,
  calculateDurationHours,
} from '@rideflow/shared';
import { Bike } from '../models/Bike';
import { Coupon } from '../models/Coupon';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';

export interface PricingOptions {
  bikeId: string;
  startAt: Date;
  endAt: Date;
  couponCode?: string;
  userId?: string;
}

export interface PricingResult {
  pricingBreakdown: PricingBreakdown;
  validUntil: Date;
  warnings?: string[];
}

class PricingService {
  /**
   * Calculate pricing for a bike rental
   */
  async calculatePricing(options: PricingOptions): Promise<PricingResult> {
    try {
      const { bikeId, startAt, endAt, couponCode, userId } = options;
      const warnings: string[] = [];

      // Get bike details
      const bike = await Bike.findById(bikeId);
      if (!bike) {
        throw new Error('Bike not found');
      }

      // Calculate duration
      const durationHours = calculateDurationHours(startAt, endAt);
      if (durationHours < appConfig.bookingPolicy.minDurationHours) {
        throw new Error(`Minimum booking duration is ${appConfig.bookingPolicy.minDurationHours} hours`);
      }

      if (durationHours > appConfig.bookingPolicy.maxDurationHours) {
        throw new Error(`Maximum booking duration is ${appConfig.bookingPolicy.maxDurationHours} hours`);
      }

      // Calculate base amount using mixed hourly/daily rates
      const baseAmount = this.calculateBaseAmount(bike.hourlyRate, bike.dailyRate, durationHours);

      // Calculate surge multiplier
      const surgeMultiplier = this.calculateSurgeMultiplier(startAt, endAt);
      if (surgeMultiplier > 1) {
        warnings.push(`Surge pricing applied (${Math.round((surgeMultiplier - 1) * 100)}% increase)`);
      }

      // Apply coupon discount if provided
      let discount = 0;
      let couponApplied = false;
      if (couponCode && userId) {
        try {
          const couponDiscount = await this.applyCoupon(couponCode, userId, bike.type, baseAmount * surgeMultiplier);
          discount = couponDiscount;
          couponApplied = true;
        } catch (error) {
          warnings.push(`Coupon "${couponCode}" could not be applied: ${(error as Error).message}`);
        }
      }

      // Calculate final pricing breakdown
      const pricingBreakdown: PricingBreakdown = {
        baseAmount,
        hourlyRate: bike.hourlyRate,
        dailyRate: bike.dailyRate,
        durationHours,
        subtotal: baseAmount * surgeMultiplier - discount,
        gstPercent: appConfig.pricing.gstPercent,
        gstAmount: 0,
        deposit: bike.deposit,
        lateFee: 0,
        discount,
        surgeMultiplier,
        surgeAmount: baseAmount * (surgeMultiplier - 1),
        total: 0,
      };

      // Calculate GST and total
      pricingBreakdown.gstAmount = (pricingBreakdown.subtotal * pricingBreakdown.gstPercent) / 100;
      pricingBreakdown.total = pricingBreakdown.subtotal + pricingBreakdown.gstAmount + pricingBreakdown.deposit;

      // Round all amounts to 2 decimal places
      Object.keys(pricingBreakdown).forEach(key => {
        if (typeof pricingBreakdown[key as keyof PricingBreakdown] === 'number') {
          (pricingBreakdown as any)[key] = Math.round((pricingBreakdown as any)[key] * 100) / 100;
        }
      });

      // Quote is valid for 15 minutes
      const validUntil = new Date(Date.now() + 15 * 60 * 1000);

      logger.info(`Pricing calculated for bike ${bikeId}: ₹${pricingBreakdown.total}`, {
        bikeId,
        durationHours,
        baseAmount,
        surgeMultiplier,
        discount,
        total: pricingBreakdown.total,
        couponApplied,
      });

      return {
        pricingBreakdown,
        validUntil,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error('Pricing calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate base amount using mixed hourly/daily rates
   */
  private calculateBaseAmount(hourlyRate: number, dailyRate: number, durationHours: number): number {
    // If rental is 24+ hours, use daily rate for full days and hourly for remainder
    if (durationHours >= 24) {
      const fullDays = Math.floor(durationHours / 24);
      const remainingHours = durationHours % 24;
      
      // If remaining hours are more than 8, it's cheaper to book another full day
      if (remainingHours > 8) {
        return (fullDays + 1) * dailyRate;
      } else {
        return fullDays * dailyRate + remainingHours * hourlyRate;
      }
    } else {
      // For rentals less than 24 hours, check if daily rate is cheaper
      const hourlyTotal = durationHours * hourlyRate;
      return Math.min(hourlyTotal, dailyRate);
    }
  }

  /**
   * Calculate surge multiplier based on time and demand
   */
  private calculateSurgeMultiplier(startAt: Date, endAt: Date): number {
    if (!appConfig.surgeConfig.enabled) {
      return 1;
    }

    let maxMultiplier = 1;

    // Check if rental period includes peak hours
    const startHour = startAt.getHours();
    const endHour = endAt.getHours();
    
    const hasPeakHours = appConfig.surgeConfig.peakHours.some(hour => 
      hour >= startHour && hour <= endHour
    );

    if (hasPeakHours) {
      maxMultiplier = Math.max(maxMultiplier, appConfig.surgeConfig.peakMultiplier);
    }

    // Check if rental includes weekend
    if (isWeekend(startAt) || isWeekend(endAt)) {
      maxMultiplier = Math.max(maxMultiplier, appConfig.surgeConfig.weekendMultiplier);
    }

    return maxMultiplier;
  }

  /**
   * Apply coupon discount
   */
  private async applyCoupon(couponCode: string, userId: string, bikeType: BikeType, amount: number): Promise<number> {
    const coupon = await Coupon.findByCode(couponCode);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (!coupon.isValid()) {
      throw new Error('Coupon is not valid or has expired');
    }

    if (!coupon.isValidForUser(userId)) {
      throw new Error('Coupon is not valid for this user');
    }

    if (!coupon.isValidForBikeType(bikeType)) {
      throw new Error('Coupon is not valid for this bike type');
    }

    if (amount < coupon.minAmount) {
      throw new Error(`Minimum order amount for this coupon is ₹${coupon.minAmount}`);
    }

    return coupon.calculateDiscount(amount);
  }

  /**
   * Validate pricing quote
   */
  async validateQuote(bikeId: string, pricingBreakdown: PricingBreakdown, quotedAt: Date): Promise<boolean> {
    try {
      // Check if quote is still valid (15 minutes)
      const now = new Date();
      const quoteAge = (now.getTime() - quotedAt.getTime()) / (1000 * 60); // minutes
      
      if (quoteAge > 15) {
        return false;
      }

      // Recalculate pricing to ensure it hasn't changed
      const bike = await Bike.findById(bikeId);
      if (!bike) {
        return false;
      }

      // Basic validation - rates should match
      if (bike.hourlyRate !== pricingBreakdown.hourlyRate || 
          bike.dailyRate !== pricingBreakdown.dailyRate ||
          bike.deposit !== pricingBreakdown.deposit) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Quote validation error:', error);
      return false;
    }
  }

  /**
   * Calculate late fee for overdue rentals
   */
  calculateLateFee(endAt: Date, actualEndAt: Date): number {
    if (actualEndAt <= endAt) {
      return 0;
    }

    const hoursLate = Math.ceil((actualEndAt.getTime() - endAt.getTime()) / (1000 * 60 * 60));
    return hoursLate * appConfig.pricing.lateFeePerHour;
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  calculateRefundAmount(booking: any): number {
    const now = new Date();
    const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Full refund if cancelled 24+ hours before
    if (hoursUntilStart >= appConfig.bookingPolicy.fullRefundHoursBefore) {
      return booking.pricingBreakdown.total - booking.pricingBreakdown.deposit;
    }
    
    // Partial refund if cancelled 2+ hours before
    if (hoursUntilStart >= appConfig.bookingPolicy.partialRefundHoursBefore) {
      const refundableAmount = booking.pricingBreakdown.total - booking.pricingBreakdown.deposit;
      return refundableAmount * (appConfig.bookingPolicy.partialRefundPercent / 100);
    }
    
    // No refund if cancelled less than 2 hours before
    return 0;
  }
}

export const pricingService = new PricingService();