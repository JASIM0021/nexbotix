import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInPendingPost } from '@/types/linkedin';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';

interface Props {
  isPaid: boolean;
  session: LinkedInSessionHook;
}

export function LinkedInPendingPage({ isPaid, session }: Props) {
  const [posts, setPosts] = useState<LinkedInPendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isPaid && session.isConnected) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, session.isConnected]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(API_ENDPOINTS.linkedin.botPending);
      const d = await r.json();
      if (d.success) {
        setPosts(d.data || []);
      }
    } catch {
      setError('Failed to load pending posts');
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'delete') => {
    setActioningId(id);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.botPending, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || `Failed to ${action} post`);
      } else {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch {
      setError(`Failed to ${action} post`);
    }
    setActioningId(null);
  };

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <Clock size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Upgrade to Pro to use LinkedIn AI automation.</p>
        <a href="/subscription" className="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">Upgrade</a>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="text-center py-16">
        <Clock size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Connect your LinkedIn account to view pending posts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Pending Approvals</h2>
          <p className="text-xs text-gray-400 mt-0.5">Direct approvals bypass the 10-minute email link expiration limit.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#0A66C2]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <Clock size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No posts pending approval.</p>
          <p className="text-gray-400 text-xs mt-1">Generated posts requiring manual review will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{post.text}</p>
              
              {post.imageUrl && (
                <div className="relative rounded-xl overflow-hidden max-w-md border border-gray-100 bg-gray-50">
                  <img
                    src={post.imageUrl}
                    alt="Pending post preview"
                    className="w-full h-auto object-cover max-h-64"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 flex-wrap">
                <button
                  onClick={() => handleAction(post.id, 'approve')}
                  disabled={actioningId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {actioningId === post.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Approve & Publish
                </button>

                <button
                  onClick={() => handleAction(post.id, 'delete')}
                  disabled={actioningId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {actioningId === post.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                  Delete
                </button>

                <span className="text-xs text-gray-400 ml-auto">
                  Generated: {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
