'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { onboardingApi } from '@/lib/api';
import { Newspaper, ShieldCheck, User, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Label } from '@/components/ui/input';
import { PageBackground, LoadingScreen } from '@/components/shared';

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
    if (!isLoaded) return;
    if (user?.publicMetadata?.role) {
      const userRole = user.publicMetadata.role;
      if (userRole === 'admin') router.push('/admin');
      else if (userRole === 'user' && user.publicMetadata.status === 'approved') router.push('/dashboard');
      else if (userRole === 'user' && user.publicMetadata.status === 'pending') router.push('/waiting');
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (role === 'user') fetchUniversities();
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

  const pollAndRedirect = async (check, destination) => {
    let attempts = 0;
    while (attempts < 10) {
      await user.reload();
      if (check()) { router.push(destination); return; }
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }
    window.location.href = destination;
  };

  const handleAdminOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = await getToken({ template: undefined });
      await onboardingApi.createUniversity(token, universityName);
      await user.reload();
      await pollAndRedirect(
        () => user.publicMetadata?.role === 'admin' && user.publicMetadata?.universityId,
        '/admin'
      );
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
      await user.reload();
      await pollAndRedirect(
        () => user.publicMetadata?.role === 'user' && user.publicMetadata?.universityId,
        '/waiting'
      );
    } catch (err) {
      console.error('User onboarding error:', err);
      setError(err.response?.data?.error || 'Failed to submit join request');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <LoadingScreen />;

  // --- Error Banner (reused across forms) ---
  const ErrorBanner = () =>
    error ? (
      <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-xs font-medium border border-destructive/20 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    ) : null;

  // --- Role selection ---
  if (!role) {
    return (
      <PageBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Newspaper className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Choose Your Role</h1>
              <p className="text-muted-foreground text-sm mt-1 font-medium">How would you like to use PressLog?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setRole('admin')}
                className="w-full p-5 bg-primary/5 border-2 border-primary/10 rounded-lg hover:border-primary/30 hover:shadow-md transition-all text-left group btn-press"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-foreground block">I&apos;m an Admin</span>
                    <span className="text-xs text-muted-foreground font-medium">Create and manage a university</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 ml-auto group-hover:text-primary transition" />
                </div>
              </button>

              <button
                onClick={() => setRole('user')}
                className="w-full p-5 bg-success/5 border-2 border-success/10 rounded-lg hover:border-success/30 hover:shadow-md transition-all text-left group btn-press"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition">
                    <User className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-foreground block">I&apos;m a User</span>
                    <span className="text-xs text-muted-foreground font-medium">Join an existing university</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 ml-auto group-hover:text-success transition" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </PageBackground>
    );
  }

  // --- Admin form ---
  if (role === 'admin') {
    return (
      <PageBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
            <div className="mb-6">
              <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Setup</h1>
              <p className="text-muted-foreground text-xs font-medium mt-1">Create your university to get started</p>
            </div>

            <form onSubmit={handleAdminOnboarding}>
              <div className="mb-5">
                <Label htmlFor="uni-name">University Name</Label>
                <Input
                  id="uni-name"
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="Enter your university name"
                  required
                />
              </div>

              <ErrorBanner />

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setRole('')}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create University'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageBackground>
    );
  }

  // --- User form ---
  if (role === 'user') {
    return (
      <PageBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="relative glass-card p-8 sm:p-10 max-w-md w-full animate-fade-in-up">
            <div className="mb-6">
              <div className="w-11 h-11 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <User className="w-5 h-5 text-success" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Join a University</h1>
              <p className="text-muted-foreground text-xs font-medium mt-1">Select your university to submit a join request</p>
            </div>

            <form onSubmit={handleUserOnboarding}>
              <div className="mb-5">
                <Label htmlFor="uni-select">Select University</Label>
                <Select
                  id="uni-select"
                  value={selectedUniversityId}
                  onChange={(e) => setSelectedUniversityId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a university --</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </Select>
              </div>

              <ErrorBanner />

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setRole('')}>
                  Back
                </Button>
                <Button type="submit" variant="success" className="flex-1" disabled={loading || !selectedUniversityId}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageBackground>
    );
  }

  return null;
}
