'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../components/Navigation';
import { MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: { latitude: '', longitude: '', address: '' },
    skills: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const skillOptions = [
    'food', 'water', 'shelter', 'transport', 'medical', 'other'
  ];

  useEffect(() => {
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
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          location: userData.location || { latitude: '', longitude: '', address: '' },
          skills: userData.skills || []
        });
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
        
        try {
          // Try to get address from coordinates (you might want to use a geocoding service)
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }
          }));
          setMessage('Location updated successfully');
        } catch (error) {
          console.error('Error getting address:', error);
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }
          }));
        }
        
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

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    // Validate location for setup
    if (isSetup && (!formData.location.latitude || !formData.location.longitude)) {
      setError('Location is required to complete your profile setup');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: formData.location.latitude && formData.location.longitude ? {
            latitude: parseFloat(formData.location.latitude),
            longitude: parseFloat(formData.location.longitude),
            address: formData.location.address
          } : {},
          skills: formData.skills
        }),
      });

      if (response.ok) {
        setMessage('Profile updated successfully');
        
        if (isSetup) {
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">
                {isSetup ? 'Complete Your Profile' : 'Profile Settings'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isSetup 
                  ? 'Please complete your profile to start using Cascade effectively'
                  : 'Update your information and preferences'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Location {isSetup && <span className="text-red-500">*</span>}
                </h3>
                
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
                        value={formData.location.longitude}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      id="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      placeholder="Enter your address or a description"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Skills (for volunteers only) */}
              {user.role === 'volunteer' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Capabilities</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the types of help you can provide to get better matched with requests
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                {!isSetup && (
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isSetup ? 'Complete Setup' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}