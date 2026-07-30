import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sliders, Bot, ShieldCheck, History,
  ArrowLeft, Crown, LogOut, Zap, MessageSquare, Mail, Menu, X, Linkedin, Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FreelancerSessionStatus, FreelancerBotConfig } from '@/types/freelancer';
import { FreelancerConfigTab } from './FreelancerConfigTab';
import { FreelancerBotTab } from './FreelancerBotTab';
import { FreelancerApprovalsTab } from './FreelancerApprovalsTab';
import { FreelancerHistoryTab } from './FreelancerHistoryTab';

type Tab = 'config' | 'run' | 'approvals' | 'history';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'config',    label: 'Configuration', icon: <Sliders size={20} />,     desc: 'OAuth & AI Persona' },
  { id: 'run',       label: 'Auto Bot',      icon: <Bot size={20} />,         desc: 'Run & Execution'    },
  { id: 'approvals', label: 'Approvals',     icon: <ShieldCheck size={20} />, desc: 'Pending Bids Queue' },
  { id: 'history',   label: 'Bidding Log',   icon: <History size={20} />,     desc: 'Placed Bids Feed'   },
];

const TAB_LABELS: Record<Tab, string> = {
  config: 'Configuration & AI Persona',
  run: 'Auto-Bidding Engine',
  approvals: 'Pending Approvals Queue',
  history: 'Bidding History',
};

export function FreelancerPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'config';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPaid = !!(user?.subscription?.plan !== 'free' && user?.subscription?.isActive);

  const [status, setStatus] = useState<FreelancerSessionStatus>({ isConnected: false });
  const [config, setConfig] = useState<FreelancerBotConfig | null>(null);

  const loadData = async () => {
    try {
      const resSt = await apiFetch(API_ENDPOINTS.freelancer.status);
      const jsonSt = await resSt.json();
      if (jsonSt.success && jsonSt.data) {
        setStatus(jsonSt.data);
      }

      const resCfg = await apiFetch(API_ENDPOINTS.freelancer.botConfig);
      const jsonCfg = await resCfg.json();
      if (jsonCfg.success && jsonCfg.data) {
        setConfig(jsonCfg.data);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadData();
  }, []);

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
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-lg text-white font-bold flex-shrink-0">
            <Briefcase size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Freelancer</p>
            <p className="text-slate-400 text-xs mt-0.5 truncate">
              {status.isConnected && status.freelancerUsername ? `@${status.freelancerUsername}` : 'Auto-Bidding'}
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
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${tab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{item.label}</p>
              <p className={`text-[10px] mt-0.5 ${tab === item.id ? 'text-sky-200' : 'text-slate-500'}`}>{item.desc}</p>
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
          {tab === 'config' && <FreelancerConfigTab status={status} config={config} onRefresh={loadData} />}
          {tab === 'run' && <FreelancerBotTab isPaid={isPaid} status={status} config={config} onRefresh={loadData} onSwitchTab={setTab} />}
          {tab === 'approvals' && <FreelancerApprovalsTab />}
          {tab === 'history' && <FreelancerHistoryTab />}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 flex">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative ${
                tab === item.id ? 'text-sky-500' : 'text-slate-500'
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
