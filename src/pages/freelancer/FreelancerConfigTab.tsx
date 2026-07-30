import { useState, useEffect } from 'react';
import { Loader2, KeyRound, CheckCircle2, LogOut, Save, Plus, Trash2, Shield, Settings, Sliders, FileText, Target, AlertCircle, ExternalLink, Clock, Globe } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FreelancerSessionStatus, FreelancerBotConfig } from '@/types/freelancer';

interface Props {
  status: FreelancerSessionStatus;
  config: FreelancerBotConfig | null;
  onRefresh: () => void;
}

const PRESET_SKILLS = [
  'web-development', 'mobile-development', 'android', 'ios', 'react-native',
  'flutter', 'react.js', 'node.js', 'python', 'go', 'php', 'laravel',
  'wordpress', 'ai-development', 'full-stack'
];

export function FreelancerConfigTab({ status, config, onRefresh }: Props) {
  const [tokenInput, setTokenInput] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Config State
  const [isEnabled, setIsEnabled] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [minBudget, setMinBudget] = useState(50);
  const [maxBudget, setMaxBudget] = useState(5000);
  const [bidsPerDay, setBidsPerDay] = useState(10);
  const [autoScheduleIntervalMins, setAutoScheduleIntervalMins] = useState(60);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [profileSummary, setProfileSummary] = useState('');
  const [exampleBids, setExampleBids] = useState<string[]>([]);
  const [newExampleBid, setNewExampleBid] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled ?? false);
      setSkills(config.skills || []);
      setMinBudget(config.minBudget ?? 50);
      setMaxBudget(config.maxBudget ?? 5000);
      setBidsPerDay(config.bidsPerDay ?? 10);
      setAutoScheduleIntervalMins(config.autoScheduleIntervalMins ?? 60);
      setStartTime(config.startTime || '00:00');
      setEndTime(config.endTime || '23:59');
      setTimezone(config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
      setRequiresApproval(config.requiresApproval ?? true);
      setProfileSummary(config.profileSummary || '');
      setExampleBids(config.exampleBids || []);
    }
  }, [config]);

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setSavingToken(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.credentials, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oauthAccessToken: tokenInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Freelancer OAuth Access Token saved & verified successfully!');
        setTokenInput('');
        onRefresh();
      } else {
        setError(json.error || 'Failed to verify token with Freelancer.com');
      }
    } catch {
      setError('Failed to contact server');
    }
    setSavingToken(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Freelancer account?')) return;
    setDisconnecting(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.disconnect, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        onRefresh();
      } else {
        setError(json.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to contact server');
    }
    setDisconnecting(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        isEnabled,
        skills,
        minBudget: Number(minBudget),
        maxBudget: Number(maxBudget),
        bidsPerDay: Number(bidsPerDay),
        autoScheduleIntervalMins: Number(autoScheduleIntervalMins),
        startTime,
        endTime,
        timezone,
        requiresApproval,
        profileSummary,
        exampleBids,
      };
      const res = await apiFetch(API_ENDPOINTS.freelancer.botConfig, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Auto-bidding configuration & persona settings saved!');
        onRefresh();
      } else {
        setError(json.error || 'Failed to save configuration');
      }
    } catch {
      setError('Failed to contact server');
    }
    setSavingConfig(false);
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const addCustomSkill = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const s = customSkillInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (s) {
      if (!skills.includes(s)) {
        setSkills([...skills, s]);
      }
      setCustomSkillInput('');
    }
  };

  const allSkillChips = Array.from(new Set([...PRESET_SKILLS, ...skills]));

  const addExampleBid = () => {
    if (newExampleBid.trim()) {
      setExampleBids([...exampleBids, newExampleBid.trim()]);
      setNewExampleBid('');
    }
  };

  const removeExampleBid = (index: number) => {
    setExampleBids(exampleBids.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Credentials Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="text-sky-600" size={18} />
          Freelancer OAuth Access Token
        </h3>

        <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            💡 How to get your Freelancer OAuth Access Token:
          </h4>
          <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Log in to your <strong>Freelancer.com</strong> account in your browser.</li>
            <li>
              Open Developer Settings:{' '}
              <a
                href="https://accounts.freelancer.com/settings/develop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                https://accounts.freelancer.com/settings/develop <ExternalLink size={11} />
              </a>
            </li>
            <li>Click <strong>"Create OAuth Token"</strong>, select scope permissions (Project Management & Bidding), and generate your token.</li>
            <li>Copy your Access Token and paste it below.</li>
          </ol>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 font-medium">
            {success}
          </div>
        )}

        {status.isConnected ? (
          <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 flex items-center gap-4">
            {status.profilePicture ? (
              <img
                src={status.profilePicture}
                alt="Freelancer profile"
                className="w-12 h-12 rounded-full border border-sky-200 bg-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-lg">
                {(status.freelancerUsername || 'F').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-gray-900 text-sm truncate">@{status.freelancerUsername}</h4>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 size={8} /> Connected
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                User ID: {status.freelancerUserId || 'N/A'} • Connected: {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : 'Active'}
              </p>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveToken} className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your Freelancer OAuth Access Token"
              className="flex-1 px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-gray-800"
            />
            <button
              type="submit"
              disabled={savingToken}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {savingToken ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Token
            </button>
          </form>
        )}
      </div>

      {/* 2. Bot Configuration & AI Persona Form */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-sky-600" size={18} />
            Auto-Bidding Engine & AI Persona
          </h3>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Enable Auto-Bidding Engine</span>
          </label>
        </div>

        {/* Approval Toggle */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 min-w-0 flex-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              Require Email / UI Approval Before Submitting Bid (Recommended)
            </label>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When checked, AI discovers matching projects & generates winning proposals, but puts them in the <strong>Approvals</strong> tab (and sends an email notification) for your one-click confirmation before bidding. Uncheck for 100% automated instant bidding.
            </p>
          </div>
        </div>

        {/* Target Project Skills */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Target size={14} className="text-sky-600" />
            Target Project Categories & Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {allSkillChips.map(skill => (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  skills.includes(skill)
                    ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {skills.includes(skill) ? '✓ ' : '+ '}{skill}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 max-w-sm">
            <input
              type="text"
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSkill(e);
                }
              }}
              placeholder="Add custom skill (e.g. vue.js)"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Filters, Daily Cap & Schedule Interval */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Min Budget ($)</label>
            <input
              type="number"
              min={0}
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Budget ($)</label>
            <input
              type="number"
              min={0}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Bids / Day</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bidsPerDay}
              onChange={(e) => setBidsPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Run Frequency</label>
            <select
              value={autoScheduleIntervalMins}
              onChange={(e) => setAutoScheduleIntervalMins(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800 font-semibold"
            >
              <option value={30}>Every 30 Mins</option>
              <option value={60}>Every 1 Hour</option>
              <option value={120}>Every 2 Hours</option>
              <option value={240}>Every 4 Hours</option>
              <option value={360}>Every 6 Hours</option>
              <option value={720}>Every 12 Hours</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Daily Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Daily End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Kolkata"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800"
            />
          </div>
        </div>

        {/* Live Execution Schedule & Timezone Card */}
        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-sky-400" />
              <h4 className="text-xs font-bold">Automation Execution & Timezone Schedule</h4>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700 font-mono">
              <Globe size={12} className="text-sky-400" />
              <span>{(() => {
                try {
                  const tzName = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short', timeZone: timezone }).split(' ').pop();
                  return `${timezone} (${tzName})`;
                } catch {
                  return timezone;
                }
              })()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Last Execution Time</p>
              <p className="font-semibold text-slate-200 mt-0.5">
                {config?.lastRunAt
                  ? new Date(config.lastRunAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Pending First Run'}
              </p>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Next Automated Execution</p>
              <p className="font-semibold text-sky-400 mt-0.5">
                {config?.lastRunAt ? (
                  (() => {
                    const last = new Date(config.lastRunAt).getTime();
                    const next = new Date(last + (autoScheduleIntervalMins * 60 * 1000));
                    const diffMins = Math.max(0, Math.round((next.getTime() - Date.now()) / 60000));
                    return `${next.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} (in ~${diffMins}m)`;
                  })()
                ) : 'Ready for First Run'}
              </p>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Daily Bid Quota Reset</p>
              <p className="font-semibold text-slate-200 mt-0.5">
                00:00 Midnight (Local Time)
              </p>
            </div>
          </div>
        </div>

        {/* Profile Summary Persona */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <FileText size={14} className="text-sky-600" />
            Your Freelancer Profile Summary & Persona
          </label>
          <textarea
            rows={4}
            value={profileSummary}
            onChange={(e) => setProfileSummary(e.target.value)}
            placeholder="Describe your background, core expertise, portfolio links, and key accomplishments. AI uses this to personalize proposals to your exact profile..."
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800 leading-relaxed resize-none"
          />
        </div>

        {/* Sample Winning Proposals */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Sliders size={14} className="text-sky-600" />
            Sample Winning Proposals (AI Tone Alignment)
          </label>
          <p className="text-[11px] text-gray-500">Provide past winning bids or proposals you like. AI will study your structure, tone, and opening hooks to match your personal style.</p>

          <div className="space-y-2">
            {exampleBids.map((bid, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap flex-1 min-w-0 font-sans">
                  {bid}
                </p>
                <button
                  type="button"
                  onClick={() => removeExampleBid(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <textarea
              rows={3}
              value={newExampleBid}
              onChange={(e) => setNewExampleBid(e.target.value)}
              placeholder="Paste a sample winning proposal text here..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-800 resize-none"
            />
            <button
              type="button"
              onClick={addExampleBid}
              disabled={!newExampleBid.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Add Sample Bid
            </button>
          </div>
        </div>

        {/* Submit Config */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={savingConfig}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
