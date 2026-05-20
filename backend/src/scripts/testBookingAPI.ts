import mongoose from 'mongoose';
import { Bike } from '../models/Bike';
import { Station } from '../models/Station';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBookingAPI() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Get sample data
    const bike = await Bike.findOne({});
    const station = await Station.findOne({});
    const user = await User.findOne({ role: 'user' });

    if (!bike || !station || !user) {
      console.log('Missing required data:');
      console.log(`Bike: ${bike ? '✅' : '❌'}`);
      console.log(`Station: ${station ? '✅' : '❌'}`);
      console.log(`User: ${user ? '✅' : '❌'}`);
      process.exit(1);
    }

    console.log('\nSample data found:');
    console.log(`Bike: ${bike.make} ${bike.model} (${bike._id})`);
    console.log(`Station: ${station.name} (${station._id})`);
    console.log(`User: ${user.name} (${user._id})`);

    // Test booking quote data
    const quoteData = {
      bikeId: bike._id.toString(),
      stationPickupId: station._id.toString(),
      stationDropoffId: station._id.toString(),
      startAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    };

    console.log('\nBooking quote data:');
    console.log(JSON.stringify(quoteData, null, 2));

    // Test booking creation data
    const bookingData = {
      bikeId: bike._id.toString(),
      stationPickupId: station._id.toString(),
      stationDropoffId: station._id.toString(),
      startAt: new Date(Date.now() + 60 * 60 * 1000),
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    };

    console.log('\nBooking creation data:');
    console.log(JSON.stringify(bookingData, null, 2));

    console.log('\n✅ Test data is ready for booking API testing');
    console.log('\nTo test the APIs:');
    console.log('1. Login with user credentials');
    console.log('2. Use the above data to test booking quote and creation');

    process.exit(0);
  } catch (error) {
    console.error('Error testing booking API:', error);
    process.exit(1);
  }
}

testBookingAPI();
