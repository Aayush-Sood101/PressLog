'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { Newspaper, ShieldCheck, ClipboardCheck, FileSpreadsheet, ArrowRight, BarChart3, Lock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';

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

  const features = [
    {
      icon: Calendar,
      title: 'Day-Specific Pricing',
      description: 'Accurate billing based on specific delivery days and flexible subscription models for weekend vs weekday editions.',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: BarChart3,
      title: 'Real-time Statistics',
      description: 'Monitor deliveries, missed issues, and expenditures in real-time with a clean, intuitive dashboard interface.',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      icon: FileSpreadsheet,
      title: 'Matrix Excel Reports',
      description: 'Generate comprehensive matrix data exports designed for audit review and administrative reporting requirements.',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      icon: Lock,
      title: 'Role-Based Access',
      description: 'Secure access control tiered for administrators and university staff to ensure data integrity and accountability.',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Newspaper className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">PressLog</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignedOut>
              <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Sign In
              </Link>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-20">
        <div className="text-center animate-fade-in-up">
          <Badge className="mb-6 px-4 py-1.5 text-xs gap-2">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            UNIVERSITY LIBRARY MANAGEMENT
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-5">
            A Modern Solution for
            <br />
            <span className="gradient-text">Newspaper Delivery Tracking</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline your newspaper management with real-time tracking, automated reporting, and role-based access control.
          </p>

          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="shadow-md">
                <Link href="/sign-up" className="gap-2">
                  Start For Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </SignedOut>

          <SignedIn>
            <Button
              onClick={handleGoToDashboard}
              disabled={isNavigating}
              size="lg"
              className="shadow-md gap-2"
            >
              {isNavigating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Loading...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </SignedIn>
        </div>

        {/* Floating stat cards */}
        <div className="mt-14 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card flex items-center gap-3 animate-float">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Issue Logged</div>
              <div className="text-sm font-bold text-foreground">The Times — Today</div>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Incoming Delivery</div>
              <div className="text-sm font-bold text-foreground">12 Bundles Pending</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-28 scroll-mt-20">
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              Everything you need to manage subscriptions at scale
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Designed specifically for the logistical complexity of university library environments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={i} className="feature-card group cursor-default">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <FeatureIcon className={`w-5 h-5 ${feature.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="mt-28 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get set up in minutes with a simple three-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Create Your University', desc: 'Sign up as an admin and register your university in seconds.' },
              { step: '02', title: 'Configure Newspapers', desc: 'Add newspaper subscriptions and set day-specific delivery rates.' },
              { step: '03', title: 'Track & Report', desc: 'Mark daily deliveries and download detailed monthly Excel reports.' },
            ].map((item, i) => (
              <div key={i} className="text-center glass-card p-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-sm">{item.step}</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-28 text-center border-t border-border pt-8 pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Newspaper className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">PressLog</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for university libraries · © {new Date().getFullYear()} PressLog
          </p>
        </div>
      </main>
    </div>
  );
}
