import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { bookingsApi } from '../services/api/bookingsApi';
// Temporary type to fix import issues
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: bookingData, isLoading, error } = useQuery(
    ['booking', id],
    () => bookingsApi.getBooking(id!),
    { enabled: !!id }
  );

  const cancelMutation = useMutation(
    (reason: string) => bookingsApi.cancelBooking(id!, reason),
    {
      onSuccess: () => {
        toast.success('Booking cancelled successfully');
        queryClient.invalidateQueries(['booking', id]);
        setShowCancelModal(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to cancel booking');
      },
    }
  );

  const booking = bookingData?.data;

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const canCancelBooking = (booking: any) => {
    if (!booking) return false;
    return ['pending', 'confirmed'].includes(booking.status);
  };

  const handleCancelBooking = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking not found</h2>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <Link to="/bookings" className="btn-primary">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/bookings"
              className="btn-ghost mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Booking #{booking.bookingNo}
              </h1>
              <p className="text-gray-600">
                Created {format(new Date(booking.createdAt), 'PPp')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`badge ${getStatusColor(booking.status)} flex items-center`}>
              {getStatusIcon(booking.status)}
              <span className="ml-2 capitalize">{booking.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Timeline */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Booking Created</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.createdAt), 'PPp')}
                    </div>
                  </div>
                </div>

                {booking.status !== 'pending' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Booking Confirmed</div>
                      <div className="text-sm text-gray-600">Payment processed</div>
                    </div>
                  </div>
                )}

                {booking.actualStartAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Bike Picked Up</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.actualStartAt), 'PPp')}
                      </div>
                    </div>
                  </div>
                )}

                {booking.actualEndAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">Bike Returned</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.actualEndAt), 'PPp')}
                      </div>
                    </div>
                  </div>
                )}

                {booking.status === 'cancelled' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Booking Cancelled</div>
                      {booking.cancellationReason && (
                        <div className="text-sm text-gray-600">
                          Reason: {booking.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pickup</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(booking.startAt), 'PPP')}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(new Date(booking.startAt), 'h:mm a')}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {typeof booking.stationPickupId === 'object'
                        ? booking.stationPickupId.name
                        : 'Pickup Station'
                      }
                    </div>
                  </div>
                </div>

                {/* Dropoff Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dropoff</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(booking.endAt), 'PPP')}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(new Date(booking.endAt), 'h:mm a')}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {typeof booking.stationDropoffId === 'object'
                        ? booking.stationDropoffId.name
                        : 'Dropoff Station'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-2">Special Notes</h4>
                  <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span>₹{booking.pricingBreakdown.baseAmount}</span>
                </div>
                {booking.pricingBreakdown.surgeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Surge Charge:</span>
                    <span>₹{booking.pricingBreakdown.surgeAmount}</span>
                  </div>
                )}
                {booking.pricingBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{booking.pricingBreakdown.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({booking.pricingBreakdown.gstPercent}%):</span>
                  <span>₹{booking.pricingBreakdown.gstAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span>₹{booking.pricingBreakdown.deposit}</span>
                </div>
                {booking.pricingBreakdown.lateFee > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fee:</span>
                    <span>₹{booking.pricingBreakdown.lateFee}</span>
                  </div>
                )}
                <hr className="my-3" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{booking.pricingBreakdown.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bike Details */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bike Details</h3>
              
              {typeof booking.bikeId === 'object' && (
                <>
                  {/* Bike Image */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    {booking.bikeId.images && booking.bikeId.images.length > 0 ? (
                      <img
                        src={booking.bikeId.images[0]}
                        alt={`${booking.bikeId.make} ${booking.bikeId.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">
                    {booking.bikeId.make} {booking.bikeId.model}
                  </h4>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>SKU:</span>
                      <span>{booking.bikeId.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{booking.bikeId.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hourly Rate:</span>
                      <span>₹{booking.bikeId.hourlyRate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="btn-outline w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </button>

                {canCancelBooking(booking) && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

            {/* Support */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                <a href="tel:+919876543210" className="btn-outline w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Support
                </a>
                <a href="mailto:support@rideflowbikes.com" className="btn-outline w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Please provide a reason for cancellation..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-outline flex-1"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelMutation.isLoading}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
