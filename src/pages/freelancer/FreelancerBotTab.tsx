import { useState } from 'react';
import { Loader2, Play, Bot, AlertCircle, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FreelancerSessionStatus, FreelancerBotConfig } from '@/types/freelancer';

interface Props {
  isPaid: boolean;
  status: FreelancerSessionStatus;
  config: FreelancerBotConfig | null;
  onRefresh: () => void;
  onSwitchTab: (tab: 'config' | 'run' | 'approvals' | 'history') => void;
}

export function FreelancerBotTab({ isPaid, status, config, onRefresh, onSwitchTab }: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleRunBot = async () => {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.botRun, { method: 'POST' });
      const json = await res.json();

      if (json.success && json.data) {
        setResult(json.data);
        onRefresh();
      } else {
        setError(json.error || 'Failed to run Freelancer Auto-Bidder');
      }
    } catch {
      setError('Failed to contact server');
    }
    setRunning(false);
  };

  if (!isPaid) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-md mx-auto mt-8">
        <ShieldAlert size={40} className="text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-2">Upgrade Required</h3>
        <p className="text-xs text-gray-500 mb-4">Freelancer AI Auto-Bidding is a premium feature. Upgrade your subscription to start generating winning proposals.</p>
        <a href="/subscription" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">Upgrade Plan</a>
      </div>
    );
  }

  if (!status.isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-md mx-auto mt-8">
        <AlertCircle size={40} className="text-sky-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-2">Freelancer Disconnected</h3>
        <p className="text-xs text-gray-500 mb-4">Please save your Freelancer OAuth Access Token in the Configuration tab before triggering auto-bidding.</p>
        <button onClick={() => onSwitchTab('config')} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors">Go to Configuration</button>
      </div>
    );
  }

  const intervalMins = config?.autoScheduleIntervalMins || 60;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneAbbr = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ').pop();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Bot className="text-sky-600" size={20} />
            Freelancer Auto-Bidding Control Panel
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            config?.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {config?.isEnabled ? '🟢 Engine Active' : '⏸️ Paused'}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Trigger the AI search and bidding engine now or let it run automatically according to your configured schedule frequency.
        </p>

        {/* Status meters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Daily Bids Limit</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {config?.dailyBidsCount || 0} / {config?.bidsPerDay || 10} Bids
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Approval Mode</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">
              {config?.requiresApproval ? '🛡️ Require Review' : '⚡ Instant Bidding'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Run Frequency</p>
            <p className="text-xs font-bold text-sky-700 mt-0.5">
              Every {intervalMins >= 60 ? `${intervalMins / 60} Hr` : `${intervalMins} Mins`}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Your Timezone</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={userTimezone}>
              {userTimezone} ({timeZoneAbbr})
            </p>
          </div>
        </div>

        {/* Schedule Timing Box */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
            <Clock size={14} />
            <span>Automated Execution Timeline ({userTimezone})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Run Local Time</span>
              <span className="font-medium text-slate-200">
                {config?.lastRunAt
                  ? new Date(config.lastRunAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Pending First Run'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Scheduled Execution</span>
              <span className="font-bold text-sky-400">
                {config?.lastRunAt ? (
                  (() => {
                    const last = new Date(config.lastRunAt).getTime();
                    const next = new Date(last + (intervalMins * 60 * 1000));
                    const diffMins = Math.max(0, Math.round((next.getTime() - Date.now()) / 60000));
                    return `${next.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} (in ~${diffMins}m)`;
                  })()
                ) : 'Ready to Run'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sky-800 text-xs font-bold">
              <CheckCircle2 size={16} />
              <span>{result.message}</span>
            </div>

            {result.projectTitle && (
              <div className="text-xs space-y-1.5 pt-2 border-t border-sky-200/60 text-gray-800">
                <p><strong>Project:</strong> {result.projectTitle}</p>
                <p><strong>Proposed Amount:</strong> ${result.proposedAmount} ({result.periodDays} days)</p>
                {result.proposalSnippet && (
                  <div className="bg-white p-3 rounded-lg border border-sky-100 font-sans text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {result.proposalSnippet}
                  </div>
                )}
              </div>
            )}

            {result.requiresApproval && (
              <div className="pt-1">
                <button
                  onClick={() => onSwitchTab('approvals')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  View Pending Approvals →
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleRunBot}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {running ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching Freelancer Projects & Writing Winning Proposal...
              </>
            ) : (
              <>
                <Play size={16} />
                Run AI Auto-Bidder Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
