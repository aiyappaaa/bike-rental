import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  Bike, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { bikesApi } from '../services/api/bikesApi';
import { stationsApi } from '../services/api/stationsApi';
import { bookingsApi } from '../services/api/bookingsApi';

// Temporary types for admin data
interface AdminStats {
  totalBikes: number;
  totalStations: number;
  totalBookings: number;
  totalRevenue: number;
  activeBikes: number;
  activeStations: number;
}

interface Bike {
  id: string;
  sku: string;
  make: string;
  model: string;
  type: string;
  size: string;
  color: string;
  hourlyRate: number;
  dailyRate: number;
  status: string;
  stationId: string;
}

interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  capacity: number;
  active: boolean;
}

interface Booking {
  id: string;
  bookingNo: string;
  userId: string;
  bikeId: string;
  stationPickupId: string;
  stationDropoffId: string;
  startAt: string;
  endAt: string;
  durationHours: number;
  status: string;
  pricingBreakdown: {
    total: number;
    deposit: number;
    hourlyRate: number;
    dailyRate: number;
  };
  paymentStatus: string;
  notes?: string;
  user?: {
    name: string;
    email: string;
  };
  bike?: {
    make: string;
    model: string;
    sku: string;
  };
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bikes' | 'stations' | 'bookings'>('overview');
  const { user, isAuthenticated } = useAuthStore();

  // Fetch bikes data
  const { data: bikesData, isLoading: bikesLoading } = useQuery(
    'admin-bikes',
    () => bikesApi.getBikes({ page: 1, limit: 100 }),
    { keepPreviousData: true }
  );

  // Fetch stations data
  const { data: stationsData, isLoading: stationsLoading } = useQuery(
    'admin-stations',
    () => stationsApi.getStations({ page: 1, limit: 100 }),
    { keepPreviousData: true }
  );

  // Fetch bookings data (only if authenticated)
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useQuery(
    'admin-bookings',
    () => bookingsApi.getBookings({ page: 1, limit: 100 }),
    {
      keepPreviousData: true,
      enabled: isAuthenticated,
      retry: false,
      onError: (error) => {
        console.log('Bookings API error:', error);
      }
    }
  );

  const bikes = bikesData?.data?.bikes || [];
  const stations = stationsData?.data?.stations || [];

  // Mock bookings data as fallback when API fails
  const mockBookings = [
    {
      id: '1',
      bookingNo: 'RFB-20250101-0001',
      userId: '1',
      bikeId: '1',
      stationPickupId: '1',
      stationDropoffId: '1',
      startAt: '2025-01-15T09:00:00Z',
      endAt: '2025-01-15T17:00:00Z',
      durationHours: 8,
      status: 'completed',
      pricingBreakdown: {
        total: 132,
        deposit: 100,
        hourlyRate: 15,
        dailyRate: 80
      },
      paymentStatus: 'paid',
      notes: 'Great ride through the mountain trails!',
      user: { name: 'John Doe', email: 'john.doe@example.com' },
      bike: { make: 'Trek', model: 'Mountain Explorer Pro', sku: 'MTN-001' }
    },
    {
      id: '2',
      bookingNo: 'RFB-20250102-0001',
      userId: '2',
      bikeId: '2',
      stationPickupId: '2',
      stationDropoffId: '2',
      startAt: '2025-01-16T10:00:00Z',
      endAt: '2025-01-16T14:00:00Z',
      durationHours: 4,
      status: 'active',
      pricingBreakdown: {
        total: 44,
        deposit: 75,
        hourlyRate: 10,
        dailyRate: 50
      },
      paymentStatus: 'paid',
      notes: 'City commute to work',
      user: { name: 'Jane Smith', email: 'jane.smith@example.com' },
      bike: { make: 'Giant', model: 'City Cruiser Deluxe', sku: 'CTY-001' }
    }
  ];

  const bookings = bookingsData?.data?.bookings || (bookingsError ? mockBookings : []);

  // Calculate admin stats
  const totalRevenue = bookings.reduce((sum: number, booking: any) => {
    return sum + (booking.pricingBreakdown?.total || 0);
  }, 0);

  const adminStats: AdminStats = {
    totalBikes: bikes.length,
    totalStations: stations.length,
    totalBookings: bookings.length,
    totalRevenue: totalRevenue,
    activeBikes: bikes.filter((bike: any) => bike.status === 'available').length,
    activeStations: stations.filter((station: any) => station.active).length,
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const BikeTable: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Bikes Management</h3>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Bike
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bike Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bikes.map((bike: any) => (
              <tr key={bike.id || bike._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {bike.make} {bike.model}
                    </div>
                    <div className="text-sm text-gray-500">SKU: {bike.sku}</div>
                    <div className="text-sm text-gray-500">Color: {bike.color}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{bike.type}</div>
                  <div className="text-sm text-gray-500">Size: {bike.size}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${bike.hourlyRate}/hr</div>
                  <div className="text-sm text-gray-500">${bike.dailyRate}/day</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bike.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : bike.status === 'rented'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bike.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const StationTable: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Stations Management</h3>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Station
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Station Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stations.map((station: any) => (
              <tr key={station.id || station._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{station.name}</div>
                    <div className="text-sm text-gray-500">Code: {station.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{station.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{station.capacity} bikes</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    station.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {station.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BookingTable: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Bookings Management</h3>
        <div className="flex space-x-2">
          <select className="input text-sm">
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bike & Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                  <p className="text-gray-600">
                    {!isAuthenticated
                      ? "Please log in to view bookings data."
                      : "No bookings have been made yet."}
                  </p>
                </td>
              </tr>
            ) : (
              bookings.map((booking: any) => (
              <tr key={booking.id || booking._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.bookingNo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.notes && booking.notes.length > 30
                        ? `${booking.notes.substring(0, 30)}...`
                        : booking.notes || 'No notes'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.user?.email || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.bike?.make} {booking.bike?.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.durationHours}h • SKU: {booking.bike?.sku}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {new Date(booking.startAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      ${booking.pricingBreakdown?.total || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Deposit: ${booking.pricingBreakdown?.deposit || 0}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'confirmed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : booking.paymentStatus === 'refunded'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin dashboard.</p>
          <a href="/login" className="btn-primary">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (bikesLoading || stationsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your bike rental system</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'bikes', label: 'Bikes', icon: Bike },
              { id: 'stations', label: 'Stations', icon: MapPin },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Bikes"
                value={adminStats.totalBikes}
                icon={<Bike className="w-6 h-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Stations"
                value={adminStats.totalStations}
                icon={<MapPin className="w-6 h-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Total Bookings"
                value={adminStats.totalBookings}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Total Revenue"
                value={`$${adminStats.totalRevenue.toFixed(2)}`}
                icon={<DollarSign className="w-6 h-6 text-white" />}
                color="bg-yellow-500"
              />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Active Bikes"
                value={adminStats.activeBikes}
                icon={<TrendingUp className="w-6 h-6 text-white" />}
                color="bg-indigo-500"
              />
              <StatCard
                title="Active Stations"
                value={adminStats.activeStations}
                icon={<MapPin className="w-6 h-6 text-white" />}
                color="bg-pink-500"
              />
              <StatCard
                title="Active Bookings"
                value={bookings.filter((b: any) => b.status === 'active').length}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="bg-teal-500"
              />
              <StatCard
                title="Completed Today"
                value={bookings.filter((b: any) =>
                  b.status === 'completed' &&
                  new Date(b.endAt).toDateString() === new Date().toDateString()
                ).length}
                icon={<Users className="w-6 h-6 text-white" />}
                color="bg-orange-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'bikes' && <BikeTable />}
        {activeTab === 'stations' && <StationTable />}
        {activeTab === 'bookings' && <BookingTable />}
      </div>
    </div>
  );
};

export default AdminPage;
