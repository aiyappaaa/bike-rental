import { Bike, IBikeDocument } from '@/models/Bike';
import { Booking } from '@/models/Booking';
import { Station } from '@/models/Station';
import { BikeType, BikeAvailability, BikeWithAvailability } from '@rideflow/shared';
import { logger } from '@/utils/logger';

export interface AvailabilityQuery {
  stationId?: string;
  bikeType?: BikeType;
  startAt: Date;
  endAt: Date;
  excludeBookingId?: string;
}

export interface StationAvailability {
  stationId: string;
  stationName: string;
  totalBikes: number;
  availableBikes: number;
  bikesByType: Record<BikeType, number>;
}

class AvailabilityService {
  /**
   * Check if a specific bike is available for the given period
   */
  async isBikeAvailable(bikeId: string, startAt: Date, endAt: Date, excludeBookingId?: string): Promise<boolean> {
    try {
      const bike = await Bike.findById(bikeId);
      if (!bike || !bike.isAvailable()) {
        return false;
      }

      // Check for overlapping bookings
      const query: any = {
        bikeId,
        status: { $in: ['confirmed', 'active'] },
        $or: [
          { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
        ],
      };

      // Exclude specific booking (useful for updates)
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }

      const conflictingBooking = await Booking.findOne(query);
      return !conflictingBooking;
    } catch (error) {
      logger.error('Error checking bike availability:', error);
      return false;
    }
  }

  /**
   * Find available bikes based on criteria
   */
  async findAvailableBikes(query: AvailabilityQuery): Promise<BikeWithAvailability[]> {
    try {
      const { stationId, bikeType, startAt, endAt, excludeBookingId } = query;

      // Build bike query
      const bikeQuery: any = { status: 'available' };
      if (stationId) {
        bikeQuery.stationId = stationId;
      }
      if (bikeType) {
        bikeQuery.type = bikeType;
      }

      // Get all potentially available bikes
      const bikes = await Bike.find(bikeQuery).populate('stationId', 'name code address');

      // Check availability for each bike
      const availableBikes: BikeWithAvailability[] = [];
      
      for (const bike of bikes) {
        const isAvailable = await this.isBikeAvailable(bike._id.toString(), startAt, endAt, excludeBookingId);
        
        const bikeWithAvailability: BikeWithAvailability = {
          ...bike.toObject(),
          isAvailable,
          nextAvailableAt: undefined,
        };

        if (!isAvailable) {
          // Find when this bike becomes available next
          bikeWithAvailability.nextAvailableAt = await this.getNextAvailableTime(bike._id.toString(), startAt);
        }

        availableBikes.push(bikeWithAvailability);
      }

      // Sort by availability first, then by price
      availableBikes.sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.hourlyRate - b.hourlyRate;
      });

      logger.info(`Found ${availableBikes.filter(b => b.isAvailable).length} available bikes out of ${availableBikes.length} total`);

      return availableBikes;
    } catch (error) {
      logger.error('Error finding available bikes:', error);
      throw error;
    }
  }

  /**
   * Get availability summary for a station
   */
  async getStationAvailability(stationId: string, startAt: Date, endAt: Date): Promise<StationAvailability> {
    try {
      const station = await Station.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      // Get all bikes at this station
      const allBikes = await Bike.find({ stationId });
      const totalBikes = allBikes.length;

      // Check availability for each bike
      let availableBikes = 0;
      const bikesByType: Record<BikeType, number> = {
        city: 0,
        mountain: 0,
        road: 0,
        'e-bike': 0,
        scooter: 0,
      };

      for (const bike of allBikes) {
        const isAvailable = await this.isBikeAvailable(bike._id.toString(), startAt, endAt);
        if (isAvailable) {
          availableBikes++;
          bikesByType[bike.type as BikeType]++;
        }
      }

      return {
        stationId,
        stationName: station.name,
        totalBikes,
        availableBikes,
        bikesByType,
      };
    } catch (error) {
      logger.error('Error getting station availability:', error);
      throw error;
    }
  }

  /**
   * Get availability for multiple stations
   */
  async getMultipleStationAvailability(stationIds: string[], startAt: Date, endAt: Date): Promise<StationAvailability[]> {
    try {
      const availabilities = await Promise.all(
        stationIds.map(stationId => this.getStationAvailability(stationId, startAt, endAt))
      );

      return availabilities;
    } catch (error) {
      logger.error('Error getting multiple station availability:', error);
      throw error;
    }
  }

  /**
   * Find when a bike becomes available next
   */
  private async getNextAvailableTime(bikeId: string, afterTime: Date): Promise<Date | undefined> {
    try {
      // Find the earliest ending booking that starts after the requested time
      const nextBooking = await Booking.findOne({
        bikeId,
        status: { $in: ['confirmed', 'active'] },
        startAt: { $gte: afterTime },
      }).sort({ endAt: 1 });

      return nextBooking ? nextBooking.endAt : undefined;
    } catch (error) {
      logger.error('Error finding next available time:', error);
      return undefined;
    }
  }

  /**
   * Check if there are any conflicts for a booking
   */
  async checkBookingConflicts(bikeId: string, startAt: Date, endAt: Date, excludeBookingId?: string): Promise<boolean> {
    try {
      const conflictingBookings = await Booking.findConflictingBookings(bikeId, startAt, endAt);
      
      if (excludeBookingId) {
        return conflictingBookings.some(booking => booking._id.toString() !== excludeBookingId);
      }
      
      return conflictingBookings.length > 0;
    } catch (error) {
      logger.error('Error checking booking conflicts:', error);
      return true; // Assume conflict on error for safety
    }
  }

  /**
   * Reserve a bike temporarily (for payment processing)
   */
  async reserveBike(bikeId: string, startAt: Date, endAt: Date, reservationMinutes: number = 15): Promise<boolean> {
    try {
      // Check if bike is still available
      const isAvailable = await this.isBikeAvailable(bikeId, startAt, endAt);
      if (!isAvailable) {
        return false;
      }

      // TODO: Implement temporary reservation logic
      // This could involve creating a temporary booking record or using Redis
      // For now, we'll just return true if the bike is available
      
      logger.info(`Bike ${bikeId} reserved for ${reservationMinutes} minutes`);
      return true;
    } catch (error) {
      logger.error('Error reserving bike:', error);
      return false;
    }
  }

  /**
   * Release a bike reservation
   */
  async releaseBikeReservation(bikeId: string): Promise<void> {
    try {
      // TODO: Implement reservation release logic
      logger.info(`Bike ${bikeId} reservation released`);
    } catch (error) {
      logger.error('Error releasing bike reservation:', error);
    }
  }

  /**
   * Get real-time availability for a station (current moment)
   */
  async getCurrentStationAvailability(stationId: string): Promise<{
    totalBikes: number;
    availableBikes: number;
    rentedBikes: number;
    maintenanceBikes: number;
    bikesByType: Record<BikeType, { total: number; available: number }>;
  }> {
    try {
      const bikes = await Bike.find({ stationId });
      
      let availableBikes = 0;
      let rentedBikes = 0;
      let maintenanceBikes = 0;
      
      const bikesByType: Record<BikeType, { total: number; available: number }> = {
        city: { total: 0, available: 0 },
        mountain: { total: 0, available: 0 },
        road: { total: 0, available: 0 },
        'e-bike': { total: 0, available: 0 },
        scooter: { total: 0, available: 0 },
      };

      for (const bike of bikes) {
        bikesByType[bike.type as BikeType].total++;
        
        switch (bike.status) {
          case 'available':
            availableBikes++;
            bikesByType[bike.type as BikeType].available++;
            break;
          case 'rented':
            rentedBikes++;
            break;
          case 'maintenance':
          case 'inactive':
            maintenanceBikes++;
            break;
        }
      }

      return {
        totalBikes: bikes.length,
        availableBikes,
        rentedBikes,
        maintenanceBikes,
        bikesByType,
      };
    } catch (error) {
      logger.error('Error getting current station availability:', error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
