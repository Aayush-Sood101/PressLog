'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const changeDate = (delta) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  // Stats
  const stats = useMemo(() => {
    const received = entries.filter(e => e.status === 'received').length;
    const notReceived = entries.filter(e => e.status === 'not_received').length;
    const unmarked = entries.filter(e => e.status === 'unmarked').length;
    return { received, notReceived, unmarked, total: entries.length };
  }, [entries]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const role = user?.publicMetadata?.role;
  const status = user?.publicMetadata?.status;

  if (!role || (role === 'user' && status !== 'approved' && status !== 'pending')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Header ── */}
        <div className="glass-card p-5 sm:p-6 mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                Mark Newspapers
              </h1>
              <p className="text-slate-400 mt-1 text-xs font-medium">
                {user?.firstName || 'User'} &middot; {role === 'admin' ? 'Admin View' : 'User'}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition btn-press border border-indigo-100"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-3.5 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition btn-press"
              >
                Home
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* ── Date Navigation ── */}
        <div className="glass-card p-4 sm:p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2.5 text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition btn-press"
              aria-label="Previous day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 text-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="sr-only peer"
                id="datePicker"
              />
              <label htmlFor="datePicker" className="cursor-pointer block">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {format(new Date(selectedDate), 'EEEE')}
                </div>
                <div className="text-sm text-slate-400 font-medium mt-0.5 flex items-center justify-center gap-2">
                  {format(new Date(selectedDate), 'MMMM d, yyyy')}
                  {isToday && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
              </label>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2.5 text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition btn-press"
              aria-label="Next day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Quick date actions */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium bg-white hover:border-slate-300 transition cursor-pointer"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition btn-press border border-indigo-100"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="glass-card p-4 mb-6 border-red-200 bg-red-50/80 animate-slide-down">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* ── Mini Stats Row (when entries exist) ── */}
        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-3.5 text-center">
              <div className="text-xl font-extrabold text-emerald-600">{stats.received}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Received</div>
            </div>
            <div className="glass-card p-3.5 text-center">
              <div className="text-xl font-extrabold text-red-500">{stats.notReceived}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Missing</div>
            </div>
            <div className="glass-card p-3.5 text-center">
              <div className="text-xl font-extrabold text-amber-500">{stats.unmarked}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Unmarked</div>
            </div>
          </div>
        )}

        {/* ── Newspapers List ── */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div className="glass-card p-8">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="skeleton w-10 h-10 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-32"></div>
                      <div className="skeleton h-3 w-20"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton h-9 w-16 rounded-lg"></div>
                      <div className="skeleton h-9 w-16 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">No Newspapers for This Date</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Newspapers haven&apos;t been configured for {format(new Date(selectedDate), 'MMMM yyyy')} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => {
                const isMarking = markingId === entry.id;
                const statusColors = {
                  received: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-700' },
                  not_received: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-700' },
                  unmarked: { bg: 'bg-white', border: 'border-slate-200', icon: 'bg-slate-300', text: 'text-slate-500' },
                };
                const sc = statusColors[entry.status] || statusColors.unmarked;

                return (
                  <div
                    key={entry.id}
                    className={`glass-card p-4 sm:p-5 transition-all duration-300 ${sc.border} hover:shadow-md`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Status indicator dot */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          entry.status === 'received' ? 'bg-emerald-100' :
                          entry.status === 'not_received' ? 'bg-red-100' : 'bg-slate-100'
                        }`}>
                          {entry.status === 'received' ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : entry.status === 'not_received' ? (
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                            {entry.newspapers?.name || 'Unknown Newspaper'}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 font-medium">₹{parseFloat(entry.rate || 0).toFixed(2)}</span>
                            {entry.status !== 'unmarked' && entry.markedByEmail && (
                              <>
                                <span className="text-slate-200">|</span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{entry.markedByEmail}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleMarkEntry(entry.id, 'received')}
                          disabled={isMarking}
                          className={`
                            px-3.5 sm:px-4 py-2 rounded-xl font-semibold transition-all text-xs sm:text-sm btn-press
                            ${entry.status === 'received'
                              ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                            }
                          `}
                        >
                          {isMarking ? '...' : '✓ Yes'}
                        </button>
                        <button
                          onClick={() => handleMarkEntry(entry.id, 'not_received')}
                          disabled={isMarking}
                          className={`
                            px-3.5 sm:px-4 py-2 rounded-xl font-semibold transition-all text-xs sm:text-sm btn-press
                            ${entry.status === 'not_received'
                              ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-1'
                              : 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                            }
                          `}
                        >
                          {isMarking ? '...' : '✗ No'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
