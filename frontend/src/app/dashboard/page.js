'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { 
  PlusIcon, 
  MapPinIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
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

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const requestsData = await response.json();
        setRequests(requestsData);
        calculateStats(requestsData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requestsData) => {
    const role = localStorage.getItem('role');
    
    if (role === 'victim') {
      const pending = requestsData.filter(r => r.status === 'pending').length;
      const inProgress = requestsData.filter(r => r.status === 'in_progress').length;
      const fulfilled = requestsData.filter(r => r.status === 'fulfilled').length;
      
      setStats({ pending, inProgress, fulfilled, total: requestsData.length });
    } else {
      const helped = requestsData.filter(r => r.status === 'fulfilled').length;
      const inProgress = requestsData.filter(r => r.status === 'in_progress').length;
      
      setStats({ helped, inProgress, available: requestsData.length });
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

  const markAsFulfilled = async (requestId) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'fulfilled' }),
      });

      if (response.ok) {
        fetchRequests(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating request status:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-600 mt-2">
            {user.role === 'victim' 
              ? 'Manage your help requests and track assistance progress' 
              : 'Find ways to help your community and track your volunteer efforts'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user.role === 'victim' ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fulfilled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.fulfilled || 0}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <HeartIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">People Helped</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.helped || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Helps</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <SparklesIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.available || 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.role === 'victim' ? (
              <>
                <Link
                  href="/requests/new"
                  className="bg-sky-600 hover:bg-sky-700 text-white p-4 rounded-lg flex items-center transition-colors"
                >
                  <PlusIcon className="h-6 w-6 mr-3" />
                  <span className="font-medium">Request Help</span>
                </Link>
                <Link
                  href="/map"
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center transition-colors"
                >
                  <MapPinIcon className="h-6 w-6 mr-3" />
                  <span className="font-medium">View Map</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/suggestions"
                  className="bg-sky-600 hover:bg-sky-700 text-white p-4 rounded-lg flex items-center transition-colors"
                >
                  <SparklesIcon className="h-6 w-6 mr-3" />
                  <span className="font-medium">Get Suggestions</span>
                </Link>
                <Link
                  href="/map"
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center transition-colors"
                >
                  <MapPinIcon className="h-6 w-6 mr-3" />
                  <span className="font-medium">Browse Map</span>
                </Link>
                <Link
                  href="/requests"
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center transition-colors"
                >
                  <UserGroupIcon className="h-6 w-6 mr-3" />
                  <span className="font-medium">Browse Requests</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {user.role === 'victim' ? 'Your Recent Requests' : 'Recent Activity'}
          </h2>
          
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-500 mb-4">
                {user.role === 'victim' 
                  ? "You haven't made any requests yet" 
                  : "No recent volunteer activity"
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {requests.slice(0, 5).map((request) => (
                  <div key={request._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
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
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {request.description.length > 100 
                            ? `${request.description.substring(0, 100)}...`
                            : request.description
                          }
                        </h3>
                        {user.role === 'volunteer' && (
                          <p className="text-sm text-gray-600">
                            Requested by: {request.victim_name}
                            {request.distance && ` • ${request.distance} km away`}
                          </p>
                        )}
                        {request.volunteer_name && (
                          <p className="text-sm text-gray-600">
                            Volunteer: {request.volunteer_name}
                            {request.volunteer_distance && ` (${request.volunteer_distance} km away)`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {user.role === 'victim' && request.status === 'in_progress' && (
                          <button
                            onClick={() => markAsFulfilled(request._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Mark as Fulfilled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {requests.length > 5 && (
                <div className="bg-gray-50 px-6 py-3">
                  <Link
                    href="/requests"
                    className="text-sm font-medium text-sky-600 hover:text-sky-500"
                  >
                    View all requests →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}