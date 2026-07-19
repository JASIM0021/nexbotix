import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import type { FeatureDefinition } from '@/types/feature';
import {
  Users,
  BarChart3,
  Mail,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shield,
  Crown,
  UserCheck,
  UserX,
  Clock,
  Send,
  RefreshCw,
  UserPlus,
  X,
  Pencil,
  Ban,
  CheckCircle2,
  Lock,
  User,
  FileText,
  Settings,
  History,
  Tag,
  Bot,
  Globe,
  Copy,
  Loader2,
  ExternalLink,
  FlaskConical,
  AlertTriangle,
  Check,
  TrendingUp,
  DollarSign,
  LinkIcon,
  Zap,
  Receipt,
} from 'lucide-react';

/* ─── Types ─── */
interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialUsers: number;
  paidUsers: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  isTestUser?: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    expiryDate: string;
    isActive: boolean;
    daysLeft: number;
    messagesUsed: number;
    messageLimit: number;
    enabledServices?: string[];
  };
}

type Tab = 'dashboard' | 'users' | 'email' | 'invoices' | 'plans' | 'features' | 'promos' | 'demos' | 'deletions' | 'services' | 'influencers' | 'transactions';

/* ─── Feature registry (dynamic service list) ─── */
// Compiled-in fallback used only while the registry hasn't loaded / errors.
const FALLBACK_SERVICES: FeatureDefinition[] = [
  { key: 'whatsapp',     name: 'WhatsApp Sender',   isActive: true },
  { key: 'whatsapp_bot', name: 'WhatsApp AI Bot',   isActive: true },
  { key: 'chatbot',      name: 'Website Chatbot',   isActive: true },
  { key: 'email',        name: 'Email Marketing',   isActive: true },
  { key: 'facebook',     name: 'Facebook',          isActive: true },
  { key: 'linkedin',     name: 'LinkedIn Publisher', isActive: true },
  { key: 'linkedin_bot', name: 'LinkedIn AI Bot',   isActive: true },
  { key: 'seo',          name: 'SEO Manager',       isActive: true },
  { key: 'seo_bot',      name: 'SEO AI Bot',        isActive: true },
  { key: 'leads',        name: 'Leads Manager',     isActive: true },
];

let featureCache: FeatureDefinition[] | null = null;

async function fetchAdminFeatures(force = false): Promise<FeatureDefinition[]> {
  if (featureCache && !force) return featureCache;
  try {
    const res = await apiFetch(API_ENDPOINTS.admin.features);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      featureCache = data.data;
    }
  } catch { /* keep fallback */ }
  return featureCache ?? FALLBACK_SERVICES;
}

/** Feature registry list for admin UIs, with a hardcoded fallback. */
function useAdminFeatures() {
  const [features, setFeatures] = useState<FeatureDefinition[]>(featureCache ?? FALLBACK_SERVICES);
  useEffect(() => { fetchAdminFeatures().then(setFeatures); }, []);
  const reload = useCallback(async () => setFeatures(await fetchAdminFeatures(true)), []);
  return { features, reload };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  originalAmount: number;
  finalAmount: number;
  txnId: string;
  mihpayId: string;
  paymentDate: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  sentAt?: string;
}

interface PlanConfigData {
  plan: string;
  name?: string;
  description?: string;
  amount: number;
  messageLimit: number;
  durationDays?: number;
  services: string[];
  features: string[];
  isVisible: boolean;
  isAdminOnly?: boolean;
  displayOrder?: number;
  highlight?: boolean;
}

interface ActivityData {
  payments: Array<{
    id: string;
    txnId: string;
    amount: number;
    originalAmount?: number;
    plan: string;
    status: string;
    promoCode?: string;
    payuResponse?: string;
    createdAt: string;
  }>;
  subscription: {
    messagesUsed: number;
    messageLimit: number;
    plan: string;
    status: string;
    startDate?: string;
    expiryDate?: string;
    enabledServices?: string[];
  };
  usageStats?: {
    whatsapp: { activeSessions: number; campaignsSent: number };
    email: { isSmtpConnected: boolean; scheduledReminders: number };
    websiteChatbot: { activeWidgets: number; leadsCaptured: number };
    facebook: { connectedPages: number };
    linkedin: { botEnabled: boolean; totalPosts: number };
    seo: { trackedSites: number };
    leads: { scrapedCount: number };
  };
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={UserCheck} label="Active Subs" value={stats.activeSubscriptions} color="bg-green-500" />
        <StatCard icon={UserX} label="Expired Subs" value={stats.expiredSubscriptions} color="bg-red-500" />
        <StatCard icon={Clock} label="Trial Users" value={stats.trialUsers} color="bg-amber-500" />
        <StatCard icon={Crown} label="Paid Users" value={stats.paidUsers} color="bg-purple-500" />
      </div>
    </div>
  );
}

/* ─── Create User Modal ─── */
function CreateUserModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setEmail(''); setPassword(''); setRole('user'); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.users, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to create user');
        return;
      }
      reset();
      onCreated();
      onClose();
    } catch {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button onClick={() => { reset(); onClose(); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex gap-3">
              {(['user', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === r ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit User Modal ─── */
function EditUserModal({ open, user, onClose, onUpdated }: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Plan update state
  const [planToSet, setPlanToSet] = useState('monthly');
  const [planDays, setPlanDays] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState('');
  const [planOptions, setPlanOptions] = useState<PlanConfigData[]>([]);

  // Add-on grant state
  const { features: grantableServices } = useAdminFeatures();
  const [grantedServices, setGrantedServices] = useState<Set<string>>(new Set());
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcMsg, setSvcMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role as 'user' | 'admin');
      setError('');
      setPlanMsg('');
      setSvcMsg('');
      setPlanToSet(user.subscription?.plan || 'monthly');
      setPlanDays('');
      setGrantedServices(new Set(user.subscription?.enabledServices ?? []));
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    apiFetch(API_ENDPOINTS.admin.plans)
      .then(r => r.json())
      .then(d => { if (d.success) setPlanOptions(d.data || []); })
      .catch(() => { /* ignore */ });
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.user(user.id), {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), role }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to update');
        return;
      }
      onUpdated();
      onClose();
    } catch {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanUpdate = async () => {
    if (!user) return;
    setPlanSaving(true);
    setPlanMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.updateUserPlan(user.id), {
        method: 'PUT',
        body: JSON.stringify({ plan: planToSet, daysToAdd: planDays ? parseInt(planDays) : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanMsg(`Plan updated to ${planToSet} (expires ${data.data?.expiryDate})`);
        onUpdated();
      } else {
        setPlanMsg(data.error || 'Failed to update plan');
      }
    } catch {
      setPlanMsg('Network error');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleServicesUpdate = async () => {
    if (!user) return;
    setSvcSaving(true); setSvcMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.updateUserServices(user.id), {
        method: 'PUT',
        body: JSON.stringify({ services: Array.from(grantedServices) }),
      });
      const data = await res.json();
      if (data.success) {
        setSvcMsg('Add-ons saved!');
        onUpdated();
      } else {
        setSvcMsg(data.error || 'Failed');
      }
    } catch {
      setSvcMsg('Network error');
    } finally {
      setSvcSaving(false);
    }
  };

  const toggleGrantedSvc = (svc: string) => setGrantedServices(prev => {
    const next = new Set(prev);
    if (next.has(svc)) { next.delete(svc); } else { next.add(svc); }
    return next;
  });

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex gap-3">
              {(['user', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === r ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Plan Update Section */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Crown size={14} className="text-amber-500" /> Change Subscription Plan
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {planOptions.map(p => {
                const value = p.plan;
                const label = p.name || value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPlanToSet(value)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      planToSet === value
                        ? p.isAdminOnly
                          ? 'bg-purple-50 border-purple-400 text-purple-700'
                          : 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {planOptions.length === 0 && (
                <p className="col-span-2 text-xs text-gray-400 text-center py-4">Loading plans…</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                placeholder="Days (blank = default)"
                value={planDays}
                onChange={e => setPlanDays(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handlePlanUpdate}
                disabled={planSaving}
                className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {planSaving ? 'Updating…' : 'Update Plan'}
              </button>
            </div>
            {planMsg && (
              <p className={`text-xs rounded-lg px-3 py-2 ${planMsg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {planMsg}
              </p>
            )}
          </div>
        </div>

        {/* Add-on Grant Section */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Zap size={14} className="text-violet-500" /> Grant Add-ons (no payment)
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {grantableServices.map(({ key: id, name: label }) => {
              const active = grantedServices.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGrantedSvc(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                    active
                      ? 'bg-violet-50 border-violet-300 text-violet-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${active ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                    {active && <Check size={10} className="text-white" />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleServicesUpdate}
              disabled={svcSaving}
              className="flex-1 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {svcSaving ? 'Saving…' : 'Save Add-ons'}
            </button>
            <button
              type="button"
              onClick={() => setGrantedServices(new Set())}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          {svcMsg && (
            <p className={`mt-2 text-xs rounded-lg px-3 py-2 ${svcMsg.includes('saved') || svcMsg.includes('Add-ons') ? 'bg-violet-50 text-violet-700' : 'bg-red-50 text-red-600'}`}>
              {svcMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [activityUser, setActivityUser] = useState<AdminUser | null>(null);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await apiFetch(`${API_ENDPOINTS.admin.users}?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setTotal(data.data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleBlock = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'Block' : 'Unblock';
    if (!confirm(`${action} this user?`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.user(userId), {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch { /* ignore */ }
  };

  const toggleTestUser = async (userId: string, current: boolean) => {
    const action = current ? 'Remove test user status from' : 'Mark as test user';
    if (!confirm(`${action} this user? Test users have no rate limits or restrictions.`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.user(userId), {
        method: 'PUT',
        body: JSON.stringify({ isTestUser: !current }),
      });
      fetchUsers();
    } catch { /* ignore */ }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete user "${email}"? This will remove all their data and cannot be undone.`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.user(userId), { method: 'DELETE' });
      fetchUsers();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Users ({total})</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors shrink-0">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Days Left</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBlocked = u.status === 'blocked';
                  const isSelf = u.id === currentUser?.id?.toString();
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isBlocked ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          {isBlocked && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Blocked</span>
                          )}
                          {u.isTestUser && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded uppercase">
                              <FlaskConical size={9} /> Test
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role === 'admin' ? <Shield size={12} /> : null}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.subscription?.plan === 'free'
                            ? 'bg-amber-50 text-amber-700'
                            : u.subscription?.plan
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}>
                          {u.subscription?.plan || 'none'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          u.subscription?.isActive ? 'text-green-600' : 'text-red-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.subscription?.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {u.subscription?.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {u.subscription?.isActive
                          ? u.subscription.plan === 'free'
                            ? `${u.subscription.messagesUsed}/${u.subscription.messageLimit} msgs`
                            : `${u.subscription.daysLeft}d`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActivityUser(u)}
                            title="View activity"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <History size={15} />
                          </button>
                          <button
                            onClick={() => setEditingUser(u)}
                            title="Edit user"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleTestUser(u.id, !!u.isTestUser)}
                            title={u.isTestUser ? 'Remove test user status' : 'Mark as test user (removes all limits)'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isTestUser
                                ? 'text-violet-600 hover:text-violet-800 hover:bg-violet-50'
                                : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
                            }`}
                          >
                            <FlaskConical size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleBlock(u.id, u.status || 'active')}
                              title={isBlocked ? 'Unblock user' : 'Block user'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBlocked
                                  ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                            >
                              {isBlocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              title="Delete user"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={fetchUsers} />
      <EditUserModal open={!!editingUser} user={editingUser} onClose={() => setEditingUser(null)} onUpdated={fetchUsers} />
      <UserActivityModal open={!!activityUser} user={activityUser} onClose={() => setActivityUser(null)} />
    </div>
  );
}

/* ─── Email Tab ─── */
function EmailTab() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<'all' | 'active' | 'trial'>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [editorTab, setEditorTab] = useState<'editor' | 'preview'>('editor');

  const STARTER_TEMPLATE = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#16a34a;padding:28px 40px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">NexBotix</h1>
  </div>
  <div style="background:#fff;padding:40px;border:1px solid #e4e4e7;border-top:none;">
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Hi {{name}},</h2>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Your message body goes here...
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://nexbotix.online" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
        Go to Dashboard
      </a>
    </div>
  </div>
  <div style="background:#fafafa;padding:20px 40px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">NexBotix &mdash; Messaging Platform</p>
  </div>
</div>`;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send promotional email to "${recipients}" users?`)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.sendEmail, {
        method: 'POST',
        body: JSON.stringify({ subject, body, recipients }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ sent: data.data.sent, failed: data.data.failed });
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch {
      alert('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Send Promotional Email</h2>

      <form onSubmit={handleSend} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-3xl">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
          <div className="flex gap-3">
            {(['all', 'active', 'trial'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecipients(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  recipients === r
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {r === 'all' ? 'All Users' : r === 'active' ? 'Active Subscribers' : 'Trial Users'}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line..."
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Body with Editor / Preview tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setEditorTab('editor')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  editorTab === 'editor'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✏️ Editor
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  editorTab === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👁️ Preview
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setBody(STARTER_TEMPLATE); setEditorTab('editor'); }}
              className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Use NexBotix Template
            </button>
          </div>

          {editorTab === 'editor' ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here... HTML tags are supported."
              required
              rows={14}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-y font-mono"
            />
          ) : (
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              {/* Email client header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400 ml-2 font-mono truncate">
                  Subject: {subject || '(no subject)'}
                </span>
              </div>
              {body.trim() ? (
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:16px;background:#f4f4f5;}</style></head><body>${body}</body></html>`}
                  sandbox="allow-same-origin"
                  className="w-full bg-white"
                  style={{ height: '420px', border: 'none' }}
                  title="Email Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                  <span className="text-3xl">📧</span>
                  <p className="text-sm">Nothing to preview yet — write some HTML in the Editor tab.</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Supports full HTML. Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> for personalised recipient names.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>

          {result && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">✓ {result.sent} sent</span>
              {result.failed > 0 && (
                <span className="text-red-500 font-medium">✗ {result.failed} failed</span>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}


/* ─── Invoices Tab ─── */
function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [editingAmount, setEditingAmount] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiFetch(`${API_ENDPOINTS.admin.invoices}?${params}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data.invoices || []);
        setTotal(data.data.total || 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleSaveAmount = async (id: string) => {
    const amount = parseFloat(editingAmount[id] || '0');
    if (isNaN(amount) || amount <= 0) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.invoice(id), {
        method: 'PUT',
        body: JSON.stringify({ finalAmount: amount }),
      });
      fetchInvoices();
    } catch { /* ignore */ }
    finally {
      setEditingAmount(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleApprove = async (inv: Invoice) => {
    const amountStr = editingAmount[inv.id];
    const amount = amountStr ? parseFloat(amountStr) : inv.finalAmount;
    if (!confirm(`Send invoice #${inv.invoiceNumber} to ${inv.userEmail} for ₹${amount}?`)) return;
    setApprovingId(inv.id);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.approveInvoice(inv.id), {
        method: 'POST',
        body: JSON.stringify({ amount: amountStr ? amount : 0 }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || 'Failed to approve'); return; }
      fetchInvoices();
    } catch { alert('Failed to send invoice'); }
    finally {
      setApprovingId(null);
      setEditingAmount(prev => { const n = { ...prev }; delete n[inv.id]; return n; });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Invoices ({total})</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'sent'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : 'Sent'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Payment Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <RefreshCw size={20} className="animate-spin inline-block mr-2" />Loading...
                </td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No invoices found</td></tr>
              ) : invoices.map((inv) => {
                const isPending = inv.status === 'pending';
                const isEditing = editingAmount[inv.id] !== undefined;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{inv.userName}</p>
                      <p className="text-xs text-gray-500">{inv.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-xs text-gray-600">{inv.plan}</td>
                    <td className="px-4 py-3">
                      {isPending && isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">₹</span>
                          <input type="number"
                            value={editingAmount[inv.id]}
                            onChange={e => setEditingAmount(prev => ({ ...prev, [inv.id]: e.target.value }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900">₹{(inv.finalAmount || 0).toLocaleString()}</span>
                          {isPending && (
                            <button onClick={() => setEditingAmount(prev => ({ ...prev, [inv.id]: String(inv.finalAmount) }))}
                              className="p-0.5 text-gray-400 hover:text-blue-600 transition-colors">
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPending && (
                        <div className="flex items-center justify-end gap-1">
                          {isEditing && (
                            <button onClick={() => handleSaveAmount(inv.id)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                              Save
                            </button>
                          )}
                          <button onClick={() => handleApprove(inv)}
                            disabled={approvingId === inv.id}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50">
                            {approvingId === inv.id ? 'Sending...' : 'Approve & Send'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-600">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Plans Tab ─── */
interface PlanFormState {
  plan: string;
  name: string;
  description: string;
  amount: string;
  messageLimit: string;
  durationDays: string;
  services: string[];
  features: string;
  isVisible: boolean;
  isAdminOnly: boolean;
  displayOrder: string;
  highlight: boolean;
  yearlyDiscount: string;
}

const emptyForm = (): PlanFormState => ({
  plan: '',
  name: '',
  description: '',
  amount: '0',
  messageLimit: '0',
  durationDays: '30',
  services: [],
  features: '',
  isVisible: true,
  isAdminOnly: false,
  displayOrder: '0',
  highlight: false,
  yearlyDiscount: '0',
});

const formFromPlan = (p: PlanConfigData): PlanFormState => ({
  plan: p.plan,
  name: p.name ?? '',
  description: p.description ?? '',
  amount: String(p.amount),
  messageLimit: String(p.messageLimit),
  durationDays: String(p.durationDays ?? 30),
  services: p.services ?? [],
  features: (p.features ?? []).join('\n'),
  isVisible: !!p.isVisible,
  isAdminOnly: !!p.isAdminOnly,
  displayOrder: String(p.displayOrder ?? 0),
  highlight: !!p.highlight,
  yearlyDiscount: '0',
});

function PlansTab() {
  const { features: registryFeatures } = useAdminFeatures();
  const [plans, setPlans] = useState<PlanConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ mode: 'create' | 'edit'; form: PlanFormState } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.plans);
      const data = await res.json();
      if (data.success) setPlans(data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { setError(null); setSuccessMsg(null); setEditing({ mode: 'create', form: emptyForm() }); };
  const startEdit = (p: PlanConfigData) => { setError(null); setSuccessMsg(null); setEditing({ mode: 'edit', form: formFromPlan(p) }); };
  const closeModal = () => { setEditing(null); setError(null); setSuccessMsg(null); };

  const submitForm = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.plan.trim()) { setError('Plan ID is required'); return; }
    const body = {
      plan: f.plan.trim().toLowerCase(),
      name: f.name,
      description: f.description,
      amount: parseFloat(f.amount) || 0,
      messageLimit: parseInt(f.messageLimit) || 0,
      durationDays: parseInt(f.durationDays) || 30,
      services: f.services,
      features: f.features.split('\n').map(s => s.trim()).filter(Boolean),
      isVisible: f.isVisible,
      isAdminOnly: f.isAdminOnly,
      displayOrder: parseInt(f.displayOrder) || 0,
      highlight: f.highlight,
    };

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const url = editing.mode === 'create'
        ? API_ENDPOINTS.admin.plans
        : API_ENDPOINTS.admin.plan(body.plan);
      const res = await apiFetch(url, {
        method: editing.mode === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save');
        return;
      }

      // Auto-create companion yearly plan if discount > 0 (create mode only)
      if (editing.mode === 'create') {
        const discount = parseFloat(f.yearlyDiscount) || 0;
        if (discount > 0 && discount < 100) {
          const yearlyAmount = Math.round(body.amount * 12 * (1 - discount / 100));
          const yearlyBody = {
            ...body,
            plan: body.plan + '_yearly',
            name: body.name + ' (Yearly)',
            durationDays: 365,
            amount: yearlyAmount,
          };
          const yr = await apiFetch(API_ENDPOINTS.admin.plans, {
            method: 'POST',
            body: JSON.stringify(yearlyBody),
          });
          const yrData = await yr.json();
          if (!yrData.success) {
            await load();
            setSuccessMsg(`Monthly plan created. Yearly companion failed: ${yrData.error || 'unknown error'}`);
            setEditing(null);
            return;
          }
          await load();
          setSuccessMsg(`Created "${body.name}" (monthly) + "${yearlyBody.name}" at ₹${yearlyAmount.toLocaleString()}/yr (${discount}% off).`);
          setEditing(null);
          return;
        }
      }

      await load();
      closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (p: PlanConfigData, field: 'isVisible' | 'highlight') => {
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.plan(p.plan), {
        method: 'PUT',
        body: JSON.stringify({
          amount: p.amount,
          messageLimit: p.messageLimit,
          [field]: !p[field],
        }),
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || 'Failed to update');
    } catch { alert('Failed to update plan'); }
  };

  const deletePlan = async (p: PlanConfigData) => {
    if (!confirm(`Delete plan "${p.plan}"? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.plan(p.plan), { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to delete');
        return;
      }
      load();
    } catch { alert('Failed to delete plan'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Plans</h2>
          <p className="text-sm text-gray-500">Manage the subscription catalog. Visible non-admin plans show on the public pricing page.</p>
        </div>
        <button onClick={startCreate}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">
          + Add Plan
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Price (₹)</th>
              <th className="px-3 py-2 text-right">Days</th>
              <th className="px-3 py-2 text-right">Msg limit</th>
              <th className="px-3 py-2 text-left">Services</th>
              <th className="px-3 py-2 text-center">Visible</th>
              <th className="px-3 py-2 text-center">Highlight</th>
              <th className="px-3 py-2 text-center">Flags</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map(p => (
              <tr key={p.plan} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{p.displayOrder ?? 0}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{p.plan}</td>
                <td className="px-3 py-2 text-gray-900">{p.name || <span className="text-gray-400 italic">—</span>}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.durationDays ?? '-'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.messageLimit === 0 ? '∞' : p.messageLimit.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{(p.services ?? []).join(', ') || <span className="text-gray-400">none</span>}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => togglePlan(p, 'isVisible')}
                    className={`w-10 h-5 rounded-full ${p.isVisible ? 'bg-green-500' : 'bg-gray-300'} relative transition-colors`}>
                    <span className={`absolute top-0.5 ${p.isVisible ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full transition-all`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => togglePlan(p, 'highlight')}
                    className={`w-10 h-5 rounded-full ${p.highlight ? 'bg-amber-500' : 'bg-gray-300'} relative transition-colors`}>
                    <span className={`absolute top-0.5 ${p.highlight ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full transition-all`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {p.isAdminOnly && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">admin-only</span>}
                </td>
                <td className="px-3 py-2 text-right space-x-1">
                  <button onClick={() => startEdit(p)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                  <button onClick={() => deletePlan(p)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">No plans yet — click "Add Plan" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editing.mode === 'create' ? 'New Plan' : `Edit ${editing.form.plan}`}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Plan ID</label>
                  <input type="text" value={editing.form.plan}
                    disabled={editing.mode === 'edit'}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, plan: e.target.value } }))}
                    placeholder="lowercase_with_underscores"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                  <input type="text" value={editing.form.name}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, name: e.target.value } }))}
                    placeholder="e.g. Monthly Unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={editing.form.description}
                  onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, description: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                  <input type="number" min="0" step="1" value={editing.form.amount}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, amount: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
                  <input type="number" min="1" step="1" value={editing.form.durationDays}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, durationDays: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Msg limit (0 = ∞)</label>
                  <input type="number" min="0" step="1" value={editing.form.messageLimit}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, messageLimit: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display order</label>
                  <input type="number" step="1" value={editing.form.displayOrder}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, displayOrder: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Services included</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {registryFeatures.map(f => (
                    <label key={f.key} className="flex items-center gap-1.5 text-sm" title={f.name}>
                      <input type="checkbox" checked={editing.form.services.includes(f.key)}
                        onChange={e => setEditing(s => s && ({
                          ...s,
                          form: {
                            ...s.form,
                            services: e.target.checked
                              ? [...s.form.services, f.key]
                              : s.form.services.filter(x => x !== f.key),
                          },
                        }))} />
                      {f.key}
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Missing a service? Register it in the <span className="font-medium">Features</span> tab first.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Features (one per line)</label>
                <textarea value={editing.form.features}
                  onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, features: e.target.value } }))}
                  rows={4}
                  placeholder="Unlimited messages&#10;Priority support"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.form.isVisible}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, isVisible: e.target.checked } }))} />
                  Visible on pricing page
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.form.highlight}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, highlight: e.target.checked } }))} />
                  Highlight
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.form.isAdminOnly}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, isAdminOnly: e.target.checked, isVisible: e.target.checked ? false : s.form.isVisible } }))} />
                  Admin-only (never sold)
                </label>
              </div>

              {editing.mode === 'create' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-blue-800 mb-1">Yearly discount % (optional)</label>
                      <input
                        type="number" min="0" max="99" step="1"
                        value={editing.form.yearlyDiscount}
                        onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, yearlyDiscount: e.target.value } }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
                        placeholder="e.g. 20"
                      />
                    </div>
                    {parseFloat(editing.form.yearlyDiscount) > 0 && parseFloat(editing.form.yearlyDiscount) < 100 && (
                      <div className="text-sm text-blue-700 pt-5">
                        → ₹{Math.round(parseFloat(editing.form.amount || '0') * 12 * (1 - parseFloat(editing.form.yearlyDiscount) / 100)).toLocaleString()}/yr
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600">
                    Enter a discount to auto-create a companion <span className="font-mono font-semibold">{editing.form.plan || 'plan_id'}_yearly</span> plan (365 days) at the discounted annual price.
                    Leave at 0 to skip.
                  </p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={submitForm} disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : editing.mode === 'create' ? 'Create plan' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Promos Tab ─── */
interface PromoCodeData {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  timesUsed: number;
  isActive: boolean;
  applicablePlans: string[];
  expiresAt?: string;
  createdAt: string;
}

const PROMO_PLANS = [
  { value: 'starter',         label: 'Starter Monthly' },
  { value: 'starter_yearly',  label: 'Starter Yearly' },
  { value: 'growth',          label: 'Growth Monthly' },
  { value: 'growth_yearly',   label: 'Growth Yearly' },
  { value: 'business',        label: 'Business Monthly' },
  { value: 'business_yearly', label: 'Business Yearly' },
  { value: 'monthly',         label: 'Legacy Monthly' },
  { value: 'yearly',          label: 'Legacy Yearly' },
];

type PromoForm = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  maxUses: string;
  applicablePlans: string[];
  expiresAt: string;
};

const EMPTY_FORM: PromoForm = {
  code: '', discountType: 'percentage', discountValue: '', maxUses: '0', applicablePlans: [], expiresAt: '',
};

function PromoModal({ mode, promo, onClose, onSaved }: {
  mode: 'create' | 'edit';
  promo?: PromoCodeData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PromoForm>(() => {
    if (mode === 'edit' && promo) {
      return {
        code: promo.code,
        discountType: promo.discountType as 'percentage' | 'fixed',
        discountValue: String(promo.discountValue),
        maxUses: String(promo.maxUses),
        applicablePlans: promo.applicablePlans || [],
        expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
      };
    }
    return EMPTY_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePlan = (plan: string) =>
    setForm(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter(p => p !== plan)
        : [...prev.applicablePlans, plan],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const val = parseFloat(form.discountValue);
    if (mode === 'create' && !form.code.trim()) { setError('Code is required'); return; }
    if (isNaN(val) || val <= 0) { setError('Discount value must be > 0'); return; }
    if (form.discountType === 'percentage' && val > 100) { setError('Percentage must be ≤ 100'); return; }
    setSaving(true);
    try {
      if (mode === 'create') {
        const res = await apiFetch(API_ENDPOINTS.admin.promos, {
          method: 'POST',
          body: JSON.stringify({
            code: form.code.trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: val,
            maxUses: parseInt(form.maxUses) || 0,
            applicablePlans: form.applicablePlans,
            expiresAt: form.expiresAt || undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error || 'Failed to create'); return; }
      } else {
        const expiresAt = form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : '';
        const res = await apiFetch(API_ENDPOINTS.admin.promo(promo!.id), {
          method: 'PUT',
          body: JSON.stringify({
            discountType: form.discountType,
            discountValue: val,
            maxUses: parseInt(form.maxUses) || 0,
            applicablePlans: form.applicablePlans,
            expiresAt,
          }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error || 'Failed to update'); return; }
      }
      onSaved();
      onClose();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Create Promo Code' : `Edit — ${promo?.code}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none uppercase"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <div className="flex gap-2">
              {(['percentage', 'fixed'] as const).map(type => (
                <button type="button" key={type}
                  onClick={() => setForm(p => ({ ...p, discountType: type }))}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    form.discountType === type
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 text-gray-600 hover:border-purple-400'
                  }`}
                >
                  {type === 'percentage' ? '% Percentage' : '₹ Fixed Amount'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value ({form.discountType === 'percentage' ? '%' : '₹'})
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
              min="0.01" step="0.01"
              placeholder={form.discountType === 'percentage' ? '20' : '100'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (0 = unlimited)</label>
            <input
              type="number"
              value={form.maxUses}
              onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
              min="0" step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Plans (empty = all)</label>
            <div className="grid grid-cols-2 gap-2">
              {PROMO_PLANS.map(({ value, label }) => (
                <button type="button" key={value}
                  onClick={() => togglePlan(value)}
                  className={`py-2 text-sm rounded-lg border font-medium transition-colors ${
                    form.applicablePlans.includes(value)
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'border-gray-300 text-gray-600 hover:border-sky-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PromosTab() {
  const [promos, setPromos] = useState<PromoCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeData | null>(null);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.promos);
      const data = await res.json();
      if (data.success) setPromos(data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const toggleActive = async (promo: PromoCodeData) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.promo(promo.id), {
        method: 'PUT',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      fetchPromos();
    } catch { /* ignore */ }
  };

  const handleDelete = async (promo: PromoCodeData) => {
    if (!confirm(`Delete promo code "${promo.code}"?`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.promo(promo.id), { method: 'DELETE' });
      fetchPromos();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Promo Codes</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Tag size={15} />
          New Promo
        </button>
      </div>

      {showCreate && (
        <PromoModal mode="create" onClose={() => setShowCreate(false)} onSaved={fetchPromos} />
      )}
      {editingPromo && (
        <PromoModal mode="edit" promo={editingPromo} onClose={() => setEditingPromo(null)} onSaved={fetchPromos} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No promo codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Discount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Uses</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Plans</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Expires</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Active</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 font-mono font-semibold text-purple-700">{promo.code}</td>
                  <td className="py-3 px-4">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}%`
                      : `₹${promo.discountValue}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {promo.timesUsed}{promo.maxUses > 0 ? `/${promo.maxUses}` : ''}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {promo.applicablePlans.length === 0 ? 'All' : promo.applicablePlans.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {promo.expiresAt || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${promo.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${promo.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPromo(promo)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── User Activity Modal ─── */
function UserActivityModal({ open, user, onClose }: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setActivity(null);
    setLoading(true);
    apiFetch(API_ENDPOINTS.admin.userActivity(user.id))
      .then(r => r.json())
      .then(data => { if (data.success) setActivity(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, user]);

  if (!open || !user) return null;

  const totalPaid = activity?.payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}'s Activity & Purchases</h3>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
            </div>
          ) : activity ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Messages Used</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {activity.subscription.messagesUsed || 0}
                    {(activity.subscription.messageLimit || 0) > 0 && (
                      <span className="text-sm font-normal text-blue-600">/{activity.subscription.messageLimit}</span>
                    )}
                  </p>
                  {activity.subscription.plan && (
                    <p className="text-xs text-blue-700 mt-1 capitalize font-medium">Plan: {activity.subscription.plan}</p>
                  )}
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-green-900">₹{totalPaid.toLocaleString()}</p>
                  {activity.subscription.expiryDate && (
                    <p className="text-xs text-green-700 mt-1">
                      Expires: {new Date(activity.subscription.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {activity.subscription.enabledServices && activity.subscription.enabledServices.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-xs text-purple-700 font-semibold mb-1.5">Unlocked Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activity.subscription.enabledServices.map((svc, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white text-purple-800 rounded-md text-xs font-medium shadow-sm border border-purple-200 uppercase">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activity.usageStats && (
                <div className="bg-slate-50 border border-gray-250 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-left">Service Configuration & Live Analytics</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">WhatsApp Marketing</span>
                      <span className="font-bold text-gray-800 mt-1">
                        {activity.usageStats.whatsapp.activeSessions > 0 ? '🟢 Connected' : '🔴 Offline'} • {activity.usageStats.whatsapp.campaignsSent} Campaigns
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">Email Campaigns</span>
                      <span className="font-bold text-gray-800 mt-1">
                        {activity.usageStats.email.isSmtpConnected ? '✅ SMTP Configured' : '❌ Unconfigured'} • {activity.usageStats.email.scheduledReminders} Reminders
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">Website Chatbot</span>
                      <span className="font-bold text-gray-800 mt-1">
                        🤖 {activity.usageStats.websiteChatbot.activeWidgets} Configured • {activity.usageStats.websiteChatbot.leadsCaptured} Leads
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">LinkedIn Automation</span>
                      <span className="font-bold text-gray-800 mt-1">
                        {activity.usageStats.linkedin.botEnabled ? '⏰ Bot Active' : '⏸️ Paused'} • {activity.usageStats.linkedin.totalPosts} Posts
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">SEO Tracking</span>
                      <span className="font-bold text-gray-800 mt-1">
                        🔍 {activity.usageStats.seo.trackedSites} Tracked Sites
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex flex-col justify-between text-left">
                      <span className="text-gray-400 font-medium">Scraped Leads</span>
                      <span className="font-bold text-gray-800 mt-1">
                        👥 {activity.usageStats.leads.scrapedCount} Maps Leads
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>Service & Plan Purchase Logs</span>
                  <span className="text-xs font-normal text-gray-500">{activity.payments.length} record(s)</span>
                </h4>
                {activity.payments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">No purchase or assignment records found</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {activity.payments.map((p, i) => {
                      const isTrial = p.payuResponse === 'free_trial_start' || p.plan === 'trial';
                      const isAdmin = p.payuResponse === 'assigned_by_admin' || p.txnId?.startsWith('ADMIN_');
                      const isPromo = !!p.promoCode;

                      return (
                        <div key={i} className="flex items-start justify-between p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-100 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 capitalize">{p.plan}</p>
                              {isTrial ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">Free Trial</span>
                              ) : isAdmin ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">Admin Assigned</span>
                              ) : isPromo ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Promo: {p.promoCode}</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">Online Gateway</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 font-mono">Txn: {p.txnId}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm font-bold text-gray-900">{p.amount === 0 ? 'Free / ₹0' : `₹${(p.amount || 0).toLocaleString()}`}</p>
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize ${
                              p.status === 'success' ? 'bg-green-100 text-green-700' :
                              p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{p.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">Failed to load activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Chatbot Demos Tab ─── */
interface ChatbotDemo {
  id: string;
  websiteUrl: string;
  businessName: string;
  description: string;
  services: string[];
  primaryColor: string;
  isAdminCreated: boolean;
  viewCount: number;
  pagesCrawled: number;
  status: string;
  leadEmail?: string;
  leadWhatsApp?: string;
  createdAt: string;
  expiresAt: string;
}

function ChatbotDemosTab() {
  const [demos, setDemos] = useState<ChatbotDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWhatsApp, setLeadWhatsApp] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const frontendBase = typeof window !== 'undefined' ? window.location.origin : '';

  const loadDemos = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.adminChatbotDemo.list);
      const data = await res.json();
      if (data.success) setDemos(data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDemos(); }, []);

  const handleCreate = async () => {
    if (!url.trim()) return;
    setError('');
    setCreating(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.adminChatbotDemo.create, {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: url.trim(), leadEmail: leadEmail.trim(), leadWhatsApp: leadWhatsApp.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create demo');
      setUrl('');
      setLeadEmail('');
      setLeadWhatsApp('');
      await loadDemos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create demo');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this demo? The link will stop working.')) return;
    try {
      await apiFetch(API_ENDPOINTS.adminChatbotDemo.delete(id), { method: 'DELETE' });
      setDemos(d => d.filter(x => x.id !== id));
    } catch {
      // ignore
    }
  };

  const handleCopy = (id: string) => {
    const link = `${frontendBase}/demo/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Chatbot Demo Links</h2>
        <p className="text-sm text-gray-500">Create shareable demo links for potential clients. Each link generates a live chatbot demo trained on their website.</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Bot size={16} className="text-green-600" /> Create New Demo Link
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Client Website URL *</label>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:border-green-500">
              <Globe size={14} className="text-gray-400 shrink-0" />
              <input
                type="url"
                placeholder="https://client-website.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead Alert Email (optional)</label>
            <input
              type="email"
              placeholder="client@email.com"
              value={leadEmail}
              onChange={e => setLeadEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead Alert WhatsApp (optional)</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={leadWhatsApp}
              onChange={e => setLeadWhatsApp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={creating || !url.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
              {creating ? 'Creating…' : 'Create Demo'}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-600 flex items-center gap-1"><X size={12} />{error}</p>}
        {creating && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Crawling website and training bot… this takes 15–30 seconds.
          </p>
        )}
      </div>

      {/* Demos list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-gray-400" />
          </div>
        ) : demos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bot size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No demos created yet. Create one above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {demos.map(demo => {
              const isExpired = new Date(demo.expiresAt) < new Date();
              const demoLink = `${frontendBase}/demo/${demo.id}`;
              return (
                <div key={demo.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: demo.primaryColor || '#16a34a' }}>
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{demo.businessName || 'Unnamed Business'}</p>
                        <a href={demo.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 truncate">
                          <Globe size={10} />
                          {demo.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{demo.pagesCrawled} pages · {demo.services?.length || 0} services</span>
                          <span className="text-xs text-gray-500">{demo.viewCount} views</span>
                          {isExpired && <span className="text-xs text-red-500 font-medium">Expired</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={demoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Open demo"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => handleCopy(demo.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 border border-gray-200 rounded-lg transition-colors"
                      >
                        {copiedId === demo.id ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
                        {copiedId === demo.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => handleDelete(demo.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete demo"
                      >
                        <Trash2 size={15} />
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
  );
}

/* ─── Deletion Requests Tab ─── */
interface DeletionRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
}

function DeletionRequestsTab() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetch_ = async (status: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.adminDeletion.list}?status=${status}`);
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(statusFilter); }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const url = action === 'approve'
      ? API_ENDPOINTS.adminDeletion.approve(id)
      : API_ENDPOINTS.adminDeletion.reject(id);
    const label = action === 'approve' ? 'Approve & delete all user data' : 'Reject';
    if (!confirm(`${label}?\n\nThis action cannot be undone.`)) return;
    setActionLoading(id + action);
    try {
      const res = await apiFetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetch_(statusFilter);
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Data Deletion Requests</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No {statusFilter} requests.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  {statusFilter === 'pending' && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{req.name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.email}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{req.reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    {statusFilter === 'pending' && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={actionLoading === req.id + 'approve'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            {actionLoading === req.id + 'approve' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            Approve & Delete
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={actionLoading === req.id + 'reject'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            {actionLoading === req.id + 'reject' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <X size={12} />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Influencers Tab ─── */
interface InfluencerProfile {
  id: string; name: string; email: string; phone?: string;
  promoCode: string; commissionRate: number; status: string;
  upiId?: string;
  totalEarned: number; totalPaid: number; totalPending: number; totalReferrals: number;
  createdAt: string;
}

function fmtMoney(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfluencersTab() {
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInf, setSelectedInf] = useState<InfluencerProfile | null>(null);
  const [payingOut, setPayingOut] = useState(false);
  const [form, setForm] = useState({ userEmail: '', promoCode: '', commissionRate: '20', upiId: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommission, setEditCommission] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.adminInfluencer.list);
      const json = await res.json();
      if (json.success) setInfluencers(json.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.adminInfluencer.create, {
        method: 'POST',
        body: JSON.stringify({
          userEmail: form.userEmail,
          promoCode: form.promoCode,
          commissionRate: parseFloat(form.commissionRate) / 100,
          upiId: form.upiId,
          phone: form.phone,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Influencer enrolled!'); setShowCreate(false);
        setForm({ userEmail: '', promoCode: '', commissionRate: '20', upiId: '', phone: '' });
        load();
      } else { setMsg(json.error || 'Failed'); }
    } catch { setMsg('Network error'); } finally { setSaving(false); }
  };

  const toggleStatus = async (inf: InfluencerProfile) => {
    const newStatus = inf.status === 'active' ? 'suspended' : 'active';
    await apiFetch(API_ENDPOINTS.adminInfluencer.update(inf.id), {
      method: 'PUT', body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const saveEdit = async (inf: InfluencerProfile) => {
    const rate = parseFloat(editCommission);
    if (isNaN(rate) || rate < 1 || rate > 100) return;
    setSaving(true);
    await apiFetch(API_ENDPOINTS.adminInfluencer.update(inf.id), {
      method: 'PUT',
      body: JSON.stringify({ commissionRate: rate / 100 }),
    });
    setSaving(false);
    setEditingId(null);
    load();
  };

  const markAllPaid = async (inf: InfluencerProfile) => {
    setPayingOut(true);
    await apiFetch(API_ENDPOINTS.adminInfluencer.payout(inf.id), { method: 'POST', body: '{}' });
    setPayingOut(false); load();
    if (selectedInf?.id === inf.id) setSelectedInf({ ...inf, totalPending: 0, totalPaid: inf.totalPaid + inf.totalPending });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Influencer / Affiliate Partners</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage affiliate commissions and payout tracking</p>
        </div>
        <button onClick={() => { setShowCreate(true); setMsg(''); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <UserPlus size={16} /> Enroll Influencer
        </button>
      </div>

      {msg && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{msg}</div>}

      {/* Enroll form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Enroll New Influencer</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">User Email</label>
              <input type="email" value={form.userEmail} onChange={e => setForm(f => ({ ...f, userEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="influencer@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Promo Code (must exist)</label>
              <input value={form.promoCode} onChange={e => setForm(f => ({ ...f, promoCode: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                placeholder="INFLUENCER10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Commission %</label>
              <input type="number" min="1" max="50" value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID (for payouts)</label>
              <input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@upi" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={create} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Enroll'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Influencer list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
      ) : influencers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No influencers enrolled yet.</div>
      ) : (
        <div className="space-y-4">
          {influencers.map(inf => (
            <div key={inf.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(inf.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{inf.name}</p>
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{inf.promoCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inf.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {inf.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{inf.email}</p>
                    {inf.upiId && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><LinkIcon size={10} /> {inf.upiId}</p>}
                    {/* Stats row */}
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Referrals</p>
                        <p className="font-semibold text-gray-900">{inf.totalReferrals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Earned</p>
                        <p className="font-semibold text-gray-900">{fmtMoney(inf.totalEarned)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pending</p>
                        <p className={`font-semibold ${inf.totalPending > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{fmtMoney(inf.totalPending)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Paid Out</p>
                        <p className="font-semibold text-green-600">{fmtMoney(inf.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Commission</p>
                        {editingId === inf.id ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number" min="1" max="100"
                              value={editCommission}
                              onChange={e => setEditCommission(e.target.value)}
                              className="w-16 border border-blue-300 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                              autoFocus
                            />
                            <span className="text-xs text-gray-500">%</span>
                            <button onClick={() => saveEdit(inf)} disabled={saving}
                              className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                              {saving ? '…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <p className="font-semibold text-gray-900">{Math.round(inf.commissionRate * 100)}%</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {inf.totalPending > 0 && (
                    <button onClick={() => markAllPaid(inf)} disabled={payingOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                      <DollarSign size={12} /> Mark Paid ({fmtMoney(inf.totalPending)})
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(inf.id); setEditCommission(String(Math.round(inf.commissionRate * 100))); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                    ✏️ Edit
                  </button>
                  <button onClick={() => toggleStatus(inf)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${inf.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                    {inf.status === 'active' ? <><Ban size={12} /> Suspend</> : <><CheckCircle2 size={12} /> Activate</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Features Tab (dynamic feature registry) ─── */
interface FeatureFormState {
  key: string;
  name: string;
  description: string;
  group: string;
  displayOrder: string;
  isActive: boolean;
  monthlyPrice: string;
}

const emptyFeatureForm = (): FeatureFormState => ({
  key: '', name: '', description: '', group: '', displayOrder: '0', isActive: true, monthlyPrice: '',
});

function FeaturesTab() {
  const { features, reload } = useAdminFeatures();
  const [editing, setEditing] = useState<{ mode: 'create' | 'edit'; form: FeatureFormState } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const startCreate = () => { setError(null); setEditing({ mode: 'create', form: emptyFeatureForm() }); };
  const startEdit = (f: FeatureDefinition) => {
    setError(null);
    setEditing({
      mode: 'edit',
      form: {
        key: f.key,
        name: f.name,
        description: f.description ?? '',
        group: f.group ?? '',
        displayOrder: String(f.displayOrder ?? 0),
        isActive: f.isActive,
        monthlyPrice: '',
      },
    });
  };

  const submitForm = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.key.trim()) { setError('Feature key is required'); return; }
    if (!f.name.trim()) { setError('Name is required'); return; }

    const body: Record<string, unknown> = {
      key: f.key.trim().toLowerCase(),
      name: f.name.trim(),
      description: f.description,
      group: f.group,
      displayOrder: parseInt(f.displayOrder) || 0,
      isActive: f.isActive,
    };
    if (editing.mode === 'create' && parseFloat(f.monthlyPrice) > 0) {
      body.monthlyPrice = parseFloat(f.monthlyPrice);
    }

    setSaving(true);
    setError(null);
    try {
      const url = editing.mode === 'create'
        ? API_ENDPOINTS.admin.features
        : API_ENDPOINTS.admin.feature(f.key);
      const res = await apiFetch(url, {
        method: editing.mode === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to save feature'); return; }
      await reload();
      setSuccessMsg(editing.mode === 'create'
        ? `Feature "${body.key}" registered${body.monthlyPrice ? ` with ${f.key} / ${f.key}_yr plans at ₹${body.monthlyPrice}/mo` : ''}.`
        : `Feature "${f.key}" updated.`);
      setEditing(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (f: FeatureDefinition) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.feature(f.key), {
        method: 'PUT',
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      const data = await res.json();
      if (data.success) reload();
      else alert(data.error || 'Failed to update feature');
    } catch { alert('Failed to update feature'); }
  };

  const deleteFeature = async (f: FeatureDefinition) => {
    if (!confirm(`Delete feature "${f.key}"? Plans that include it must drop it first.`)) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.feature(f.key), { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) { alert(data.error || 'Failed to delete'); return; }
      reload();
    } catch { alert('Failed to delete feature'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Features</h2>
          <p className="text-sm text-gray-500">
            The feature registry — every sellable service on the platform. Register a feature here, then price it via plans (or set a monthly price to auto-create them).
          </p>
        </div>
        <button onClick={startCreate}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">
          + Register Feature
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Key</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Group</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-center">Active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {features.map(f => (
              <tr key={f.key} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{f.displayOrder ?? 0}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">
                  {f.key}
                  {f.isBuiltIn && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">built-in</span>}
                </td>
                <td className="px-3 py-2 text-gray-900">{f.name}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{f.group || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">{f.description || '—'}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => toggleActive(f)}
                    className={`w-10 h-5 rounded-full ${f.isActive ? 'bg-green-500' : 'bg-gray-300'} relative transition-colors`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${f.isActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(f)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit">
                    <Pencil size={14} />
                  </button>
                  {!f.isBuiltIn && (
                    <button onClick={() => deleteFeature(f)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {editing.mode === 'create' ? 'Register Feature' : `Edit Feature — ${editing.form.key}`}
              </h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Feature key</label>
                  <input type="text" value={editing.form.key} disabled={editing.mode === 'edit'}
                    placeholder="e.g. leads, instagram"
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, key: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500" />
                  <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, digits, underscores. Used as the service key on plans.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input type="text" value={editing.form.name}
                    placeholder="e.g. Leads Manager"
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, name: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={editing.form.description}
                  onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, description: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                  <input type="text" value={editing.form.group}
                    placeholder="messaging / social / web / growth"
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, group: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display order</label>
                  <input type="number" step="1" value={editing.form.displayOrder}
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, displayOrder: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              {editing.mode === 'create' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monthly price (₹, optional)</label>
                  <input type="number" min="0" step="1" value={editing.form.monthlyPrice}
                    placeholder="e.g. 99"
                    onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, monthlyPrice: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">
                    If set, "{editing.form.key || 'key'}" (monthly) and "{editing.form.key || 'key'}_yr" (yearly, 20% off) plans are created automatically.
                  </p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.form.isActive}
                  onChange={e => setEditing(s => s && ({ ...s, form: { ...s.form, isActive: e.target.checked } }))} />
                Active (shown in the public pricing catalog)
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={submitForm} disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : editing.mode === 'create' ? 'Register' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Service Availability Tab ─── */
const SVC_LABELS: Record<string, { label: string; desc: string }> = {
  whatsapp:     { label: 'WhatsApp Sender',  desc: 'Bulk messaging at scale' },
  whatsapp_bot: { label: 'WhatsApp AI Bot',  desc: '24/7 auto-reply chatbot' },
  email:        { label: 'Email Marketing',  desc: 'Bulk campaigns & tracking' },
  chatbot:      { label: 'Website Chatbot',  desc: 'Embeddable AI widget' },
  facebook:     { label: 'Facebook',         desc: 'Schedule & publish posts' },
  linkedin:     { label: 'LinkedIn',         desc: 'Publish & schedule posts' },
  linkedin_bot: { label: 'LinkedIn AI Bot',  desc: 'Automated AI posting' },
  seo:          { label: 'SEO Manager',      desc: 'Audit & health tracking' },
  seo_bot:      { label: 'SEO AI Bot',       desc: 'AI blog & recommendations' },
  leads:        { label: 'Leads Manager',    desc: 'Scrape & enrich local leads' },
};

interface ServiceStatus {
  service: string;
  isUnavailable: boolean;
  message?: string;
}

function ServiceAvailabilityTab() {
  const { features: registryFeatures } = useAdminFeatures();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.serviceAvailability);
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
        const msgs: Record<string, string> = {};
        for (const s of (data.data || [])) msgs[s.service] = s.message || '';
        setEditMsg(msgs);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const updateService = async (svcId: string, isUnavailable: boolean, message: string) => {
    setSaving(svcId);
    try {
      await apiFetch(API_ENDPOINTS.admin.serviceAvailability, {
        method: 'PUT',
        body: JSON.stringify({ service: svcId, isUnavailable, message }),
      });
      setServices(prev => prev.map(s => s.service === svcId ? { ...s, isUnavailable, message } : s));
      setSaved(svcId);
      setTimeout(() => setSaved(null), 2000);
    } catch { /* ignore */ } finally { setSaving(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Service Availability</h2>
      <p className="text-sm text-gray-500 mb-6">
        Mark any service as temporarily unavailable. Users will see a "Temporarily Unavailable" badge on pricing cards and cannot subscribe to that service.
      </p>
      <div className="space-y-3">
        {services.map(svc => {
          const registered = registryFeatures.find(f => f.key === svc.service);
          const meta = SVC_LABELS[svc.service]
            ?? (registered ? { label: registered.name, desc: registered.description ?? '' } : undefined);
          return (
            <div
              key={svc.service}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors ${
                svc.isUnavailable ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{meta?.label ?? svc.service}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.isUnavailable ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {svc.isUnavailable ? 'Unavailable' : 'Available'}
                  </span>
                  {saved === svc.service && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{meta?.desc}</p>
                {svc.isUnavailable && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Message for users (e.g. Maintenance until Dec 15)"
                      value={editMsg[svc.service] ?? ''}
                      onChange={e => setEditMsg(prev => ({ ...prev, [svc.service]: e.target.value }))}
                      className="flex-1 text-xs border border-red-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-red-300 placeholder:text-gray-400"
                    />
                    <button
                      onClick={() => updateService(svc.service, true, editMsg[svc.service] ?? '')}
                      disabled={saving === svc.service}
                      className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
                    >
                      Save msg
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => updateService(svc.service, !svc.isUnavailable, editMsg[svc.service] ?? '')}
                disabled={saving === svc.service}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  svc.isUnavailable
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                {saving === svc.service && <Loader2 className="w-4 h-4 animate-spin" />}
                {svc.isUnavailable ? 'Mark Available' : 'Mark Unavailable'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Transactions / Purchase Logs Tab ─── */
interface TransactionItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  txnId: string;
  amount: number;
  originalAmount?: number;
  plan: string;
  status: string;
  payuResponse?: string;
  mihpayId?: string;
  promoCode?: string;
  createdAt: string;
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    apiFetch(API_ENDPOINTS.admin.transactions)
      .then(r => r.json())
      .then(data => { if (data.success) setTransactions(data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter(t => {
    const matchesSearch = !search || 
      t.userName?.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      t.plan?.toLowerCase().includes(search.toLowerCase()) ||
      t.txnId?.toLowerCase().includes(search.toLowerCase()) ||
      t.promoCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Purchase & Assignment Logs</h2>
          <p className="text-xs text-gray-500">Track all user service purchases, trial activations, and admin plan grants across the platform</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Logs
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, email, plan, txn ID, promo code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success / Granted</option>
          <option value="pending">Pending</option>
          <option value="failure">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transaction or purchase logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Service / Plan</th>
                  <th className="px-4 py-3">Method / Source</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(t => {
                  const isTrial = t.payuResponse === 'free_trial_start' || t.plan === 'trial';
                  const isAdmin = t.payuResponse === 'assigned_by_admin' || t.txnId?.startsWith('ADMIN_');
                  const isPromo = !!t.promoCode;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.userName || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{t.userEmail || `ID: ${t.userId.slice(-6)}`}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 capitalize">
                        {t.plan}
                      </td>
                      <td className="px-4 py-3">
                        {isTrial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            Free Trial
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Admin Assigned
                          </span>
                        ) : isPromo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Promo: {t.promoCode}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Online Gateway
                          </span>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono truncate max-w-[150px]" title={t.txnId}>
                          {t.txnId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {t.amount === 0 ? (
                          <span className="text-gray-500 font-normal">Free / ₹0</span>
                        ) : (
                          `₹${t.amount.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          t.status === 'success' ? 'bg-green-100 text-green-700' :
                          t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Admin Panel ─── */
export function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.admin.stats);
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch { /* ignore */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Purchase Logs', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'plans', label: 'Plans', icon: Settings },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'promos', label: 'Promos', icon: Tag },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'demos', label: 'Chatbot Demos', icon: Bot },
    { id: 'deletions', label: 'Deletion Requests', icon: Trash2 },
    { id: 'services', label: 'Services', icon: AlertTriangle },
    { id: 'influencers', label: 'Influencers', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app')}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">Manage users, subscriptions & emails</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={16} className="text-purple-500" />
              <span>{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'dashboard' && <DashboardTab stats={stats} loading={statsLoading} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'invoices' && <InvoicesTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'features' && <FeaturesTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'email' && <EmailTab />}
        {tab === 'demos' && <ChatbotDemosTab />}
        {tab === 'deletions' && <DeletionRequestsTab />}
        {tab === 'services' && <ServiceAvailabilityTab />}
        {tab === 'influencers' && <InfluencersTab />}
      </div>
    </div>
  );
}
