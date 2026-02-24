# Phase 2: Authentication & Onboarding

## Overview
This phase implements Clerk authentication, creates the onboarding flow for admins and users, and sets up role-based routing. By the end of this phase, users will be able to sign up, choose their role, and complete onboarding based on whether they're an admin or regular user.

---

## 2.1 Configure Backend Database & Clerk Clients

### Create Supabase Client Configuration
Create `backend/config/database.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
```

**Explanation:**
- Creates a Supabase client using the service role key
- Disables auth features since we're using Clerk for authentication
- Service role key bypasses Row Level Security for backend operations

### Create Clerk Client Configuration
Create `backend/config/clerk.js`:

```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

module.exports = clerkClient;
```

**Explanation:**
- Initializes Clerk backend SDK
- Uses `CLERK_SECRET_KEY` from environment variables automatically
- Provides methods to update user metadata, verify tokens, etc.

---

## 2.2 Create Authentication Middleware

### JWT Verification Middleware
Create `backend/middleware/auth.js`:

```javascript
const { verifyToken } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to verify Clerk JWT token
 * Attaches user info to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach user info to request
    req.user = {
      clerkId: payload.sub,
      role: payload.publicMetadata?.role,
      universityId: payload.publicMetadata?.universityId,
      status: payload.publicMetadata?.status,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

/**
 * Middleware to require approved status
 */
const requireApproved = (req, res, next) => {
  if (req.user.status === 'pending') {
    return res.status(403).json({ error: 'Forbidden: Approval pending' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireApproved,
};
```

**Explanation:**
- `requireAuth`: Verifies JWT token from Authorization header, extracts user metadata
- `requireAdmin`: Ensures user has admin role
- `requireApproved`: Ensures user is approved (not pending)
- All protected routes will use these middleware functions

---

## 2.3 Create Onboarding API Routes

### Onboarding Routes
Create `backend/routes/onboarding.js`:

```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const clerkClient = require('../config/clerk');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/onboarding/admin
 * Create university and update Clerk metadata
 */
router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { universityName } = req.body;
    const { clerkId } = req.user;

    if (!universityName || universityName.trim() === '') {
      return res.status(400).json({ error: 'University name is required' });
    }

    // Check if admin already has a university
    const { data: existingUniversity } = await supabase
      .from('universities')
      .select('*')
      .eq('admin_clerk_id', clerkId)
      .single();

    if (existingUniversity) {
      return res.status(400).json({ error: 'You have already created a university' });
    }

    // Create university
    const { data: university, error: dbError } = await supabase
      .from('universities')
      .insert([
        {
          name: universityName.trim(),
          admin_clerk_id: clerkId,
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to create university' });
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: 'admin',
        universityId: university.id,
      },
    });

    res.status(201).json({
      message: 'University created successfully',
      university,
    });
  } catch (error) {
    console.error('Admin onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/onboarding/user
 * Submit join request for a university
 */
router.post('/user', requireAuth, async (req, res) => {
  try {
    const { universityId } = req.body;
    const { clerkId } = req.user;

    if (!universityId) {
      return res.status(400).json({ error: 'University ID is required' });
    }

    // Verify university exists
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .single();

    if (universityError || !university) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Check if user already has a join request
    const { data: existingRequest } = await supabase
      .from('join_requests')
      .select('*')
      .eq('user_clerk_id', clerkId)
      .eq('university_id', universityId)
      .single();

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You have already submitted a request for this university',
        status: existingRequest.status
      });
    }

    // Create join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('join_requests')
      .insert([
        {
          user_clerk_id: clerkId,
          university_id: universityId,
          status: 'pending',
        }
      ])
      .select()
      .single();

    if (requestError) {
      console.error('Database error:', requestError);
      return res.status(500).json({ error: 'Failed to create join request' });
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: 'user',
        universityId: universityId,
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Join request submitted successfully',
      joinRequest,
    });
  } catch (error) {
    console.error('User onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/onboarding/universities
 * Get list of all universities for user onboarding
 */
router.get('/universities', async (req, res) => {
  try {
    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch universities' });
    }

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**Explanation:**
- **POST /admin**: Admin creates university, updates Clerk metadata with role and universityId
- **POST /user**: User submits join request, updates Clerk metadata with pending status
- **GET /universities**: Returns list of all universities for dropdown selection
- All routes validate input and handle errors appropriately

---

## 2.4 Create Express Server

### Main Server File
Create `backend/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const onboardingRoutes = require('./routes/onboarding');

app.use('/api/onboarding', onboardingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Explanation:**
- Initializes Express server with CORS and JSON parsing
- Mounts onboarding routes at `/api/onboarding`
- Health check endpoint for monitoring
- Global error handler

---

## 2.5 Configure Frontend Clerk Provider

### Root Layout with ClerkProvider
Edit `frontend/src/app/layout.js`:

```javascript
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'Newspaper Management System',
  description: 'Track and manage newspaper deliveries for university libraries',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Explanation:**
- Wraps entire app with ClerkProvider for authentication
- Makes Clerk hooks available throughout the application
- Sets up metadata for SEO

---

## 2.6 Create Clerk Middleware

### Authentication Middleware
Create `frontend/src/middleware.js`:

```javascript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = sessionClaims?.publicMetadata?.role;
  const universityId = sessionClaims?.publicMetadata?.universityId;
  const status = sessionClaims?.publicMetadata?.status;

  // Allow onboarding route
  if (isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to onboarding if user has no role
  if (!role) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Admin routes - require admin role and university
  if (isAdminRoute(req)) {
    if (role !== 'admin' || !universityId) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Dashboard routes - require approved status for regular users
  if (isDashboardRoute(req)) {
    if (role === 'user' && status === 'pending') {
      const waitingUrl = new URL('/waiting', req.url);
      return NextResponse.redirect(waitingUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

**Explanation:**
- Protects routes based on authentication status and user role
- Redirects unauthenticated users to sign-in
- Redirects users without role to onboarding
- Prevents pending users from accessing dashboard
- Ensures admins have created a university before accessing admin routes

---

## 2.7 Create API Client

### Axios API Client
Create `frontend/src/lib/api.js`:

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

export default apiClient;
```

**Explanation:**
- Creates axios instance with base URL from environment
- Exports organized API functions for onboarding
- Handles authentication tokens in headers
- Provides clean interface for making API calls

---

## 2.8 Create Sign-In and Sign-Up Pages

### Sign-In Page
Create `frontend/src/app/sign-in/[[...sign-in]]/page.js`:

```javascript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/onboarding"
      />
    </div>
  );
}
```

### Sign-Up Page
Create `frontend/src/app/sign-up/[[...sign-up]]/page.js`:

```javascript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
```

**Explanation:**
- Uses Clerk's pre-built SignIn and SignUp components
- Redirects to onboarding after successful authentication
- Provides links to switch between sign-in and sign-up
- Styled with Tailwind CSS

---

## 2.9 Create Onboarding Page

### Onboarding Page with Role Selection
Create `frontend/src/app/onboarding/page.js`:

```javascript
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
      if (userRole === 'admin' && user.publicMetadata.universityId) {
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
      const token = await getToken();
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
      const token = await getToken();
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
```

**Explanation:**
- **Role Selection**: User chooses between Admin or User role
- **Admin Flow**: Enter university name → creates university → updates Clerk metadata
- **User Flow**: Select university from dropdown → creates join request → updates Clerk metadata with pending status
- **Metadata Polling**: Waits for Clerk metadata to update before redirecting
- **Auto-redirect**: If user already has a role, redirects to appropriate page

---

## 2.10 Create Waiting Page

### Pending Approval Page
Create `frontend/src/app/waiting/page.js`:

```javascript
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WaitingPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect if approved
    if (user?.publicMetadata?.status === 'approved') {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Pending Approval</h1>
        <p className="text-gray-600 mb-6">
          Your request to join the university is pending admin approval. 
          You&apos;ll be notified once an admin reviews your request.
        </p>
        
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
```

**Explanation:**
- Shows message to users waiting for admin approval
- Auto-redirects to dashboard if status becomes "approved"
- Provides link back to home page

---

## 2.11 Create Landing Page

### Home Page
Edit `frontend/src/app/page.js`:

```javascript
'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { user, isLoaded } = useUser();

  // Determine the correct dashboard link based on user role
  const getDashboardLink = () => {
    if (!isLoaded || !user) return '/onboarding';
    
    const role = user.publicMetadata?.role;
    const status = user.publicMetadata?.status;
    
    if (role === 'admin') return '/admin';
    if (role === 'user' && status === 'approved') return '/dashboard';
    if (role === 'user' && status === 'pending') return '/waiting';
    return '/onboarding';
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
            <Link
              href={getDashboardLink()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
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
```

**Explanation:**
- Shows sign-in/sign-up buttons for unauthenticated users
- Shows user button and dashboard link for authenticated users
- Smart dashboard link routing based on user role
- Information cards explaining the system

---

## 2.12 Testing Phase 2

### Start Backend Server
```bash
cd backend
npm run dev
```

You should see: "Server running on port 5000"

### Start Frontend Server
```bash
cd frontend
npm run dev
```

You should see: "Ready on http://localhost:3000"

### Test Admin Flow
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create an account with email/password
4. After sign-up, you'll be redirected to `/onboarding`
5. Click "I'm an Admin"
6. Enter a university name (e.g., "Harvard University")
7. Click "Create University"
8. You should be redirected to `/admin` (will be empty for now)

### Test User Flow
1. Sign out and create a new account
2. On onboarding, click "I'm a User"
3. Select the university you created
4. Click "Submit Request"
5. You should be redirected to `/waiting` page

### Verify in Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Navigate to "Users"
3. Click on your admin user
4. Check "Public metadata" - should see:
   ```json
   {
     "role": "admin",
     "universityId": "uuid-here"
   }
   ```

### Verify in Supabase
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Check `universities` table - should have one row
4. Check `join_requests` table - should have pending request

---

## 2.13 Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access sign-in page at /sign-in
- [ ] Can access sign-up page at /sign-up
- [ ] Admin onboarding creates university in database
- [ ] Admin onboarding updates Clerk publicMetadata
- [ ] Admin redirected to /admin after onboarding
- [ ] User onboarding shows university dropdown
- [ ] User onboarding creates join request in database
- [ ] User onboarding updates Clerk publicMetadata
- [ ] User redirected to /waiting after onboarding
- [ ] Middleware protects routes correctly
- [ ] Unauthenticated users redirected to sign-in

---

## 2.14 Expected Outcome

At the end of Phase 2, you should have:

1. ✅ Working Clerk authentication
2. ✅ Role-based onboarding flow for admins and users
3. ✅ Backend API for onboarding
4. ✅ Frontend pages for sign-in, sign-up, onboarding, and waiting
5. ✅ Route protection with middleware
6. ✅ University creation and join request functionality
7. ✅ Clerk metadata properly updated with role and university info

---

## Next Steps

Proceed to **Phase 3: Backend API Development** where you'll:
- Create admin routes for managing join requests and newspapers
- Create user routes for marking newspaper entries
- Implement report generation with Excel export
- Add date helper utilities

---

## Troubleshooting

### Issue: "Invalid token" error
**Solution:** Check that `CLERK_SECRET_KEY` is correctly set in `backend/.env`

### Issue: Clerk metadata not updating
**Solution:** Wait a few seconds after onboarding. The metadata polling should handle this.

### Issue: University not appearing in dropdown
**Solution:** Check backend console for errors. Verify Supabase connection.

### Issue: CORS errors in browser
**Solution:** Ensure `cors` middleware is properly configured in `server.js`
