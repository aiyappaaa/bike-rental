import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAuthService() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rideflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Import authService after database connection
    const { authService } = await import('../services/authService');

    const loginData = {
      email: 'admin@rideflow.com',
      password: 'password123'
    };

    console.log(`\nTesting authService.login with:`);
    console.log(`Email: ${loginData.email}`);
    console.log(`Password: ${loginData.password}`);

    try {
      const result = await authService.login(loginData);
      console.log('\n✅ Login successful!');
      console.log(`User: ${result.user.email}`);
      console.log(`Role: ${result.user.role}`);
      console.log(`Access Token: ${result.tokens.accessToken.substring(0, 20)}...`);
    } catch (error: any) {
      console.log('\n❌ Login failed!');
      console.log(`Error: ${error.message}`);
      console.log(`Code: ${error.code}`);
      console.log(`Status: ${error.statusCode}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error testing auth service:', error);
    process.exit(1);
  }
}

testAuthService();
