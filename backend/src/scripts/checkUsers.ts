import mongoose from 'mongoose';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkUsers() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Find all users (including password field)
    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- Email: ${user.email}, Name: ${user.name}, Role: ${user.role}, Verified: ${user.isVerified}`);

      // Test password comparison
      const isPasswordValid = await user.comparePassword('password123');
      console.log(`  Password check for 'password123': ${isPasswordValid}`);

      // Also test with bcrypt directly
      const directCheck = await bcrypt.compare('password123', user.password);
      console.log(`  Direct bcrypt check: ${directCheck}`);
    }

    // Test findByEmail method
    console.log('\nTesting findByEmail method:');
    const adminUser = await User.findByEmail('admin@rideflow.com');
    if (adminUser) {
      console.log(`Found admin user: ${adminUser.email}`);
      const passwordCheck = await adminUser.comparePassword('password123');
      console.log(`Admin password check: ${passwordCheck}`);
    } else {
      console.log('Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();
