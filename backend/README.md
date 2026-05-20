# RideFlow Bikes - Backend API

A comprehensive bike rental management system backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Registration, login, email verification, password reset
- **Station Management**: CRUD operations for bike stations with geospatial queries
- **Bike Management**: Comprehensive bike inventory with availability tracking
- **Booking System**: Complete booking workflow with pricing, availability, and status management
- **Payment Integration**: Support for Razorpay and Stripe payment gateways
- **Email Notifications**: Automated emails for booking confirmations and updates
- **File Upload**: Image upload support with Cloudinary and AWS S3
- **Rate Limiting**: API rate limiting for security
- **Validation**: Comprehensive input validation with Zod
- **Error Handling**: Centralized error handling with detailed logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Email**: Nodemailer
- **File Upload**: Multer + Sharp
- **Payment**: Razorpay, Stripe
- **Cloud Storage**: Cloudinary, AWS S3
- **Testing**: Jest + Supertest

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB 6.0 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - Database connection string
   - JWT secrets (generate secure random strings)
   - Email configuration (optional)
   - Payment gateway credentials (optional)
   - Cloud storage credentials (optional)

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Building for Production

```bash
npm run build
npm start
```

## API Documentation

### Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://your-domain.com/api/v1`

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user profile

### Station Endpoints

- `GET /stations` - Get all stations
- `GET /stations/nearby` - Get nearby stations
- `GET /stations/:id` - Get station by ID
- `GET /stations/:id/availability` - Get station availability
- `GET /stations/:id/bikes` - Get bikes at station

### Bike Endpoints

- `GET /bikes` - Get all bikes with filters
- `GET /bikes/available` - Get available bikes for time period
- `GET /bikes/:id` - Get bike by ID
- `GET /bikes/:id/availability` - Check bike availability

### Booking Endpoints

- `POST /bookings/quote` - Get pricing quote
- `POST /bookings` - Create new booking
- `GET /bookings` - Get user bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/start` - Start booking (staff)
- `POST /bookings/:id/complete` - Complete booking (staff)

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rideflow-bikes
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Optional Variables

- Email configuration for notifications
- Payment gateway credentials
- Cloud storage configuration
- Feature toggles
- Business configuration

## Database Schema

The application uses MongoDB with the following main collections:

- **users**: User accounts and authentication
- **stations**: Bike pickup/dropoff locations
- **bikes**: Bike inventory and specifications
- **bookings**: Rental bookings and history
- **payments**: Payment transactions
- **coupons**: Discount coupons
- **reviews**: User reviews and ratings
- **maintenance**: Bike maintenance records

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Account lockout after failed attempts

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ]
}
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run seed` - Seed database with sample data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
