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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Decorative blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Choose Your Role</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">How would you like to use NewsPaper Tracker?</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setRole('admin')}
              className="w-full p-5 bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all text-left group btn-press"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="text-base font-bold text-slate-800 block">I&apos;m an Admin</span>
                  <span className="text-xs text-slate-400 font-medium">Create and manage a university</span>
                </div>
                <svg className="w-5 h-5 text-slate-300 ml-auto group-hover:text-indigo-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button
              onClick={() => setRole('user')}
              className="w-full p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all text-left group btn-press"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-base font-bold text-slate-800 block">I&apos;m a User</span>
                  <span className="text-xs text-slate-400 font-medium">Join an existing university</span>
                </div>
                <svg className="w-5 h-5 text-slate-300 ml-auto group-hover:text-emerald-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
          <div className="mb-6">
            <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Setup</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Create your university to get started</p>
          </div>
          
          <form onSubmit={handleAdminOnboarding}>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                University Name
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70 placeholder:text-slate-300"
                placeholder="Enter your university name"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('')}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-semibold text-slate-600 btn-press"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:bg-slate-200 disabled:text-slate-400 text-sm font-semibold btn-press shadow-sm shadow-indigo-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                    Creating...
                  </span>
                ) : 'Create University'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
          <div className="mb-6">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Join a University</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Select your university to submit a join request</p>
          </div>
          
          <form onSubmit={handleUserOnboarding}>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Select University
              </label>
              <select
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70"
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
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('')}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-semibold text-slate-600 btn-press"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !selectedUniversityId}
                className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition disabled:bg-slate-200 disabled:text-slate-400 text-sm font-semibold btn-press shadow-sm shadow-emerald-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                    Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
