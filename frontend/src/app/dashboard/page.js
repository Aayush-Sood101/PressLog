'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { userApi } from '@/lib/api';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  // --- Auth validation ---
  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role;
    const status = user?.publicMetadata?.status;

    // Allow both user and admin to access this page
    if (!role) { router.push('/onboarding'); return; }
    if (role === 'user' && status === 'pending') { router.push('/waiting'); return; }
  }, [user, isLoaded, router]);

  // --- Data fetching ---
  const fetchEntriesForDate = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken({ template: undefined });
      const data = await userApi.getNewspaperEntriesForDate(token, selectedDate);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load newspapers for this date.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedDate]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role) {
      fetchEntriesForDate();
    }
  }, [fetchEntriesForDate, isLoaded, user]);

  // --- Mark entry ---
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

  const changeDate = (delta) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  // --- Loading / redirect guards ---
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = user?.publicMetadata?.role;
  const status = user?.publicMetadata?.status;

  if (!role || (role === 'user' && status !== 'approved' && status !== 'pending')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                📰 Mark Newspapers
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm">
                {user?.firstName || 'User'} | {role === 'admin' ? 'Admin View' : 'User View'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                >
                  Admin Dashboard
                </button>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* ── Date Navigation ── */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => changeDate(-1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95"
            >
              ← Previous Day
            </button>
            
            <div className="flex-1 max-w-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 text-sm text-center font-medium"
              />
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition active:scale-95"
              >
                Today
              </button>
            )}

            <button
              onClick={() => changeDate(1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95"
            >
              Next Day →
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-lg font-bold text-slate-800">
              {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </span>
            {isToday && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                TODAY
              </span>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span className="text-red-400">⚠</span> {error}
          </div>
        )}

        {/* ── Newspapers List ── */}
        <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-500 text-sm">Loading newspapers...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-slate-700">No Newspapers for This Date</h3>
              <p className="text-slate-400 text-sm mt-1">The admin hasn&apos;t configured newspapers for {format(new Date(selectedDate), 'MMMM yyyy')} yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Newspapers ({entries.length})
              </h2>
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {entry.newspapers?.name || 'Unknown Newspaper'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Rate: ₹{parseFloat(entry.rate || 0).toFixed(2)}
                    </p>
                    {entry.status !== 'unmarked' && entry.markedByEmail && (
                      <p className="text-xs text-slate-400 mt-1">
                        Marked by: {entry.markedByEmail}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className={`
                      px-3 py-1.5 rounded-lg text-sm font-semibold min-w-[100px] text-center
                      ${entry.status === 'received' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${entry.status === 'not_received' ? 'bg-red-100 text-red-700' : ''}
                      ${entry.status === 'unmarked' ? 'bg-amber-100 text-amber-700' : ''}
                    `}>
                      {entry.status === 'received' && '✓ Received'}
                      {entry.status === 'not_received' && '✗ Not Received'}
                      {entry.status === 'unmarked' && '• Unmarked'}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkEntry(entry.id, 'received')}
                        disabled={markingId === entry.id}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all text-sm min-w-[80px]
                          ${entry.status === 'received'
                            ? 'bg-emerald-200 text-emerald-700 cursor-default'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 disabled:bg-slate-300'
                          }
                        `}
                      >
                        {markingId === entry.id ? '...' : '✓ Yes'}
                      </button>
                      <button
                        onClick={() => handleMarkEntry(entry.id, 'not_received')}
                        disabled={markingId === entry.id}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all text-sm min-w-[80px]
                          ${entry.status === 'not_received'
                            ? 'bg-red-200 text-red-700 cursor-default'
                            : 'bg-red-500 text-white hover:bg-red-600 active:scale-95 disabled:bg-slate-300'
                          }
                        `}
                      >
                        {markingId === entry.id ? '...' : '✗ No'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
