import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { MapPin, Clock, Bike, Search, Navigation } from 'lucide-react';
import { stationsApi } from '../services/api/stationsApi';

// Temporary type to fix import issues
interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const StationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: stationsData, isLoading, error } = useQuery(
    ['stations', { search: searchTerm }],
    () => stationsApi.getStations({
      search: searchTerm || undefined,
      page: 1,
      limit: 50,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
    {
      keepPreviousData: true,
    }
  );

  const stations = stationsData?.data || [];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const calculateDistance = (station: Station) => {
    if (!userLocation || !station.geo?.coordinates) return null;
    
    const [stationLng, stationLat] = station.geo.coordinates;
    const R = 6371; // Earth's radius in kilometers
    const dLat = (stationLat - userLocation.lat) * Math.PI / 180;
    const dLng = (stationLng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  const sortedStations = userLocation 
    ? [...stations].sort((a, b) => {
        const distanceA = calculateDistance(a) || Infinity;
        const distanceB = calculateDistance(b) || Infinity;
        return distanceA - distanceB;
      })
    : stations;

  const formatOperatingHours = (station: Station) => {
    if (!station.operatingHours) return '24/7';
    
    const { openTime, closeTime } = station.operatingHours;
    return `${openTime} - ${closeTime}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bike Stations</h1>
          <p className="text-gray-600">Find convenient pickup and drop-off locations near you</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search and Location */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stations by name or location..."
                className="input pl-10 w-full"
              />
            </div>

            {/* Get Location Button */}
            <button
              onClick={getCurrentLocation}
              className="btn-outline whitespace-nowrap"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </button>
          </div>

          {userLocation && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              Location detected! Stations are now sorted by distance from you.
            </div>
          )}
        </div>

        {/* Stations List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load stations. Please try again.</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStations.map((station) => {
              const distance = userLocation ? calculateDistance(station) : null;
              
              return (
                <div key={station._id} className="card-hover">
                  <div className="p-6">
                    {/* Station Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {station.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Code: {station.code}
                        </p>
                        {distance && (
                          <p className="text-sm text-primary-600 font-medium">
                            {distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <span className={`badge ${
                        station.active ? 'badge-success' : 'badge-gray'
                      }`}>
                        {station.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start space-x-2 mb-4">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{station.address}</p>
                    </div>

                    {/* Operating Hours */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatOperatingHours(station)}
                      </span>
                    </div>

                    {/* Station Stats */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary-600">
                            {station.capacity || 0}
                          </div>
                          <div className="text-xs text-gray-600">Total Capacity</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-secondary-600">
                            {station.availableBikes || 0}
                          </div>
                          <div className="text-xs text-gray-600">Available Now</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button className="btn-primary w-full btn-sm">
                        <Bike className="w-4 h-4 mr-2" />
                        View Available Bikes
                      </button>
                      
                      {station.geo?.coordinates && (
                        <button
                          onClick={() => {
                            const [lng, lat] = station.geo!.coordinates;
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                            window.open(url, '_blank');
                          }}
                          className="btn-outline w-full btn-sm"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </button>
                      )}
                    </div>

                    {/* Contact Info */}
                    {(station.contactPhone || station.contactEmail) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {station.contactPhone && (
                            <div>Phone: {station.contactPhone}</div>
                          )}
                          {station.contactEmail && (
                            <div>Email: {station.contactEmail}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Map Integration Note */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Interactive Map Coming Soon
          </h3>
          <p className="text-blue-700">
            We're working on an interactive map to help you visualize station locations and plan your routes better.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StationsPage;
