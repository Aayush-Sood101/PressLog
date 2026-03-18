'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Newspaper, Calendar, History, User, Settings } from 'lucide-react';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { DateNavigator } from '@/components/date-navigator';
import { NewspaperEntryCard } from '@/components/newspaper-entry-card';
import { EmptyState, LoadingScreen, EntryListSkeleton, SidebarLayout } from '@/components/shared';
import { Toast } from '@/components/toast';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role;
    const status = user?.publicMetadata?.status;
    if (!role) { router.push('/onboarding'); return; }
    if (role === 'user' && status === 'pending') { router.push('/waiting'); return; }
  }, [user, isLoaded, router]);

  const fetchEntriesForDate = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken({ template: undefined });
      const data = await userApi.getNewspaperEntriesForDate(token, selectedDate);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError(err.response?.data?.error || 'Failed to load newspapers for this date.');
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedDate]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role) {
      fetchEntriesForDate();
    }
  }, [fetchEntriesForDate, isLoaded, user]);

  const handleMarkEntry = async (entryId, status) => {
    try {
      setMarkingId(entryId);
      const token = await getToken({ template: undefined });
      await userApi.markEntry(token, entryId, status);
      await fetchEntriesForDate();
    } catch (err) {
      console.error('Failed to mark entry:', err);
      setError(err.response?.data?.error || 'Failed to mark newspaper entry');
    } finally {
      setMarkingId(null);
    }
  };

  const stats = useMemo(() => {
    const received = entries.filter(e => e.status === 'received').length;
    const notReceived = entries.filter(e => e.status === 'not_received').length;
    const unmarked = entries.filter(e => e.status === 'unmarked').length;
    return { received, notReceived, unmarked, total: entries.length };
  }, [entries]);

  if (!isLoaded) return <LoadingScreen />;

  const role = user?.publicMetadata?.role;
  const status = user?.publicMetadata?.status;

  if (!role || (role === 'user' && status !== 'approved' && status !== 'pending')) {
    return <LoadingScreen message="Redirecting..." />;
  }

  const sidebarContent = (
    <>
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">PressLog</span>
        </div>
        <p className="text-sidebar-text text-[11px] mt-2 font-medium">User Dashboard</p>
      </div>

      <div className="sidebar-section-label">Navigation</div>
      <button className="sidebar-nav-item active" onClick={() => setSidebarOpen(false)}>
        <Calendar className="w-4 h-4" />
        Today&apos;s Deliveries
      </button>
      <button className="sidebar-nav-item" disabled>
        <History className="w-4 h-4" />
        History
      </button>

      <div className="sidebar-section-label mt-4">Account</div>
      <button className="sidebar-nav-item" disabled>
        <User className="w-4 h-4" />
        My Profile
      </button>
      <button className="sidebar-nav-item" disabled>
        <Settings className="w-4 h-4" />
        Settings
      </button>
    </>
  );

  return (
    <SidebarLayout
      sidebar={sidebarContent}
      sidebarOpen={sidebarOpen}
      onSidebarClose={() => setSidebarOpen(false)}
    >
      <PageHeader
        title="Mark Newspapers"
        subtitle={`${user?.firstName || 'User'} · ${role === 'admin' ? 'Admin View' : 'User'}`}
        icon={Newspaper}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        actions={
          role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
            >
              Admin Panel
            </Button>
          )
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          className="mb-6 animate-fade-in-up"
        />

        <Toast message={error} type="error" onDismiss={() => setError('')} />

        {/* Mini Stats Row */}
        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card text-center">
              <div className="text-xl font-bold text-success">{stats.received}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Received</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-xl font-bold text-destructive">{stats.notReceived}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Missing</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-xl font-bold text-warning">{stats.unmarked}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Unmarked</div>
            </div>
          </div>
        )}

        {/* Delivery progress */}
        {!loading && entries.length > 0 && stats.received > 0 && (
          <div className="glass-card p-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Delivery Progress</span>
              <span className="text-xs font-bold text-foreground">{stats.received}/{stats.total}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${(stats.received / stats.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {stats.received} out of {stats.total} expected newspapers have been logged for today.
            </p>
          </div>
        )}

        {/* Newspapers List */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <EntryListSkeleton />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No Newspapers for This Date"
              description={`Newspapers haven't been configured for ${format(new Date(selectedDate), 'MMMM yyyy')} yet.`}
            />
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <NewspaperEntryCard
                  key={entry.id}
                  entry={entry}
                  isMarking={markingId === entry.id}
                  onMark={handleMarkEntry}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
