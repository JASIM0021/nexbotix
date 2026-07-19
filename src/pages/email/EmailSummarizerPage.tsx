import { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, Globe2, Mail } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface SummarizerConfig {
  isEnabled: boolean;
  source: 'hostinger' | 'gmail' | '';
  timeOfDay: string;
  timezone: string;
  lastRunAt?: string;
  availableSources: ('hostinger' | 'gmail')[];
}

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function EmailSummarizerPage({ isPaid }: { isPaid: boolean }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SummarizerConfig>({
    isEnabled: false, source: '', timeOfDay: '08:00', timezone: browserTimezone, availableSources: [],
  });
  const [saving, setSaving] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const gmailConnected = config.availableSources.includes('gmail');

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.summarizer);
      const d = await r.json();
      if (d.success && d.data) {
        setConfig(c => ({
          ...c,
          isEnabled: d.data.isEnabled,
          source: d.data.source || ((d.data.availableSources || [])[0] ?? ''),
          timeOfDay: d.data.timeOfDay || '08:00',
          timezone: browserTimezone, // always send the current browser zone on save
          lastRunAt: d.data.lastRunAt,
          availableSources: d.data.availableSources || [],
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const connectGmail = async () => {
    setConnectingGmail(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.gmailOAuthUrl);
      const d = await r.json();
      if (d.success && d.data?.url) {
        window.location.href = d.data.url;
      } else {
        setMsg({ text: d.error || 'Failed to start Gmail connection', type: 'error' });
        setConnectingGmail(false);
      }
    } catch {
      setMsg({ text: 'Network error', type: 'error' });
      setConnectingGmail(false);
    }
  };

  const save = async () => {
    if (config.isEnabled && !config.source) {
      setMsg({ text: 'Choose a source mailbox first', type: 'error' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.summarizer, {
        method: 'POST',
        body: JSON.stringify({
          isEnabled: config.isEnabled,
          source: config.source,
          timeOfDay: config.timeOfDay,
          timezone: browserTimezone,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ text: 'Summarizer settings saved!', type: 'success' });
      } else {
        setMsg({ text: d.error || 'Failed to save', type: 'error' });
      }
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setSaving(false);
  };

  const runNow = async () => {
    setRunningNow(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.summarizerRunNow, { method: 'POST' });
      const d = await r.json();
      setMsg({
        text: d.success ? 'Test digest sent — check your inbox shortly.' : (d.error || 'Failed to send test digest'),
        type: d.success ? 'success' : 'error',
      });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setRunningNow(false);
  };

  if (!isPaid) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles size={28} className="text-amber-500" /></div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
      <p className="text-gray-500">Email summarization is available on paid plans.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Email Summarizer</h2>
        <p className="text-sm text-gray-500 mt-1">Get a daily AI digest of everything that came into your inbox, with action items.</p>
      </div>

      {config.availableSources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
          <Mail size={32} className="mx-auto text-gray-300" />
          <p className="text-sm text-gray-600">Connect a mailbox to summarize before enabling this feature.</p>
          <button onClick={connectGmail} disabled={connectingGmail}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {connectingGmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            Connect Gmail
          </button>
          <p className="text-xs text-gray-400">Or connect a Hostinger mailbox on the SMTP tab — that works too.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {!gmailConnected && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">Also want to summarize a Gmail inbox?</p>
              <button onClick={connectGmail} disabled={connectingGmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0">
                {connectingGmail ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                Connect Gmail
              </button>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setConfig(c => ({ ...c, isEnabled: !c.isEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${config.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.isEnabled ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-semibold text-gray-800">Enable daily digest</span>
          </label>

          {config.availableSources.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Source mailbox</label>
              <div className="flex gap-2">
                {config.availableSources.map(src => (
                  <button key={src} onClick={() => setConfig(c => ({ ...c, source: src }))}
                    className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-colors capitalize ${config.source === src ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {src}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <Clock size={12} /> Send time
              </label>
              <input type="time" value={config.timeOfDay} onChange={e => setConfig(c => ({ ...c, timeOfDay: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <Globe2 size={12} /> Timezone (detected)
              </label>
              <input value={browserTimezone} disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>

          {config.lastRunAt && (
            <p className="text-xs text-gray-400">Last sent: {new Date(config.lastRunAt).toLocaleString()}</p>
          )}

          {msg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {msg.text}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            <button onClick={runNow} disabled={runningNow || !config.source}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
              {runningNow ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {runningNow ? 'Sending…' : 'Send test digest now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
