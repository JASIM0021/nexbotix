import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, Mail, Globe, LogOut, Shield, Crown, ChevronRight, User, Lock, Bot, Sparkles, Search, Code2, Compass, Briefcase } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { ProfileModal } from '@/components/ProfileModal';

function FacebookIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.07h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function RedditIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF4500">
      <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.37-4.31 4.5 1c.02.83.69 1.5 1.54 1.5 1.65 0 3-1.35 3-3s-1.35-3-3-3c-.83 0-1.57.34-2.11.9l-5.06-1.12c-.17-.04-.34.05-.39.22L6.8 9.02c-2.44.08-4.65.72-6.29 1.72C-.06 9.98-.96 9.5-1.92 9.5c-1.65 0-3 1.35-3 3 0 1.32.86 2.44 2.05 2.85-.03.22-.05.44-.05.65 0 3.86 4.49 7 10 7s10-3.14 10-7c0-.21-.02-.43-.05-.65 1.19-.41 2.05-1.53 2.05-2.85zM6 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8.8 2.2c-1.04 1.04-3.03 1.13-3.8 1.13-.77 0-2.76-.09-3.8-1.13-.1-.1-.1-.26 0-.36.1-.1.26-.1.36 0 .84.84 2.51.93 3.44.93.93 0 2.6-.09 3.44-.93.1-.1.26-.1.36 0 .1.1.1.26 0 .36zm-.8-3.2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.security.userUsageStats);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to load user usage stats", err);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Marketing',
      description: 'Send bulk WhatsApp messages, schedule campaigns, and set up automated chatbot responses.',
      icon: <Smartphone size={32} className="text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-green-100',
      hoverBorder: 'hover:border-green-300',
      iconBg: 'bg-green-100',
      path: '/whatsapp',
      dbId: 'whatsapp',
    },
    {
      id: 'email',
      title: 'Email Campaigns',
      description: 'Create and broadcast professional email marketing campaigns with custom HTML templates.',
      icon: <Mail size={32} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      iconBg: 'bg-blue-100',
      path: '/email',
      dbId: 'email',
    },
    {
      id: 'website-chatbot',
      title: 'Website Chatbot',
      description: 'Embed a smart AI-powered chat widget on your website to instantly answer questions and capture leads.',
      icon: <Globe size={32} className="text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
      path: '/website-chatbot',
      dbId: 'chatbot',
    },
    {
      id: 'facebook',
      title: 'Facebook Pages',
      description: 'Publish posts, schedule content, and view reach analytics for your Facebook Pages.',
      icon: <FacebookIcon size={32} />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-400',
      iconBg: 'bg-blue-100',
      path: '/facebook',
      dbId: 'facebook',
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      description: 'Automate LinkedIn posts and schedule content to your feed using browser automation.',
      icon: <LinkedInIcon size={32} />,
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      hoverBorder: 'hover:border-sky-400',
      iconBg: 'bg-sky-100',
      path: '/linkedin',
      dbId: 'linkedin',
    },
    {
      id: 'reddit',
      title: 'Reddit Workspace',
      description: 'Publish text posts and schedule content directly to subreddits or your personal profile feed.',
      icon: <RedditIcon size={32} />,
      bg: 'bg-orange-50/50',
      border: 'border-orange-100',
      hoverBorder: 'hover:border-orange-400',
      iconBg: 'bg-orange-100',
      path: '/reddit',
      dbId: 'reddit',
    },
    {
      id: 'freelancer',
      title: 'Freelancer Auto-Bidder',
      description: 'Automate project discovery and generate tailored winning AI proposals for Freelancer.com.',
      icon: <Briefcase size={32} className="text-sky-600" />,
      bg: 'bg-sky-50/50',
      border: 'border-sky-100',
      hoverBorder: 'hover:border-sky-400',
      iconBg: 'bg-sky-100',
      path: '/freelancer',
      dbId: 'freelancer',
    },
    {
      id: 'seo',
      title: 'SEO Manager',
      description: 'Embed one script to track SEO scores, Core Web Vitals, and page-level issues across your entire website.',
      icon: <Search size={32} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
      path: '/seo',
      dbId: 'seo',
    },
    {
      id: 'leads',
      title: 'Leads Manager',
      description: 'Scrape business leads from maps by niche and location, enrich with email addresses, and launch campaigns.',
      icon: <Search size={32} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      iconBg: 'bg-amber-100',
      path: '/leads',
      dbId: 'leads',
    },
    {
      id: 'life-companion',
      title: 'AI Life & Growth Companion',
      description: 'Understand emotions & sadness, elevate mood with music, generate earning roadmaps, and verify tasks via AI.',
      icon: <Compass size={32} className="text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
      path: '/life-companion',
      dbId: 'life_companion',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="NexBotix" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">NexBotix</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">Unified Workspace</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors shadow-sm border border-transparent hover:border-purple-200">
                <Shield size={18} />
              </button>
            )}
            <button onClick={() => navigate('/subscription')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm">
              <Crown size={16} />
              <span className="text-sm font-semibold capitalize">{user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial' ? 'Trial' : user?.subscription?.plan || 'Free'}</span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button onClick={() => navigate('/sessions')} title="Active Sessions" className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <Globe size={18} />
            </button>
            <button onClick={() => navigate('/security')} title="Security Settings" className="p-2 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Lock size={18} />
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-md shrink-0">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold text-gray-800 hidden sm:block">{user?.name}</span>
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-500 text-lg max-w-2xl">Select a service below to start managing your communications, running campaigns, and capturing leads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const plan = user?.subscription?.plan || 'free';
            const enabled = user?.subscription?.enabledServices ?? [];
            const isLocked = !user?.subscription?.isActive || ((plan !== 'free' && plan !== 'trial' && plan !== 'admin_all') && !enabled.includes(service.dbId));
            return (
              <div
                key={service.id}
                onClick={() => !isLocked && navigate(service.path)}
                className={`relative group bg-white rounded-2xl border-2 ${service.border} ${isLocked ? 'opacity-80' : `cursor-pointer ${service.hoverBorder}`} overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
              >
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        <Crown size={12} /> Premium
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{service.description}</p>
                  
                  {!isLocked && stats && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-start">
                      {service.id === 'whatsapp' && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                          {stats.whatsapp.activeSessions > 0 ? '🟢 CONNECTED' : '🔴 OFFLINE'} • {stats.whatsapp.campaignsSent} CAMPAIGNS
                        </span>
                      )}
                      {service.id === 'email' && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          {stats.email.isSmtpConnected ? '📧 SMTP CONNECTED' : '❌ UNCONFIGURED'} • {stats.email.scheduledReminders} REMINDERS
                        </span>
                      )}
                      {service.id === 'website-chatbot' && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                          🤖 {stats.websiteChatbot.activeWidgets} WIDGETS • {stats.websiteChatbot.leadsCaptured} LEADS
                        </span>
                      )}
                      {service.id === 'facebook' && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          👥 {stats.facebook.connectedPages} PAGES
                        </span>
                      )}
                      {service.id === 'linkedin' && (
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                          {stats.linkedin.botEnabled ? '⏰ BOT ACTIVE' : '⏸️ BOT PAUSED'} • {stats.linkedin.totalPosts} POSTS
                        </span>
                      )}
                      {service.id === 'reddit' && (
                        <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                          {stats.reddit?.isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'} • {stats.reddit?.totalPosts || 0} POSTS
                        </span>
                      )}
                      {service.id === 'freelancer' && (
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                          {stats.freelancer?.isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'} • {stats.freelancer?.totalBids || 0} BIDS
                        </span>
                      )}
                      {service.id === 'seo' && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          🔍 {stats.seo.trackedSites} SITES TRACKED
                        </span>
                      )}
                      {service.id === 'leads' && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                          👥 {stats.leads.scrapedCount} MAPS LEADS
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={`px-8 py-4 ${service.bg} border-t ${service.border} flex items-center justify-between`}>
                  {isLocked ? (
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/subscription', { state: { preselect: service.dbId } }); }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Lock size={13} /> Click here to unlock
                    </button>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-900">Open Workspace</span>
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={16} className="text-gray-700" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bots Hub */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Bot size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Bots</h2>
              <p className="text-sm text-gray-500">AI-powered automation for every channel</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'whatsapp-bot', label: 'WhatsApp Bot',  icon: <Smartphone size={22} className="text-green-600" />,  bg: 'bg-green-50',  border: 'border-green-200',  hoverBorder: 'hover:border-green-400', service: 'whatsapp',  path: '/bot' },
              { id: 'chatbot',      label: 'Website Chatbot', icon: <Globe size={22} className="text-sky-600" />,      bg: 'bg-sky-50',    border: 'border-sky-200',    hoverBorder: 'hover:border-sky-400',   service: 'chatbot',   path: '/website-chatbot' },
              { id: 'email-bot',   label: 'Email Bot',      icon: <Mail size={22} className="text-blue-600" />,       bg: 'bg-blue-50',   border: 'border-blue-200',   hoverBorder: 'hover:border-blue-400',  service: 'email',     path: '/email' },
              { id: 'seo-bot',     label: 'SEO Bot',        icon: <Search size={22} className="text-emerald-600" />,  bg: 'bg-emerald-50',border: 'border-emerald-200',hoverBorder: 'hover:border-emerald-400',service: 'seo',      path: '/seo' },
              { id: 'linkedin-bot',label: 'LinkedIn Bot',   icon: <LinkedInIcon size={22} />,                         bg: 'bg-indigo-50', border: 'border-indigo-200', hoverBorder: 'hover:border-indigo-400',service: 'linkedin',  path: '/linkedin' },
              { id: 'blog-bot',    label: 'Blog Bot',       icon: <Sparkles size={22} className="text-amber-500" />,  bg: 'bg-amber-50',  border: 'border-amber-200',  hoverBorder: 'hover:border-amber-400', service: null,        path: null },
            ].map((bot) => {
              const enabled = user?.subscription?.enabledServices ?? [];
              const isActive = !!user?.subscription?.isActive;
              const accessible = bot.path !== null && isActive && (bot.service === null || enabled.includes(bot.service));
              const comingSoon = bot.path === null;
              return (
                <div
                  key={bot.id}
                  onClick={() => accessible && navigate(bot.path!)}
                  title={bot.label}
                  className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 ${bot.border} ${bot.bg} transition-all duration-200 ${accessible ? `cursor-pointer ${bot.hoverBorder} hover:shadow-md` : 'opacity-60 cursor-not-allowed'}`}
                >
                  {!accessible && !comingSoon && (
                    <span className="absolute top-2 right-2">
                      <Lock size={11} className="text-gray-400" />
                    </span>
                  )}
                  {comingSoon && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Soon</span>
                  )}
                  <div className={`w-11 h-11 rounded-xl ${bot.bg} border ${bot.border} flex items-center justify-center shadow-sm`}>
                    {bot.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{bot.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Developer Hub */}
        <div
          onClick={() => navigate('/developer')}
          className="mt-6 cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 hover:border-violet-400 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-violet-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Code2 size={24} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900">Developer Hub</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
                  API + MCP
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Manage API keys, explore REST API docs for WhatsApp & Email, and connect AI agents via the WhatsApp MCP server.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-violet-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Open <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Check Your AI Chatbot Demo */}
        <div
          onClick={() => navigate('/check-chatbot')}
          className="mt-8 cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 hover:border-orange-400 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-orange-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Bot size={28} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">Check Your AI Chatbot</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                  <Sparkles size={10} /> Free
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Enter your website URL and instantly see how an AI chatbot would answer questions about your business. Share the live demo link with potential clients.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Try Demo <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </main>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
}
