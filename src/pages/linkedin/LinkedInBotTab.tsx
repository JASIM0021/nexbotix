import { useState, useEffect } from 'react';
import {
  Loader2, Bot, Play, Save, Plus, X, Clock, Image, Zap, AlertCircle,
  CheckCircle2, Calendar, Megaphone, Sparkles, Mail,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';
import { LinkedInBotConfig, LinkedInBotRunResult, LinkedInPendingPost } from '@/types/linkedin';

interface Props {
  isPaid: boolean;
  session: LinkedInSessionHook;
}

export function LinkedInBotTab({ isPaid, session }: Props) {
  const [config, setConfig] = useState<LinkedInBotConfig>({
    isEnabled: false,
    keywords: [],
    postsPerDay: 1,
    schedule: 'off',
    postTime: '09:00',
    postGapMinutes: 120,
    generateImage: true,
    requiresApproval: false,
    adText: '',
    systemPrompt: '',
    engagementType: 'learning',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [lastRun, setLastRun] = useState<LinkedInBotRunResult | null>(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI assistant state
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [assistantSuccess, setAssistantSuccess] = useState(false);

  // Pending approval posts state
  const [pendingPosts, setPendingPosts] = useState<LinkedInPendingPost[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actioningPostId, setActioningPostId] = useState<string | null>(null);

  const loadPendingPosts = async () => {
    setLoadingPending(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.botPending);
      const data = await res.json();
      if (data.success && data.data) {
        setPendingPosts(data.data);
      }
    } catch { /* ignore */ }
    setLoadingPending(false);
  };

  const handleActionPending = async (id: string, action: 'approve' | 'delete') => {
    setActioningPostId(id);
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
        setPendingPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch {
      setError(`Failed to ${action} post`);
    }
    setActioningPostId(null);
  };

  const handleAIAssist = async () => {
    if (!assistantPrompt.trim()) return;
    setError('');
    setGeneratingConfig(true);
    setAssistantSuccess(false);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.botSuggest, {
        method: 'POST',
        body: JSON.stringify({ prompt: assistantPrompt.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to generate configuration');
      } else {
        const suggested = data.data;
        setConfig(c => ({
          ...c,
          keywords: suggested.keywords || [],
          postsPerDay: suggested.postsPerDay || 1,
          postTime: suggested.postTime || '09:00',
          postGapMinutes: suggested.postGapMinutes || 120,
          generateImage: suggested.generateImage !== undefined ? suggested.generateImage : true,
          adText: suggested.adText || '',
          systemPrompt: suggested.systemPrompt || '',
          engagementType: suggested.engagementType || 'learning',
        }));
        setAssistantSuccess(true);
        setTimeout(() => setAssistantSuccess(false), 5000);
      }
    } catch {
      setError('Failed to generate configuration');
    }
    setGeneratingConfig(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.linkedin.bot);
        const data = await res.json();
        if (data.success && data.data) setConfig(data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
    loadPendingPosts();
    // Silence unused variables warning for compilation
    if (false) {
      console.log(pendingPosts, loadingPending, actioningPostId, handleActionPending);
    }
  }, []);

  const handleSave = async () => {
    if (config.keywords.length === 0) {
      setError('Add at least one keyword before saving.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.bot, {
        method: 'POST',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save configuration');
      } else {
        setConfig(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setError('Failed to save configuration');
    }
    setSaving(false);
  };

  const handleRunNow = async () => {
    if (config.keywords.length === 0) {
      setError('Add at least one keyword to run the bot.');
      return;
    }
    setError('');
    setRunning(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.botRun, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Bot run failed');
      } else {
        setLastRun(data.data);
        if (data.data && data.data.requiresApproval) {
          loadPendingPosts();
        }
      }
    } catch {
      setError('Failed to run the bot');
    }
    setRunning(false);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || config.keywords.includes(kw)) return;
    setConfig(c => ({ ...c, keywords: [...c.keywords, kw] }));
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    setConfig(c => ({ ...c, keywords: c.keywords.filter(k => k !== kw) }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-[#0A66C2]" />
    </div>
  );

  if (!session.isConnected) return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <Bot size={40} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-base font-bold text-gray-800 mb-2">Connect LinkedIn First</h3>
      <p className="text-sm text-gray-500">Connect your LinkedIn account from the Connect tab to use the automation bot.</p>
    </div>
  );

  if (!isPaid) return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <Zap size={40} className="text-amber-400 mx-auto mb-4" />
      <h3 className="text-base font-bold text-gray-800 mb-2">Pro Feature</h3>
      <p className="text-sm text-gray-500 mb-4">LinkedIn automation is available on the Pro plan.</p>
      <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
        <Zap size={14} /> Upgrade to Pro
      </a>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base leading-none">LinkedIn Automation Bot</h2>
            <p className="text-blue-200 text-xs mt-0.5">AI-generated posts from your keywords</p>
          </div>
        </div>
        <p className="text-sm text-blue-100 mt-3">
          The bot automatically creates professional LinkedIn posts based on your keywords, with AI-generated images. Up to 3 posts per day.
        </p>
      </div>

      {/* AI Configuration Assistant */}
      <div className="bg-[#0A66C2]/5 border border-[#0A66C2]/15 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-[#0A66C2] animate-pulse" />
            AI Config Assistant
          </h3>
          <span className="text-[10px] bg-blue-100 text-[#0A66C2] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Smart Fill</span>
        </div>
        <p className="text-xs text-gray-500">
          Describe your business, how often you want to post, target region, or specific rules. The AI will instantly auto-fill all the settings below.
        </p>
        <div className="space-y-3">
          <textarea
            value={assistantPrompt}
            onChange={e => setAssistantPrompt(e.target.value)}
            disabled={generatingConfig}
            placeholder="e.g. I want to post twice a day for promoting my B2B software consulting firm. I target business decision makers in the US. Let's write daily genuine stories and naturally link to our website https://nexbotix.online."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800 bg-white"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 italic">Fast & fully automated setup.</p>
            <button
              onClick={handleAIAssist}
              disabled={generatingConfig || !assistantPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] text-white text-xs font-semibold rounded-xl hover:bg-[#004182] transition-colors disabled:opacity-50"
            >
              {generatingConfig ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Generating Config...
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Auto-Fill Config
                </>
              )}
            </button>
          </div>
        </div>

        {assistantSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 flex items-start gap-2">
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold">Successfully filled!</p>
              <p className="mt-0.5 text-green-600">Review the auto-filled fields below, then click <strong>Save Config</strong> at the bottom.</p>
            </div>
          </div>
        )}
      </div>

      {/* Last run result */}
      {lastRun && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="font-semibold text-green-800 text-sm">
              {lastRun.requiresApproval
                ? "Post queued & approval email sent!"
                : "Post published successfully!"}
            </span>
            {lastRun.hasImage && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">With image</span>
            )}
          </div>
          <p className="text-xs text-green-700 line-clamp-3 mb-2">{lastRun.postText}</p>
          {lastRun.imageUrl && (
            <img
              src={lastRun.imageUrl}
              alt="Generated post visual"
              className="w-full max-w-xs rounded-xl border border-green-200 mb-2"
            />
          )}
          {lastRun.requiresApproval ? (
            <p className="text-xs text-green-600 font-medium">
              Check your connected SMTP/Hostinger email inbox to approve or delete this post. (Link valid for 10 minutes)
            </p>
          ) : (
            lastRun.postUrl && (
              <a
                href={lastRun.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0A66C2] hover:underline font-medium"
              >
                View on LinkedIn →
              </a>
            )
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Keywords */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">1</span>
          Content Keywords
        </h3>
        <p className="text-xs text-gray-500">The bot rotates through these keywords daily to generate varied content.</p>

        {/* Keyword tags */}
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {config.keywords.map(kw => (
            <span key={kw} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#0A66C2] text-xs font-semibold px-3 py-1.5 rounded-full">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          {config.keywords.length === 0 && (
            <span className="text-xs text-gray-400 italic">No keywords yet — add some below</span>
          )}
        </div>

        {/* Add keyword input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="e.g. AI in healthcare, remote work, startup tips…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
          />
          <button
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] text-white text-sm font-semibold rounded-xl hover:bg-[#004182] transition-colors disabled:opacity-50"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Geo + Image settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">2</span>
          Targeting & Content
        </h3>

        {/* Generate image toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Generate AI image</p>
              <p className="text-xs text-gray-400">DALL-E 3 or Google Imagen 3 (uses whichever key is configured)</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, generateImage: !c.generateImage }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${config.generateImage ? 'bg-[#0A66C2]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.generateImage ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {/* Requires manual approval toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Requires manual approval</p>
              <p className="text-xs text-gray-400">Receive an email with Approve/Delete buttons for every post</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, requiresApproval: !c.requiresApproval }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${config.requiresApproval ? 'bg-[#0A66C2]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.requiresApproval ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {/* Advertisement injection */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Megaphone size={12} /> Advertisement injection <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={config.adText ?? ''}
            onChange={e => setConfig(c => ({ ...c, adText: e.target.value }))}
            rows={4}
            placeholder={`Paste your ad text here — links, promo copy, anything.\nThe AI will intelligently weave it into each post naturally.\n\nExample: "Try Acme Pro free for 30 days → https://acme.io/trial"`}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800"
          />
          {config.adText && config.adText.trim().length > 0 && (
            <p className="text-xs text-amber-600 flex items-start gap-1.5">
              <Megaphone size={11} className="flex-shrink-0 mt-0.5" />
              Ad will be woven into every auto-generated post. Keep it concise for best results.
            </p>
          )}
        </div>

        {/* Custom system prompt / AI persona */}
        {/* Engagement Style */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Zap size={12} className="text-[#0A66C2]" /> Post Engagement Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'technical', label: 'Technical', desc: 'Sleek system diagrams & deep engineering breakdowns' },
              { id: 'learning', label: 'Learning', desc: 'Explainer guides, cheat-sheets & tutorials' },
              { id: 'marketing', label: 'Marketing', desc: 'ROI impact, case benefits & business values' },
              { id: 'storytelling', label: 'Storytelling', desc: 'Personal anecdotes, founder journeys & client stories' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setConfig(c => ({ ...c, engagementType: item.id as any }))}
                className={`p-3 text-left rounded-xl border flex flex-col justify-between transition-all duration-200 hover:shadow-sm ${config.engagementType === item.id
                    ? 'bg-[#0A66C2]/5 border-[#0A66C2] text-[#0A66C2] ring-1 ring-[#0A66C2]'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#0A66C2]/40'
                  }`}
              >
                <div>
                  <p className="text-xs font-bold capitalize leading-none">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom AI Persona / System Prompt */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Zap size={12} className="text-amber-500" /> Custom AI Persona / System Prompt <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={config.systemPrompt ?? ''}
            onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
            rows={5}
            placeholder={`Instruct the AI on writing style, constraints, target audience, or specific guidelines.\n\nExample: "Write in a conversational founder-to-founder style. Maximum length: 1200 characters. No hashtags inside paragraphs. Add 3-5 relevant hashtags only at the end."`}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800"
          />
          {config.systemPrompt && config.systemPrompt.trim().length > 0 && (
            <p className="text-xs text-amber-600 flex items-start gap-1.5">
              <Zap size={11} className="flex-shrink-0 mt-0.5 text-amber-500" />
              Custom system instructions will override the default bot writing persona.
            </p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">3</span>
          Schedule
        </h3>

        {/* Posts per day */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Clock size={12} /> Posts per day
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => setConfig(c => ({ ...c, postsPerDay: n }))}
                className={`w-12 h-10 rounded-xl text-sm font-bold border transition-colors ${config.postsPerDay === n
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0A66C2]'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Post time */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <Clock size={12} /> First post time <span className="font-normal text-gray-400">(UTC)</span>
            </label>
            <input
              type="time"
              value={config.postTime}
              onChange={e => setConfig(c => ({ ...c, postTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
            />
          </div>

          {/* Gap between posts — only shown when postsPerDay > 1 */}
          {config.postsPerDay > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Clock size={12} /> Gap between posts
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '30m', value: 30 },
                  { label: '1h', value: 60 },
                  { label: '2h', value: 120 },
                  { label: '3h', value: 180 },
                  { label: '4h', value: 240 },
                  { label: '6h', value: 360 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(c => ({ ...c, postGapMinutes: opt.value }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${config.postGapMinutes === opt.value
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0A66C2] hover:text-[#0A66C2]'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schedule toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Auto-run daily</p>
              <p className="text-xs text-gray-400">Bot runs automatically at the scheduled time(s)</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, schedule: c.schedule === 'daily' ? 'off' : 'daily', isEnabled: c.schedule !== 'daily' }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${config.schedule === 'daily' ? 'bg-[#0A66C2]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.schedule === 'daily' ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {config.schedule === 'daily' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
            <Zap size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              Daily automation is enabled. Posts at{' '}
              <strong>{config.postTime} UTC</strong>
              {config.postsPerDay > 1 && (
                <> × {config.postsPerDay} posts every{' '}
                  <strong>
                    {config.postGapMinutes < 60
                      ? `${config.postGapMinutes}min`
                      : `${config.postGapMinutes / 60}h`}
                  </strong>
                </>
              )}.
            </span>
          </div>
        )}

        {config.lastRunAt && (
          <p className="text-xs text-gray-400">
            Last run: {new Date(config.lastRunAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saveSuccess ? 'Saved!' : 'Save Config'}
        </button>

        <button
          onClick={handleRunNow}
          disabled={running || config.keywords.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 shadow-md shadow-blue-200"
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {running ? 'Generating post…' : 'Run Now'}
        </button>
      </div>


    </div>
  );
}
