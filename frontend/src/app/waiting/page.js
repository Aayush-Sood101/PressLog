'use client';

import { useUser, UserButton } from '@clerk/nextjs';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative glass-card p-8 sm:p-10 max-w-md w-full text-center animate-fade-in-up">
        <div className="flex justify-end mb-4">
          <UserButton afterSignOutUrl="/" />
        </div>
        
        <div className="mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <svg
              className="w-8 h-8 text-amber-500"
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
        
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Pending Approval</h1>
        <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
          Your request to join the university is pending admin approval. 
          You&apos;ll be notified once an admin reviews your request.
        </p>

        <div className="flex items-center justify-center gap-2 p-3 bg-amber-50/70 rounded-xl border border-amber-100/80 mb-6">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-amber-700 tracking-wide">Waiting for admin response</span>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-semibold btn-press shadow-sm shadow-indigo-200"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
