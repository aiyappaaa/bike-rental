import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Bike } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="text-9xl font-bold text-gray-200">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Bike className="w-16 h-16 text-primary-600" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page not found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="btn-primary btn-lg group inline-flex items-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go back home
            </Link>
            
            <div className="text-center">
              <button
                onClick={() => window.history.back()}
                className="btn-ghost group inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back to previous page
              </button>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Popular pages
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Link
                to="/bikes"
                className="text-primary-600 hover:text-primary-500"
              >
                Browse Bikes
              </Link>
              <Link
                to="/stations"
                className="text-primary-600 hover:text-primary-500"
              >
                Find Stations
              </Link>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-500"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-500"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
