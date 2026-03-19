"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { Newspaper } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
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
    <header className="flex w-full items-center justify-between whitespace-nowrap border-b border-solid border-border/60 px-6 md:px-20 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* 1. Left Section - Logo */}
      <div className="flex w-1/3 justify-start">
        <Link href="/" className="flex items-center gap-3 text-foreground hover:opacity-90 transition-opacity">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Newspaper className="w-5 h-5" />
          </div>
          <h2 className="text-foreground text-xl font-bold leading-tight tracking-tight">PressLog</h2>
        </Link>
      </div>

      {/* 2. Center Section - Navigation Links */}
      <nav className="hidden md:flex w-1/3 justify-center gap-9 items-center">
        <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" href="/">Home</Link>
        <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" href="/#features">Features</Link>
        <Link className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" href="/contact">Contact Us</Link>
      </nav>

      {/* 3. Right Section - Auth & Theme */}
      <div className="flex w-1/3 justify-end items-center gap-4">
        <ThemeToggle />
        <SignedOut>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors hidden md:block">
            Sign In
          </Link>
          <Link href="/sign-up" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 shadow-sm">
            <span className="truncate">Get Started</span>
          </Link>
        </SignedOut>
        <SignedIn>
          <button onClick={handleGoToDashboard} disabled={isNavigating} className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 shadow-sm">
            <span className="truncate">{isNavigating ? 'Loading...' : 'Dashboard'}</span>
          </button>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
