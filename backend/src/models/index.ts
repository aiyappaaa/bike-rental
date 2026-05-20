// Export all models
export { User, IUserDocument, IUserModel } from './User';
export { Station, IStationDocument, IStationModel } from './Station';
export { Bike, IBikeDocument, IBikeModel } from './Bike';
export { Booking, IBookingDocument, IBookingModel } from './Booking';
export { Payment, IPaymentDocument, IPaymentModel } from './Payment';
export { Coupon, ICouponDocument, ICouponModel } from './Coupon';
export { Review, IReviewDocument, IReviewModel } from './Review';
export { Maintenance, IMaintenanceDocument, IMaintenanceModel } from './Maintenance';

// Import all models to ensure they are registered with Mongoose
import './User';
import './Station';
import './Bike';
import './Booking';
import './Payment';
import './Coupon';
import './Review';
import './Maintenance';
