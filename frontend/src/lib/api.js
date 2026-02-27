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
  // Get all pending join requests
  getJoinRequests: async (token) => {
    const response = await apiClient.get('/api/admin/join-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Approve or reject a join request
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

  // Create a new newspaper
  createNewspaper: async (token, name) => {
    const response = await apiClient.post(
      '/api/admin/newspapers',
      { name },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Get all newspapers for the university
  getNewspapers: async (token) => {
    const response = await apiClient.get('/api/admin/newspapers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Delete a newspaper
  deleteNewspaper: async (token, newspaperId) => {
    const response = await apiClient.delete(`/api/admin/newspapers/${newspaperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Configure rates for a newspaper for a month
  configureNewspaper: async (token, newspaperId, month, rates) => {
    const response = await apiClient.post(
      `/api/admin/newspapers/${newspaperId}/configure`,
      { month, rates },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Get rates for a newspaper for a month
  getNewspaperRates: async (token, newspaperId, month) => {
    const response = await apiClient.get(`/api/admin/newspapers/${newspaperId}/rates/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get rates for ALL newspapers for a month
  getAllRates: async (token, month) => {
    const response = await apiClient.get(`/api/admin/all-rates/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update rates for a newspaper for a month
  updateNewspaperRates: async (token, newspaperId, month, rates) => {
    const response = await apiClient.put(
      `/api/admin/newspapers/${newspaperId}/rates/${month}`,
      { rates },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Copy rates from one month to another
  copyRates: async (token, sourceMonth, targetMonth) => {
    const response = await apiClient.post(
      '/api/admin/copy-rates',
      { sourceMonth, targetMonth },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Get newspaper entries for a month (all newspapers)
  getNewspaperEntries: async (token, month) => {
    const response = await apiClient.get(`/api/admin/newspaper-entries/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Download monthly report (returns blob)
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
  // Get all newspapers for the university
  getNewspapers: async (token) => {
    const response = await apiClient.get('/api/newspapers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get newspaper entries for a month
  getNewspaperEntries: async (token, month) => {
    const response = await apiClient.get(`/api/newspaper-entries/${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get newspaper entries for a specific date
  getNewspaperEntriesForDate: async (token, date) => {
    const response = await apiClient.get(`/api/newspaper-entries/date/${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Mark a newspaper entry as received or not_received
  markEntry: async (token, entryId, status) => {
    const response = await apiClient.post(
      '/api/newspaper-entries',
      { entryId, status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};

export default apiClient;
