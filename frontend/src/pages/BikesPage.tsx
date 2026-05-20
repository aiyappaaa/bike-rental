import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, Filter, MapPin, Star, Clock, Battery, Bike } from 'lucide-react';
import { bikesApi } from '../services/api/bikesApi';

// Temporary type to fix import issues
enum BikeType {
  MOUNTAIN = 'mountain',
  ROAD = 'road',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  CITY = 'city'
}

const BikesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState<BikeType | ''>((searchParams.get('type') as BikeType) || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');

  const { data: bikesData, isLoading, error } = useQuery(
    ['bikes', { page, limit, search: searchTerm, type: selectedType, ...priceRange }],
    () => bikesApi.getBikes({
      page,
      limit,
      search: searchTerm || undefined,
      type: selectedType || undefined,
      minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
      sortBy: 'price',
      sortOrder: 'asc',
    }),
    {
      keepPreviousData: true,
    }
  );

  const bikes = bikesData?.data || [];
  const pagination = bikesData?.pagination;

  const bikeTypes: { value: BikeType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'city', label: 'City Bike' },
    { value: 'mountain', label: 'Mountain Bike' },
    { value: 'road', label: 'Road Bike' },
    { value: 'e-bike', label: 'E-Bike' },
    { value: 'scooter', label: 'Scooter' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const updateFilters = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedType) params.set('type', selectedType);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setPriceRange({ min: '', max: '' });
    setSearchParams({});
  };

  const getBikeTypeIcon = (type: BikeType) => {
    switch (type) {
      case 'e-bike':
        return <Battery className="w-4 h-4" />;
      default:
        return <Bike className="w-4 h-4" />;
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Bikes</h1>
          <p className="text-gray-600">Find the perfect bike for your journey</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn-ghost btn-sm"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <form onSubmit={handleSearch}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search bikes..."
                      className="input pl-10"
                    />
                  </div>
                </form>

                {/* Bike Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bike Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as BikeType | '')}
                    className="input"
                  >
                    {bikeTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (₹/hour)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="space-y-2">
                  <button
                    onClick={updateFilters}
                    className="btn-primary w-full"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="btn-outline w-full"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bikes Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load bikes. Please try again.</p>
              </div>
            ) : bikes.length === 0 ? (
              <div className="text-center py-12">
                <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bikes found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    Showing {bikes.length} of {pagination?.total || 0} bikes
                  </p>
                </div>

                {/* Bikes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {bikes.map((bike) => (
                    <Link
                      key={bike._id}
                      to={`/bikes/${bike._id}`}
                      className="card-hover group"
                    >
                      {/* Bike Image */}
                      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                        {bike.images && bike.images.length > 0 ? (
                          <img
                            src={bike.images[0]}
                            alt={`${bike.make} ${bike.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Bike className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Bike Type Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`badge ${getBikeTypeColor(bike.type as BikeType)}`}>
                            {getBikeTypeIcon(bike.type as BikeType)}
                            <span className="ml-1 capitalize">{bike.type}</span>
                          </span>
                          {bike.type === 'e-bike' && bike.batteryLevel && (
                            <span className="text-sm text-gray-500">
                              {bike.batteryLevel}% battery
                            </span>
                          )}
                        </div>

                        {/* Bike Details */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {bike.make} {bike.model}
                        </h3>
                        
                        {bike.stationId && (
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            {typeof bike.stationId === 'object' ? bike.stationId.name : 'Station'}
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary-600">
                              ₹{bike.hourlyRate}
                            </span>
                            <span className="text-sm text-gray-500">/hour</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Daily rate</div>
                            <div className="font-semibold text-gray-900">₹{bike.dailyRate}</div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <span className={`badge ${
                            bike.status === 'available' 
                              ? 'badge-success' 
                              : 'badge-gray'
                          }`}>
                            {bike.status === 'available' ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </Link>
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
                            onClick={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set('page', pageNum.toString());
                              setSearchParams(params);
                            }}
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
      </div>
    </div>
  );
};

export default BikesPage;
