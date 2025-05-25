'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { 
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  StarIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function Suggestions() {
  const [user, setUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');
    
    if (!role || !userId) {
      router.push('/login');
      return;
    }

    if (role !== 'volunteer') {
      router.push('/dashboard');
      return;
    }

    fetchUserData();
    fetchSuggestions();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/login');
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const suggestionsData = await response.json();
        setSuggestions(suggestionsData);
      } else {
        const data = await response.json();
        if (response.status === 400 && data.error.includes('Location is required')) {
          // Redirect to profile to set up location
          router.push('/profile?setup=true&reason=location');
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSuggestions();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getMatchReasons = (suggestion) => {
    const reasons = [];
    
    if (suggestion.distance <= 5) {
      reasons.push('Very close to you');
    } else if (suggestion.distance <= 15) {
      reasons.push('Nearby');
    }
    
    if (suggestion.urgency === 'high') {
      reasons.push('High priority');
    }
    
    if (user?.skills?.includes(suggestion.type)) {
      reasons.push('Matches your skills');
    }
    
    const hoursOld = (new Date() - new Date(suggestion.created_at)) / (1000 * 60 * 60);
    if (hoursOld < 2) {
      reasons.push('Recent request');
    }
    
    return reasons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading suggestions...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-8 w-8 text-sky-600 mr-3" />
                Smart Suggestions
              </h1>
              <p className="text-gray-600 mt-2">
                Personalized help opportunities based on your location, skills, and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/profile"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Update Skills
              </Link>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <SparklesIcon className="h-6 w-6 text-sky-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-sky-900 mb-2">How Smart Suggestions Work</h3>
              <p className="text-sky-800 text-sm mb-3">
                We analyze requests based on several factors to find the best matches for you:
              </p>
              <ul className="text-sky-800 text-sm space-y-1">
                <li>• <strong>Distance:</strong> Closer requests get higher priority</li>
                <li>• <strong>Skills Match:</strong> Requests matching your listed skills</li>
                <li>• <strong>Urgency:</strong> High-priority requests are prioritized</li>
                <li>• <strong>Recency:</strong> Newer requests get a slight boost</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Profile Check */}
        {!user.location?.latitude || !user.location?.longitude ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-1 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900 mb-2">Location Required</h3>
                <p className="text-yellow-800 text-sm mb-4">
                  To get personalized suggestions, we need your location to find nearby requests.
                </p>
                <Link
                  href="/profile?setup=true"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Set Your Location
                </Link>
              </div>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Suggestions Available</h3>
            <p className="text-gray-600 mb-6">
              There are currently no help requests that match your profile and location. 
              Check back later or browse all available requests.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/requests"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                Browse All Requests
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                View Map
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
                            {suggestions.map((suggestion, index) => {
              const matchReasons = getMatchReasons(suggestion);
              
              return (
                <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Ranking and Score */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                          <div className="ml-3 flex items-center">
                            <StarIcon className={`h-5 w-5 ${getScoreColor(suggestion.score)}`} />
                            <span className={`ml-1 text-sm font-medium ${getScoreColor(suggestion.score)}`}>
                              {suggestion.score}% match
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(suggestion.urgency)}`}>
                            {suggestion.urgency} priority
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {suggestion.type}
                          </span>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      {matchReasons.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {matchReasons.map((reason, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {suggestion.description}
                      </h3>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Requested by: {suggestion.victim_name}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>{suggestion.distance} km away</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Posted: {new Date(suggestion.created_at).toLocaleDateString()} at {new Date(suggestion.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-6">
                      <Link
                        href={`/volunteer/${suggestion.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                      >
                        Offer Help
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More / View All */}
            <div className="text-center pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Showing top {suggestions.length} suggestions for you
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Suggestions
                </button>
                <Link
                  href="/requests"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                >
                  View All Requests
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}