'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HeartIcon, 
  MapPinIcon, 
  BellAlertIcon, 
  UsersIcon, 
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleScrollTo = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      id: "emergency-requests",
      icon: <BellAlertIcon className="h-8 w-8 text-sky-600" />,
      title: "Emergency Request System",
      description: "Quickly post detailed help requests for food, water, shelter, transportation, or medical assistance with location-based matching.",
    },
    {
      id: "volunteer-network",
      icon: <UsersIcon className="h-8 w-8 text-sky-600" />,
      title: "Volunteer Network",
      description: "Connect with local volunteers ready to help. Browse available requests, offer assistance, and coordinate relief efforts in real-time.",
    },
    {
      id: "interactive-map",
      icon: <MapPinIcon className="h-8 w-8 text-sky-600" />,
      title: "Interactive Map View",
      description: "Visualize emergency needs and volunteer locations on an interactive map with filters for request type, urgency, and distance.",
    },
    {
      id: "smart-matching",
      icon: <SparklesIcon className="h-8 w-8 text-sky-600" />,
      title: "Smart Request Matching",
      description: "AI-powered suggestions match volunteers with nearby requests based on skills, availability, and proximity for maximum impact.",
    },
    {
      id: "real-time-tracking",
      icon: <ClockIcon className="h-8 w-8 text-sky-600" />,
      title: "Real-time Status Updates",
      description: "Track request progress from pending to fulfilled with automatic notifications and status updates for all parties involved.",
    },
    {
      id: "safety-first",
      icon: <ShieldCheckIcon className="h-8 w-8 text-sky-600" />,
      title: "Safety & Verification",
      description: "Built-in safety features including volunteer verification, location sharing, and emergency contact systems for secure assistance.",
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white">
        <div className="container mx-auto px-4 py-20 flex flex-col items-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 text-center">Cascade</h1>
          <p className="text-2xl md:text-3xl font-light mb-10 text-center max-w-3xl">
            Emergency Assistance Network
          </p>
          <p className="text-xl text-sky-100 max-w-2xl mx-auto text-center mb-12">
            Connect victims of emergencies with volunteers who can help. Get assistance when you need it most, or offer help to your community.
          </p>
          
          <div className="flex gap-6 mt-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white text-sky-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link href="/login" className="bg-white text-sky-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg">
                  Log In
                </Link>
                <Link href="/signup" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all">
                  Get Help or Volunteer
                </Link>
              </>
            )}
          </div>
          
          <button 
            onClick={() => handleScrollTo('features')}
            className="mt-16 text-sky-200 flex flex-col items-center hover:text-white transition-colors"
          >
            <span>Learn how Cascade works</span>
            <svg className="w-6 h-6 mt-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Emergency Response Made Simple</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Everything you need to request help during emergencies or volunteer your time to help others in need
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature) => (
              <div key={feature.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:border-sky-300">
                <div className="bg-sky-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">How Cascade Works</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Simple, secure, and designed for real emergency situations
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Victims */}
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <HeartIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="text-gray-700">Create an account and set your location</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="text-gray-700">Post a detailed help request with your needs</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="text-gray-700">Get matched with nearby volunteers who can help</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="text-gray-700">Coordinate with volunteers and confirm completion</p>
                </div>
              </div>
            </div>

            {/* For Volunteers */}
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to Help?</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="text-gray-700">Sign up as a volunteer and add your skills</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="text-gray-700">Browse requests on the map or get smart suggestions</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="text-gray-700">Offer help for requests you can fulfill</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="text-gray-700">Coordinate assistance and make a difference</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-sky-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to make a difference?</h2>
          <p className="text-xl text-sky-100 max-w-2xl mx-auto mb-8">
            Join our community of people helping people during emergencies. Whether you need help or want to help others, Cascade connects you with your community.
          </p>
          <button 
            onClick={() => isLoggedIn ? router.push('/dashboard') : router.push('/signup')}
            className="bg-white text-sky-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started - It\'s Free'}
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Cascade</h3>
              <p>Emergency assistance when you need it most.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Victims</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Request Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Emergency Contacts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Volunteers</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">How to Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Volunteer Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Protocols</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Cascade. All rights reserved. | Connecting communities in times of need.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}