import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Bike, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authApi } from '../../services/api/authApi';
import { useAuthStore } from '../../store/authStore';

const VerifyEmailPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setIsLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    try {
      const response = await authApi.verifyEmail({ token });
      const { user, tokens } = response.data;
      
      // Auto-login after successful verification
      setUser(user);
      setTokens(tokens);
      
      setIsVerified(true);
      toast.success('Email verified successfully!');
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Email verification failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // This would need the user's email - for now, redirect to login
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="spinner-lg"></div>
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Verifying your email...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we verify your email address
          </p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Email verified!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your email has been successfully verified. You'll be redirected to the home page shortly.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">RideFlow</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Welcome to RideFlow! You can now start booking bikes and exploring the city.
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Verification failed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            
            <p className="text-gray-600 mb-6">
              The verification link may have expired or is invalid. Please try requesting a new verification email.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="btn-primary w-full"
              >
                Request new verification email
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="btn-outline w-full"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmailPage;
