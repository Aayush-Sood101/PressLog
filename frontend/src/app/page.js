'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle dashboard navigation
  const handleGoToDashboard = async () => {
    if (!isLoaded || !user) {
      router.push('/onboarding');
      return;
    }
    
    setIsNavigating(true);
    
    // Reload user data to get latest metadata
    await user.reload();
    
    const role = user.publicMetadata?.role;
    const universityId = user.publicMetadata?.universityId;
    const status = user.publicMetadata?.status;
    
    console.log('User metadata:', { role, universityId, status }); // Debug log
    
    if (role === 'admin' && universityId) {
      router.push('/admin');
    } else if (role === 'user' && status === 'approved') {
      router.push('/dashboard');
    } else if (role === 'user' && status === 'pending') {
      router.push('/waiting');
    } else {
      router.push('/onboarding');
    }
    
    // Navigation will happen, so we don't need to reset isNavigating
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Newspaper Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track and manage newspaper deliveries for your university library
        </p>

        <SignedOut>
          <div className="flex gap-4 justify-center">
            <Link
              href="/sign-in"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <button
              onClick={handleGoToDashboard}
              disabled={isNavigating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isNavigating ? 'Loading...' : 'Go to Dashboard'}
            </button>
          </div>
        </SignedIn>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Admins</h3>
            <p className="text-gray-600">
              Create your university, manage join requests, configure newspapers, and generate reports
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Users</h3>
            <p className="text-gray-600">
              Join a university, mark daily newspaper deliveries as received or not received
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
            <p className="text-gray-600">
              Download detailed Excel reports with delivery status and rates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
