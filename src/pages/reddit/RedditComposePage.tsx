import { useState } from 'react';
import { Loader2, Send, Calendar, AlertCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { RedditSessionStatus } from '@/types/reddit';

interface Props {
  isPaid: boolean;
  status: RedditSessionStatus;
  onSwitchTab: (tab: 'connect' | 'compose' | 'schedule' | 'feed') => void;
}

export function RedditComposePage({ isPaid, status, onSwitchTab }: Props) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [subreddit, setSubreddit] = useState(status.redditUsername ? `u/${status.redditUsername}` : '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [wantSchedule, setWantSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || !subreddit.trim()) {
      setError('Title, content body, and target subreddit are required.');
      return;
    }
    if (wantSchedule && !scheduledAt) {
      setError('Please specify a scheduled time.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: title.trim(),
        text: text.trim(),
        subreddit: subreddit.trim(),
        scheduledAt: wantSchedule ? new Date(scheduledAt).toISOString() : undefined,
      };

      const endpoint = wantSchedule ? API_ENDPOINTS.reddit.schedule : API_ENDPOINTS.reddit.posts;
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to submit post.');
      } else {
        setSuccess(wantSchedule ? 'Post scheduled successfully!' : 'Post published successfully!');
        setTitle('');
        setText('');
        setTimeout(() => {
          onSwitchTab(wantSchedule ? 'schedule' : 'feed');
        }, 1500);
      }
    } catch {
      setError('Failed to contact server.');
    }
    setLoading(false);
  };

  if (!isPaid) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-md mx-auto mt-8">
        <AlertCircle size={40} className="text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-2">Upgrade Required</h3>
        <p className="text-xs text-gray-500 mb-4">Reddit posting and AI scheduling are premium features. Upgrade your subscription to start posting.</p>
        <a href="/subscription" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">Upgrade Plan</a>
      </div>
    );
  }

  if (!status.isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-md mx-auto mt-8">
        <AlertCircle size={40} className="text-orange-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-2">Reddit Disconnected</h3>
        <p className="text-xs text-gray-500 mb-4">Please connect your Reddit account in the Connect tab before composing a post.</p>
        <button onClick={() => onSwitchTab('connect')} className="px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold rounded-xl transition-colors">Connect Account</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Send className="text-[#FF4500]" size={18} />
          Compose Reddit Post
        </h3>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-600">Subreddit / Target Profile</label>
          <input
            type="text"
            required
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="e.g. u/myusername or r/test"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-white text-gray-800"
          />
          <p className="text-[10px] text-gray-400">Prefix with <code>u/</code> to publish directly to your personal profile feed (e.g. <code>u/{status.redditUsername}</code>), or write a public subreddit like <code>r/gaming</code>.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-600">Post Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title for your Reddit post"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-white text-gray-800 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-600">Body Content (Markdown Supported)</label>
          <textarea
            required
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your text body content here... Markdown lists, bold text, and links are supported."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-white text-gray-800 resize-none leading-relaxed"
          />
        </div>

        {/* Schedule */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={wantSchedule}
              onChange={(e) => setWantSchedule(e.target.checked)}
              className="rounded text-[#FF4500] focus:ring-[#FF4500]"
            />
            Schedule this post for later
          </label>

          {wantSchedule && (
            <div className="flex items-center gap-2 max-w-xs">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="datetime-local"
                required={wantSchedule}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent bg-white text-gray-800"
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF4500] text-white text-xs font-bold rounded-xl hover:bg-[#E03D00] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : wantSchedule ? (
              <>
                <Calendar size={14} />
                Schedule Post
              </>
            ) : (
              <>
                <Send size={14} />
                Publish to Reddit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
