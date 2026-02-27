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

  // All-rates overview state
  const [allRates, setAllRates] = useState([]);
  const [ratesMonth, setRatesMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loadingRates, setLoadingRates] = useState(false);
  const [editingNewspaperId, setEditingNewspaperId] = useState(null);
  const [editRates, setEditRates] = useState({});
  const [savingRates, setSavingRates] = useState(false);

  // Copy rates state
  const [copySourceMonth, setCopySourceMonth] = useState('');
  const [copyTargetMonth, setCopyTargetMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [copyingRates, setCopyingRates] = useState(false);

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

  const fetchAllRates = useCallback(async (month) => {
    try {
      setLoadingRates(true); setError('');
      const token = await getToken({ template: undefined });
      const data = await adminApi.getAllRates(token, month);
      setAllRates(data.newspapers || []);
    } catch (err) {
      console.error('Failed to fetch all rates:', err);
      setError(err.response?.data?.error || 'Failed to load rates overview');
    } finally { setLoadingRates(false); }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || user?.publicMetadata?.role !== 'admin') return;
    if (activeTab === 'calendar') fetchEntries();
    else if (activeTab === 'requests') fetchJoinRequests();
    else if (activeTab === 'configure') { fetchNewspapers(); fetchAllRates(ratesMonth); }
    else if (activeTab === 'mark') fetchMarkEntries();
  }, [activeTab, fetchEntries, fetchJoinRequests, fetchNewspapers, fetchMarkEntries, fetchAllRates, ratesMonth, isLoaded, user]);

  // Refetch all rates when ratesMonth changes
  useEffect(() => {
    if (activeTab === 'configure') {
      fetchAllRates(ratesMonth);
    }
  }, [activeTab, ratesMonth, fetchAllRates]);

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

  const handleStartEdit = (newspaper) => {
    setEditingNewspaperId(newspaper.id);
    setEditRates({ ...newspaper.rates });
  };

  const handleCancelEdit = () => {
    setEditingNewspaperId(null);
    setEditRates({});
  };

  const handleSaveRates = async (newspaperId) => {
    try {
      setSavingRates(true); setError('');
      const token = await getToken({ template: undefined });
      await adminApi.updateNewspaperRates(token, newspaperId, ratesMonth, editRates);
      setSuccessMsg('Rates updated successfully!');
      setEditingNewspaperId(null);
      setEditRates({});
      await fetchAllRates(ratesMonth);
    } catch (err) {
      console.error('Failed to update rates:', err);
      setError(err.response?.data?.error || 'Failed to update rates');
    } finally { setSavingRates(false); }
  };

  const handleCopyRates = async () => {
    if (!copySourceMonth || !copyTargetMonth) {
      setError('Please select both source and target months');
      return;
    }
    if (copySourceMonth === copyTargetMonth) {
      setError('Source and target months cannot be the same');
      return;
    }
    try {
      setCopyingRates(true); setError('');
      const token = await getToken({ template: undefined });
      const result = await adminApi.copyRates(token, copySourceMonth, copyTargetMonth);
      setSuccessMsg(`Copied rates for ${result.newspapersCopied} newspaper(s) to ${copyTargetMonth}. ${result.entriesCreated} entries created.${result.skipped > 0 ? ` ${result.skipped} already configured (skipped).` : ''}`);
      setCopySourceMonth('');
      // Refresh rates if we're viewing the target month
      if (ratesMonth === copyTargetMonth) {
        await fetchAllRates(ratesMonth);
      }
    } catch (err) {
      console.error('Failed to copy rates:', err);
      setError(err.response?.data?.error || 'Failed to copy rates');
    } finally { setCopyingRates(false); }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400 font-medium">Loading...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400 font-medium">Redirecting...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Header ── */}
        <div className="glass-card p-5 sm:p-6 mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-400 text-xs font-medium mt-0.5">
                  Welcome back, <span className="text-slate-600">{user?.firstName || 'Admin'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/dashboard')}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition btn-press border border-indigo-100"
              >
                User View
              </button>
              <button
                onClick={() => router.push('/')}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition btn-press"
              >
                Home
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="glass-card mb-6 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccessMsg(''); }}
                className={`
                  flex-1 py-3.5 px-3 sm:px-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 relative
                  ${activeTab === tab.id
                    ? 'text-indigo-600 bg-indigo-50/60'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none animate-pulse">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Toast messages ── */}
        {successMsg && (
          <div className="glass-card p-4 mb-6 border-emerald-200 bg-emerald-50/80 animate-slide-down">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
            </div>
          </div>
        )}
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

        {/* ══════════ MARK NEWSPAPERS TAB ══════════ */}
        {activeTab === 'mark' && (
          <>
            {/* Date Navigation */}
            <div className="glass-card p-4 sm:p-5 mb-6 animate-fade-in-up">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                  }}
                  className="p-2.5 text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition btn-press"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex-1 text-center">
                  <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {format(new Date(selectedDate), 'EEEE')}
                  </div>
                  <div className="text-sm text-slate-400 font-medium mt-0.5 flex items-center justify-center gap-2">
                    {format(new Date(selectedDate), 'MMMM d, yyyy')}
                    {selectedDate === format(new Date(), 'yyyy-MM-dd') && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                  }}
                  className="p-2.5 text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition btn-press"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium bg-white hover:border-slate-300 transition cursor-pointer"
                />
                {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <button
                    onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition btn-press border border-indigo-100"
                  >
                    Jump to Today
                  </button>
                )}
              </div>
            </div>

            {/* Newspapers List */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
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
              ) : markEntries.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-700 mb-1">No Newspapers for This Date</h3>
                  <p className="text-sm text-slate-400 mb-4">Newspapers haven&apos;t been configured for {format(new Date(selectedDate), 'MMMM yyyy')} yet.</p>
                  <button onClick={() => setActiveTab('configure')}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition btn-press shadow-sm shadow-indigo-200">
                    Configure Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {markEntries.map((entry, i) => {
                    const isMarking = markingId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className={`glass-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md ${
                          entry.status === 'received' ? 'border-emerald-200' :
                          entry.status === 'not_received' ? 'border-red-200' : ''
                        }`}
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
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

                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleMarkEntry(entry.id, 'received')}
                              disabled={isMarking}
                              className={`px-3.5 sm:px-4 py-2 rounded-xl font-semibold transition-all text-xs sm:text-sm btn-press ${
                                entry.status === 'received'
                                  ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                              }`}
                            >
                              {isMarking ? '...' : '✓ Yes'}
                            </button>
                            <button
                              onClick={() => handleMarkEntry(entry.id, 'not_received')}
                              disabled={isMarking}
                              className={`px-3.5 sm:px-4 py-2 rounded-xl font-semibold transition-all text-xs sm:text-sm btn-press ${
                                entry.status === 'not_received'
                                  ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-1'
                                  : 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                              }`}
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
          </>
        )}

        {/* ══════════ CONFIGURE TAB ══════════ */}
        {activeTab === 'configure' && (
          <>
            {/* ── Section 1: Manage Newspapers ── */}
            <div className="glass-card p-5 sm:p-8 mb-6 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Manage Newspapers</h2>
                  <p className="text-slate-400 text-xs font-medium">Add or remove newspapers for your university.</p>
                </div>
              </div>

              {/* Add newspaper form */}
              <form onSubmit={handleAddNewspaper} className="mt-5 mb-6">
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={newNewspaperName}
                    onChange={(e) => setNewNewspaperName(e.target.value)}
                    placeholder="e.g., Times of India"
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70 placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !newNewspaperName.trim()}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition btn-press text-sm whitespace-nowrap shadow-sm shadow-indigo-200"
                  >
                    + Add
                  </button>
                </div>
              </form>

              {/* Newspapers list */}
              {newspapers.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-700">No Newspapers Added</h3>
                  <p className="text-slate-400 text-xs mt-1">Add newspapers using the form above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {newspapers.map((newspaper, i) => (
                    <div key={newspaper.id} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition" style={{animationDelay: `${i*0.03}s`}}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-xs">{newspaper.name[0]}</span>
                        </div>
                        <span className="text-slate-800 font-semibold text-sm">{newspaper.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteNewspaper(newspaper.id, newspaper.name)}
                        disabled={loading}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 2: Configure Rates (Initial Setup) ── */}
            <div className="glass-card p-5 sm:p-8 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Configure Rates</h2>
                  <p className="text-slate-400 text-xs font-medium">Set daily rates for a month. Auto-generates entries for every day.</p>
                </div>
              </div>

              <form onSubmit={handleConfigureNewspaper}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Newspaper</label>
                    <select
                      value={selectedNewspaper?.id || ''}
                      onChange={(e) => {
                        const newspaper = newspapers.find(n => n.id === e.target.value);
                        setSelectedNewspaper(newspaper || null);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70"
                      required
                    >
                      <option value="">Choose a newspaper...</option>
                      {newspapers.map(newspaper => (
                        <option key={newspaper.id} value={newspaper.id}>{newspaper.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Month</label>
                    <input
                      type="month"
                      value={configMonth}
                      onChange={(e) => setConfigMonth(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70"
                      required
                    />
                  </div>
                </div>

                {/* Rates grid */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Daily Rates</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {Object.keys(rates).map(day => (
                      <div key={day} className="text-center">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{day.slice(0, 3)}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rates[day]}
                            onChange={(e) => setRates({ ...rates, [day]: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-7 pr-2 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm text-center bg-white/70"
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
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition btn-press text-sm shadow-sm shadow-indigo-200"
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

            {/* ── Section 3: Monthly Rates Overview (View + Edit) ── */}
            <div className="glass-card p-5 sm:p-8 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Monthly Rates Overview</h2>
                    <p className="text-slate-400 text-xs font-medium">View and edit rates for all configured newspapers.</p>
                  </div>
                </div>
                <input
                  type="month"
                  value={ratesMonth}
                  onChange={(e) => setRatesMonth(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 text-sm bg-white/70 font-medium"
                />
              </div>

              {loadingRates ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="skeleton h-5 w-36"></div>
                        <div className="skeleton h-7 w-16 rounded-lg"></div>
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {[1,2,3,4,5,6,7].map(j => (
                          <div key={j} className="skeleton h-10 rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : allRates.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-700">No Rates Configured</h3>
                  <p className="text-slate-400 text-xs mt-1">No newspapers have been configured for this month yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allRates.map(newspaper => {
                    const isEditing = editingNewspaperId === newspaper.id;
                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                    return (
                      <div key={newspaper.id} className={`rounded-xl border transition-all ${isEditing ? 'border-indigo-300 bg-indigo-50/40 shadow-md ring-1 ring-indigo-200' : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'}`}>
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${newspaper.configured ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                              <span className={`text-xs font-bold ${newspaper.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {newspaper.name[0]}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">{newspaper.name}</h3>
                            {newspaper.configured ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                            )}
                          </div>
                          {newspaper.configured && (
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveRates(newspaper.id)}
                                    disabled={savingRates}
                                    className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition btn-press shadow-sm shadow-emerald-200"
                                  >
                                    {savingRates ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={savingRates}
                                    className="px-3.5 py-1.5 bg-white text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition btn-press"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(newspaper)}
                                  className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition btn-press"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {newspaper.configured && (
                          <div className="px-4 sm:px-5 py-3.5">
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                              {days.map(day => (
                                <div key={day} className="text-center">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{day.slice(0, 3)}</div>
                                  {isEditing ? (
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 text-xs font-medium">₹</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editRates[day] ?? 0}
                                        onChange={(e) => setEditRates({ ...editRates, [day]: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-6 pr-1.5 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm text-center bg-white font-semibold"
                                      />
                                    </div>
                                  ) : (
                                    <div className="px-2 py-2 bg-white rounded-lg border border-slate-100 text-sm font-bold text-slate-700">
                                      ₹{parseFloat(newspaper.rates[day] || 0).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 4: Copy Rates ── */}
            <div className="glass-card p-5 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Copy Rates</h2>
                  <p className="text-slate-400 text-xs font-medium">Copy rates from a previous month. Already configured newspapers are skipped.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">From Month</label>
                  <input
                    type="month"
                    value={copySourceMonth}
                    onChange={(e) => setCopySourceMonth(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70"
                    placeholder="Select source month"
                  />
                </div>

                <div className="hidden sm:flex items-center pb-3">
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">To Month</label>
                  <input
                    type="month"
                    value={copyTargetMonth}
                    onChange={(e) => setCopyTargetMonth(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm bg-white/70"
                  />
                </div>

                <button
                  onClick={handleCopyRates}
                  disabled={copyingRates || !copySourceMonth || !copyTargetMonth}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition btn-press text-sm whitespace-nowrap shadow-sm shadow-indigo-200"
                >
                  {copyingRates ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                      Copying...
                    </span>
                  ) : 'Copy Rates'}
                </button>
              </div>

              {/* Info */}
              <div className="mt-5 p-3.5 bg-amber-50/70 rounded-xl border border-amber-100/80 flex items-start gap-2.5">
                <div className="w-6 h-6 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  This will copy rates for all newspapers configured in the source month and generate daily entries for the target month. Already configured newspapers will be skipped.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══════════ JOIN REQUESTS TAB ══════════ */}
        {activeTab === 'requests' && (
          <div className="glass-card p-5 sm:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Join Requests</h2>
                <p className="text-slate-400 text-xs font-medium">Manage users requesting to join your university.</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="skeleton w-10 h-10 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-28"></div>
                      <div className="skeleton h-3 w-40"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton h-9 w-20 rounded-lg"></div>
                      <div className="skeleton h-9 w-20 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-700">All Clear!</h3>
                <p className="text-slate-400 text-xs mt-1">No pending join requests at this time.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {joinRequests.map((request, i) => {
                  const isProcessing = processingRequestId === request.id;
                  return (
                    <div key={request.id}
                      className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all bg-white/60"
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
                            <span className="text-white font-bold text-sm">
                              {(request.userName || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{request.userName}</h3>
                            <p className="text-xs text-slate-400 font-medium">{request.userEmail}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5 font-medium">
                              {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <button
                            onClick={() => handleApproveReject(request.id, 'approved')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition btn-press shadow-sm shadow-emerald-200"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleApproveReject(request.id, 'rejected')}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white text-red-500 text-xs font-semibold rounded-xl border border-red-200 hover:bg-red-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition btn-press"
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
          <div className="glass-card p-5 sm:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Download Reports</h2>
                <p className="text-slate-400 text-xs font-medium">Generate and download monthly Excel reports.</p>
              </div>
            </div>

            {/* Month selector */}
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100 mb-6">
              <button onClick={() => changeMonth(-1)}
                className="p-2 text-slate-500 bg-white rounded-lg hover:bg-slate-100 transition btn-press border border-slate-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-base font-bold text-slate-800 min-w-[160px] text-center tracking-tight">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={() => changeMonth(1)}
                className="p-2 text-slate-500 bg-white rounded-lg hover:bg-slate-100 transition btn-press border border-slate-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 transition btn-press text-sm flex items-center justify-center gap-2.5 shadow-md shadow-indigo-200"
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
            <div className="mt-6 p-5 bg-indigo-50/60 rounded-xl border border-indigo-100/80">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report Includes
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  'Date-wise newspaper delivery status',
                  'Day of week and newspaper rates',
                  'Who marked each entry',
                  'Summary with totals and delivery rate',
                  'Total receivable amount',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-xs font-medium">{item}</span>
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
