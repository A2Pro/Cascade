'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { 
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Map() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    urgency: '',
    maxDistance: ''
  });
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');
    
    if (!role || !userId) {
      router.push('/login');
      return;
    }

    fetchUserData();
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (user && leafletRef.current) {
      fetchMapData();
    }
  }, [user, filters]);

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

  const fetchMapData = async () => {
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

      const response = await fetch(`/api/map/data?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
        initializeMap(data.requests, data.user_location);
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (requestsData, userLocation) => {
    if (!leafletRef.current || !mapRef.current) return;

    const L = leafletRef.current;

    // Clear existing map
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet_map.remove();
    }

    // Default center (San Francisco if no user location)
    const defaultCenter = [37.7749, -122.4194];
    const center = userLocation.latitude && userLocation.longitude 
      ? [userLocation.latitude, userLocation.longitude]
      : defaultCenter;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, 12);
    mapRef.current._leaflet_map = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker if available
    if (userLocation.latitude && userLocation.longitude) {
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude])
        .addTo(map)
        .bindPopup('Your Location')
        .openPopup();
      
      // Style user marker differently
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userMarker.setIcon(userIcon);
      
      markersRef.current.push(userMarker);
    }

    // Add request markers
    requestsData.forEach(request => {
      if (request.location.latitude && request.location.longitude) {
        const urgencyColors = {
          high: '#dc2626',
          medium: '#ea580c',
          low: '#16a34a'
        };

        const marker = L.marker([request.location.latitude, request.location.longitude])
          .addTo(map);

        // Custom icon based on urgency and status
        let iconHtml;
        if (request.status === 'in_progress' && request.volunteer_location) {
          // Request has volunteer assigned - show as yellow
          iconHtml = `<div style="background-color: #eab308; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
        } else {
          // Regular request
          iconHtml = `<div style="background-color: ${urgencyColors[request.urgency]}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
        }

        const icon = L.divIcon({
          className: 'request-marker',
          html: iconHtml,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        marker.setIcon(icon);

        // Add click handler
        marker.on('click', () => {
          setSelectedRequest(request);
        });

        // Enhanced popup content
        const statusText = request.status === 'in_progress' ? 'Help on the way' : 'Help needed';
        const popupContent = `
          <div class="p-2">
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${urgencyColors[request.urgency]}20; color: ${urgencyColors[request.urgency]}">
                ${request.urgency} priority
              </span>
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                ${request.type}
              </span>
            </div>
            <p class="text-sm font-medium mb-1">${statusText}</p>
            <p class="text-sm mb-1">${request.description.length > 50 ? request.description.substring(0, 50) + '...' : request.description}</p>
            ${request.distance ? `<p class="text-xs text-gray-600">${request.distance} km away</p>` : ''}
            ${request.status === 'in_progress' ? '<p class="text-xs text-green-600 font-medium">Volunteer assigned</p>' : ''}
            <button onclick="window.selectRequest('${request.id}')" class="mt-2 text-xs text-blue-600 hover:text-blue-800">View Details</button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);

        // Add volunteer marker if request is in progress and has volunteer location
        if (request.status === 'in_progress' && request.volunteer_location && 
            request.volunteer_location.latitude && request.volunteer_location.longitude) {
          
          const volunteerMarker = L.marker([request.volunteer_location.latitude, request.volunteer_location.longitude])
            .addTo(map);

          // Volunteer icon
          const volunteerIcon = L.divIcon({
            className: 'volunteer-marker',
            html: `<div style="background-color: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                     <div style="color: white; font-size: 10px; font-weight: bold;">V</div>
                   </div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });
          volunteerMarker.setIcon(volunteerIcon);

          const volunteerPopupContent = `
            <div class="p-2">
              <p class="text-sm font-medium mb-1">Volunteer</p>
              <p class="text-sm text-gray-700">${request.volunteer_name || 'Volunteer'}</p>
              <p class="text-xs text-green-600">Helping with ${request.type} request</p>
            </div>
          `;
          volunteerMarker.bindPopup(volunteerPopupContent);
          markersRef.current.push(volunteerMarker);

          // Add a connecting line between request and volunteer
          const connectionLine = L.polyline([
            [request.location.latitude, request.location.longitude],
            [request.volunteer_location.latitude, request.volunteer_location.longitude]
          ], {
            color: '#059669',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 5'
          }).addTo(map);
          markersRef.current.push(connectionLine);
        }
      }
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  // Global function for popup button clicks
  useEffect(() => {
    window.selectRequest = (requestId) => {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
      }
    };

    return () => {
      delete window.selectRequest;
    };
  }, [requests]);

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
        setSelectedRequest(null);
        fetchMapData(); // Refresh the data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to volunteer for request');
      }
    } catch (error) {
      console.error('Error volunteering for request:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading map...</div>
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
      
      {/* Import Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Emergency Map</h1>
            <p className="text-sm text-gray-600 mt-1">
              {user.role === 'victim' 
                ? 'View help requests in your area' 
                : 'Find people who need help nearby'
              }
            </p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">All Urgencies</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {user.role === 'volunteer' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Distance (km)
                  </label>
                  <select
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
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

          {/* Legend */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                <span className="text-sm text-gray-600">Your Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full border border-white shadow"></div>
                <span className="text-sm text-gray-600">High Priority Need</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-600 rounded-full border border-white shadow"></div>
                <span className="text-sm text-gray-600">Medium Priority Need</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full border border-white shadow"></div>
                <span className="text-sm text-gray-600">Low Priority Need</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full border border-white shadow"></div>
                <span className="text-sm text-gray-600">Help on the Way</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full border border-white shadow flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-gray-600">Volunteer Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-1 bg-green-600 opacity-60 border-dashed border border-green-600"></div>
                <span className="text-sm text-gray-600">Volunteer Route</span>
              </div>
            </div>
          </div>

          {/* Request Count */}
          <div className="p-6 flex-1">
            <div className="text-sm text-gray-600">
              Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
              {user.role === 'volunteer' && ' available to help with'}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef}
            className="w-full h-full"
            style={{ zIndex: 1 }}
          />
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedRequest.urgency)}`}>
                      {selectedRequest.urgency} priority
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {selectedRequest.type}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                  </div>

                  {/* Location and Distance */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>Location provided</span>
                    </div>
                    {selectedRequest.distance && (
                      <div className="flex items-center">
                        <span>{selectedRequest.distance} km away</span>
                      </div>
                    )}
                  </div>

                  {/* Timing */}
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Posted: {new Date(selectedRequest.created_at).toLocaleDateString()} at {new Date(selectedRequest.created_at).toLocaleTimeString()}</span>
                  </div>

                  {/* Action Button */}
                  {user.role === 'volunteer' && (
                    <div className="pt-4">
                      <button
                        onClick={() => volunteerForRequest(selectedRequest.id)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                      >
                        Offer Help
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}