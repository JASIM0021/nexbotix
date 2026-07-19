import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, Send, CalendarClock, FileText, Bot, Settings, History, Sparkles,
  ArrowLeft, Crown, LogOut, User, Zap, MessageSquare, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailSMTPPage } from './email/EmailSMTPPage';
import { EmailComposePage } from './email/EmailComposePage';
import { EmailSchedulePage } from './email/EmailSchedulePage';
import { EmailTemplatePage } from './email/EmailTemplatePage';
import { EmailBotPage } from './email/EmailBotPage';
import { EmailInboxPage } from './email/EmailInboxPage';
import { EmailSentPage } from './email/EmailSentPage';
import { EmailSummarizerPage } from './email/EmailSummarizerPage';

type Tab = 'inbox' | 'compose' | 'schedule' | 'sent' | 'summarizer' | 'templates' | 'bot' | 'smtp';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'inbox',       label: 'Inbox',       icon: <Mail size={20} />,          desc: 'Check messages' },
  { id: 'compose',     label: 'Send',        icon: <Send size={20} />,          desc: 'Bulk campaigns' },
  { id: 'schedule',    label: 'Scheduled',   icon: <CalendarClock size={20} />, desc: 'Queued jobs'     },
  { id: 'sent',        label: 'Sent',        icon: <History size={20} />,       desc: 'Sent history'   },
  { id: 'summarizer',  label: 'Summarizer',  icon: <Sparkles size={20} />,      desc: 'Daily AI digest' },
  { id: 'templates',   label: 'Templates',   icon: <FileText size={20} />,      desc: 'HTML library'   },
  { id: 'bot',         label: 'Bot',         icon: <Bot size={20} />,           desc: 'Auto-reply AI'  },
  { id: 'smtp',        label: 'SMTP',        icon: <Settings size={20} />,      desc: 'Connection'     },
];

const TAB_LABELS: Record<Tab, string> = {
  inbox: 'Inbox Messages', compose: 'Send Email', schedule: 'Scheduled', sent: 'Sent Emails', summarizer: 'Email Summarizer', templates: 'Templates', bot: 'Email Bot', smtp: 'SMTP Setup',
};

const VALID_TABS: Tab[] = ['inbox', 'compose', 'schedule', 'sent', 'summarizer', 'templates', 'bot', 'smtp'];

export function EmailPage() {
  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab') as Tab) ? (searchParams.get('tab') as Tab) : 'inbox';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPaid = !!(user?.subscription?.plan !== 'free' && user?.subscription?.isActive);

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Mail size={17} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Email</p>
            <p className="text-slate-400 text-xs mt-0.5">Campaigns</p>
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
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${tab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{item.label === 'Send' ? 'Send Email' : item.label}</p>
              <p className={`text-[10px] mt-0.5 ${tab === item.id ? 'text-blue-200' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* Channel switch */}
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
          onClick={() => navigate('/facebook')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.07h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
          </svg>
          <div>
            <p className="text-sm font-semibold leading-none">Facebook</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Switch channel</p>
          </div>
        </button>
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-2">
        {!isPaid && (
          <button
            onClick={() => navigate('/subscription')}
            className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
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

      {/* ── Desktop Sidebar (hidden on mobile) ──────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ─────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <aside className="relative z-10 w-64 flex flex-col bg-slate-900 h-full shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-none">
                {TAB_LABELS[tab]}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                {NAV_ITEMS.find(n => n.id === tab)?.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaid
              ? <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <Zap size={11} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700 hidden sm:inline">Pro Active</span>
                </div>
              : <button onClick={() => navigate('/subscription')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors">
                  <Crown size={12} /><span className="hidden sm:inline">Upgrade</span>
                </button>
            }
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {tab === 'inbox'     && <EmailInboxPage isPaid={isPaid} />}
          {tab === 'compose'   && <EmailComposePage isPaid={isPaid} />}
          {tab === 'schedule'  && <EmailSchedulePage isPaid={isPaid} />}
          {tab === 'sent'      && <EmailSentPage isPaid={isPaid} />}
          {tab === 'summarizer' && <EmailSummarizerPage isPaid={isPaid} />}
          {tab === 'templates' && <EmailTemplatePage isPaid={isPaid} />}
          {tab === 'bot'       && <EmailBotPage isPaid={isPaid} />}
          {tab === 'smtp'      && <EmailSMTPPage isPaid={isPaid} />}
        </div>

        {/* ── Mobile Bottom Tab Bar (hidden on desktop) ─────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 flex">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                tab === item.id ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <span className={`transition-transform ${tab === item.id ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              {tab === item.id && <span className="absolute bottom-0 w-8 h-0.5 bg-blue-400 rounded-full" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
