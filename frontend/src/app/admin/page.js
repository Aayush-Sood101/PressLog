'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { adminApi, userApi } from '@/lib/api';

/* ──────────────────────────────────────────────
   TAB ICON COMPONENTS
   ────────────────────────────────────────────── */
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const CogIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const CheckMarkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ──────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────── */
export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  // UI state
  const [activeTab, setActiveTab] = useState('mark');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mark tab state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markEntries, setMarkEntries] = useState([]);

  // Data state
  const [entries, setEntries] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newspapers, setNewspapers] = useState([]);
  const [markingId, setMarkingId] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Configure tab state
  const [newNewspaperName, setNewNewspaperName] = useState('');
  const [selectedNewspaper, setSelectedNewspaper] = useState(null);
  const [configMonth, setConfigMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [rates, setRates] = useState({
    Monday: 10, Tuesday: 10, Wednesday: 10, Thursday: 10,
    Friday: 10, Saturday: 12, Sunday: 12,
  });

  const monthString = format(currentDate, 'yyyy-MM');

  // --- Auth validation ---
  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role;
    const universityId = user?.publicMetadata?.universityId;
    if (role !== 'admin') { router.push('/onboarding'); return; }
    if (!universityId) { router.push('/onboarding'); return; }
  }, [user, isLoaded, router]);

  // --- Auto-dismiss success messages ---
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  /* ────── Data fetchers ────── */
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined }); // Force refresh for latest metadata
      const data = await adminApi.getNewspaperEntries(token, monthString);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load newspaper entries';
      setError(errorMsg);
    } finally { setLoading(false); }
  }, [getToken, monthString]);

  const fetchJoinRequests = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined }); // Force refresh for latest metadata
      const data = await adminApi.getJoinRequests(token);
      setJoinRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load join requests';
      setError(errorMsg);
    } finally { setLoading(false); }
  }, [getToken]);

  const fetchNewspapers = useCallback(async () => {
    try {
      const token = await getToken({ template: undefined }); // Force refresh for latest metadata
      const data = await adminApi.getNewspapers(token);
      setNewspapers(data.newspapers || []);
    } catch (err) {
      console.error('Failed to fetch newspapers:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load newspapers';
      setError(errorMsg);
    }
  }, [getToken]);

  const fetchMarkEntries = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      const data = await userApi.getNewspaperEntriesForDate(token, selectedDate);
      setMarkEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch mark entries:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load newspapers for this date.';
      setError(errorMsg);
    } finally { setLoading(false); }
  }, [getToken, selectedDate]);

  useEffect(() => {
    if (!isLoaded || user?.publicMetadata?.role !== 'admin') return;
    if (activeTab === 'calendar') fetchEntries();
    else if (activeTab === 'requests') fetchJoinRequests();
    else if (activeTab === 'configure') fetchNewspapers();
    else if (activeTab === 'mark') fetchMarkEntries();
  }, [activeTab, fetchEntries, fetchJoinRequests, fetchNewspapers, fetchMarkEntries, isLoaded, user]);

  // Refetch mark entries when date changes
  useEffect(() => {
    if (activeTab === 'mark') {
      fetchMarkEntries();
    }
  }, [activeTab, selectedDate, fetchMarkEntries]);

  /* ────── Actions ────── */
  const handleMarkEntry = async (entryId, status) => {
    try {
      setMarkingId(entryId);
      const token = await getToken({ template: undefined });
      await userApi.markEntry(token, entryId, status);
      if (activeTab === 'mark') {
        await fetchMarkEntries();
        setSuccessMsg(`Newspaper marked as ${status.replace('_', ' ')}!`);
      } else {
        await fetchEntries();
      }
    } catch (err) {
      console.error('Failed to mark entry:', err);
      setError(err.response?.data?.error || 'Failed to mark entry');
    } finally { setMarkingId(null); }
  };

  const handleApproveReject = async (requestId, status) => {
    try {
      setProcessingRequestId(requestId);
      const token = await getToken({ template: undefined });
      await adminApi.updateJoinRequest(token, requestId, status);
      setSuccessMsg(`Request ${status} successfully!`);
      await fetchJoinRequests();
    } catch (err) {
      console.error('Failed to update request:', err);
      setError(err.response?.data?.error || 'Failed to update request');
    } finally { setProcessingRequestId(null); }
  };

  const handleAddNewspaper = async (e) => {
    e.preventDefault();
    if (!newNewspaperName.trim()) return;
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      await adminApi.createNewspaper(token, newNewspaperName.trim());
      setSuccessMsg(`Newspaper "${newNewspaperName}" added successfully!`);
      setNewNewspaperName('');
      await fetchNewspapers();
    } catch (err) {
      console.error('Failed to add newspaper:', err);
      setError(err.response?.data?.error || 'Failed to add newspaper');
    } finally { setLoading(false); }
  };

  const handleDeleteNewspaper = async (newspaperId, newspaperName) => {
    if (!confirm(`Delete "${newspaperName}"? This will remove all entries and rates.`)) return;
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      await adminApi.deleteNewspaper(token, newspaperId);
      setSuccessMsg(`Newspaper "${newspaperName}" deleted successfully!`);
      setSelectedNewspaper(null);
      await fetchNewspapers();
    } catch (err) {
      console.error('Failed to delete newspaper:', err);
      setError(err.response?.data?.error || 'Failed to delete newspaper');
    } finally { setLoading(false); }
  };

  const handleConfigureNewspaper = async (e) => {
    e.preventDefault();
    if (!selectedNewspaper) {
      setError('Please select a newspaper first');
      return;
    }
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      const result = await adminApi.configureNewspaper(token, selectedNewspaper.id, configMonth, rates);
      setSuccessMsg(`"${selectedNewspaper.name}" configured for ${configMonth}! ${result.entriesCreated} entries created.`);
      setSelectedNewspaper(null);
    } catch (err) {
      console.error('Failed to configure newspaper:', err);
      setError(err.response?.data?.error || 'Failed to configure newspaper');
    } finally { setLoading(false); }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      const blob = await adminApi.downloadReport(token, monthString);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newspaper-report-${monthString}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Report downloaded successfully!');
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('Failed to download report. Make sure newspapers are configured for this month.');
    } finally { setLoading(false); }
  };

  /* ────── Computed values ────── */
  const stats = useMemo(() => {
    const received = entries.filter(e => e.status === 'received');
    const notReceived = entries.filter(e => e.status === 'not_received');
    const unmarked = entries.filter(e => e.status === 'unmarked');
    const totalAmount = received.reduce((sum, e) => sum + parseFloat(e.rate || 0), 0);
    const deliveryRate = entries.length > 0 ? Math.round((received.length / entries.length) * 100) : 0;
    return { received: received.length, notReceived: notReceived.length, unmarked: unmarked.length, total: entries.length, totalAmount, deliveryRate };
  }, [entries]);

  const getEntryForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return entries.find(entry => entry.date === dateString);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  /* ────── Loading / redirect guards ────── */
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const role = user?.publicMetadata?.role;
  const universityId = user?.publicMetadata?.universityId;

  if (role !== 'admin' || !universityId) {
    if (role !== 'admin') router.push('/onboarding');
    else if (!universityId) router.push('/onboarding');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     RENDER HELPERS
     ════════════════════════════════════════════ */

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] sm:min-h-[130px]"></div>
        ))}
        {days.map(day => {
          const entry = getEntryForDate(day);
          const dateString = format(day, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isMarking = markingId === entry?.id;

          return (
            <div
              key={dateString}
              className={`
                min-h-[100px] sm:min-h-[130px] p-1.5 sm:p-2 rounded-xl transition-all duration-200
                ${isCurrentDay
                  ? 'ring-2 ring-indigo-500 bg-indigo-50/50 shadow-md'
                  : entry
                    ? 'bg-white border border-slate-200 hover:shadow-md hover:border-slate-300'
                    : 'bg-slate-50/50 border border-dashed border-slate-200'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`
                  text-xs sm:text-sm font-semibold inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full
                  ${isCurrentDay ? 'bg-indigo-600 text-white' : 'text-slate-700'}
                `}>
                  {format(day, 'd')}
                </span>
                {entry && (
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    ₹{parseFloat(entry.rate || 0).toFixed(0)}
                  </span>
                )}
              </div>

              {entry ? (
                <div className="space-y-1.5">
                  <div className={`
                    text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md text-center font-semibold tracking-wide
                    ${entry.status === 'received' ? 'bg-emerald-100 text-emerald-700' : ''}
                    ${entry.status === 'not_received' ? 'bg-red-100 text-red-700' : ''}
                    ${entry.status === 'unmarked' ? 'bg-amber-100 text-amber-700' : ''}
                  `}>
                    {entry.status === 'received' && '✓ Received'}
                    {entry.status === 'not_received' && '✗ Missing'}
                    {entry.status === 'unmarked' && '• Unmarked'}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMarkEntry(entry.id, 'received')}
                      disabled={isMarking || entry.status === 'received'}
                      className={`flex-1 text-[10px] sm:text-xs py-1 rounded-md font-medium transition-all duration-150
                        ${entry.status === 'received'
                          ? 'bg-emerald-200 text-emerald-600 cursor-default'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 disabled:bg-slate-300'}`}
                    >✓</button>
                    <button
                      onClick={() => handleMarkEntry(entry.id, 'not_received')}
                      disabled={isMarking || entry.status === 'not_received'}
                      className={`flex-1 text-[10px] sm:text-xs py-1 rounded-md font-medium transition-all duration-150
                        ${entry.status === 'not_received'
                          ? 'bg-red-200 text-red-600 cursor-default'
                          : 'bg-red-500 text-white hover:bg-red-600 active:scale-95 disabled:bg-slate-300'}`}
                    >✗</button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] sm:text-xs text-slate-300 text-center mt-4 italic">
                  No entry
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const tabs = [
    { id: 'mark', label: 'Mark Newspapers', icon: <CheckMarkIcon /> },
    { id: 'configure', label: 'Configure', icon: <CogIcon /> },
    { id: 'requests', label: 'Requests', icon: <UsersIcon />, badge: joinRequests.length || null },
    { id: 'reports', label: 'Reports', icon: <DownloadIcon /> },
  ];

  /* ════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                🏛️ Admin Dashboard
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm">
                Welcome back, <span className="font-medium text-slate-700">{user?.firstName || 'Admin'}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Home
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 mb-6 overflow-hidden">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccessMsg(''); }}
                className={`
                  flex-1 py-3.5 px-3 sm:px-6 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 relative
                  ${activeTab === tab.id
                    ? 'text-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Toast messages ── */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-[fadeIn_0.3s]">
            <span>✓</span> {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ══════════ MARK NEWSPAPERS TAB ══════════ */}
        {activeTab === 'mark' && (
          <>
            {/* Date Navigation */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95"
                >
                  ← Previous Day
                </button>
                
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm text-center font-medium"
                  />
                </div>

                {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <button
                    onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition active:scale-95"
                  >
                    Today
                  </button>
                )}

                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95"
                >
                  Next Day →
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-lg font-bold text-slate-800">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </span>
                {selectedDate === format(new Date(), 'yyyy-MM-dd') && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    TODAY
                  </span>
                )}
              </div>
            </div>

            {/* Newspapers List */}
            <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500 text-sm">Loading newspapers...</p>
                </div>
              ) : markEntries.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-slate-700">No Newspapers for This Date</h3>
                  <p className="text-slate-400 text-sm mt-1">Newspapers haven&apos;t been configured for {format(new Date(selectedDate), 'MMMM yyyy')} yet.</p>
                  <button onClick={() => setActiveTab('configure')}
                    className="mt-4 px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Configure Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Newspapers ({markEntries.length})
                  </h2>
                  {markEntries.map(entry => (
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
          </>
        )}

        {/* ══════════ CONFIGURE TAB ══════════ */}
        {activeTab === 'configure' && (
          <>
            {/* Newspaper Management Section */}
            <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Manage Newspapers</h2>
              <p className="text-slate-400 text-sm mb-6">Add or remove newspapers for your university.</p>

              {/* Add newspaper form */}
              <form onSubmit={handleAddNewspaper} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newNewspaperName}
                    onChange={(e) => setNewNewspaperName(e.target.value)}
                    placeholder="e.g., Times of India"
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !newNewspaperName.trim()}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition active:scale-95 text-sm whitespace-nowrap"
                  >
                    Add Newspaper
                  </button>
                </div>
              </form>

              {/* Newspapers list */}
              {newspapers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📰</div>
                  <h3 className="text-lg font-semibold text-slate-700">No Newspapers Added</h3>
                  <p className="text-slate-400 text-sm mt-1">Add newspapers using the form above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {newspapers.map(newspaper => (
                    <div key={newspaper.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-800 font-medium">{newspaper.name}</span>
                      <button
                        onClick={() => handleDeleteNewspaper(newspaper.id, newspaper.name)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configure Newspaper Section */}
            <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Configure Rates</h2>
              <p className="text-slate-400 text-sm mb-6">Set daily newspaper rates for a month. This will auto-generate an entry for every day.</p>

              <form onSubmit={handleConfigureNewspaper}>
                {/* Newspaper selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Newspaper</label>
                  <select
                    value={selectedNewspaper?.id || ''}
                    onChange={(e) => {
                      const newspaper = newspapers.find(n => n.id === e.target.value);
                      setSelectedNewspaper(newspaper || null);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
                    required
                  >
                    <option value="">Choose a newspaper...</option>
                    {newspapers.map(newspaper => (
                      <option key={newspaper.id} value={newspaper.id}>{newspaper.name}</option>
                    ))}
                  </select>
                </div>

                {/* Month picker */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={configMonth}
                    onChange={(e) => setConfigMonth(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
                    required
                  />
                </div>

                {/* Rates grid */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Daily Rates</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.keys(rates).map(day => (
                      <div key={day}>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{day}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rates[day]}
                            onChange={(e) => setRates({ ...rates, [day]: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedNewspaper}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition active:scale-95 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                      Configuring...
                    </span>
                  ) : 'Configure Newspaper'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ══════════ JOIN REQUESTS TAB ══════════ */}
        {activeTab === 'requests' && (
          <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Join Requests</h2>
            <p className="text-slate-400 text-sm mb-6">Manage users requesting to join your university.</p>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                <p className="mt-4 text-slate-500 text-sm">Loading requests...</p>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-slate-700">All Clear!</h3>
                <p className="text-slate-400 text-sm mt-1">No pending join requests at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map(request => {
                  const isProcessing = processingRequestId === request.id;
                  return (
                    <div key={request.id}
                      className="border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 transition bg-white/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-bold text-sm">
                              {(request.userName || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{request.userName}</h3>
                            <p className="text-xs text-slate-500">{request.userEmail}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <button
                            onClick={() => handleApproveReject(request.id, 'approved')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-5 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:bg-slate-300 transition active:scale-95"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleApproveReject(request.id, 'rejected')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-5 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition active:scale-95"
                          >
                            {isProcessing ? '...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ REPORTS TAB ══════════ */}
        {activeTab === 'reports' && (
          <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Download Reports</h2>
            <p className="text-slate-400 text-sm mb-8">Generate and download monthly Excel reports.</p>

            {/* Month selector */}
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => changeMonth(-1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95">
                ←
              </button>
              <div className="text-lg font-bold text-slate-800 min-w-[160px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={() => changeMonth(1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition active:scale-95">
                →
              </button>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-slate-300 transition active:scale-95 text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                  Generating...
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Download Excel Report
                </>
              )}
            </button>

            {/* Info card */}
            <div className="mt-8 p-5 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Report includes:</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  'Date-wise newspaper delivery status',
                  'Day of week and newspaper rates',
                  'Who marked each entry',
                  'Summary with totals and delivery rate',
                  'Total receivable amount',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
