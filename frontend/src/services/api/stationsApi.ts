// Temporary types to fix import issues
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

interface StationQuery {
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

import { api } from './client';

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

export interface StationAvailability {
  stationId: string;
  stationName: string;
  totalBikes: number;
  availableBikes: number;
  bikesByType: Record<string, number>;
}

export interface CurrentStationAvailability {
  totalBikes: number;
  availableBikes: number;
  rentedBikes: number;
  maintenanceBikes: number;
  bikesByType: Record<string, { total: number; available: number }>;
}

export const stationsApi = {
  // Get all stations
  getStations: (params?: StationQuery): Promise<ApiResponse<Station[]>> =>
    api.get('/stations', { params }),

  // Get nearby stations
  getNearbyStations: (lat: number, lng: number, radius?: number): Promise<ApiResponse<Station[]>> =>
    api.get('/stations/nearby', { params: { lat, lng, radius } }),

  // Get station by ID
  getStation: (id: string): Promise<ApiResponse<Station>> =>
    api.get(`/stations/${id}`),

  // Get real-time station availability
  getStationAvailability: (id: string): Promise<ApiResponse<CurrentStationAvailability>> =>
    api.get(`/stations/${id}/availability`),

  // Get station availability for a time period
  getStationAvailabilityForPeriod: (
    id: string, 
    startAt: string, 
    endAt: string
  ): Promise<ApiResponse<StationAvailability>> =>
    api.get(`/stations/${id}/availability/period`, { params: { startAt, endAt } }),

  // Get bikes at station
  getStationBikes: (id: string): Promise<ApiResponse<any[]>> =>
    api.get(`/stations/${id}/bikes`),
};
