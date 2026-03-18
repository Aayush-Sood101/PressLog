'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/shared';

export default function WaitingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.publicMetadata?.status === 'approved') {
      router.push('/dashboard');
      return;
    }

    const interval = setInterval(() => {
      if (isLoaded) user?.reload();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, router, isLoaded]);

  return (
    <PageBackground>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="relative glass-card p-8 sm:p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="flex justify-end mb-4">
            <UserButton afterSignOutUrl="/" />
          </div>

          <div className="mb-6">
            <div className="w-16 h-16 bg-warning/10 rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Pending Approval</h1>
          <p className="text-muted-foreground text-sm font-medium mb-6 leading-relaxed">
            Your request to join the university is pending admin approval.
            You&apos;ll be notified once an admin reviews your request.
          </p>

          <div className="flex items-center justify-center gap-2 p-3 bg-warning/5 rounded-lg border border-warning/10 mb-6">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-warning tracking-wide">Waiting for admin response</span>
          </div>

          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    </PageBackground>
  );
}
