import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLogin() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    const email = 'admin@rideflow.com';
    const password = 'password123';

    console.log(`\nTesting login for: ${email}`);
    console.log(`Password: ${password}`);

    // Step 1: Find user by email
    console.log('\n1. Finding user by email...');
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Login attempts: ${user.loginAttempts}`);

    // Step 2: Check if account is locked
    console.log('\n2. Checking if account is locked...');
    const isLocked = user.isAccountLocked();
    if (isLocked) {
      console.log('❌ Account is locked');
      process.exit(1);
    }
    console.log('✅ Account is not locked');

    // Step 3: Verify password
    console.log('\n3. Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      process.exit(1);
    }
    console.log('✅ Password is valid');

    // Step 4: Check if email is verified (assume verification is enabled)
    console.log('\n4. Checking email verification...');
    if (!user.isVerified) {
      console.log('❌ Email is not verified');
      process.exit(1);
    }
    console.log('✅ Email verification check passed');

    console.log('\n🎉 Login should succeed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

testLogin();
