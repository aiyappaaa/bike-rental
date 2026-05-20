import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bike, MapPin, Clock, Shield, Leaf, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Bike,
      title: 'Premium Bikes',
      description: 'High-quality bikes maintained to the highest standards for your safety and comfort.',
    },
    {
      icon: MapPin,
      title: 'Multiple Locations',
      description: 'Convenient pickup and drop-off points across the city for easy access.',
    },
    {
      icon: Clock,
      title: 'Flexible Timing',
      description: 'Rent by the hour or day with flexible booking options to suit your schedule.',
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'All bikes are regularly maintained and equipped with safety features.',
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Reduce your carbon footprint while exploring the city sustainably.',
    },
    {
      icon: Star,
      title: 'Rated 4.8/5',
      description: 'Trusted by thousands of riders with excellent customer satisfaction.',
    },
  ];

  const stats = [
    { label: 'Happy Riders', value: '10,000+' },
    { label: 'Bikes Available', value: '500+' },
    { label: 'Stations', value: '50+' },
    { label: 'Cities', value: '5' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Ride the City,{' '}
                <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Your Way
                </span>
              </h1>
              <p className="text-xl text-gray-100 max-w-lg">
                Discover the freedom of cycling with our premium bike rental service. 
                Eco-friendly, convenient, and affordable urban mobility solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/bikes"
                  className="btn-primary btn-lg group"
                >
                  Explore Bikes
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/stations"
                  className="btn-outline btn-lg border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                >
                  Find Stations
                </Link>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 p-8 flex items-center justify-center">
                <Bike className="w-48 h-48 text-white/80" />
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white text-gray-900 p-4 rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-primary-600">₹50</div>
                <div className="text-sm">per hour</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white text-gray-900 p-4 rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-secondary-600">24/7</div>
                <div className="text-sm">available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose RideFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing the best bike rental experience with 
              premium bikes, convenient locations, and exceptional service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-hover p-8 text-center group"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Bike',
                description: 'Browse our selection of premium bikes and find the perfect one for your journey.',
              },
              {
                step: '02',
                title: 'Book & Pay',
                description: 'Select your pickup time and location, then complete your booking with secure payment.',
              },
              {
                step: '03',
                title: 'Ride & Enjoy',
                description: 'Pick up your bike and explore the city. Return it at any of our convenient locations.',
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-gray-300 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white section-padding">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of riders who have discovered the joy of cycling with RideFlow. 
            Book your first ride today!
          </p>
          <Link
            to="/bikes"
            className="btn-secondary btn-xl group"
          >
            Book Your First Ride
            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
