import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addHours, addDays } from 'date-fns';
// Temporary types to fix import issues
import { z } from 'zod';

const BookingCreateSchema = z.object({
  bikeId: z.string(),
  stationPickupId: z.string(),
  stationDropoffId: z.string(),
  startAt: z.date(),
  endAt: z.date(),
});

type BookingCreate = z.infer<typeof BookingCreateSchema>;

interface BookingQuote {
  bikeId: string;
  stationPickupId: string;
  stationDropoffId: string;
  startAt: Date;
  endAt: Date;
}
import { bikesApi } from '../services/api/bikesApi';
import { bookingsApi } from '../services/api/bookingsApi';
import { stationsApi } from '../services/api/stationsApi';

const BookingPage: React.FC = () => {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingCreate>({
    resolver: zodResolver(BookingCreateSchema),
    defaultValues: {
      bikeId: bikeId!,
      stationPickupId: '',
      stationDropoffId: '',
      startAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    },
  });

  const watchedValues = watch();

  // Get bike details
  const { data: bikeData, isLoading: bikeLoading } = useQuery(
    ['bike', bikeId],
    () => bikesApi.getBike(bikeId!),
    { enabled: !!bikeId }
  );

  // Get stations
  const { data: stationsData } = useQuery(
    ['stations'],
    () => stationsApi.getStations({ page: 1, limit: 100 })
  );

  const bike = bikeData?.data;
  const stations = stationsData?.data?.stations || stationsData?.data || [];

  // Get quote mutation
  const getQuoteMutation = useMutation(
    (quoteData: BookingQuote) => bookingsApi.getQuote(quoteData),
    {
      onSuccess: (data) => {
        setQuote(data.data);
        setStep(2);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to get quote');
      },
    }
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    (bookingData: BookingCreate) => bookingsApi.createBooking(bookingData),
    {
      onSuccess: (data) => {
        toast.success('Booking created successfully!');
        navigate(`/bookings/${data.data.booking._id}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create booking');
      },
    }
  );

  const onSubmitStep1 = (data: BookingCreate) => {
    const quoteData: BookingQuote = {
      bikeId: data.bikeId,
      stationPickupId: data.stationPickupId,
      stationDropoffId: data.stationDropoffId,
      startAt: data.startAt,
      endAt: data.endAt,
    };
    getQuoteMutation.mutate(quoteData);
  };

  const onSubmitStep2 = (data: BookingCreate) => {
    createBookingMutation.mutate(data);
  };

  const setQuickDuration = (hours: number) => {
    const startAt = watchedValues.startAt;
    if (startAt) {
      setValue('endAt', addHours(new Date(startAt), hours));
    }
  };

  const setQuickDay = (days: number) => {
    const startAt = watchedValues.startAt;
    if (startAt) {
      setValue('endAt', addDays(new Date(startAt), days));
    }
  };

  if (bikeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg mb-4"></div>
          <p className="text-gray-600">Loading bike details...</p>
        </div>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bike not found</h2>
          <p className="text-gray-600 mb-6">The bike you're trying to book doesn't exist.</p>
          <button onClick={() => navigate('/bikes')} className="btn-primary">
            Back to Bikes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => step === 1 ? navigate(-1) : setStep(1)}
            className="btn-ghost mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Your Bike</h1>
            <p className="text-gray-600">
              {bike.make} {bike.model} - ₹{bike.hourlyRate}/hour
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Booking Details</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Review & Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 1 ? (
              <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    When do you need the bike?
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Start Date/Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Date & Time
                      </label>
                      <input
                        {...register('startAt', { valueAsDate: true })}
                        type="datetime-local"
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        className={`input ${errors.startAt ? 'input-error' : ''}`}
                      />
                      {errors.startAt && (
                        <p className="mt-1 text-sm text-red-600">{errors.startAt.message}</p>
                      )}
                    </div>

                    {/* End Date/Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Date & Time
                      </label>
                      <input
                        {...register('endAt', { valueAsDate: true })}
                        type="datetime-local"
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        className={`input ${errors.endAt ? 'input-error' : ''}`}
                      />
                      {errors.endAt && (
                        <p className="mt-1 text-sm text-red-600">{errors.endAt.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Duration Buttons */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Duration
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickDuration(2)}
                        className="btn-outline btn-sm"
                      >
                        2 hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDuration(4)}
                        className="btn-outline btn-sm"
                      >
                        4 hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDuration(8)}
                        className="btn-outline btn-sm"
                      >
                        8 hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDay(1)}
                        className="btn-outline btn-sm"
                      >
                        1 day
                      </button>
                    </div>
                  </div>

                  {/* Pickup/Dropoff Stations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Station
                      </label>
                      <select
                        {...register('stationPickupId')}
                        className={`input ${errors.stationPickupId ? 'input-error' : ''}`}
                      >
                        <option value="">Select pickup station</option>
                        {stations.map((station) => (
                          <option key={station._id} value={station._id}>
                            {station.name} - {station.code}
                          </option>
                        ))}
                      </select>
                      {errors.stationPickupId && (
                        <p className="mt-1 text-sm text-red-600">{errors.stationPickupId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dropoff Station
                      </label>
                      <select
                        {...register('stationDropoffId')}
                        className={`input ${errors.stationDropoffId ? 'input-error' : ''}`}
                      >
                        <option value="">Select dropoff station</option>
                        {stations.map((station) => (
                          <option key={station._id} value={station._id}>
                            {station.name} - {station.code}
                          </option>
                        ))}
                      </select>
                      {errors.stationDropoffId && (
                        <p className="mt-1 text-sm text-red-600">{errors.stationDropoffId.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code (Optional)
                    </label>
                    <input
                      {...register('couponCode')}
                      type="text"
                      placeholder="Enter coupon code"
                      className="input"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      placeholder="Any special requirements or notes..."
                      className="input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={getQuoteMutation.isLoading}
                    className="btn-primary w-full btn-lg"
                  >
                    {getQuoteMutation.isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner-sm mr-2"></div>
                        Getting Quote...
                      </div>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 mr-2" />
                        Get Quote
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review Your Booking
                    </h3>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Booking Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span>{format(new Date(watchedValues.startAt), 'PPp')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return:</span>
                        <span>{format(new Date(watchedValues.endAt), 'PPp')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span>{quote?.pricingBreakdown?.durationHours} hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {quote?.pricingBreakdown && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Amount:</span>
                          <span>₹{quote.pricingBreakdown.baseAmount}</span>
                        </div>
                        {quote.pricingBreakdown.surgeAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Surge Charge:</span>
                            <span>₹{quote.pricingBreakdown.surgeAmount}</span>
                          </div>
                        )}
                        {quote.pricingBreakdown.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-₹{quote.pricingBreakdown.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST ({quote.pricingBreakdown.gstPercent}%):</span>
                          <span>₹{quote.pricingBreakdown.gstAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Security Deposit:</span>
                          <span>₹{quote.pricingBreakdown.deposit}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total Amount:</span>
                          <span>₹{quote.pricingBreakdown.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={createBookingMutation.isLoading}
                    className="btn-primary w-full btn-lg"
                  >
                    {createBookingMutation.isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner-sm mr-2"></div>
                        Creating Booking...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Confirm & Pay
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Bike
              </h3>
              
              {/* Bike Image */}
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {bike.images && bike.images.length > 0 ? (
                  <img
                    src={bike.images[0]}
                    alt={`${bike.make} ${bike.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">
                {bike.make} {bike.model}
              </h4>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Hourly Rate:</span>
                  <span className="font-medium">₹{bike.hourlyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Rate:</span>
                  <span className="font-medium">₹{bike.dailyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit:</span>
                  <span className="font-medium">₹{bike.deposit}</span>
                </div>
              </div>

              {quote && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      ₹{quote.pricingBreakdown.total}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
