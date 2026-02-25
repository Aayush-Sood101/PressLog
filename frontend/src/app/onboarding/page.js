'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { onboardingApi } from '@/lib/api';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [role, setRole] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for user to be loaded before checking
    if (!isLoaded) return;
    
    // Check if user already has a role
    if (user?.publicMetadata?.role) {
      const userRole = user.publicMetadata.role;
      if (userRole === 'admin') {
        // Redirect to admin page (it will check for universityId)
        router.push('/admin');
      } else if (userRole === 'user' && user.publicMetadata.status === 'approved') {
        router.push('/dashboard');
      } else if (userRole === 'user' && user.publicMetadata.status === 'pending') {
        router.push('/waiting');
      }
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (role === 'user') {
      fetchUniversities();
    }
  }, [role]);

  const fetchUniversities = async () => {
    try {
      const data = await onboardingApi.getUniversities();
      setUniversities(data.universities || []);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
      setError('Failed to load universities');
    }
  };

  const handleAdminOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken({ template: undefined });
      await onboardingApi.createUniversity(token, universityName);
      
      // Reload user and wait for metadata to update
      await user.reload();
      
      // Poll for metadata update (max 5 seconds)
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await user.reload();
        
        if (user.publicMetadata?.role === 'admin' && user.publicMetadata?.universityId) {
          router.push('/admin');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // If metadata didn't update, force a hard refresh
      window.location.href = '/admin';
    } catch (err) {
      console.error('Admin onboarding error:', err);
      setError(err.response?.data?.error || 'Failed to create university');
    } finally {
      setLoading(false);
    }
  };

  const handleUserOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken({ template: undefined });
      await onboardingApi.submitJoinRequest(token, selectedUniversityId);
      
      // Reload user and wait for metadata to update
      await user.reload();
      
      // Poll for metadata update (max 5 seconds)
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await user.reload();
        
        if (user.publicMetadata?.role === 'user' && user.publicMetadata?.universityId) {
          router.push('/waiting');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // If metadata didn't update, force a hard refresh
      window.location.href = '/waiting';
    } catch (err) {
      console.error('User onboarding error:', err);
      setError(err.response?.data?.error || 'Failed to submit join request');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while user data is being fetched
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Choose Your Role</h1>
          
          <div className="space-y-4">
            <button
              onClick={() => setRole('admin')}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              I&apos;m an Admin
              <p className="text-sm text-blue-100 mt-1">Create and manage a university</p>
            </button>
            
            <button
              onClick={() => setRole('user')}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              I&apos;m a User
              <p className="text-sm text-green-100 mt-1">Join an existing university</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">Admin Onboarding</h1>
          
          <form onSubmit={handleAdminOnboarding}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University Name
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your university name"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create University'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">User Onboarding</h1>
          
          <form onSubmit={handleUserOnboarding}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select University
              </label>
              <select
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose a university --</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !selectedUniversityId}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
