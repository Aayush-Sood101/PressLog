'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { Newspaper, CreditCard, BarChart3, LayoutGrid, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

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
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background font-sans text-foreground antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <Navbar />

        <main className="flex-1">
          <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-12 md:py-24">
            <div className="flex flex-col gap-10 md:flex-row items-center">
              <div className="flex flex-col gap-8 flex-1">
                <div className="flex flex-col gap-4">
                  <h1 className="text-foreground text-4xl md:text-6xl font-black leading-tight tracking-tight">
                    A Modern Solution for University Library Newspaper Delivery Tracking
                  </h1>
                  <p className="text-muted-foreground text-lg md:text-xl font-normal leading-relaxed max-w-[600px]">
                    Streamline your newspaper management with real-time tracking, automated reporting, and role-based access control.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <SignedOut>
                    <Link href="/sign-up" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-14 px-6 bg-primary text-primary-foreground text-base font-bold shadow-lg hover:translate-y-[-2px] transition-all">
                      <span className="truncate">Get Started Free</span>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <button onClick={handleGoToDashboard} className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-14 px-6 bg-primary text-primary-foreground text-base font-bold shadow-lg hover:translate-y-[-2px] transition-all">
                      <span className="truncate">Go to Dashboard</span>
                    </button>
                  </SignedIn>
                  <a href="#features" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-14 px-6 bg-secondary text-secondary-foreground text-base font-bold hover:bg-secondary/80 transition-all">
                    <span className="truncate">Learn More</span>
                  </a>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <div className="w-full aspect-video rounded-2xl shadow-2xl bg-slate-200 overflow-hidden relative" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEiBiNJGsljNgByiC6AZDCmBKDbdyBErUY7P_An9NZi4lt5wm7EV88_Dv20L_iLARMkm6HtY1u7cccVkklyIVYYlz4GO1cX9z0VZnz1uAybbxB8koLtfv_rR5EyRk_a5ML4xO-7SPInrMDWt5dO_NliUgL3yqpZ3aHKzYxv3m3Q1UaZzoc8V9AtVKZ33UtUEeqJGcgj-Wmhh7RvngNmtXL_BqUGeldJ4Hbvk3GcvTfE-Gvl2Va-kRuqXW7mCk0xNg9UBxHlQQbJmtB')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-[#1a355b]/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img alt="Librarian logging newspaper delivery on tablet" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcGQglcy7bRtXDNTq68Ysd-oiTZYOmQEf_WjW_SAg6DQOKPAB_q2VXwz63xDEMs08-8OugcxuBBIECPeS8w8rFEHgLpUcEDUGZ5GVj1p1wzV15RjFk6WuWDDE6ST1-Dp_7QkoFTKxEghg9Tz0-2iVbsiDN5HjSu31xoMTujT6S4tifbAz95VTO8AfaWbayLBszy0YjFURpzoMX9kz5vjSOjqDXw1yyaPU8g8zQleRUdXECciLpjSzeuNTEii02Rf-cL6eBFmHXdAy3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          <div className="max-w-[1280px] mx-auto px-6 md:px-20 py-24 flex flex-col gap-16" id="features">
            <div className="flex flex-col gap-4 text-center items-center">
              <h2 className="text-foreground text-3xl md:text-5xl font-black leading-tight tracking-tight max-w-[800px]">
                Everything you need to manage subscriptions at scale
              </h2>
              <p className="text-muted-foreground text-lg font-normal max-w-[720px]">Designed specifically for the logistical complexity of university library environments.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-5 p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="size-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground text-xl font-bold">Day-Specific Pricing</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">Accurate billing based on specific delivery days and flexible subscription models for weekend vs weekday editions.</p>
                </div>
              </div>
              <div className="flex flex-col gap-5 p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="size-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground text-xl font-bold">Real-time Statistics</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">Monitor deliveries, missed issues, and expenditures in real-time with beautiful, interactive dashboards.</p>
                </div>
              </div>
              <div className="flex flex-col gap-5 p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="size-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <LayoutGrid className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground text-xl font-bold">Matrix Excel Reports</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">Generate comprehensive matrix data exports designed for audit review and complex administrative reporting requirements.</p>
                </div>
              </div>
              <div className="flex flex-col gap-5 p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="size-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground text-xl font-bold">Role-Based Access</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">Secure access control tiered for administrators, librarians, and delivery staff to ensure data integrity.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1280px] mx-auto px-6 md:px-20 pb-24 pt-12">
            <div className="bg-primary rounded-3xl p-10 md:p-20 text-center flex flex-col items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <h2 className="text-primary-foreground text-3xl md:text-5xl font-bold max-w-2xl leading-tight">Ready to modernize your library's tracking?</h2>
              <p className="text-primary-foreground/80 text-lg md:text-xl max-w-xl">Join hundreds of institutions already saving hours every week on manual newspaper tracking.</p>
              <div className="flex flex-wrap justify-center gap-4 relative z-10">
                <SignedOut>
                  <Link href="/sign-up" className="bg-primary-foreground text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-foreground/90 transition-colors shadow-lg">Get Started</Link>
                </SignedOut>
                <SignedIn>
                  <button onClick={handleGoToDashboard} disabled={isNavigating} className="bg-primary-foreground text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-foreground/90 transition-colors shadow-lg">{isNavigating ? 'Loading...' : 'Get Started'}</button>
                </SignedIn>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
