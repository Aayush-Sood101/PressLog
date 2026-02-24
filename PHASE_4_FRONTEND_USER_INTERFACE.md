# Phase 4: Frontend User Interface

## Overview
This phase implements all frontend pages including user dashboard with calendar view, admin dashboard with newspaper configuration and join request management, and report download functionality. By the end of this phase, you'll have a complete working application with full user interface.

---

## 4.1 Update API Client with All Endpoints

### Complete API Client
Edit `frontend/src/lib/api.js`:

```javascript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Onboarding API calls
export const onboardingApi = {
  createUniversity: async (token, universityName) => {
    const response = await apiClient.post(
      '/api/onboarding/admin',
      { universityName },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  submitJoinRequest: async (token, universityId) => {
    const response = await apiClient.post(
      '/api/onboarding/user',
      { universityId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getUniversities: async () => {
    const response = await apiClient.get('/api/onboarding/universities');
    return response.data;
  },
};

// Admin API calls
export const adminApi = {
  getJoinRequests: async (token) => {
    const response = await apiClient.get('/api/admin/join-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateJoinRequest: async (token, requestId, status) => {
    const response = await apiClient.patch(
      `/api/admin/join-requests/${requestId}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  configureNewspapers: async (token, month, rates) => {
    const response = await apiClient.post(
      '/api/admin/newspapers',
      { month, rates },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getNewspapers: async (token, month) => {
    const response = await apiClient.get(`/api/admin/newspapers/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getNewspaperEntries: async (token, month) => {
    const response = await apiClient.get(`/api/admin/newspaper-entries/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  downloadReport: async (token, month) => {
    const response = await apiClient.get(`/api/admin/report/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    return response.data;
  },
};

// User API calls
export const userApi = {
  getNewspapers: async (token, month) => {
    const response = await apiClient.get(`/api/newspapers/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getNewspaperEntries: async (token, month) => {
    const response = await apiClient.get(`/api/newspaper-entries/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  markNewspaperEntry: async (token, date, status) => {
    const response = await apiClient.post(
      '/api/newspaper-entries',
      { date, status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};

export default apiClient;
```

**Explanation:**
- Organized API calls into three modules: onboarding, admin, and user
- All authenticated requests include Authorization header with Clerk JWT
- Report download uses `responseType: 'blob'` for binary file handling
- Clean interface for consuming in React components

---

## 4.2 Create User Dashboard

### Calendar View for Users
Create `frontend/src/app/dashboard/page.js`:

```javascript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { userApi } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingDate, setMarkingDate] = useState(null);

  const monthString = format(currentDate, 'yyyy-MM');

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await userApi.getNewspaperEntries(token, monthString);
      setEntries(data.entries || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError('Failed to load newspaper entries');
    } finally {
      setLoading(false);
    }
  }, [getToken, monthString]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleMarkEntry = async (date, status) => {
    try {
      setMarkingDate(date);
      const token = await getToken();
      await userApi.markNewspaperEntry(token, date, status);
      
      // Refresh entries
      await fetchEntries();
    } catch (err) {
      console.error('Failed to mark entry:', err);
      alert(err.response?.data?.error || 'Failed to mark newspaper entry');
    } finally {
      setMarkingDate(null);
    }
  };

  const getEntryForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return entries.find(entry => entry.date === dateString);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}

        {/* Add empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}

        {/* Calendar days */}
        {days.map(day => {
          const entry = getEntryForDate(day);
          const dateString = format(day, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isMarking = markingDate === dateString;

          return (
            <div
              key={dateString}
              className={`
                min-h-[120px] p-2 border rounded-lg
                ${isCurrentDay ? 'border-blue-500 border-2' : 'border-gray-300'}
                ${!entry ? 'bg-gray-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-900 mb-2">
                {format(day, 'd')}
              </div>

              {entry && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    Rate: ₹{parseFloat(entry.newspapers?.rate || 0).toFixed(2)}
                  </div>

                  <div className={`
                    text-xs px-2 py-1 rounded text-center font-medium
                    ${entry.status === 'received' ? 'bg-green-100 text-green-800' : ''}
                    ${entry.status === 'not_received' ? 'bg-red-100 text-red-800' : ''}
                    ${entry.status === 'unmarked' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {entry.status === 'received' && '✓ Received'}
                    {entry.status === 'not_received' && '✗ Not Received'}
                    {entry.status === 'unmarked' && 'Unmarked'}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMarkEntry(dateString, 'received')}
                      disabled={isMarking}
                      className="flex-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleMarkEntry(dateString, 'not_received')}
                      disabled={isMarking}
                      className="flex-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              )}

              {!entry && (
                <div className="text-xs text-gray-400 text-center mt-4">
                  Not configured
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.firstName || 'User'}!
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Home
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading calendar...</p>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>

        {/* Legend */}
        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Legend:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Received</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Not Received</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-sm text-gray-700">Unmarked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Explanation:**
- **Calendar Grid**: Displays full month calendar with all dates
- **Entry Status**: Color-coded cells (green=received, red=not received, yellow=unmarked)
- **Mark Buttons**: Quick ✓ and ✗ buttons on each date
- **Month Navigation**: Previous/Next buttons to browse different months
- **Today Highlight**: Blue border on current date
- **Loading States**: Spinner during data fetch
- **Responsive Design**: Works on mobile and desktop

---

## 4.3 Create Admin Dashboard

### Multi-Tab Admin Interface
Create `frontend/src/app/admin/page.js`:

```javascript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { adminApi, userApi } from '@/lib/api';

export default function AdminPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newspapers, setNewspapers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingDate, setMarkingDate] = useState(null);

  // Configure tab state
  const [configMonth, setConfigMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [rates, setRates] = useState({
    Monday: 10.00,
    Tuesday: 10.00,
    Wednesday: 10.00,
    Thursday: 10.00,
    Friday: 10.00,
    Saturday: 12.00,
    Sunday: 12.00,
  });

  const monthString = format(currentDate, 'yyyy-MM');

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await adminApi.getNewspaperEntries(token, monthString);
      setEntries(data.entries || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError('Failed to load newspaper entries');
    } finally {
      setLoading(false);
    }
  }, [getToken, monthString]);

  const fetchJoinRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await adminApi.getJoinRequests(token);
      setJoinRequests(data.requests || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
      setError('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const fetchNewspapers = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await adminApi.getNewspapers(token, configMonth);
      setNewspapers(data);
      if (data.configured && data.rates) {
        setRates(data.rates);
      }
    } catch (err) {
      console.error('Failed to fetch newspapers:', err);
    }
  }, [getToken, configMonth]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchEntries();
    } else if (activeTab === 'requests') {
      fetchJoinRequests();
    } else if (activeTab === 'configure') {
      fetchNewspapers();
    }
  }, [activeTab, fetchEntries, fetchJoinRequests, fetchNewspapers]);

  const handleMarkEntry = async (date, status) => {
    try {
      setMarkingDate(date);
      const token = await getToken();
      await userApi.markNewspaperEntry(token, date, status);
      await fetchEntries();
    } catch (err) {
      console.error('Failed to mark entry:', err);
      alert(err.response?.data?.error || 'Failed to mark newspaper entry');
    } finally {
      setMarkingDate(null);
    }
  };

  const handleApproveReject = async (requestId, status) => {
    try {
      const token = await getToken();
      await adminApi.updateJoinRequest(token, requestId, status);
      await fetchJoinRequests();
      alert(`Request ${status} successfully!`);
    } catch (err) {
      console.error('Failed to update request:', err);
      alert(err.response?.data?.error || 'Failed to update request');
    }
  };

  const handleConfigureNewspapers = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await getToken();
      await adminApi.configureNewspapers(token, configMonth, rates);
      alert('Newspapers configured successfully!');
      await fetchNewspapers();
    } catch (err) {
      console.error('Failed to configure newspapers:', err);
      alert(err.response?.data?.error || 'Failed to configure newspapers');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const blob = await adminApi.downloadReport(token, monthString);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newspaper-report-${monthString}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const getEntryForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return entries.find(entry => entry.date === dateString);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}

        {days.map(day => {
          const entry = getEntryForDate(day);
          const dateString = format(day, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isMarking = markingDate === dateString;

          return (
            <div
              key={dateString}
              className={`
                min-h-[120px] p-2 border rounded-lg
                ${isCurrentDay ? 'border-blue-500 border-2' : 'border-gray-300'}
                ${!entry ? 'bg-gray-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-900 mb-2">
                {format(day, 'd')}
              </div>

              {entry && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    Rate: ₹{parseFloat(entry.newspapers?.rate || 0).toFixed(2)}
                  </div>

                  <div className={`
                    text-xs px-2 py-1 rounded text-center font-medium
                    ${entry.status === 'received' ? 'bg-green-100 text-green-800' : ''}
                    ${entry.status === 'not_received' ? 'bg-red-100 text-red-800' : ''}
                    ${entry.status === 'unmarked' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {entry.status === 'received' && '✓ Received'}
                    {entry.status === 'not_received' && '✗ Not Received'}
                    {entry.status === 'unmarked' && 'Unmarked'}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMarkEntry(dateString, 'received')}
                      disabled={isMarking}
                      className="flex-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleMarkEntry(dateString, 'not_received')}
                      disabled={isMarking}
                      className="flex-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              )}

              {!entry && (
                <div className="text-xs text-gray-400 text-center mt-4">
                  Not configured
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.firstName || 'Admin'}!
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Home
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-4 px-6 font-medium ${
                activeTab === 'calendar'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('configure')}
              className={`flex-1 py-4 px-6 font-medium ${
                activeTab === 'configure'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Configure
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 px-6 font-medium ${
                activeTab === 'requests'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Join Requests
              {joinRequests.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                  {joinRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-4 px-6 font-medium ${
                activeTab === 'reports'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => changeMonth(-1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ← Previous
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading calendar...</p>
                </div>
              ) : (
                renderCalendar()
              )}
            </div>
          </>
        )}

        {/* Configure Tab */}
        {activeTab === 'configure' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Newspapers</h2>

            <form onSubmit={handleConfigureNewspapers}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={configMonth}
                  onChange={(e) => setConfigMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {newspapers?.configured && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                  This month is already configured. Creating a new configuration will fail unless you delete the existing one first.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.keys(rates).map(day => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {day}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rates[day]}
                        onChange={(e) => setRates({ ...rates, [day]: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Configuring...' : 'Configure Newspapers'}
              </button>
            </form>
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Requests</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading requests...</p>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No pending join requests
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map(request => (
                  <div key={request.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveReject(request.id, 'approved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(request.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Download Reports</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Month for Report
              </label>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => changeMonth(-1)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  ← Previous
                </button>
                <div className="text-xl font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Next →
                </button>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {loading ? 'Downloading...' : 'Download Excel Report'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Report Contents:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Date-wise newspaper delivery status</li>
                <li>Day of week and newspaper rates</li>
                <li>Marked by user information</li>
                <li>Summary with totals and delivery rate</li>
                <li>Total amount for received newspapers</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Explanation:**
- **4 Tabs**: Calendar, Configure, Join Requests, Reports
- **Calendar Tab**: Same as user dashboard, admin can also mark entries
- **Configure Tab**: Set newspaper rates for each day of week, auto-generates entries
- **Join Requests Tab**: Approve/reject pending user requests with badge count
- **Reports Tab**: Month selector and download button for Excel reports
- **Download Handler**: Creates blob URL and triggers file download
- **State Management**: Separate states for each tab with optimized fetching

---

## 4.4 Testing the Complete Application

### Complete User Flow Test

1. **Admin Creates University**
   - Sign up as admin
   - Complete onboarding with university name
   - Verify redirected to admin dashboard

2. **Admin Configures Newspapers**
   - Go to "Configure" tab
   - Select current month
   - Set rates for each day of week
   - Click "Configure Newspapers"
   - Verify success message

3. **User Requests to Join**
   - Sign up as new user
   - Select admin's university
   - Complete onboarding
   - Verify redirected to waiting page

4. **Admin Approves User**
   - Login as admin
   - Go to "Join Requests" tab
   - See pending request
   - Click "Approve"
   - Verify request disappears

5. **User Marks Newspapers**
   - Login as approved user
   - Go to dashboard
   - See calendar with all configured dates
   - Mark some dates as received/not received
   - Verify status updates

6. **Admin Downloads Report**
   - Login as admin
   - Go to "Reports" tab
   - Select month
   - Click "Download Excel Report"
   - Verify Excel file downloads with correct data

---

## 4.5 Verification Checklist

- [ ] User dashboard displays calendar correctly
- [ ] User can mark newspapers as received/not received
- [ ] Admin dashboard has all 4 tabs working
- [ ] Admin calendar view matches user view
- [ ] Newspaper configuration creates entries successfully
- [ ] Join requests appear in admin dashboard
- [ ] Approve/reject updates Clerk metadata
- [ ] Approved users can access dashboard
- [ ] Rejected users cannot access dashboard
- [ ] Excel report downloads successfully
- [ ] Report contains correct data and formatting
- [ ] Month navigation works in all views
- [ ] Today's date is highlighted
- [ ] Loading states display correctly
- [ ] Error messages appear when appropriate

---

## 4.6 Expected Outcome

At the end of Phase 4, you should have:

1. ✅ Fully functional user dashboard with calendar view
2. ✅ Comprehensive admin dashboard with 4 tabs
3. ✅ Newspaper entry marking functionality
4. ✅ Join request management interface
5. ✅ Newspaper configuration system
6. ✅ Excel report download functionality
7. ✅ Responsive design that works on mobile and desktop
8. ✅ Proper loading and error states
9. ✅ Intuitive UI/UX with color coding
10. ✅ Complete end-to-end user flow working

---

## Next Steps

Proceed to **Phase 5: Testing & Deployment** where you'll:
- Perform comprehensive testing of all features
- Set up environment variables for production
- Deploy frontend to Vercel
- Deploy backend to Railway/Render
- Configure production database
- Set up monitoring and logging

---

## Troubleshooting

### Issue: Calendar not displaying
**Solution:** Check browser console for errors. Verify date-fns is installed.

### Issue: "Not configured" showing for all days
**Solution:** Admin must configure newspapers for that month first.

### Issue: Join requests not appearing
**Solution:** Check that requests have status='pending' in database.

### Issue: Excel download fails
**Solution:** Check backend console. Verify ExcelJS is installed and report route works.

### Issue: Metadata not updating after approval
**Solution:** Clear browser cache and sign out/in again. Check Clerk dashboard for metadata.

### Issue: Colors not showing
**Solution:** Ensure Tailwind CSS is properly configured and built.
