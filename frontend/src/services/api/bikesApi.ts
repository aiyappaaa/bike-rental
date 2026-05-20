// Temporary types to fix import issues
interface Bike {
  id: string;
  name: string;
  type: string;
  description: string;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string;
  features: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BikeWithAvailability extends Bike {
  isAvailable: boolean;
  availableAt?: string;
}

interface BikeQuery {
  type?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  available?: boolean;
  page?: number;
  limit?: number;
}

enum BikeType {
  MOUNTAIN = 'mountain',
  ROAD = 'road',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  CITY = 'city'
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

export interface BikesResponse {
  bikes: Bike[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AvailableBikesResponse {
  bikes: BikeWithAvailability[];
  meta: {
    totalFound: number;
    availableCount: number;
  };
}

export interface BikeAvailabilityResponse {
  bikeId: string;
  isAvailable: boolean;
  period: {
    startAt: Date;
    endAt: Date;
  };
}

export const bikesApi = {
  // Get all bikes with filters
  getBikes: (params: BikeQuery): Promise<ApiResponse<Bike[]>> =>
    api.get('/bikes', { params }),

  // Get available bikes for a time period
  getAvailableBikes: (params: {
    startAt: string;
    endAt: string;
    stationId?: string;
    bikeType?: BikeType;
  }): Promise<ApiResponse<BikeWithAvailability[]>> =>
    api.get('/bikes/available', { params }),

  // Search bikes
  searchBikes: (query: string): Promise<ApiResponse<Bike[]>> =>
    api.get('/bikes/search', { params: { q: query } }),

  // Get bike by ID
  getBike: (id: string): Promise<ApiResponse<Bike>> =>
    api.get(`/bikes/${id}`),

  // Check bike availability
  checkAvailability: (id: string, startAt: string, endAt: string): Promise<ApiResponse<BikeAvailabilityResponse>> =>
    api.get(`/bikes/${id}/availability`, { params: { startAt, endAt } }),
};
