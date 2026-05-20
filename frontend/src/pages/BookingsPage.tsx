import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Eye, 
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { bookingsApi } from '../services/api/bookingsApi';
// Temporary type to fix import issues
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

const BookingsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: bookingsData, isLoading, error } = useQuery(
    ['bookings', { page, limit, status: statusFilter, search: searchTerm }],
    () => bookingsApi.getBookings({
      page,
      limit,
      status: statusFilter || undefined,
      search: searchTerm || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    {
      keepPreviousData: true,
    }
  );

  const bookings = bookingsData?.data || [];
  const pagination = bookingsData?.pagination;

  const statusOptions: { value: BookingStatus | ''; label: string; color: string }[] = [
    { value: '', label: 'All Bookings', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const getStatusColor = (status: BookingStatus) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const formatBookingDuration = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Bookings</h1>
          <p className="text-gray-600">Track and manage your bike rental bookings</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by booking number or bike..."
                className="input pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
                className="input w-full"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`badge ${
                  statusFilter === option.value 
                    ? option.color 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load bookings. Please try again.</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">
              {statusFilter || searchTerm 
                ? 'Try adjusting your filters or search terms.'
                : "You haven't made any bookings yet."
              }
            </p>
            {!statusFilter && !searchTerm && (
              <Link to="/bikes" className="btn-primary">
                Browse Bikes
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="card-hover">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Booking #{booking.bookingNo}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Created {format(new Date(booking.createdAt), 'PPp')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`badge ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <Link
                          to={`/bookings/${booking._id}`}
                          className="btn-ghost btn-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </div>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Bike Info */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Bike</div>
                        <div className="font-medium">
                          {typeof booking.bikeId === 'object' 
                            ? `${booking.bikeId.make} ${booking.bikeId.model}`
                            : 'Bike Details'
                          }
                        </div>
                        {typeof booking.bikeId === 'object' && (
                          <div className="text-sm text-gray-600 capitalize">
                            {booking.bikeId.type}
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Duration</div>
                        <div className="font-medium">
                          {formatBookingDuration(booking.startAt, booking.endAt)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(booking.startAt), 'MMM d')} - {format(new Date(booking.endAt), 'MMM d')}
                        </div>
                      </div>

                      {/* Pickup Location */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Pickup</div>
                        <div className="font-medium">
                          {typeof booking.stationPickupId === 'object'
                            ? booking.stationPickupId.name
                            : 'Station'
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(booking.startAt), 'h:mm a')}
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                        <div className="font-medium text-lg text-primary-600">
                          ₹{booking.pricingBreakdown.total}
                        </div>
                        {booking.pricingBreakdown.discount > 0 && (
                          <div className="text-sm text-green-600">
                            ₹{booking.pricingBreakdown.discount} saved
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {booking.actualStartAt && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Started {format(new Date(booking.actualStartAt), 'h:mm a')}
                          </div>
                        )}
                        {booking.actualEndAt && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Returned {format(new Date(booking.actualEndAt), 'h:mm a')}
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/bookings/${booking._id}`}
                        className="btn-outline btn-sm group"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          pageNum === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
