import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, CalendarClock, LayoutGrid, Loader2,
  ArrowLeft, Crown, LogOut, Zap, MessageSquare, Mail, Menu, X, Link2, Linkedin, Clock, Trash2, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { RedditSessionStatus, RedditPost, RedditScheduledPost } from '@/types/reddit';
import { RedditConnectTab } from './RedditConnectTab';
import { RedditComposePage } from './RedditComposePage';

type Tab = 'connect' | 'compose' | 'schedule' | 'feed';

function RedditIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.37-4.31 4.5 1c.02.83.69 1.5 1.54 1.5 1.65 0 3-1.35 3-3s-1.35-3-3-3c-.83 0-1.57.34-2.11.9l-5.06-1.12c-.17-.04-.34.05-.39.22L6.8 9.02c-2.44.08-4.65.72-6.29 1.72C-.06 9.98-.96 9.5-1.92 9.5c-1.65 0-3 1.35-3 3 0 1.32.86 2.44 2.05 2.85-.03.22-.05.44-.05.65 0 3.86 4.49 7 10 7s10-3.14 10-7c0-.21-.02-.43-.05-.65 1.19-.41 2.05-1.53 2.05-2.85zM6 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8.8 2.2c-1.04 1.04-3.03 1.13-3.8 1.13-.77 0-2.76-.09-3.8-1.13-.1-.1-.1-.26 0-.36.1-.1.26-.1.36 0 .84.84 2.51.93 3.44.93.93 0 2.6-.09 3.44-.93.1-.1.26-.1.36 0 .1.1.1.26 0 .36zm-.8-3.2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'connect',  label: 'Connect',   icon: <Link2 size={20} />,         desc: 'Reddit account'   },
  { id: 'compose',  label: 'Compose',   icon: <Send size={20} />,          desc: 'Create post'      },
  { id: 'schedule', label: 'Scheduled', icon: <CalendarClock size={20} />, desc: 'Queued posts'     },
  { id: 'feed',     label: 'Feed Log',  icon: <LayoutGrid size={20} />,    desc: 'Published posts'  },
];

const TAB_LABELS: Record<Tab, string> = {
  connect: 'Connect Account',
  compose: 'Create Post',
  schedule: 'Scheduled Posts',
  feed: 'Feed Logs',
};

export function RedditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'connect';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPaid = !!(user?.subscription?.plan !== 'free' && user?.subscription?.isActive);

  const [status, setStatus] = useState<RedditSessionStatus>({
    isConnected: false,
    hasPlatformAuth: false,
  });
  const [statusLoading, setStatusLoading] = useState(true);

  const [scheduledPosts, setScheduledPosts] = useState<RedditScheduledPost[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.reddit.status);
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
      }
    } catch { /* ignore */ }
    setStatusLoading(false);
  };

  const loadSchedule = async () => {
    if (!status.isConnected) return;
    setScheduleLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.reddit.schedule);
      const json = await res.json();
      if (json.success && json.data) {
        setScheduledPosts(json.data);
      }
    } catch { /* ignore */ }
    setScheduleLoading(false);
  };

  const loadFeed = async () => {
    if (!status.isConnected) return;
    setPostsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.reddit.logs);
      const json = await res.json();
      if (json.success && json.data) {
        setPosts(json.data);
      }
    } catch { /* ignore */ }
    setPostsLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setSearchParams({});
      loadStatus();
      setTab('compose');
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (tab === 'schedule') loadSchedule();
    if (tab === 'feed') loadFeed();
  }, [tab, status.isConnected]);

  useEffect(() => {
    if (!statusLoading && status.isConnected && tab === 'connect' && searchParams.get('tab') !== 'connect') {
      setTab('compose');
    }
  }, [statusLoading, status.isConnected]);

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;
    setActioningId(id);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.reddit.schedule}?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setScheduledPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch { /* ignore */ }
    setActioningId(null);
  };

  const SidebarContent = () => (
    <>
      <div className="px-4 pt-5 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF4500] flex items-center justify-center shadow-lg text-white font-bold flex-shrink-0">
            <RedditIcon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Reddit</p>
            <p className="text-slate-400 text-xs mt-0.5 truncate">
              {status.isConnected && status.redditUsername ? `u/${status.redditUsername}` : 'Workspace'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setDrawerOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
              tab === item.id
                ? 'bg-[#FF4500] text-white shadow-lg shadow-orange-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${tab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{item.label}</p>
              <p className={`text-[10px] mt-0.5 ${tab === item.id ? 'text-orange-200' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      <div className="px-3 pb-1 border-t border-slate-800 pt-3 space-y-1">
        <button
          onClick={() => navigate('/whatsapp')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <MessageSquare size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">WhatsApp</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/email')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Mail size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">Email</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/linkedin')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Linkedin size={18} />
          <div>
            <p className="text-sm font-semibold leading-none">LinkedIn</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
      </div>

      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-2">
        {!isPaid && (
          <button
            onClick={() => navigate('/subscription')}
            className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <Crown size={12} />
            <span>Upgrade to Pro</span>
          </button>
        )}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase flex-shrink-0">
              {user?.email?.charAt(0) || 'U'}
            </div>
            <span className="text-xs text-slate-300 font-semibold truncate">{user?.email || 'User'}</span>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 text-slate-200">
        <SidebarContent />
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-900">{TAB_LABELS[tab]}</h1>
          </div>

          <div className="flex items-center gap-3">
            {isPaid ? (
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                <Crown size={8} /> Pro Account
              </span>
            ) : (
              <button
                onClick={() => navigate('/subscription')}
                className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-full shadow-sm transition-colors flex items-center gap-0.5"
              >
                <Zap size={8} /> Upgrade
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {statusLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#FF4500]" size={28} />
            </div>
          ) : (
            <>
              {tab === 'connect' && <RedditConnectTab status={status} onRefresh={loadStatus} />}
              {tab === 'compose' && <RedditComposePage isPaid={isPaid} status={status} onSwitchTab={setTab} />}
              
              {tab === 'schedule' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  {scheduleLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-[#FF4500]" />
                    </div>
                  ) : scheduledPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
                      <CalendarClock size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm">No scheduled Reddit posts found.</p>
                      <p className="text-gray-400 text-xs mt-1">Posts configured to be scheduled will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                              r/{post.subreddit}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm">{post.title}</h4>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{post.text}</p>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                            <span className={`text-[10px] font-bold uppercase ${
                              post.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              Status: {post.status} {post.error && `(${post.error})`}
                            </span>
                            {post.status === 'pending' && (
                              <button
                                onClick={() => handleCancelSchedule(post.id)}
                                disabled={actioningId !== null}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                              >
                                {actioningId === post.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={12} />}
                                Cancel Schedule
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'feed' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  {postsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-[#FF4500]" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
                      <LayoutGrid size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm">No published posts found.</p>
                      <p className="text-gray-400 text-xs mt-1">Posts successfully published via nexBotix will log here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                              r/{post.subreddit}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Published: {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm">{post.title}</h4>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                          {post.postUrl && (
                            <div className="pt-2 border-t border-gray-50">
                              <a
                                href={post.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#FF4500] hover:underline flex items-center gap-1.5 font-semibold"
                              >
                                View post on Reddit <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 flex">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative ${
                tab === item.id ? 'text-[#FF4500]' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200 z-10 animate-slide-in">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </div>
  );
}
