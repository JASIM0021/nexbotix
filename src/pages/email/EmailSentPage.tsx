import { useState, useEffect } from 'react';
import { Send, RefreshCw, Loader2, Mailbox, Mail, ArrowLeft, User, Calendar } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  provider: 'hostinger' | 'smtp' | 'gmail';
  source?: string; // "" (Email channel) | "leads_autopilot"
  sentAt: string;
}

interface HostingerSentMessage {
  uid: string;
  subject: string;
  from: string;
  date: string;
  size: number;
  seen: boolean;
}

interface MessageText {
  plain: string;
  html: string;
}

interface Viewer {
  key: string;
  subject: string;
  metaLabel: string;
  metaValue: string;
  date: string;
}

const PAGE_SIZE = 20;

const PROVIDER_STYLES: Record<string, string> = {
  hostinger: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  smtp: 'bg-gray-50 text-gray-600 border-gray-200',
  gmail: 'bg-red-50 text-red-700 border-red-200',
};

const PROVIDER_LABELS: Record<string, string> = {
  hostinger: 'Hostinger',
  smtp: 'SMTP',
  gmail: 'Gmail',
};

export function EmailSentPage({ isPaid }: { isPaid: boolean }) {
  const [logs, setLogs] = useState<SentEmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [crossCheckProvider, setCrossCheckProvider] = useState<'hostinger' | 'gmail' | null>(null);
  const [hostingerMessages, setHostingerMessages] = useState<HostingerSentMessage[]>([]);
  const [hostingerTotal, setHostingerTotal] = useState(0);
  const [hostingerPage, setHostingerPage] = useState(1);
  const [hostingerLoading, setHostingerLoading] = useState(false);
  const [showHostinger, setShowHostinger] = useState(false);
  const [hostingerPageTokens, setHostingerPageTokens] = useState<Record<number, string>>({});
  const [hostingerHasMore, setHostingerHasMore] = useState(false);

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [viewerBody, setViewerBody] = useState<MessageText | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => { if (isPaid) { load(1); checkProvider(); } }, [isPaid]);

  const checkProvider = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp);
      const d = await r.json();
      if (d.success && d.data?.provider === 'gmail') setCrossCheckProvider('gmail');
      else if (d.success && d.data?.host === 'hostinger-api') setCrossCheckProvider('hostinger');
    } catch { /* ignore */ }
  };

  const load = async (pageToLoad: number) => {
    setLoading(true);
    try {
      const r = await apiFetch(`${API_ENDPOINTS.email.sent}?page=${pageToLoad}&limit=${PAGE_SIZE}`);
      const d = await r.json();
      if (d.success) {
        setLogs(prev => pageToLoad === 1 ? (d.data || []) : [...prev, ...(d.data || [])]);
        setTotal(d.total || 0);
        setPage(pageToLoad);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadHostinger = async (pageToLoad: number) => {
    setHostingerLoading(true);
    try {
      const token = hostingerPageTokens[pageToLoad] || '';
      const url = `${API_ENDPOINTS.email.sentHostinger}?page=${pageToLoad}&perPage=${PAGE_SIZE}${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`;
      const r = await apiFetch(url);
      const d = await r.json();
      if (d.success) {
        setHostingerMessages(prev => pageToLoad === 1 ? (d.data || []) : [...prev, ...(d.data || [])]);
        setHostingerTotal(d.total || 0);
        setHostingerPage(pageToLoad);
        if (d.nextPageToken) {
          setHostingerPageTokens(pt => ({ ...pt, [pageToLoad + 1]: d.nextPageToken }));
          setHostingerHasMore(true);
        } else {
          setHostingerHasMore(false);
        }
      }
    } catch { /* ignore */ }
    setHostingerLoading(false);
  };

  const toggleHostinger = () => {
    const next = !showHostinger;
    setShowHostinger(next);
    if (next && hostingerMessages.length === 0) loadHostinger(1);
  };

  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const fmtShort = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

  const openLog = (log: SentEmailLog) => {
    setViewer({
      key: `log-${log.id}`,
      subject: log.subject || '(no subject)',
      metaLabel: 'To',
      metaValue: log.to,
      date: fmt(log.sentAt),
    });
    setViewerBody({ plain: '', html: log.body || '' });
    setViewerLoading(false);
    setViewerError(null);
  };

  const openHostingerMessage = async (m: HostingerSentMessage) => {
    setViewer({
      key: `host-${m.uid}`,
      subject: m.subject || '(no subject)',
      metaLabel: 'From',
      metaValue: m.from,
      date: fmt(m.date),
    });
    setViewerBody(null);
    setViewerError(null);
    setViewerLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.sentHostingerMessage(m.uid));
      const d = await r.json();
      if (d.success && d.data) setViewerBody(d.data);
      else setViewerError(d.error || 'Failed to load email content');
    } catch {
      setViewerError('Network error loading email content');
    }
    setViewerLoading(false);
  };

  const closeViewer = () => { setViewer(null); setViewerBody(null); setViewerError(null); };

  if (!isPaid) return <div className="text-center py-16"><Send size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-gray-150 p-4 gap-3 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Send size={16} className="text-blue-500" />
          Sent Emails ({total})
        </h3>
        <button
          onClick={() => { load(1); if (showHostinger) loadHostinger(1); }}
          disabled={loading}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
          title="Refresh Sent Emails"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main split-pane content */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left Side: Message List */}
        <div className={`w-full ${viewer ? 'hidden md:block md:w-[350px] lg:w-[400px]' : ''} border-r border-gray-150 overflow-y-auto flex-shrink-0`}>
          {loading && !logs.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-xs">Fetching sent emails...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2 text-center px-4">
              <Send size={32} className="text-gray-300" />
              <span className="text-xs font-semibold text-gray-600">No emails sent yet</span>
              <span className="text-[11px] text-gray-400">Sends from the Send tab will show up here.</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map(log => (
                <div
                  key={log.id}
                  onClick={() => openLog(log)}
                  className={`p-4 cursor-pointer transition-colors text-left ${
                    viewer?.key === `log-${log.id}`
                      ? 'bg-blue-50/70 border-l-4 border-blue-500'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-xs truncate text-gray-600 font-medium">To: {log.to}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{fmtShort(log.sentAt)}</span>
                  </div>
                  <h4 className="text-xs truncate mb-1.5 font-semibold text-gray-900">
                    {log.subject || '(no subject)'}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${PROVIDER_STYLES[log.provider] || PROVIDER_STYLES.smtp}`}>
                      {PROVIDER_LABELS[log.provider] || 'SMTP'}
                    </span>
                    {log.source === 'leads_autopilot' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border bg-amber-50 text-amber-700 border-amber-200">
                        Autopilot
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {logs.length < total && (
                <button onClick={() => load(page + 1)} disabled={loading}
                  className="w-full py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  {loading ? 'Loading…' : `Load more (${logs.length} of ${total})`}
                </button>
              )}
            </div>
          )}

          {crossCheckProvider && (
            <div className="border-t border-gray-150">
              <button onClick={toggleHostinger} className="w-full flex items-center justify-between gap-2 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Mailbox size={14} className="text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-gray-900 truncate">
                    From {crossCheckProvider === 'gmail' ? 'Gmail Sent Folder' : 'Hostinger Mailbox'}
                  </span>
                </div>
                <span className="text-xs text-blue-600 font-medium shrink-0">{showHostinger ? 'Hide' : 'Show'}</span>
              </button>

              {showHostinger && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {hostingerLoading && !hostingerMessages.length ? (
                    <div className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto text-blue-500" /></div>
                  ) : hostingerMessages.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">No messages found</p>
                  ) : (
                    <>
                      {hostingerMessages.map(m => (
                        <div
                          key={m.uid}
                          onClick={() => openHostingerMessage(m)}
                          className={`p-4 cursor-pointer transition-colors text-left ${
                            viewer?.key === `host-${m.uid}`
                              ? 'bg-blue-50/70 border-l-4 border-blue-500'
                              : 'hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-xs truncate text-gray-600 font-medium">From: {m.from}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{fmtShort(m.date)}</span>
                          </div>
                          <h4 className="text-xs truncate font-semibold text-gray-900">
                            {m.subject || '(no subject)'}
                          </h4>
                        </div>
                      ))}
                      {(hostingerTotal > 0 ? hostingerMessages.length < hostingerTotal : hostingerHasMore) && (
                        <button onClick={() => loadHostinger(hostingerPage + 1)} disabled={hostingerLoading}
                          className="w-full py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                          {hostingerLoading ? 'Loading…' : hostingerTotal > 0 ? `Load more (${hostingerMessages.length} of ${hostingerTotal})` : 'Load more'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Message Preview Pane */}
        <div className={`flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50/30 ${!viewer ? 'hidden md:flex' : ''}`}>
          {viewer ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Back button for mobile */}
              <div className="md:hidden border-b border-gray-150 p-3 bg-white flex items-center">
                <button
                  onClick={closeViewer}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to List</span>
                </button>
              </div>

              {/* Email details header */}
              <div className="bg-white border-b border-gray-150 p-5 shrink-0 text-left">
                <h2 className="text-sm font-bold text-gray-900 mb-3">{viewer.subject}</h2>
                <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-gray-400" />
                    <span className="font-semibold text-gray-700">{viewer.metaLabel}:</span>
                    <span className="truncate">{viewer.metaValue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-gray-400" />
                    <span className="font-semibold text-gray-700">Date:</span>
                    <span>{viewer.date}</span>
                  </div>
                </div>
              </div>

              {/* Email body renderer */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                {viewerLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="text-xs">Loading email content...</span>
                  </div>
                ) : viewerError ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-red-500 text-center">{viewerError}</div>
                ) : viewerBody?.html ? (
                  <iframe
                    title="Email Body"
                    srcDoc={viewerBody.html}
                    className="w-full flex-1 border border-gray-200 rounded-lg bg-white shadow-inner animate-in fade-in zoom-in-95 duration-200"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                  />
                ) : (
                  <div className="w-full flex-1 border border-gray-200 rounded-lg bg-white p-5 text-sm text-gray-700 whitespace-pre-wrap font-mono shadow-inner overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200">
                    {viewerBody?.plain || '(Empty message)'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Mail size={40} className="text-gray-300 animate-pulse" />
              <span className="text-xs font-medium">Select an email to preview its content</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
