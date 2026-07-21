import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ContactsTable } from '@/components/ContactsTable';
import { MessageComposer } from '@/components/MessageComposer';
import { QRCodeModal } from '@/components/QRCodeModal';
import { SendProgress } from '@/components/SendProgress';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseFile } from '@/lib/fileParser';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { Message, SendProgress as SendProgressType } from '@/types/message';
import { Contact } from '@/types/contact';
import { MessageSquare, Smartphone, Upload as UploadIcon, Trash2, LogOut, User, HelpCircle, Crown, Shield, BookUser, Users, CalendarClock, X, Bot, Lock, ChevronRight, MoreHorizontal, Mail, Globe, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TourGuide } from '@/components/TourGuide';
import { ManualContactEntry } from '@/components/ManualContactEntry';
import { SavedContactsDrawer } from '@/components/SavedContactsDrawer';
import { WhatsAppContactsDrawer } from '@/components/WhatsAppContactsDrawer';
import { ScheduledJobsDrawer } from '@/components/ScheduledJobsDrawer';
import { BackgroundJobsPanel, BgJob } from '@/components/BackgroundJobsPanel';
import './App.css';

function App() {
  const {
    contacts,
    setContacts,
    selection,
    setSelection,
    isWhatsAppConnected,
    setIsWhatsAppConnected,
  } = useApp();
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showSendProgress, setShowSendProgress] = useState(false);
  const [showSavedContacts, setShowSavedContacts] = useState(false);
  const [showWAContacts, setShowWAContacts] = useState(false);
  const [showScheduledJobs, setShowScheduledJobs] = useState(false);
  const [scheduleToast, setScheduleToast] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentCampaignName, setCurrentCampaignName] = useState<string | undefined>(undefined);
  const [bgJobs, setBgJobs] = useState<BgJob[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Draggable panel divider
  const [panelWidth, setPanelWidth] = useState(58); // left panel % width
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(58);
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showTour, setShowTour] = useState(false);
  const [mobileTab, setMobileTab] = useState<'send' | 'contacts' | 'schedule' | 'more'>('send');

  // Load bridged contacts from Leads Scraper if present
  useEffect(() => {
    const raw = sessionStorage.getItem('temp_leads_whatsapp');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item: any) => ({
            id: item.id || Math.random().toString(36).substring(2, 9),
            phone: item.phone,
            formattedPhone: item.phone,
            isValid: true,
            name: item.name || '',
          }));
          setContacts(formatted);

          // Select all loaded contacts by default
          const newSelection: Record<string, boolean> = {};
          formatted.forEach((c: any) => {
            newSelection[c.id] = true;
          });
          setSelection(newSelection);
        }
      } catch (e) {
        console.error('Failed to load bridged leads:', e);
      } finally {
        sessionStorage.removeItem('temp_leads_whatsapp');
      }
    }
  }, [setContacts, setSelection]);

  // Define before useEffect so the closure captures the correct binding
  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.whatsapp.status);
      const result = await response.json();
      const isConnected = result.success && result.data?.isConnected && result.data?.isReady;
      setIsWhatsAppConnected(isConnected);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch {
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [setIsWhatsAppConnected]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, checkWhatsAppStatus]);

  // Heartbeat for auto-logout: send activity ping to backend on user interaction.
  // The backend's idle checker disconnects WhatsApp if no heartbeat for 10 minutes.
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let lastHeartbeat = 0;
    const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeat < HEARTBEAT_INTERVAL) return;
      lastHeartbeat = now;
      apiFetch(API_ENDPOINTS.security.heartbeat, { method: 'POST' }).catch(() => { });
    };

    // Send on mount (page open/refresh counts as activity)
    sendHeartbeat();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, sendHeartbeat, { passive: true }));
    return () => events.forEach(evt => window.removeEventListener(evt, sendHeartbeat));
  }, [isAuthenticated, isLoading]);

  // Poll active background jobs every 3 seconds
  useEffect(() => {
    const running = bgJobs.filter(j => j.status === 'running');
    if (running.length === 0) return;

    const poll = async () => {
      for (const job of running) {
        try {
          const res = await apiFetch(API_ENDPOINTS.whatsapp.bgJobStatus(job.id));
          const json = await res.json();
          if (json.success && json.data) {
            setBgJobs(prev => prev.map(j =>
              j.id === job.id
                ? { ...j, sent: json.data.sent, failed: json.data.failed, total: json.data.total, status: json.data.status }
                : j
            ));
          }
        } catch { /* ignore */ }
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [bgJobs]);

  const handleWorkInBackground = (jobId: string) => {
    setBgJobs(prev => [...prev, {
      id: jobId,
      total: selectedContacts.length,
      sent: 0,
      failed: 0,
      status: 'running',
      startedAt: new Date(),
    }]);
    setShowSendProgress(false);
    setScheduleToast("Sending in background! We'll email you when it's done — no worries.");
    setTimeout(() => setScheduleToast(''), 7000);
  };

  const handleStopBgJob = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.bgJobStop(id), { method: 'DELETE' });
      setBgJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'stopped' } : j));
    } catch { /* ignore */ }
  };

  const handleDismissBgJob = (id: string) => {
    setBgJobs(prev => prev.filter(j => j.id !== id));
  };

  // Save contacts to the user's persistent contacts book (fire-and-forget)
  const saveContactsToBook = useCallback(async (contactsToSave: Contact[]) => {
    const valid = contactsToSave
      .filter((c) => c.isValid)
      .map((c) => ({ name: c.name || '', phone: c.formattedPhone || c.phone }));
    if (valid.length === 0) return;
    try {
      await apiFetch(API_ENDPOINTS.contacts.save, {
        method: 'POST',
        body: JSON.stringify({ contacts: valid }),
      });
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsFileUploading(true);
    try {
      const parsedContacts = await parseFile(file);
      setContacts(parsedContacts);
      const autoSelection: Record<string, boolean> = {};
      parsedContacts.forEach((contact) => {
        if (contact.isValid) autoSelection[contact.id] = true;
      });
      setSelection(autoSelection);
      // Auto-save valid contacts to the contacts book
      saveContactsToBook(parsedContacts);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleManualAdd = (newContacts: Contact[]) => {
    // Merge new contacts with existing ones (avoid duplicate phone numbers in session)
    const existingPhones = new Set(contacts.map((c) => c.formattedPhone || c.phone));
    const unique = newContacts.filter((c) => !existingPhones.has(c.formattedPhone || c.phone));
    const merged = [...contacts, ...unique];
    setContacts(merged);
    const autoSelection: Record<string, boolean> = { ...selection };
    unique.forEach((contact) => {
      if (contact.isValid) autoSelection[contact.id] = true;
    });
    setSelection(autoSelection);
    // Save to contacts book
    saveContactsToBook(newContacts);
  };

  const handleSavedContactsLoad = (loaded: Contact[]) => {
    // Merge saved contacts into session without duplicating phone numbers
    const existingPhones = new Set(contacts.map((c) => c.formattedPhone || c.phone));
    const unique = loaded.filter((c) => !existingPhones.has(c.formattedPhone || c.phone));
    const merged = [...contacts, ...unique];
    setContacts(merged);
    const autoSelection: Record<string, boolean> = { ...selection };
    unique.forEach((contact) => {
      if (contact.isValid) autoSelection[contact.id] = true;
    });
    setSelection(autoSelection);
  };

  const handleConnectWhatsApp = async () => {
    setConnectionStatus('connecting');
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.init, { method: 'POST' });
      setShowQRModal(true);
    } catch {
      alert('Failed to connect to WhatsApp');
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.disconnect, { method: 'POST' });
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    } catch {
      // ignore
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setTimeout(checkWhatsAppStatus, 1000);
  };

  const handleSendMessages = async (messages: Message[], scheduledAt?: Date, campaignName?: string) => {
    setShowMessageComposer(false);

    if (scheduledAt) {
      // Schedule the job via API
      try {
        const res = await apiFetch(API_ENDPOINTS.schedule.create, {
          method: 'POST',
          body: JSON.stringify({
            contacts: selectedContacts.map(c => ({ phone: c.formattedPhone || c.phone, name: c.name || '' })),
            messages,
            scheduledAt: scheduledAt.toISOString(),
            campaignName: campaignName || undefined,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setScheduleToast(`Scheduled for ${scheduledAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`);
          setTimeout(() => setScheduleToast(''), 5000);
        } else {
          setScheduleToast(`Failed to schedule: ${json.error || 'unknown error'}`);
          setTimeout(() => setScheduleToast(''), 5000);
        }
      } catch {
        setScheduleToast('Network error — could not schedule');
        setTimeout(() => setScheduleToast(''), 5000);
      }
      return;
    }

    // Immediate send
    setCurrentMessages(messages);
    setCurrentCampaignName(campaignName);
    setShowSendProgress(true);
  };

  const handleSendComplete = (progress: SendProgressType) => {
    console.log('Send complete:', progress);
    setSelection({});
  };

  const handleClearContacts = () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      setContacts([]);
      setSelection({});
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMobileTab = (tab: 'send' | 'contacts' | 'schedule' | 'more') => {
    setMobileTab(tab);
    if (tab === 'contacts') setShowSavedContacts(true);
    else if (tab === 'schedule') setShowScheduledJobs(true);
  };

  const handleSavedContactsClose = () => {
    setShowSavedContacts(false);
    setMobileTab('send');
  };

  const handleScheduledJobsClose = () => {
    setShowScheduledJobs(false);
    setMobileTab('send');
  };

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerW = containerRef.current.getBoundingClientRect().width;
      const delta = ev.clientX - dragStartX.current;
      const newPct = dragStartWidth.current + (delta / containerW) * 100;
      setPanelWidth(Math.min(70, Math.max(30, newPct)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const selectedContacts = contacts.filter((c) => selection[c.id]);
  const selectedCount = selectedContacts.length;

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
          {/* Desktop header */}
          <div className="hidden md:flex items-center h-14 gap-3">

            {/* Left: back + logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/app')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={17} />
              </button>
              <div className="flex items-center gap-2">
                <img src="/icon-192.png" alt="Logo" className="w-7 h-7 rounded-lg object-contain" />
                <span className="text-sm font-semibold text-gray-900">WhatsApp Campaign</span>
              </div>
            </div>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            {/* WhatsApp status */}
            <div data-tour="step-connect" className="flex items-center gap-1.5 shrink-0">
              {isWhatsAppConnected ? (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-semibold text-green-700 tracking-wide">CONNECTED</span>
                  </div>
                  <button
                    onClick={handleDisconnectWhatsApp}
                    className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full border border-gray-200 hover:border-red-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={handleConnectWhatsApp} disabled={connectionStatus === 'connecting'}>
                  <Smartphone className="mr-1.5" size={14} />
                  {connectionStatus === 'connecting' ? 'Connecting…' : 'Connect WhatsApp'}
                </Button>
              )}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            {/* Nav buttons — consistent neutral style, icon + label */}
            <nav className="flex items-center gap-1">
              {/* Schedule */}
              <button
                onClick={() => setShowScheduledJobs(true)}
                title="Scheduled messages"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium"
              >
                <CalendarClock size={14} className="text-blue-500" />
                <span>Schedule</span>
              </button>

              {/* AI Bot */}
              {user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('whatsapp') && (
                <button
                  onClick={() => navigate('/bot')}
                  title="AI WhatsApp Bot"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium"
                >
                  <Bot size={14} className="text-violet-500" />
                  <span>AI Bot</span>
                </button>
              )}

              {/* Campaigns */}
              <button
                onClick={() => navigate('/campaigns')}
                title="Campaign history & lead tracking"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium"
              >
                <MessageSquare size={14} className="text-emerald-500" />
                <span>Campaigns</span>
              </button>

              {/* Email channel switch */}
              {user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('email') && (
                <button
                  onClick={() => navigate('/email')}
                  title="Switch to Email Channel"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium"
                >
                  <Mail size={14} className="text-sky-500" />
                  <span>Email</span>
                </button>
              )}

              {/* Icon-only utilities */}
              {user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('chatbot') && (
                <button onClick={() => navigate('/website-chatbot')} title="Website Chatbot"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Globe size={15} />
                </button>
              )}
              <button onClick={() => navigate('/security')} title="Security Settings"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Lock size={15} />
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => navigate('/admin')} title="Admin Panel"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Shield size={15} />
                </button>
              )}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Subscription badge */}
            <button
              onClick={() => navigate('/subscription')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors shrink-0 ${
                !user?.subscription?.isActive
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              }`}
            >
              <Crown size={11} />
              <span>{(() => {
                const plan = user?.subscription?.plan || ''
                if (plan === 'free' || plan === 'trial') return 'Trial'
                if (plan.includes('yearly')) return 'Yearly'
                if (plan.includes('monthly')) return 'Monthly'
                if (plan.includes('chatbot')) return 'Chatbot'
                return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free'
              })()}</span>
              {user?.subscription?.isActive && (user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial') && (
                <span className={`font-normal ${user.subscription.messagesUsed >= user.subscription.messageLimit - 10 ? 'text-red-600 font-bold' : 'opacity-70'}`}>
                  · {user.subscription.messagesUsed}/{user.subscription.messageLimit}
                </span>
              )}
              {user?.subscription?.isActive && user?.subscription?.plan !== 'free' && user?.subscription?.plan !== 'trial' && user?.subscription?.daysLeft > 0 && user?.subscription?.daysLeft <= 90 && (
                <span className={`font-normal ${user.subscription.daysLeft <= 7 ? 'text-red-600 font-bold' : 'opacity-70'}`}>
                  · {user.subscription.daysLeft}d
                </span>
              )}
            </button>

            {/* User avatar */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              title="View Profile"
            >
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || <User size={12} className="text-white" />}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate hidden lg:block">{user?.name?.split(' ')[0]}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile: simplified header */}
          <div className="md:hidden">
            {/* Row 1: Logo + WA status + avatar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain shrink-0" />
                <h1 className="text-base font-bold text-gray-900 truncate">Bulk Messenger</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* WA status dot */}
                <div
                  data-tour="step-connect"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${isWhatsAppConnected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isWhatsAppConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {isWhatsAppConnected ? 'Connected' : 'Disconnected'}
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
                  title="View Profile"
                >
                  <span className="text-[11px] font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </button>
              </div>
            </div>

            {/* Row 2: WhatsApp connect/disconnect */}
            <div className="mt-2 pt-2 border-t border-gray-100" data-tour="step-connect">
              {isWhatsAppConnected ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleDisconnectWhatsApp} className="flex-1">
                    Disconnect WhatsApp
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectWhatsApp}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full"
                >
                  <Smartphone className="mr-1.5" size={16} />
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              )}
            </div>

            {/* Row 3: Feature shortcuts */}
            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1.5">
              <button
                onClick={() => setShowScheduledJobs(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium active:bg-gray-100 transition-colors"
              >
                <CalendarClock size={13} className="text-blue-500" />
                Schedule
              </button>
              {user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('whatsapp') && (
                <button
                  onClick={() => navigate('/bot')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium active:bg-gray-100 transition-colors"
                >
                  <Bot size={13} className="text-violet-500" />
                  AI Bot
                </button>
              )}
              <button
                onClick={() => navigate('/campaigns')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium active:bg-gray-100 transition-colors"
              >
                <MessageSquare size={13} className="text-emerald-500" />
                Campaigns
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Subscription Banners */}
      <div className="flex-none">
        {user?.subscription && !user.subscription.isActive && (
          <div className="bg-red-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-medium">
                Your subscription has expired. Upgrade now to continue.
              </p>
              <button
                onClick={() => navigate('/subscription')}
                className="px-3 sm:px-4 py-1.5 bg-white text-red-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
        {user?.subscription?.isActive && (user.subscription.plan === 'free' || user.subscription.plan === 'trial') && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-medium">
                Free trial — {user.subscription.messageLimit - user.subscription.messagesUsed} of {user.subscription.messageLimit} messages remaining. Upgrade for unlimited access.
              </p>
              <button
                onClick={() => navigate('/subscription')}
                className="px-3 sm:px-4 py-1.5 bg-white text-amber-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-50 transition-colors shrink-0"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 overflow-hidden min-h-0">

        {/* ── Desktop two-column layout ── */}
        <div ref={containerRef} className="hidden md:flex flex-1 h-full overflow-hidden min-h-0">

          {/* LEFT: Contacts Panel */}
          <div className="flex flex-col border-r border-gray-200 bg-white overflow-hidden" style={{ width: `${panelWidth}%` }}>

            {/* Panel header */}
            <div className="flex-none flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
              <span className="text-sm font-semibold text-gray-800">Contacts</span>
              {contacts.length > 0 && (
                <span className="text-xs text-gray-400 ml-1">{selectedCount}/{contacts.length} selected</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setShowSavedContacts(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
                  <BookUser size={12} /> My Contacts
                </button>
                <button onClick={() => setShowWAContacts(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Users size={12} /> WA Contacts
                </button>
                {contacts.length > 0 && (
                  <button onClick={handleClearContacts} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Compact file upload */}
            <div className="flex-none px-5 py-3 border-b border-gray-100" data-tour="step-upload">
              <FileUpload onFileUpload={handleFileUpload} isLoading={isFileUploading} compact />
            </div>

            {/* Collapsible manual entry */}
            <div className="flex-none border-b border-gray-100 px-5 py-0.5">
              <ManualContactEntry onAdd={handleManualAdd} collapsible />
            </div>

            {/* Contact table (scrollable) */}
            <div className="flex-1 overflow-y-auto">
              {contacts.length > 0 ? (
                <ContactsTable contacts={contacts} selection={selection} onSelectionChange={setSelection} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <UploadIcon size={28} className="text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">No contacts yet</h3>
                  <p className="text-xs text-gray-400">Upload a file or add contacts manually above</p>
                </div>
              )}
            </div>
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={handleDividerMouseDown}
            className="w-1.5 flex-none bg-gray-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors group flex items-center justify-center"
            title="Drag to resize"
          >
            <div className="w-0.5 h-8 rounded-full bg-gray-400 group-hover:bg-blue-500 transition-colors" />
          </div>

          {/* RIGHT: Compose Panel */}
          <div className="flex flex-col bg-gray-50 overflow-hidden" style={{ width: `${100 - panelWidth}%` }}>

            {/* Panel header: step label + WA status */}
            <div className="flex-none flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <span className="text-sm font-semibold text-gray-800">Compose &amp; Send</span>
              </div>
              <div className="ml-auto" data-tour="step-connect">
                {isWhatsAppConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[11px] font-semibold text-green-700">WA Connected</span>
                    </div>
                    <button
                      onClick={handleDisconnectWhatsApp}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={connectionStatus === 'connecting'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    <Smartphone size={12} />
                    {connectionStatus === 'connecting' ? 'Connecting…' : 'Connect WhatsApp'}
                  </button>
                )}
              </div>
            </div>

            {/* Selected contacts indicator */}
            {selectedCount > 0 ? (
              <div className="flex-none px-5 py-2 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                <span className="text-xs font-medium text-primary-700">{selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected</span>
              </div>
            ) : (
              <div className="flex-none px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span className="text-xs font-medium text-amber-700">Select contacts on the left to enable sending</span>
              </div>
            )}

            {/* Inline composer */}
            <div className="flex-1 overflow-y-auto" data-tour="step-compose">
              <MessageComposer
                inline
                isOpen
                onClose={() => {}}
                onSend={handleSendMessages}
                selectedCount={selectedCount}
                isWhatsAppConnected={isWhatsAppConnected}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden">
          <div className="max-w-7xl mx-auto px-3 py-4 pb-24 space-y-4">

            {/* Mobile: More tab */}
            {mobileTab === 'more' && (
              <div className="space-y-3">
                {/* Email Channel Switch card */}
                <button
                  onClick={() => navigate('/email')}
                  className="w-full flex items-center justify-between px-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm leading-none">Email Channel</p>
                      <p className="text-blue-200 text-xs mt-0.5">Bulk email campaigns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-semibold">Open</span>
                    <ChevronRight size={14} />
                  </div>
                </button>

                {/* User card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <User size={20} className="text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Subscription */}
                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Crown size={18} className="text-amber-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">Subscription</p>
                         <p className="text-xs text-gray-500 capitalize">
                          {user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial' ? 'Trial' : user?.subscription?.plan || 'Free'}
                          {user?.subscription?.isActive && (user.subscription.plan === 'free' || user.subscription.plan === 'trial')
                            ? ` · ${user.subscription.messagesUsed}/${user.subscription.messageLimit} msgs`
                            : user?.subscription?.isActive
                              ? ` · ${user?.subscription?.daysLeft}d left`
                              : ' · Expired'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Bot */}
                  {user?.subscription?.isActive && (
                    <>
                      <button
                        onClick={() => navigate('/bot')}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bot size={18} className="text-indigo-500" />
                          <p className="text-sm font-medium text-gray-800">AI Chatbot</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/website-chatbot')}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe size={18} className="text-green-500" />
                          <p className="text-sm font-medium text-gray-800">Website Chatbot</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    </>
                  )}

                  {/* Security */}
                  <button
                    onClick={() => navigate('/security')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-slate-500" />
                      <p className="text-sm font-medium text-gray-800">Security</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Admin */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="text-purple-500" />
                        <p className="text-sm font-medium text-gray-800">Admin Panel</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  )}

                  {/* Help */}
                  <button
                    onClick={() => {
                      localStorage.removeItem('nexbotix_tour_completed');
                      setShowTour(true);
                      setTimeout(() => setShowTour(false), 100);
                      setMobileTab('send');
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle size={18} className="text-green-500" />
                      <p className="text-sm font-medium text-gray-800">Help &amp; Tour</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium text-sm hover:bg-red-100 transition-colors"
                >
                  <LogOut size={17} />
                  Log Out
                </button>
              </div>
            )}

            {/* Main workflow (Send tab) */}
            <div className={mobileTab !== 'send' ? 'hidden' : 'space-y-4'}>
              {/* Step 1: Upload Contacts */}
              <section data-tour="step-upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary-700 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Upload Contacts</h2>
                      <p className="text-xs text-gray-600">Upload Excel/CSV or add manually</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSavedContacts(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <BookUser size={16} />
                    </button>
                    <button
                      onClick={() => setShowWAContacts(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Users size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <FileUpload onFileUpload={handleFileUpload} isLoading={isFileUploading} />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-xs text-gray-500 font-medium">OR</span>
                    </div>
                  </div>
                  <ManualContactEntry onAdd={handleManualAdd} />
                </div>
              </section>

              {/* Step 2: Review & Select Contacts */}
              {contacts.length > 0 && (
                <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary-700 font-bold text-sm">2</span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900">Review &amp; Select</h2>
                        <p className="text-xs text-gray-600">
                          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleClearContacts}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <ContactsTable contacts={contacts} selection={selection} onSelectionChange={setSelection} />
                </section>
              )}

              {/* Step 3: Send Messages */}
              {selectedCount > 0 && (
                <section data-tour="step-compose" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary-700 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Compose &amp; Send</h2>
                        <p className="text-xs text-gray-600">Create your message and send</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <MessageSquare className="mx-auto mb-3 text-gray-400" size={40} />
                      <h3 className="text-base font-medium text-gray-900 mb-2">Ready to send messages</h3>
                      <p className="text-xs text-gray-600 mb-4">
                        {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                      </p>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setShowMessageComposer(true)}
                        disabled={!isWhatsAppConnected}
                        data-tour="step-send"
                      >
                        <MessageSquare className="mr-2" size={20} />
                        Compose Message
                      </Button>
                      {!isWhatsAppConnected && (
                        <p className="text-xs text-red-600 mt-3">Please connect WhatsApp first</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Empty State */}
              {contacts.length === 0 && (
                <div className="text-center py-10">
                  <UploadIcon className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts uploaded</h3>
                  <p className="text-sm text-gray-600">Upload an Excel or CSV file to get started</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>{/* end main content wrapper */}

      {/* Modals */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={handleQRModalClose}
        onConnected={() => {
          setIsWhatsAppConnected(true);
          setConnectionStatus('connected');
        }}
        token={token}
      />

      {/* Mobile modal composer */}
      <MessageComposer
        isOpen={showMessageComposer}
        onClose={() => setShowMessageComposer(false)}
        onSend={handleSendMessages}
        selectedCount={selectedCount}
      />

      {currentMessages.length > 0 && (
        <SendProgress
          isOpen={showSendProgress}
          onClose={() => setShowSendProgress(false)}
          onComplete={handleSendComplete}
          onWorkInBackground={handleWorkInBackground}
          contacts={selectedContacts}
          messages={currentMessages}
          campaignName={currentCampaignName}
        />
      )}

      {/* Saved Contacts Drawer */}
      <SavedContactsDrawer
        isOpen={showSavedContacts}
        onClose={handleSavedContactsClose}
        onLoad={handleSavedContactsLoad}
      />

      {/* WhatsApp Contacts Drawer */}
      <WhatsAppContactsDrawer
        isOpen={showWAContacts}
        onClose={() => setShowWAContacts(false)}
        onLoad={handleSavedContactsLoad}
        isWhatsAppConnected={isWhatsAppConnected}
      />

      {/* Scheduled Jobs Drawer */}
      <ScheduledJobsDrawer
        isOpen={showScheduledJobs}
        onClose={handleScheduledJobsClose}
      />

      {/* Schedule success/error toast */}
      {scheduleToast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-2xl">
          <CalendarClock size={16} className="text-blue-400 shrink-0" />
          <span>{scheduleToast}</span>
          <button onClick={() => setScheduleToast('')} className="ml-2 text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Background Jobs Panel */}
      <BackgroundJobsPanel
        jobs={bgJobs}
        onStop={handleStopBgJob}
        onDismiss={handleDismissBgJob}
      />

      {/* Tour Guide */}
      <TourGuide forceShow={showTour} />

      {/* Help button to replay tour — desktop only */}
      <button
        onClick={() => {
          localStorage.removeItem('nexbotix_tour_completed');
          setShowTour(true);
          setTimeout(() => setShowTour(false), 100);
        }}
        title="Show Guide"
        className="hidden md:flex fixed bottom-6 right-6 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl items-center justify-center transition-all z-50"
      >
        <HelpCircle size={22} />
      </button>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16">
          {/* Send tab */}
          <button
            onClick={() => setMobileTab('send')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'send' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'send' ? 'bg-primary-50' : ''}`}>
              <MessageSquare size={19} strokeWidth={mobileTab === 'send' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[9px] font-medium leading-none ${mobileTab === 'send' ? 'text-primary-600' : 'text-gray-400'}`}>Send</span>
          </button>

          {/* Contacts tab */}
          <button
            onClick={() => handleMobileTab('contacts')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'contacts' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'contacts' ? 'bg-primary-50' : ''}`}>
              <BookUser size={19} strokeWidth={mobileTab === 'contacts' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[9px] font-medium leading-none ${mobileTab === 'contacts' ? 'text-primary-600' : 'text-gray-400'}`}>Contacts</span>
          </button>

          {/* Schedule tab */}
          <button
            onClick={() => handleMobileTab('schedule')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'schedule' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'schedule' ? 'bg-blue-50' : ''}`}>
              <CalendarClock size={19} strokeWidth={mobileTab === 'schedule' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[9px] font-medium leading-none ${mobileTab === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}>Schedule</span>
          </button>

          {/* ── Email tab ── */}
          <button
            onClick={() => navigate('/email')}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-gray-400 hover:text-blue-600"
          >
            <div className="p-1.5 rounded-xl transition-colors hover:bg-blue-50">
              <Mail size={19} strokeWidth={1.8} />
            </div>
            <span className="text-[9px] font-medium leading-none">Email</span>
          </button>

          {/* More tab */}
          <button
            onClick={() => setMobileTab(mobileTab === 'more' ? 'send' : 'more')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'more' ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'more' ? 'bg-gray-100' : ''}`}>
              <MoreHorizontal size={19} strokeWidth={mobileTab === 'more' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[9px] font-medium leading-none ${mobileTab === 'more' ? 'text-gray-700' : 'text-gray-400'}`}>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
