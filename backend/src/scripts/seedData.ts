import mongoose from 'mongoose';
import { Bike } from '../models/Bike';
import { Station } from '../models/Station';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample bikes data - will be updated with station IDs after stations are created
const createSampleBikes = (stationIds: string[]) => [
  {
    sku: 'MTN-001',
    make: 'Trek',
    model: 'Mountain Explorer Pro',
    type: 'mountain',
    gears: 21,
    size: 'L',
    color: 'Red',
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500'],
    hourlyRate: 15,
    dailyRate: 80,
    deposit: 100,
    stationId: stationIds[0],
    tags: ['mountain', 'trail', 'adventure']
  },
  {
    sku: 'CTY-001',
    make: 'Giant',
    model: 'City Cruiser Deluxe',
    type: 'city',
    gears: 7,
    size: 'M',
    color: 'Blue',
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'],
    hourlyRate: 10,
    dailyRate: 50,
    deposit: 75,
    stationId: stationIds[1],
    tags: ['city', 'commute', 'comfort']
  },
  {
    sku: 'ELC-001',
    make: 'Specialized',
    model: 'Electric Power Bike',
    type: 'e-bike',
    gears: 10,
    size: 'L',
    color: 'Black',
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'],
    hourlyRate: 25,
    dailyRate: 120,
    deposit: 200,
    stationId: stationIds[2],
    batteryLevel: 100,
    tags: ['electric', 'eco-friendly', 'long-range']
  },
  {
    sku: 'RD-001',
    make: 'Cannondale',
    model: 'Road Runner Speed',
    type: 'road',
    gears: 16,
    size: 'M',
    color: 'White',
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500'],
    hourlyRate: 18,
    dailyRate: 90,
    deposit: 120,
    stationId: stationIds[3],
    tags: ['road', 'speed', 'racing']
  },
  {
    sku: 'HYB-001',
    make: 'Scott',
    model: 'Hybrid Adventure',
    type: 'city',
    gears: 21,
    size: 'L',
    color: 'Green',
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'],
    hourlyRate: 12,
    dailyRate: 65,
    deposit: 90,
    stationId: stationIds[4],
    tags: ['hybrid', 'versatile', 'adventure']
  }
];

const sampleStations = [
  {
    name: 'Central Park Station',
    code: 'CPS001',
    address: '123 Park Avenue, Downtown',
    geo: {
      type: 'Point',
      coordinates: [-73.9654, 40.7829] // [longitude, latitude]
    },
    capacity: 20,
    active: true,
    openingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '21:00', closed: false },
      sunday: { open: '07:00', close: '21:00', closed: false }
    }
  },
  {
    name: 'University Campus Hub',
    code: 'UCH001',
    address: '456 College Street, University District',
    geo: {
      type: 'Point',
      coordinates: [-73.9851, 40.7589]
    },
    capacity: 15,
    active: true,
    openingHours: {
      monday: { open: '05:30', close: '23:00', closed: false },
      tuesday: { open: '05:30', close: '23:00', closed: false },
      wednesday: { open: '05:30', close: '23:00', closed: false },
      thursday: { open: '05:30', close: '23:00', closed: false },
      friday: { open: '05:30', close: '23:00', closed: false },
      saturday: { open: '07:00', close: '22:00', closed: false },
      sunday: { open: '07:00', close: '22:00', closed: false }
    }
  },
  {
    name: 'Riverside Trail Point',
    code: 'RTP001',
    address: '789 River Road, Riverside',
    geo: {
      type: 'Point',
      coordinates: [-73.9934, 40.7505]
    },
    capacity: 12,
    active: true,
    openingHours: {
      monday: { open: '06:00', close: '20:00', closed: false },
      tuesday: { open: '06:00', close: '20:00', closed: false },
      wednesday: { open: '06:00', close: '20:00', closed: false },
      thursday: { open: '06:00', close: '20:00', closed: false },
      friday: { open: '06:00', close: '20:00', closed: false },
      saturday: { open: '06:00', close: '20:00', closed: false },
      sunday: { open: '06:00', close: '20:00', closed: false }
    }
  },
  {
    name: 'Shopping District Plaza',
    code: 'SDP001',
    address: '321 Commerce Street, Shopping District',
    geo: {
      type: 'Point',
      coordinates: [-73.9776, 40.7614]
    },
    capacity: 25,
    active: true,
    openingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '23:00', closed: false },
      saturday: { open: '07:00', close: '23:00', closed: false },
      sunday: { open: '07:00', close: '21:00', closed: false }
    }
  },
  {
    name: 'Beach Front Station',
    code: 'BFS001',
    address: '654 Ocean Drive, Beachfront',
    geo: {
      type: 'Point',
      coordinates: [-73.9942, 40.7282]
    },
    capacity: 18,
    active: true,
    openingHours: {
      monday: { open: '06:00', close: '21:00', closed: false },
      tuesday: { open: '06:00', close: '21:00', closed: false },
      wednesday: { open: '06:00', close: '21:00', closed: false },
      thursday: { open: '06:00', close: '21:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '06:00', close: '22:00', closed: false },
      sunday: { open: '06:00', close: '22:00', closed: false }
    }
  }
];

// Create users with properly hashed passwords
const createSampleUsers = async () => [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: await bcrypt.hash('password123', 10),
    phone: '+1234567890',
    isVerified: true,
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: await bcrypt.hash('password123', 10),
    phone: '+1234567891',
    isVerified: true,
    role: 'user'
  },
  {
    name: 'Admin User',
    email: 'admin@rideflow.com',
    password: await bcrypt.hash('password123', 10),
    phone: '+1234567892',
    isVerified: true,
    role: 'admin'
  }
];

// Sample bookings data - will be updated with user and bike IDs after they are created
const createSampleBookings = (userIds: string[], bikeIds: string[], stationIds: string[]) => [
  {
    bookingNo: 'RFB-20250101-0001',
    userId: userIds[0],
    bikeId: bikeIds[0],
    stationPickupId: stationIds[0],
    stationDropoffId: stationIds[0],
    startAt: new Date('2025-01-15T09:00:00Z'),
    endAt: new Date('2025-01-15T17:00:00Z'),
    durationHours: 8,
    status: 'completed',
    pricingBreakdown: {
      baseAmount: 120,
      hourlyRate: 15,
      dailyRate: 80,
      durationHours: 8,
      subtotal: 120,
      gstPercent: 10,
      gstAmount: 12,
      deposit: 100,
      lateFee: 0,
      discount: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
      total: 132
    },
    paymentStatus: 'paid',
    notes: 'Great ride through the mountain trails!'
  },
  {
    bookingNo: 'RFB-20250102-0001',
    userId: userIds[1],
    bikeId: bikeIds[1],
    stationPickupId: stationIds[1],
    stationDropoffId: stationIds[1],
    startAt: new Date('2025-01-16T10:00:00Z'),
    endAt: new Date('2025-01-16T14:00:00Z'),
    durationHours: 4,
    status: 'active',
    pricingBreakdown: {
      baseAmount: 40,
      hourlyRate: 10,
      dailyRate: 50,
      durationHours: 4,
      subtotal: 40,
      gstPercent: 10,
      gstAmount: 4,
      deposit: 75,
      lateFee: 0,
      discount: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
      total: 44
    },
    paymentStatus: 'paid',
    notes: 'City commute to work'
  },
  {
    bookingNo: 'RFB-20250103-0001',
    userId: userIds[0],
    bikeId: bikeIds[2],
    stationPickupId: stationIds[2],
    stationDropoffId: stationIds[2],
    startAt: new Date('2025-01-17T08:00:00Z'),
    endAt: new Date('2025-01-17T18:00:00Z'),
    durationHours: 10,
    status: 'confirmed',
    pricingBreakdown: {
      baseAmount: 250,
      hourlyRate: 25,
      dailyRate: 120,
      durationHours: 10,
      subtotal: 250,
      gstPercent: 10,
      gstAmount: 25,
      deposit: 200,
      lateFee: 0,
      discount: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
      total: 275
    },
    paymentStatus: 'paid',
    notes: 'Electric bike for long distance tour'
  },
  {
    bookingNo: 'RFB-20250104-0001',
    userId: userIds[1],
    bikeId: bikeIds[3],
    stationPickupId: stationIds[3],
    stationDropoffId: stationIds[3],
    startAt: new Date('2025-01-18T07:00:00Z'),
    endAt: new Date('2025-01-18T19:00:00Z'),
    durationHours: 12,
    status: 'cancelled',
    pricingBreakdown: {
      baseAmount: 216,
      hourlyRate: 18,
      dailyRate: 90,
      durationHours: 12,
      subtotal: 216,
      gstPercent: 10,
      gstAmount: 21.6,
      deposit: 120,
      lateFee: 0,
      discount: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
      total: 237.6
    },
    paymentStatus: 'refunded',
    notes: 'Cancelled due to weather conditions',
    cancellationReason: 'Bad weather forecast'
  }
];

async function seedData() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Clear existing data
    await Booking.deleteMany({});
    await Bike.deleteMany({});
    await Station.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create and insert sample users with hashed passwords
    const sampleUsers = await createSampleUsers();
    const users = await User.insertMany(sampleUsers);
    console.log(`Inserted ${users.length} users`);

    // Insert sample stations
    const stations = await Station.insertMany(sampleStations);
    console.log(`Inserted ${stations.length} stations`);

    // Get station IDs and create bikes with proper station references
    const stationIds = stations.map(station => station._id.toString());
    const sampleBikes = createSampleBikes(stationIds);

    // Insert sample bikes
    const bikes = await Bike.insertMany(sampleBikes);
    console.log(`Inserted ${bikes.length} bikes`);

    // Get user and bike IDs and create bookings
    const userIds = users.map(user => user._id.toString());
    const bikeIds = bikes.map(bike => bike._id.toString());
    const sampleBookings = createSampleBookings(userIds, bikeIds, stationIds);

    // Insert sample bookings
    const bookings = await Booking.insertMany(sampleBookings);
    console.log(`Inserted ${bookings.length} bookings`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
