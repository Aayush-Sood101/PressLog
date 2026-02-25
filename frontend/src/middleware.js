import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isWaitingRoute = createRouteMatcher(['/waiting']);
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

  // Debug logging for all protected routes
  console.log('Middleware - Path:', req.nextUrl.pathname);
  console.log('Middleware - Metadata:', { role, universityId, status });

  // If on onboarding route but user already has a role, redirect to appropriate page
  if (isOnboardingRoute(req)) {
    if (role === 'admin') {
      // Redirect admin to admin page (it will check for universityId)
      const adminUrl = new URL('/admin', req.url);
      return NextResponse.redirect(adminUrl);
    }
    if (role === 'user' && status === 'approved') {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
    if (role === 'user' && status === 'pending') {
      const waitingUrl = new URL('/waiting', req.url);
      return NextResponse.redirect(waitingUrl);
    }
    // User has no role - allow them to onboard
    return NextResponse.next();
  }

  // If on waiting route but user is approved, redirect to dashboard
  if (isWaitingRoute(req)) {
    if (role === 'user' && status === 'approved') {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
    if (role === 'admin') {
      const adminUrl = new URL('/admin', req.url);
      return NextResponse.redirect(adminUrl);
    }
    // User is pending, allow them to see waiting page
    return NextResponse.next();
  }

  // Admin routes - allow through and let page handle validation
  if (isAdminRoute(req)) {
    // Allow through - the page itself will check for role and universityId client-side
    return NextResponse.next();
  }

  // Dashboard routes - allow through and let page handle validation
  if (isDashboardRoute(req)) {
    // Allow through - the page itself will check for role and status client-side
    return NextResponse.next();
  }

  // For any other protected route, redirect to onboarding if no role
  if (!role) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
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
