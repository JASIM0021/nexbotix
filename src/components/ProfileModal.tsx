import { X, Mail, Crown } from 'lucide-react';

interface SubscriptionInfo {
  plan: string;
  status: string;
  expiryDate: string;
  isActive: boolean;
  daysLeft: number;
  messagesUsed: number;
  messageLimit: number;
  enabledServices?: string[];
}

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  subscription?: SubscriptionInfo;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInfo | null;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col text-left">
        {/* Header / Banner */}
        <div className="relative bg-gradient-to-tr from-violet-600 to-indigo-600 px-6 py-8 text-white flex flex-col items-center">
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          {/* Large Avatar */}
          <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner mb-4">
            <span className="text-3xl font-extrabold text-white">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          
          <h3 className="text-xl font-bold tracking-tight">{user.name}</h3>
          <p className="text-xs text-white/70 font-mono mt-1">ID: #{user.id}</p>
          
          {/* Role badge */}
          <span className="mt-3 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
            {user.role || 'User'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Email details */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
            </div>
          </div>

          {/* Subscription card */}
          {user.subscription && (
            <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Subscription Plan</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white capitalize shadow-sm">
                  {user.subscription.plan || 'Free'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${user.subscription.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    <span className="text-xs font-bold text-slate-700 capitalize">{user.subscription.status}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Days</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {user.subscription.daysLeft > 0 ? `${user.subscription.daysLeft} days` : 'N/A'}
                  </p>
                </div>
              </div>

              {user.subscription.messageLimit > 0 && (
                <div className="pt-2 border-t border-indigo-100/50">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Monthly Usage Limit</span>
                    <span>{user.subscription.messagesUsed} / {user.subscription.messageLimit} Messages</span>
                  </div>
                  
                  {/* Gradient Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (user.subscription.messagesUsed / user.subscription.messageLimit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Close footer button */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
