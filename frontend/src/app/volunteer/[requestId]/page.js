'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import { 
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PhoneIcon,
  TruckIcon,
  InformationCircleIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function VolunteerConfirmation() {
  const [user, setUser] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId;

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
    fetchRequestData();
    loadLeaflet();
  }, [requestId]);

  useEffect(() => {
    if (user && request && leafletRef.current) {
      initializeMap();
    }
  }, [user, request, leafletRef.current]);

  const loadLeaflet = async () => {
    if (typeof window !== 'undefined') {
      const L = await import('leaflet');
      leafletRef.current = L.default;
      
      // Fix for default markers
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  };

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

  const fetchRequestData = async () => {
    try {
      // First try to get from suggestions endpoint (which has distance/score data)
      const suggestionsResponse = await fetch('/api/suggestions', {
        credentials: 'include',
      });
      
      if (suggestionsResponse.ok) {
        const suggestions = await suggestionsResponse.json();
        const foundRequest = suggestions.find(s => s.id === requestId);
        
        if (foundRequest) {
          setRequest(foundRequest);
          setLoading(false);
          return;
        }
      }

      // If not found in suggestions, get all requests and find it
      const requestsResponse = await fetch('/api/requests', {
        credentials: 'include',
      });
      
      if (requestsResponse.ok) {
        const requests = await requestsResponse.json();
        const foundRequest = requests.find(r => r._id === requestId);
        
        if (foundRequest) {
          // Convert to match suggestions format
          setRequest({
            id: foundRequest._id,
            ...foundRequest,
            score: 0 // Default score since it's not from suggestions
          });
        } else {
          setError('Request not found or no longer available');
        }
      } else {
        setError('Failed to load request details');
      }
    } catch (error) {
      console.error('Error fetching request data:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!leafletRef.current || !mapRef.current || !user?.location || !request?.location) return;

    const L = leafletRef.current;

    // Clear existing map
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet_map.remove();
    }

    // Get coordinates
    const volunteerLat = user.location.latitude;
    const volunteerLng = user.location.longitude;
    const victimLat = request.location.latitude;
    const victimLng = request.location.longitude;

    if (!volunteerLat || !volunteerLng || !victimLat || !victimLng) return;

    // Calculate center point between the two locations
    const centerLat = (volunteerLat + victimLat) / 2;
    const centerLng = (volunteerLng + victimLng) / 2;

    // Initialize map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
    mapRef.current._leaflet_map = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create custom icons
    const volunteerIcon = L.divIcon({
      className: 'volunteer-marker',
      html: `<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
               <div style="color: white; font-size: 12px; font-weight: bold;">V</div>
             </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const victimIcon = L.divIcon({
      className: 'victim-marker',
      html: `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
               <div style="color: white; font-size: 12px; font-weight: bold;">H</div>
             </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    // Add markers
    const volunteerMarker = L.marker([volunteerLat, volunteerLng], { icon: volunteerIcon })
      .addTo(map)
      .bindPopup(`<strong>Your Location</strong><br/>${user.name}`);

    const victimMarker = L.marker([victimLat, victimLng], { icon: victimIcon })
      .addTo(map)
      .bindPopup(`<strong>Help Needed</strong><br/>${request.victim_name}<br/>${request.type} - ${request.urgency} priority`);

    // Add a line connecting the two points
    const routeLine = L.polyline([[volunteerLat, volunteerLng], [victimLat, victimLng]], {
      color: '#059669',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map);

    // Fit map to show both markers with some padding
    const group = new L.featureGroup([volunteerMarker, victimMarker, routeLine]);
    map.fitBounds(group.getBounds().pad(0.1));
  };

  const calculateETA = (distance) => {
    if (!distance) return 'Unknown';
    
    // Assume average speed of 30 km/h in emergency situations
    const timeInHours = distance / 30;
    const minutes = Math.round(timeInHours * 60);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const handleVolunteer = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/requests/${requestId}/volunteer`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        // Redirect to dashboard with success message
        router.push('/dashboard?volunteered=true');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to volunteer for request');
      }
    } catch (error) {
      console.error('Error volunteering for request:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading request details...</div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Available</h2>
            <p className="text-gray-600 mb-6">
              {error || 'This request may have been fulfilled or is no longer available.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/suggestions"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                Back to Suggestions
              </Link>
              <Link
                href="/requests"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse All Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Import Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/suggestions"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Suggestions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer for This Request</h1>
          <p className="text-gray-600 mt-2">
            Review the details below and confirm if you can help
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Location Overview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Your location and the person who needs help
              </p>
            </div>
            <div className="p-4">
              <div 
                ref={mapRef}
                className="w-full h-80 rounded-lg border border-gray-300"
                style={{ minHeight: '320px' }}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow mr-2"></div>
                  <span className="text-gray-700">Your Location (V)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow mr-2"></div>
                  <span className="text-gray-700">Help Needed (H)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5" />
                    {error}
                  </div>
                </div>
              )}

              {/* Request Details */}
              <div className="space-y-6">
                {/* Status and Type */}
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(request.urgency)}`}>
                    {request.urgency} priority
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {request.type}
                  </span>
                  {request.score > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <StarIcon className={`h-4 w-4 mr-1 ${getScoreColor(request.score)}`} />
                      <span className={getScoreColor(request.score)}>
                        {request.score}% match
                      </span>
                    </div>
                  )}
                </div>

                {/* What They Need */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">What they need:</h4>
                      <p className="text-blue-800 text-sm">{request.description}</p>
                    </div>
                  </div>
                </div>

                {/* Location and ETA */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Travel Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <p className="font-medium text-gray-900">
                        {request.distance ? `${request.distance} km away` : 'Distance not calculated'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estimated Travel Time:</span>
                      <p className="font-medium text-gray-900 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {calculateETA(request.distance)}
                      </p>
                    </div>
                    {request.location?.address && (
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="font-medium text-gray-900">{request.location.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Victim Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Person Requesting Help
                  </h4>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium text-gray-900">{request.victim_name}</p>
                    </div>
                    {request.victim_phone && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium text-gray-900">{request.victim_phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Request Posted:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()} at{' '}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preparation Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <TruckIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">Before you go:</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• Gather the requested supplies based on their description</li>
                        <li>• Ensure you have transportation to reach the location</li>
                        <li>• Consider bringing your phone for communication</li>
                        <li>• Let someone know where you're going for safety</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/suggestions"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleVolunteer}
                    disabled={submitting}
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                  >
                    {submitting ? 'Confirming...' : 'Confirm - I\'ll Help'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}