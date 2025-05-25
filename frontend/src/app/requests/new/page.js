'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NewRequest() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    type: 'food',
    description: '',
    urgency: 'medium',
    location: { latitude: '', longitude: '', address: '' }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const router = useRouter();

  const helpTypes = [
    { value: 'food', label: 'Food', description: 'Meals, groceries, or food supplies' },
    { value: 'water', label: 'Water', description: 'Drinking water or water supplies' },
    { value: 'shelter', label: 'Shelter', description: 'Temporary housing or accommodation' },
    { value: 'transport', label: 'Transportation', description: 'Rides, vehicle assistance, or evacuation' },
    { value: 'medical', label: 'Medical', description: 'Medical care, supplies, or medication' },
    { value: 'other', label: 'Other', description: 'Other types of emergency assistance' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'Can wait several hours or days', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', description: 'Needed within a few hours', color: 'text-orange-600' },
    { value: 'high', label: 'High', description: 'Urgent - needed immediately', color: 'text-red-600' }
  ];

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');
    
    if (!role || !userId) {
      router.push('/login');
      return;
    }

    if (role !== 'victim') {
      router.push('/dashboard');
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Pre-fill location if user has it
        if (userData.location && userData.location.latitude && userData.location.longitude) {
          setFormData(prev => ({
            ...prev,
            location: userData.location
          }));
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationRequest = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }
        }));
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Please check your browser settings.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate required fields
    if (!formData.description.trim()) {
      setError('Please provide a description of what help you need');
      setSubmitting(false);
      return;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      setError('Location is required. Please use current location or enter coordinates manually.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          description: formData.description.trim(),
          urgency: formData.urgency,
          location: {
            latitude: parseFloat(formData.location.latitude),
            longitude: parseFloat(formData.location.longitude),
            address: formData.location.address
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/requests?created=true');
      } else {
        setError(data.error || 'Failed to create request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
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
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Request Emergency Help</h1>
              <p className="text-gray-600 mt-2">
                Describe what kind of help you need and volunteers in your area will be notified
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5" />
                    {error}
                  </div>
                </div>
              )}

              {/* Type of Help */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of help do you need? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {helpTypes.map((type) => (
                    <label key={type.value} className="relative flex items-start">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 mt-1"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">{type.label}</span>
                        <span className="block text-sm text-gray-600">{type.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Describe your situation and what help you need <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  Be specific about what you need, when you need it, and any other relevant details
                </p>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="Example: I need emergency food supplies for my family of 4. We lost power and our food spoiled. Looking for non-perishable items like canned goods, bread, and water..."
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How urgent is this request? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {urgencyLevels.map((level) => (
                    <label key={level.value} className="relative flex items-start">
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={formData.urgency === level.value}
                        onChange={handleChange}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 mt-1"
                      />
                      <div className="ml-3">
                        <span className={`block text-sm font-medium ${level.color}`}>{level.label}</span>
                        <span className="block text-sm text-gray-600">{level.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Location <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Your location helps volunteers find you. We only share approximate location with volunteers.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={handleLocationRequest}
                      disabled={locationLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </button>
                    <span className="text-sm text-gray-500">or enter manually below</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="location.latitude" className="block text-sm font-medium text-gray-700">
                        Latitude
                      </label>
                      <input
                        type="number"
                        name="location.latitude"
                        id="location.latitude"
                        step="any"
                        required
                        value={formData.location.latitude}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="location.longitude" className="block text-sm font-medium text-gray-700">
                        Longitude
                      </label>
                      <input
                        type="number"
                        name="location.longitude"
                        id="location.longitude"
                        step="any"
                        required
                        value={formData.location.longitude}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                      Address or Description (Optional)
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      id="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      placeholder="Enter your address or location description"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/requests')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating Request...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}