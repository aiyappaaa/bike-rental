import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Edit3, 
  Save, 
  X,
  Calendar,
  MapPin,
  CreditCard,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api/authApi';

const ProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
type PasswordChange = z.infer<typeof PasswordChangeSchema>;

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordChange>({
    resolver: zodResolver(PasswordChangeSchema),
  });

  const onUpdateProfile = async (data: ProfileUpdate) => {
    setIsLoading(true);
    try {
      // In a real app, you'd call an API to update the profile
      // For now, we'll just update the local state
      const updatedUser = { ...user!, ...data };
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordChange) => {
    setIsLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      setIsChangingPassword(false);
      resetPassword();
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    resetPassword();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h3>
              <p className="text-gray-600 mb-4">{user.email}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Member since {new Date(user.createdAt).getFullYear()}
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  {user.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Bookings:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-medium">₹0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-outline btn-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...registerProfile('name')}
                        type="text"
                        className={`input pl-10 ${profileErrors.name ? 'input-error' : ''}`}
                      />
                    </div>
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...registerProfile('email')}
                        type="email"
                        className={`input pl-10 ${profileErrors.email ? 'input-error' : ''}`}
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...registerProfile('phone')}
                        type="tel"
                        className={`input pl-10 ${profileErrors.phone ? 'input-error' : ''}`}
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="spinner-sm mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-outline flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Full Name</div>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Email Address</div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Phone Number</div>
                      <div className="font-medium">{user.phone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Settings */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="btn-outline btn-sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      {...registerPassword('currentPassword')}
                      type="password"
                      className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      {...registerPassword('newPassword')}
                      type="password"
                      className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="spinner-sm mr-2"></div>
                          Changing...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="btn-outline flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Password</div>
                      <div className="font-medium">••••••••</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last changed: Never
                  </div>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Actions</h3>
              <div className="space-y-4">
                <button className="btn-outline w-full text-left">
                  <CreditCard className="w-4 h-4 mr-3" />
                  Manage Payment Methods
                </button>
                <button className="btn-outline w-full text-left">
                  <MapPin className="w-4 h-4 mr-3" />
                  Saved Addresses
                </button>
                <button className="btn-outline w-full text-left text-red-600 border-red-300 hover:bg-red-50">
                  <X className="w-4 h-4 mr-3" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
