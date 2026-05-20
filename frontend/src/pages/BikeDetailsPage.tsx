import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Battery, 
  Bike, 
  Calendar,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bikesApi } from '../services/api/bikesApi';
import { useAuthStore } from '../store/authStore';
// Temporary type to fix import issues
enum BikeType {
  MOUNTAIN = 'mountain',
  ROAD = 'road',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  CITY = 'city'
}

const BikeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: bikeData, isLoading, error } = useQuery(
    ['bike', id],
    () => bikesApi.getBike(id!),
    {
      enabled: !!id,
    }
  );

  const bike = bikeData?.data;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a bike');
      navigate('/login', { state: { from: { pathname: `/book/${id}` } } });
      return;
    }
    navigate(`/book/${id}`);
  };

  const getBikeTypeColor = (type: BikeType) => {
    switch (type) {
      case 'city':
        return 'bg-blue-100 text-blue-800';
      case 'mountain':
        return 'bg-green-100 text-green-800';
      case 'road':
        return 'bg-purple-100 text-purple-800';
      case 'e-bike':
        return 'bg-yellow-100 text-yellow-800';
      case 'scooter':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const features = [
    { icon: Shield, label: 'Safety Certified', description: 'Regular safety inspections' },
    { icon: Clock, label: 'Flexible Timing', description: 'Hourly or daily rentals' },
    { icon: MapPin, label: 'Multiple Locations', description: 'Convenient pickup/dropoff' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-video bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bike) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bike not found</h2>
          <p className="text-gray-600 mb-6">The bike you're looking for doesn't exist or has been removed.</p>
          <Link to="/bikes" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bikes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Back Button */}
        <Link
          to="/bikes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bikes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
              {bike.images && bike.images.length > 0 ? (
                <img
                  src={bike.images[selectedImage]}
                  alt={`${bike.make} ${bike.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bike className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {bike.images && bike.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {bike.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${bike.make} ${bike.model} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bike Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`badge ${getBikeTypeColor(bike.type as BikeType)}`}>
                  {bike.type === 'e-bike' ? <Battery className="w-4 h-4 mr-1" /> : <Bike className="w-4 h-4 mr-1" />}
                  <span className="capitalize">{bike.type}</span>
                </span>
                <span className={`badge ${
                  bike.status === 'available' ? 'badge-success' : 'badge-gray'
                }`}>
                  {bike.status === 'available' ? 'Available' : 'Not Available'}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bike.make} {bike.model}
              </h1>

              {bike.stationId && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {typeof bike.stationId === 'object' ? bike.stationId.name : 'Station'}
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">₹{bike.hourlyRate}</div>
                  <div className="text-sm text-gray-600">per hour</div>
                </div>
                <div className="text-center p-4 bg-secondary-50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-600">₹{bike.dailyRate}</div>
                  <div className="text-sm text-gray-600">per day</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">₹{bike.deposit}</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <span className="ml-2 font-medium">{bike.sku}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">{bike.type}</span>
                </div>
                {bike.type === 'e-bike' && bike.batteryLevel && (
                  <div>
                    <span className="text-gray-600">Battery:</span>
                    <span className="ml-2 font-medium">{bike.batteryLevel}%</span>
                  </div>
                )}
                {bike.specifications && Object.entries(bike.specifications).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="ml-2 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{feature.label}</div>
                      <div className="text-sm text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
                {bike.type === 'e-bike' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Electric Powered</div>
                      <div className="text-sm text-gray-600">Eco-friendly electric motor assistance</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Now Button */}
            <div className="sticky bottom-4">
              <button
                onClick={handleBookNow}
                disabled={bike.status !== 'available'}
                className={`w-full btn-lg ${
                  bike.status === 'available' 
                    ? 'btn-primary' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {bike.status === 'available' ? 'Book This Bike' : 'Not Available'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailsPage;
