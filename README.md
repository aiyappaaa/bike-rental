# RideFlow Bikes - Complete Bike Rental System

A comprehensive bike rental management system built with modern web technologies. This full-stack application provides a complete solution for bike rental businesses with user management, booking system, payment integration, and administrative features.

## 🚀 Features

### User Features
- **User Authentication**: Registration, login, email verification, password reset
- **Bike Browsing**: Search and filter bikes by type, price, location
- **Station Locator**: Find nearby pickup and drop-off stations
- **Booking System**: Complete booking workflow with pricing calculation
- **Payment Integration**: Secure payment processing (Razorpay/Stripe)
- **Booking Management**: View, track, and cancel bookings
- **Profile Management**: Update personal information and preferences

### Admin Features
- **Dashboard**: Overview of bookings, revenue, and bike utilization
- **Bike Management**: Add, edit, and manage bike inventory
- **Station Management**: Manage pickup/drop-off locations
- **Booking Management**: View and manage all bookings
- **User Management**: Manage user accounts and permissions
- **Analytics**: Detailed reports and insights

### Technical Features
- **Responsive Design**: Mobile-first, fully responsive UI
- **Real-time Updates**: Live availability and booking status
- **Email Notifications**: Automated booking confirmations and updates
- **File Upload**: Image management for bikes and stations
- **API Documentation**: Comprehensive REST API
- **Security**: JWT authentication, input validation, rate limiting

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Email**: Nodemailer
- **File Upload**: Multer + Sharp
- **Payment**: Razorpay, Stripe
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

### Shared
- **Validation**: Zod schemas
- **Types**: TypeScript interfaces
- **Utilities**: Date-fns, utility functions

## 📁 Project Structure

```
bikerental/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── README.md
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── utils/          # Utility functions
│   │   └── main.tsx        # App entry point
│   ├── package.json
│   └── public/
├── shared/                 # Shared types and utilities
│   ├── src/
│   │   ├── types/          # TypeScript interfaces
│   │   ├── schemas/        # Zod validation schemas
│   │   └── utils/          # Shared utilities
│   └── package.json
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB 6.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bikerental
```

2. **Install dependencies**
```bash
# Install shared package dependencies
cd shared && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

3. **Environment Setup**

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend (.env)**
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
- Start MongoDB service
- The application will create necessary collections automatically

5. **Start Development Servers**

**Backend (Terminal 1)**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2)**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user profile

### Bike Endpoints
- `GET /api/v1/bikes` - Get all bikes with filters
- `GET /api/v1/bikes/available` - Get available bikes for time period
- `GET /api/v1/bikes/:id` - Get bike by ID
- `GET /api/v1/bikes/:id/availability` - Check bike availability

### Station Endpoints
- `GET /api/v1/stations` - Get all stations
- `GET /api/v1/stations/nearby` - Get nearby stations
- `GET /api/v1/stations/:id` - Get station by ID
- `GET /api/v1/stations/:id/availability` - Get station availability

### Booking Endpoints
- `POST /api/v1/bookings/quote` - Get pricing quote
- `POST /api/v1/bookings` - Create new booking
- `GET /api/v1/bookings` - Get user bookings
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings/:id/cancel` - Cancel booking

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your preferred hosting (Vercel, Netlify, AWS S3, etc.)

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection strings
- JWT secrets
- Email service credentials
- Payment gateway credentials
- Cloud storage credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@rideflowbikes.com or create an issue in the repository.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading bike-sharing platforms
- Community contributions and feedback

---

**RideFlow Bikes** - Ride the City, Your Way! 🚴‍♂️
