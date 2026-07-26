import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, CalendarClock, LayoutGrid,
  ArrowLeft, Crown, LogOut, User, Zap, MessageSquare, Mail, Menu, X, Link2, Facebook, Bot, Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useLinkedInSession } from '@/hooks/useLinkedInSession';
import { LinkedInConnectTab } from './LinkedInConnectTab';
import { LinkedInComposePage } from './LinkedInComposePage';
import { LinkedInSchedulePage } from './LinkedInSchedulePage';
import { LinkedInPostsPage } from './LinkedInPostsPage';
import { LinkedInBotTab } from './LinkedInBotTab';
import { LinkedInPendingPage } from './LinkedInPendingPage';

type Tab = 'connect' | 'compose' | 'schedule' | 'posts' | 'bot' | 'pending';

function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'connect',  label: 'Connect',   icon: <Link2 size={20} />,         desc: 'LinkedIn account' },
  { id: 'compose',  label: 'Compose',   icon: <Send size={20} />,          desc: 'Create post'      },
  { id: 'pending',  label: 'Approvals', icon: <Clock size={20} />,         desc: 'Pending review'   },
  { id: 'schedule', label: 'Scheduled', icon: <CalendarClock size={20} />, desc: 'Queued posts'     },
  { id: 'posts',    label: 'Posts',     icon: <LayoutGrid size={20} />,    desc: 'Published feed'   },
  { id: 'bot',      label: 'Auto Bot',  icon: <Bot size={20} />,           desc: 'AI automation'    },
];

const TAB_LABELS: Record<Tab, string> = {
  connect: 'Connect Account',
  compose: 'Create Post',
  pending: 'Pending Approvals',
  schedule: 'Scheduled Posts',
  posts: 'Published Posts',
  bot: 'Auto Bot',
};

export function LinkedInPage() {
  const [tab, setTab] = useState<Tab>('connect');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const { user, logout } = useAuth();
  const { setIsLinkedInConnected } = useApp();
  const navigate = useNavigate();
  const isPaid = !!(user?.subscription?.plan !== 'free' && user?.subscription?.isActive);
  const hasLinkedInBot = !!(user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('linkedin_bot'));
  const session = useLinkedInSession();

  // Handle OAuth2 callback redirect params (?connected=true or ?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setOauthBanner({ type: 'success', msg: 'LinkedIn connected successfully!' });
      session.refresh();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      const errMsg = params.get('error') || 'connection_failed';
      setOauthBanner({ type: 'error', msg: `LinkedIn connection failed: ${errMsg.replace(/_/g, ' ')}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session.isLoading) {
      setIsLinkedInConnected(session.isConnected);
    }
  }, [session.isConnected, session.isLoading, setIsLinkedInConnected]);

  useEffect(() => {
    if (!session.isLoading && session.isConnected && tab === 'connect') {
      setTab('compose');
    }
  }, [session.isLoading, session.isConnected]);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A66C2] flex items-center justify-center shadow-lg text-white">
            <LinkedInIcon size={17} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">LinkedIn</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {session.isConnected && session.profileName ? session.profileName : 'Account'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setDrawerOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
              tab === item.id
                ? 'bg-[#0A66C2] text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${tab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{item.label}</p>
              <p className={`text-[10px] mt-0.5 ${tab === item.id ? 'text-blue-200' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* Channel switch */}
      <div className="px-3 pb-1 border-t border-slate-800 pt-3 space-y-1">
        <button onClick={() => navigate('/whatsapp')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <MessageSquare size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">WhatsApp</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
        <button onClick={() => navigate('/email')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <Mail size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">Email</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
        <button onClick={() => navigate('/facebook')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <Facebook size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">Facebook</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-2">
        {!isPaid && (
          <button onClick={() => navigate('/subscription')} className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors">
            <Crown size={13} />Upgrade to Pro
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-slate-300" />
            </div>
            <span className="text-xs text-slate-400 truncate">{user?.name}</span>
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative z-10 w-64 flex flex-col bg-slate-900 h-full shadow-2xl">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-none">{TAB_LABELS[tab]}</h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                {NAV_ITEMS.find(n => n.id === tab)?.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.isConnected && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A66C2]" />
                <span className="text-xs font-semibold text-[#0A66C2]">{session.profileName || 'Connected'}</span>
              </div>
            )}
            {isPaid
              ? <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <Zap size={11} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700 hidden sm:inline">Pro Active</span>
                </div>
              : <button onClick={() => navigate('/subscription')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors">
                  <Crown size={12} /><span className="hidden sm:inline">Upgrade</span>
                </button>
            }
          </div>
        </header>

        {/* OAuth callback banner */}
        {oauthBanner && (
          <div className={`mx-4 mt-3 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
            oauthBanner.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span>{oauthBanner.msg}</span>
            <button onClick={() => setOauthBanner(null)} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {tab === 'connect'  && <LinkedInConnectTab session={session} />}
          {tab === 'compose'  && <LinkedInComposePage isPaid={isPaid} session={session} onSwitchTab={setTab} />}
          {tab === 'pending'  && <LinkedInPendingPage isPaid={isPaid} session={session} />}
          {tab === 'schedule' && <LinkedInSchedulePage isPaid={isPaid} session={session} />}
          {tab === 'posts'    && <LinkedInPostsPage isPaid={isPaid} session={session} />}
          {tab === 'bot'      && <LinkedInBotTab isPaid={hasLinkedInBot} session={session} />}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 flex">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative ${
                tab === item.id ? 'text-[#0A66C2]' : 'text-slate-500'
              }`}
            >
              <span className={`transition-transform ${tab === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              {tab === item.id && <span className="absolute bottom-0 w-8 h-0.5 bg-[#0A66C2] rounded-full" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
