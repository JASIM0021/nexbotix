import { useState } from 'react';
import { Loader2, KeyRound, AlertCircle, CheckCircle2, LogOut, ExternalLink } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { RedditSessionStatus } from '@/types/reddit';

interface Props {
  status: RedditSessionStatus;
  onRefresh: () => void;
}

export function RedditConnectTab({ status, onRefresh }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.reddit.authUrl);
      const json = await res.json();
      if (json.success && json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || 'Failed to generate connection URL');
      }
    } catch {
      setError('Failed to contact server');
    }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Reddit account?')) return;
    setDisconnecting(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.reddit.disconnect, { method: 'POST' });
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="text-[#FF4500]" size={18} />
          Reddit Account Authorization
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Connect your Reddit account via secure OAuth 2.0. NexBotix requests permissions to retrieve your username and submit text posts on your behalf.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {status.isConnected ? (
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
            {status.profilePicture ? (
              <img
                src={status.profilePicture}
                alt="Reddit profile"
                className="w-12 h-12 rounded-full border border-orange-200 bg-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#FF4500] text-white flex items-center justify-center font-bold text-lg">
                {(status.redditUsername || 'R').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-gray-900 text-sm truncate">u/{status.redditUsername}</h4>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 size={8} /> Active
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Connected: {status.connectedAt ? new Date(status.connectedAt).toLocaleString() : 'Just now'}
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
          <div className="pt-2">
            <button
              onClick={handleConnect}
              disabled={connecting || !status.hasPlatformAuth}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF4500] text-white text-xs font-bold rounded-xl hover:bg-[#E03D00] transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <ExternalLink size={14} />
                  Connect Reddit Account
                </>
              )}
            </button>
            {!status.hasPlatformAuth && (
              <p className="text-[10px] text-red-500 mt-2">
                Server configuration missing: Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
