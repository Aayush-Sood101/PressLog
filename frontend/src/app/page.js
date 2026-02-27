'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoToDashboard = async () => {
    if (!isLoaded || !user) { router.push('/onboarding'); return; }
    setIsNavigating(true);
    await user.reload();
    const role = user.publicMetadata?.role;
    const universityId = user.publicMetadata?.universityId;
    const status = user.publicMetadata?.status;

    if (role === 'admin' && universityId) router.push('/admin');
    else if (role === 'user' && status === 'approved') router.push('/dashboard');
    else if (role === 'user' && status === 'pending') router.push('/waiting');
    else router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">NewsPaper Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 btn-press">
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            UNIVERSITY LIBRARY MANAGEMENT
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
            Track Newspaper
            <br />
            <span className="gradient-text">Deliveries Effortlessly</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A modern system for university libraries to manage newspaper subscriptions, track daily deliveries, and generate detailed reports.
          </p>

          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up"
                className="px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200/60 btn-press flex items-center justify-center gap-2"
              >
                Start For Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="/sign-in"
                className="px-8 py-3.5 text-sm font-semibold text-slate-700 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition btn-press"
              >
                Sign In
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <button
              onClick={handleGoToDashboard}
              disabled={isNavigating}
              className="px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200/60 disabled:bg-slate-300 disabled:shadow-none btn-press inline-flex items-center gap-2"
            >
              {isNavigating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                  Loading...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </SignedIn>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Admin Control',
              description: 'Create your university, manage users, configure newspaper subscriptions, and set custom daily rates.',
              color: 'indigo',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              title: 'Daily Tracking',
              description: 'Mark newspapers as received or not received each day with a clean, intuitive one-click interface.',
              color: 'emerald',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: 'Excel Reports',
              description: 'Download detailed monthly reports with delivery stats, rates, billing summaries, and who marked each entry.',
              color: 'violet',
            },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-7 group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                feature.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                'bg-violet-100 text-violet-600'
              }`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-xs text-slate-400 tracking-wide uppercase font-medium">
            Built for university libraries
          </p>
        </div>
      </main>
    </div>
  );
}
