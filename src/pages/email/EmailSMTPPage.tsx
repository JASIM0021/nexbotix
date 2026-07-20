import { useState, useEffect } from 'react';
import { Settings2, Wifi, WifiOff, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, HelpCircle, FileText, Upload, X, Code2, KeyRound, Mail, LogOut } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface GmailStatus {
  isConnected: boolean;
  email: string | null;
  connectedAt: string | null;
}

const DEFAULT_GMAIL_STATUS: GmailStatus = { isConnected: false, email: null, connectedAt: null };

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  senderName: string;
  senderEmail: string;
  useTLS: boolean;
  isVerified: boolean;
  signature: string;
  deckURL: string;
  deckName: string;
  autoAttachSignature: boolean;
  autoAttachDeck: boolean;
}

const PRESETS: Record<string, { host: string; port: number; useTLS: boolean; label: string }> = {
  gmail:   { host: 'smtp.gmail.com',       port: 587, useTLS: false, label: 'Gmail (App Password)' },
  outlook: { host: 'smtp.office365.com',   port: 587, useTLS: false, label: 'Outlook / Office 365' },
  yahoo:   { host: 'smtp.mail.yahoo.com',  port: 587, useTLS: false, label: 'Yahoo Mail' },
  zoho:    { host: 'smtp.zoho.com',        port: 465, useTLS: true,  label: 'Zoho Mail' },
  hostinger: { host: 'hostinger-api',      port: 0,   useTLS: false, label: 'Hostinger API' },
  custom:  { host: '',                     port: 587, useTLS: false, label: 'Custom SMTP' },
};

export function EmailSMTPPage({ isPaid }: { isPaid: boolean }) {
  const [form, setForm] = useState({
    host: '', port: 587, username: '', password: '', senderName: '', senderEmail: '', useTLS: false,
    signature: '', deckURL: '', deckName: '', autoAttachSignature: false, autoAttachDeck: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [sigView, setSigView] = useState<'code' | 'preview'>('code');
  const [preset, setPreset] = useState('gmail');
  const [saved, setSaved] = useState<SMTPConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>(DEFAULT_GMAIL_STATUS);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  useEffect(() => { if (isPaid) { load(); loadGmailStatus(); } }, [isPaid]);

  const load = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp);
      const d = await r.json();
      if (d.success && d.data) {
        setSaved(d.data);
        setForm(f => ({
          ...f, host: d.data.host, port: d.data.port, username: d.data.username, senderName: d.data.senderName, senderEmail: d.data.senderEmail, useTLS: d.data.useTLS,
          signature: d.data.signature || '', deckURL: d.data.deckURL || '', deckName: d.data.deckName || '',
          autoAttachSignature: !!d.data.autoAttachSignature, autoAttachDeck: !!d.data.autoAttachDeck,
        }));
        if (d.data.provider === 'gmail') {
          setPreset('google-oauth');
        } else if (d.data.host === 'hostinger-api') {
          setPreset('hostinger');
        } else {
          const matching = Object.entries(PRESETS).find(([_, p]) => p.host === d.data.host && p.port === d.data.port);
          if (matching) setPreset(matching[0]);
          else setPreset('custom');
        }
      }
    } catch { /* ignore */ }
  };

  const loadGmailStatus = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.gmailStatus);
      const d = await r.json();
      if (d.success && d.data) setGmailStatus(d.data);
    } catch { /* ignore */ }
  };

  const connectGmail = async () => {
    setConnectingGmail(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.gmailOAuthUrl);
      const d = await r.json();
      const url = d.data?.url || d.url;
      if (url) {
        window.location.href = url;
      } else {
        setMsg({ text: d.error || 'Failed to start Gmail connection', type: 'error' });
        setConnectingGmail(false);
      }
    } catch {
      setMsg({ text: 'Network error', type: 'error' });
      setConnectingGmail(false);
    }
  };

  const disconnectGmail = async () => {
    setDisconnectingGmail(true); setMsg(null);
    try {
      await apiFetch(API_ENDPOINTS.email.gmailDisconnect, { method: 'POST' });
      setGmailStatus(DEFAULT_GMAIL_STATUS);
      setMsg({ text: 'Gmail disconnected', type: 'success' });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setDisconnectingGmail(false);
  };

  const applyPreset = (key: string) => {
    setPreset(key);
    if (key === 'google-oauth') return; // no host/port form for OAuth
    const p = PRESETS[key];
    setForm(f => ({ ...f, host: p.host, port: p.port, useTLS: p.useTLS }));
  };

  const uploadDeck = async (file: File) => {
    setUploadingDeck(true); setMsg(null);
    try {
      const body = new FormData();
      body.append('deck', file);
      const r = await apiFetch(API_ENDPOINTS.email.uploadDeck, { method: 'POST', body });
      const d = await r.json();
      if (d.success) {
        setForm(f => ({ ...f, deckURL: d.filePath, deckName: d.fileName }));
        setMsg({ text: 'Deck uploaded — remember to click Save Settings to apply it.', type: 'success' });
      } else {
        setMsg({ text: d.error || 'Failed to upload deck', type: 'error' });
      }
    } catch { setMsg({ text: 'Network error uploading deck', type: 'error' }); }
    setUploadingDeck(false);
  };

  const save = async () => {
    let checkForm: typeof form & { provider?: string } = { ...form };
    if (preset === 'google-oauth') {
      if (!gmailStatus.isConnected) {
        setMsg({ text: 'Connect your Gmail account first', type: 'error' });
        return;
      }
      checkForm = { ...checkForm, provider: 'gmail', host: '', port: 0, username: '', password: '', useTLS: false, senderEmail: gmailStatus.email || checkForm.senderEmail };
    } else if (preset === 'hostinger') {
      checkForm.host = 'hostinger-api';
      checkForm.port = 0;
      checkForm.useTLS = false;
      if (!checkForm.username) {
        setMsg({ text: 'Mailbox Address is required', type: 'error' });
        return;
      }
      checkForm.senderEmail = checkForm.username; // Keep in sync for sending
    } else {
      if (!checkForm.host || !checkForm.username || !checkForm.senderEmail) {
        setMsg({ text: 'Host, username and sender email are required', type: 'error' });
        return;
      }
    }

    setSaving(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp, { method: 'POST', body: JSON.stringify(checkForm) });
      const d = await r.json();
      if (d.success) {
        setSaved(d.data);
        setForm(f => ({ ...f, password: '' })); // stored encrypted server-side; keep the field blank so it isn't re-sent
        setMsg({ text: 'Email settings saved successfully!', type: 'success' });
      }
      else setMsg({ text: d.error || 'Failed to save', type: 'error' });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setSaving(false);
  };

  const test = async () => {
    let checkForm: typeof form & { provider?: string } = { ...form };
    if (preset === 'google-oauth') {
      if (!gmailStatus.isConnected) {
        setMsg({ text: 'Connect your Gmail account first', type: 'error' });
        return;
      }
      checkForm = { ...checkForm, provider: 'gmail' };
    } else if (preset === 'hostinger') {
      checkForm.host = 'hostinger-api';
      checkForm.port = 0;
      checkForm.useTLS = false;
      if (!checkForm.username) {
        setMsg({ text: 'Mailbox Address is required to test connection', type: 'error' });
        return;
      }
      checkForm.senderEmail = checkForm.username; // Keep in sync
    } else {
      if (!checkForm.host || !checkForm.username) {
        setMsg({ text: 'Host and username/email are required to test connection', type: 'error' });
        return;
      }
    }

    setTesting(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtpTest, {
        method: 'POST',
        body: JSON.stringify(checkForm)
      });
      const d = await r.json();
      setMsg({ text: d.success ? (preset === 'google-oauth' ? '✅ Gmail is connected and working.' : preset === 'hostinger' ? '✅ Connection successful! Hostinger API is working.' : '✅ Connection successful! SMTP is working.') : d.error, type: d.success ? 'success' : 'error' });
      if (d.success && saved) setSaved({ ...saved, isVerified: true });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setTesting(false);
  };

  if (!isPaid) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4"><Settings2 size={28} className="text-amber-500" /></div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
      <p className="text-gray-500">SMTP configuration is available on paid plans.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">SMTP Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Connect your email account to send campaigns</p>
        </div>
        {saved?.isVerified && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">Verified</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Provider Presets */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Provider</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([k, v]) => (
              <button key={k} onClick={() => applyPreset(k)}
                className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-colors ${preset === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {v.label}
              </button>
            ))}
            <button onClick={() => applyPreset('google-oauth')}
              className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-colors flex items-center gap-1.5 ${preset === 'google-oauth' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <Mail size={14} />Google (OAuth)
            </button>
          </div>
          {preset === 'google-oauth' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <HelpCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">Sign in with Google to send, browse the inbox, and summarize this mailbox — no app password needed.</p>
            </div>
          )}
          {preset === 'gmail' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <HelpCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">For Gmail, use your Gmail address as username and create an <strong>App Password</strong> at myaccount.google.com → Security → 2-Step Verification → App Passwords.</p>
            </div>
          )}
          {preset === 'hostinger' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <HelpCircle size={15} className="text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-800">For Hostinger, create an <strong>API token</strong> in the Hostinger Panel under <strong>Emails ➔ API access</strong>. The token must have access to the Mailbox Address configured below.</p>
            </div>
          )}
        </div>

        {preset === 'google-oauth' ? (
          <div className="border border-gray-200 rounded-xl p-6 text-center space-y-3">
            {gmailStatus.isConnected ? (
              <>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Connected as {gmailStatus.email}</p>
                <p className="text-xs text-gray-400">Click Save Settings below to make Gmail the active mailbox for this channel.</p>
                <button onClick={disconnectGmail} disabled={disconnectingGmail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                  {disconnectingGmail ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                  Disconnect Gmail
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                  <Mail size={22} className="text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Sign in with your Google account to connect Gmail.</p>
                <button onClick={connectGmail} disabled={connectingGmail}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                  {connectingGmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  Connect Gmail
                </button>
              </>
            )}
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {preset !== 'hostinger' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SMTP Host</label>
                <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                  placeholder="smtp.gmail.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Port</label>
                <input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: +e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {preset === 'hostinger' ? 'Mailbox Address (Username)' : 'Username / Email'}
            </label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="off" name="botx_smtp_username"
              placeholder={preset === 'hostinger' ? 'you@yourdomain.com' : 'you@gmail.com'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {preset === 'hostinger' ? 'Hostinger API Token' : 'Password / App Password'}
            </label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password" name="botx_smtp_secret"
                placeholder={saved ? 'Saved — leave blank to keep current' : preset === 'hostinger' ? 'Enter API token' : 'Enter password'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {saved && (
              <p className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                <KeyRound size={11} className="text-green-500 shrink-0" />
                A {preset === 'hostinger' ? 'token' : 'password'} is already saved (encrypted). Only fill this to replace it.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sender Name</label>
            <input value={form.senderName} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
              placeholder="My Business" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          {preset !== 'hostinger' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sender Email (From)</label>
              <input value={form.senderEmail} onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))}
                placeholder="noreply@mybusiness.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
          )}
        </div>

        {preset !== 'hostinger' && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setForm(f => ({ ...f, useTLS: !f.useTLS }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.useTLS ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.useTLS ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-gray-700">Use TLS (port 465) — leave off for STARTTLS (port 587)</span>
          </label>
        )}
        </>
        )}

        <div className="border-t border-gray-100 pt-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Signature &amp; Company Deck</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Email Signature</label>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button type="button" onClick={() => setSigView('code')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${sigView === 'code' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Code2 size={12} />Code
                </button>
                <button type="button" onClick={() => setSigView('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${sigView === 'preview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Eye size={12} />Preview
                </button>
              </div>
            </div>
            {sigView === 'code' ? (
              <textarea value={form.signature} onChange={e => setForm(f => ({ ...f, signature: e.target.value }))}
                placeholder={'Best regards,\nJane Doe\nSales, My Business'} rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y" />
            ) : form.signature.trim() ? (
              <iframe
                title="Signature Preview"
                srcDoc={`<base target="_blank"><div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">${form.signature}</div>`}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                className="w-full h-48 border border-gray-300 rounded-lg bg-white"
              />
            ) : (
              <div className="w-full h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                Nothing to preview — add your signature in the Code tab
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Company Deck / Brochure</label>
            {form.deckName ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <FileText size={15} className="text-gray-400 shrink-0" />
                <span className="flex-1 truncate text-gray-700">{form.deckName}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, deckURL: '', deckName: '' }))}
                  className="text-gray-400 hover:text-red-500 shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-gray-400 hover:text-gray-600 transition-colors">
                {uploadingDeck ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploadingDeck ? 'Uploading…' : 'Upload PDF / DOC / PPT'}
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" disabled={uploadingDeck}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDeck(f); e.target.value = ''; }} />
              </label>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setForm(f => ({ ...f, autoAttachSignature: !f.autoAttachSignature }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.autoAttachSignature ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoAttachSignature ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-gray-700">Auto-attach signature to every email</span>
          </label>

          <label className={`flex items-center gap-3 select-none ${form.deckName ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
            <div onClick={() => form.deckName && setForm(f => ({ ...f, autoAttachDeck: !f.autoAttachDeck }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.autoAttachDeck ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoAttachDeck ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-gray-700">Auto-attach company deck to every email{!form.deckName && ' (upload a deck first)'}</span>
          </label>
        </div>

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
          <button onClick={test} disabled={testing}
            className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
            {testing ? <Loader2 size={15} className="animate-spin" /> : saved?.isVerified ? <Wifi size={15} className="text-green-600" /> : <WifiOff size={15} />}
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
