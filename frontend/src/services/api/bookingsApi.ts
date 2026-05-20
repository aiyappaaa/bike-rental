import { api } from './client';
interface Booking {
  id: string;
  userId: string;
  bikeId: string;
  stationPickupId: string;
  stationDropoffId: string;
  startAt: string;
  endAt: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface BookingQuote {
  bikeId: string;
  stationPickupId: string;
  stationDropoffId: string;
  startAt: Date;
  endAt: Date;
}

interface BookingQuoteResponse {
  quote: {
    bikeId: string;
    stationPickupId: string;
    stationDropoffId: string;
    startAt: string;
    endAt: string;
    duration: number;
    hourlyRate: number;
    dailyRate: number;
    totalAmount: number;
    breakdown: {
      hours: number;
      days: number;
      hourlyAmount: number;
      dailyAmount: number;
    };
  };
}

interface BookingCreate {
  bikeId: string;
  stationPickupId: string;
  stationDropoffId: string;
  startAt: Date;
  endAt: Date;
}

interface BookingQuery {
  status?: string;
  page?: number;
  limit?: number;
}



// Temporary ApiResponse type to fix import issues
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BookingCreateResponse {
  booking: Booking;
  requiresPayment: boolean;
  paymentAmount?: number;
}

export const bookingsApi = {
  // Get pricing quote
  getQuote: (quoteData: BookingQuote): Promise<ApiResponse<BookingQuoteResponse>> =>
    api.post('/bookings/quote', quoteData),

  // Create booking
  createBooking: (bookingData: BookingCreate): Promise<ApiResponse<BookingCreateResponse>> =>
    api.post('/bookings', bookingData),

  // Get user bookings
  getBookings: (params?: BookingQuery): Promise<ApiResponse<Booking[]>> =>
    api.get('/bookings', { params }),

  // Get booking by ID
  getBooking: (id: string): Promise<ApiResponse<Booking>> =>
    api.get(`/bookings/${id}`),

  // Get booking by booking number
  getBookingByNumber: (bookingNo: string): Promise<ApiResponse<Booking>> =>
    api.get(`/bookings/number/${bookingNo}`),

  // Cancel booking
  cancelBooking: (id: string, reason: string): Promise<ApiResponse<Booking>> =>
    api.post(`/bookings/${id}/cancel`, { reason }),

  // Confirm booking (after payment)
  confirmBooking: (id: string): Promise<ApiResponse<Booking>> =>
    api.post(`/bookings/${id}/confirm`),
};
