'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { 
  PlusIcon, 
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function Requests() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    urgency: '',
    status: '',
    maxDistance: ''
  });
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');
    
    if (!role || !userId) {
      router.push('/login');
      return;
    }

    fetchUserData();
    fetchRequests();
  }, [filters]);

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

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'maxDistance') {
            params.append('max_distance', value);
          } else {
            params.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/requests?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const requestsData = await response.json();
        setRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const volunteerForRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/volunteer`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        fetchRequests(); // Refresh the data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to volunteer for request');
      }
    } catch (error) {
      console.error('Error volunteering for request:', error);
      alert('Network error. Please try again.');
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchRequests(); // Refresh the data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Network error. Please try again.');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fulfilled': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.role === 'victim' ? 'My Requests' : 'Available Requests'}
              </h1>
              <p className="text-gray-600 mt-2">
                {user.role === 'victim' 
                  ? 'Manage your help requests and track progress' 
                  : 'Find opportunities to help people in your community'
                }
              </p>
            </div>
            {user.role === 'victim' && (
              <Link
                href="/requests/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Request
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="food">Food</option>
                <option value="water">Water</option>
                <option value="shelter">Shelter</option>
                <option value="transport">Transport</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency
              </label>
              <select
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">All Urgencies</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {user.role === 'victim' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>
            )}

            {user.role === 'volunteer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (km)
                </label>
                <select
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  <option value="">Any Distance</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500 mb-4">
              {user.role === 'victim' 
                ? "No requests found. Create your first request to get started." 
                : "No requests match your current filters. Try adjusting the filters above."
              }
            </div>
            {user.role === 'victim' && (
              <Link
                href="/requests/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Request
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Status and Type Badges */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency} priority
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {request.type}
                      </span>
                    </div>

                    {/* Description */}
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {request.description}
                    </h3>

                    {/* Request Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {user.role === 'volunteer' && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Requested by: {request.victim_name}</span>
                          </div>
                          {request.victim_phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              <span>{request.victim_phone}</span>
                            </div>
                          )}
                          {request.distance && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              <span>{request.distance} km away</span>
                            </div>
                          )}
                        </div>
                      )}

                      {request.volunteer_name && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Volunteer: {request.volunteer_name}</span>
                          </div>
                          {request.volunteer_phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              <span>{request.volunteer_phone}</span>
                            </div>
                          )}
                          {request.volunteer_distance && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              <span>{request.volunteer_distance} km away</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Created: {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col space-y-2">
                    {user.role === 'volunteer' && request.status === 'pending' && (
                      <Link
                        href={`/volunteer/${request._id}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                      >
                        Offer Help
                      </Link>
                    )}

                    {user.role === 'victim' && request.status === 'in_progress' && (
                      <button
                        onClick={() => updateRequestStatus(request._id, 'fulfilled')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Mark as Fulfilled
                      </button>
                    )}

                    {user.role === 'victim' && request.status === 'pending' && (
                      <button
                        onClick={() => updateRequestStatus(request._id, 'cancelled')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}