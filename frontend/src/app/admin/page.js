'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ShieldCheck, CheckCircle, Settings, Users, Download, Newspaper, BarChart3, Building2 } from 'lucide-react';
import { adminApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { Toast } from '@/components/toast';
import { LoadingScreen, SidebarLayout } from '@/components/shared';
import { MarkTab } from '@/components/admin/mark-tab';
import { ConfigureTab } from '@/components/admin/configure-tab';
import { RequestsTab } from '@/components/admin/requests-tab';
import { ReportsTab } from '@/components/admin/reports-tab';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const token = await getToken({ template: undefined });
      const data = await adminApi.getNewspaperEntries(token, monthString);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError(err.response?.data?.error || 'Failed to load newspaper entries');
    } finally { setLoading(false); }
  }, [getToken, monthString]);

  const fetchJoinRequests = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const token = await getToken({ template: undefined });
      const data = await adminApi.getJoinRequests(token);
      setJoinRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
      setError(err.response?.data?.error || 'Failed to load join requests');
    } finally { setLoading(false); }
  }, [getToken]);

  const fetchNewspapers = useCallback(async () => {
    try {
      const token = await getToken({ template: undefined });
      const data = await adminApi.getNewspapers(token);
      setNewspapers(data.newspapers || []);
    } catch (err) {
      console.error('Failed to fetch newspapers:', err);
      setError(err.response?.data?.error || 'Failed to load newspapers');
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
      setError(err.response?.data?.error || 'Failed to load newspapers for this date.');
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

  useEffect(() => {
    if (activeTab === 'configure') fetchAllRates(ratesMonth);
  }, [activeTab, ratesMonth, fetchAllRates]);

  useEffect(() => {
    if (activeTab === 'mark') fetchMarkEntries();
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
      } else { await fetchEntries(); }
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
    if (!selectedNewspaper) { setError('Please select a newspaper first'); return; }
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
    if (!copySourceMonth || !copyTargetMonth) { setError('Please select both source and target months'); return; }
    if (copySourceMonth === copyTargetMonth) { setError('Source and target months cannot be the same'); return; }
    try {
      setCopyingRates(true); setError('');
      const token = await getToken({ template: undefined });
      const result = await adminApi.copyRates(token, copySourceMonth, copyTargetMonth);
      setSuccessMsg(`Copied rates for ${result.newspapersCopied} newspaper(s) to ${copyTargetMonth}. ${result.entriesCreated} entries created.${result.skipped > 0 ? ` ${result.skipped} already configured (skipped).` : ''}`);
      setCopySourceMonth('');
      if (ratesMonth === copyTargetMonth) await fetchAllRates(ratesMonth);
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

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  /* ────── Loading / redirect guards ────── */
  if (!isLoaded) return <LoadingScreen />;

  const role = user?.publicMetadata?.role;
  const universityId = user?.publicMetadata?.universityId;

  if (role !== 'admin' || !universityId) {
    return <LoadingScreen message="Redirecting..." />;
  }

  /* ────── Tab/sidebar definitions ────── */
  const sidebarItems = [
    { id: 'mark', label: 'Mark Newspapers', icon: CheckCircle, section: 'Management' },
    { id: 'configure', label: 'Newspaper Config', icon: Newspaper, section: 'Management' },
    { id: 'requests', label: 'User Requests', icon: Users, section: 'Management', badge: joinRequests.length || null },
    { id: 'reports', label: 'Reports', icon: Download, section: 'Analytics' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setError('');
    setSuccessMsg('');
    setSidebarOpen(false);
  };

  const sections = [...new Set(sidebarItems.map(item => item.section))];

  const sidebarContent = (
    <>
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Admin Panel</span>
        </div>
        <p className="text-sidebar-text text-[11px] mt-2 font-medium">{user?.firstName || 'Admin'} · Administrator</p>
      </div>

      {sections.map(section => (
        <div key={section}>
          <div className="sidebar-section-label">{section}</div>
          {sidebarItems.filter(item => item.section === section).map(item => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto text-[9px] px-1.5 py-0 animate-pulse">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="mt-auto pt-4 px-5">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full text-left text-xs text-sidebar-text hover:text-sidebar-active transition px-2 py-2"
        >
          ← Switch to User View
        </button>
      </div>
    </>
  );

  return (
    <SidebarLayout
      sidebar={sidebarContent}
      sidebarOpen={sidebarOpen}
      onSidebarClose={() => setSidebarOpen(false)}
    >
      <PageHeader
        title="Admin Dashboard"
        subtitle={<>Welcome back, <span className="text-foreground">{user?.firstName || 'Admin'}</span></>}
        icon={ShieldCheck}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="hidden sm:inline-flex"
          >
            User View
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toast messages */}
        <Toast message={successMsg} type="success" onDismiss={() => setSuccessMsg('')} />
        <Toast message={error} type="error" onDismiss={() => setError('')} />

        {/* Tab panels */}
        <div role="tabpanel" id={`panel-${activeTab}`}>
          {activeTab === 'mark' && (
            <MarkTab
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              entries={markEntries}
              loading={loading}
              markingId={markingId}
              onMark={handleMarkEntry}
              onSwitchToConfig={() => setActiveTab('configure')}
            />
          )}

          {activeTab === 'configure' && (
            <ConfigureTab
              newspapers={newspapers}
              newNewspaperName={newNewspaperName}
              onNewspaperNameChange={setNewNewspaperName}
              onAddNewspaper={handleAddNewspaper}
              onDeleteNewspaper={handleDeleteNewspaper}
              selectedNewspaper={selectedNewspaper}
              onSelectNewspaper={setSelectedNewspaper}
              configMonth={configMonth}
              onConfigMonthChange={setConfigMonth}
              rates={rates}
              onRatesChange={setRates}
              onConfigureNewspaper={handleConfigureNewspaper}
              allRates={allRates}
              ratesMonth={ratesMonth}
              onRatesMonthChange={setRatesMonth}
              loadingRates={loadingRates}
              editingNewspaperId={editingNewspaperId}
              editRates={editRates}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveRates={handleSaveRates}
              onEditRatesChange={setEditRates}
              savingRates={savingRates}
              copySourceMonth={copySourceMonth}
              onCopySourceChange={setCopySourceMonth}
              copyTargetMonth={copyTargetMonth}
              onCopyTargetChange={setCopyTargetMonth}
              onCopyRates={handleCopyRates}
              copyingRates={copyingRates}
              loading={loading}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsTab
              joinRequests={joinRequests}
              loading={loading}
              processingRequestId={processingRequestId}
              onApproveReject={handleApproveReject}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              currentDate={currentDate}
              onChangeMonth={changeMonth}
              onDownload={handleDownloadReport}
              loading={loading}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
