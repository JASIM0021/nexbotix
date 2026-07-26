import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Sparkles, Heart, Quote, ArrowLeft, Mail, CheckCircle2,
  ChevronRight, User, Compass, Play, TrendingUp, Trash2, AlertTriangle
} from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';
import {
  LifeCompanionSession, LifeCompanionChatMessage, UserProfile
} from '../../types/life_companion';
import { MusicRecommendationWidget } from '../../components/life_companion/MusicRecommendationWidget';
import { AssignmentVerificationCard } from '../../components/life_companion/AssignmentVerificationCard';

export function LifeCompanionPage() {
  const navigate = useNavigate();

  // Core Session State
  const [session, setSession] = useState<LifeCompanionSession | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [messages, setMessages] = useState<LifeCompanionChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifyingScreenshot, setIsVerifyingScreenshot] = useState<boolean>(false);

  // Reset State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState<UserProfile>({
    name: '',
    age: 21,
    gender: 'boy',
  });

  const handleResetAllChats = async () => {
    setIsResetting(true);
    try {
      await apiFetch(API_ENDPOINTS.lifeCompanion.reset, { method: 'DELETE' });
      setMessages([]);
      setSession(null);
      setQuote('');
      setShowResetModal(false);
      // Re-initialize session from scratch
      loadSession();
    } catch (err) {
      console.error('Failed to reset companion session:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Full-Screen Typewriter Motivational Intro States
  const [showIntroOverlay, setShowIntroOverlay] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [introPhase, setIntroPhase] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Initial Load: Fetch or Initialize Session
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async (userProfile?: UserProfile) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.lifeCompanion.session, {
        method: 'POST',
        body: JSON.stringify(userProfile || profileForm),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data.session);
        setQuote(data.data.quote);
        if (!data.data.session.profile?.name) {
          setShowProfileModal(true);
        }
      }

      // Load Chat History
      const histRes = await apiFetch(API_ENDPOINTS.lifeCompanion.history);
      const histData = await histRes.json();
      if (histData.success && histData.messages) {
        setMessages(histData.messages);
      }
    } catch (err) {
      console.error('Failed to initialize Life Companion session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Full-Screen Typewriter Animation Logic ───────────────────────────────
  useEffect(() => {
    if (isLoading || !showIntroOverlay) return;

    const phrases = [
      'Hi! You know what? You can do this!',
      'You have so much potential inside you! ✨',
      quote || '"The secret of getting ahead is getting started." — Mark Twain',
    ];

    const currentPhrase = phrases[introPhase];
    let charIdx = 0;
    setTypedText('');

    // Smooth, deliberate cinematic typing speed (65ms per character)
    const typingInterval = setInterval(() => {
      if (charIdx < currentPhrase.length) {
        setTypedText(currentPhrase.slice(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typingInterval);
        // Phrase finished typing!
        if (introPhase < phrases.length - 1) {
          setTimeout(() => {
            setIntroPhase((prev) => prev + 1);
          }, 2000);
        } else {
          // Final quote finished! Smoothly hide overlay after 3s
          setTimeout(() => {
            closeIntroOverlay();
          }, 3000);
        }
      }
    }, 65);

    return () => clearInterval(typingInterval);
  }, [isLoading, introPhase, quote, showIntroOverlay]);

  const closeIntroOverlay = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowIntroOverlay(false);
      setIsFadingOut(false);
    }, 800);
  };

  const replayIntro = () => {
    setIntroPhase(0);
    setTypedText('');
    setIsFadingOut(false);
    setShowIntroOverlay(true);
  };

  // Handle Profile Submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    setShowProfileModal(false);
    loadSession(profileForm);
  };

  // Handle Send Text Message
  const handleSendMessage = async (customMessage?: string, replyToContext?: string) => {
    const textToSend = customMessage || inputText;
    if (!textToSend.trim() || isSending) return;

    setInputText('');
    setIsSending(true);

    // Optimistic User Message with reply preview context
    const tempUserMsg: LifeCompanionChatMessage = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      reply_to: replyToContext,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await apiFetch(API_ENDPOINTS.lifeCompanion.chat, {
        method: 'POST',
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const aiMsg: LifeCompanionChatMessage = data.data;
        setMessages((prev) => [...prev, aiMsg]);
        if (aiMsg.task || aiMsg.action_type) {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  next_action_state: aiMsg.action_type as any,
                  current_task: aiMsg.task || prev.current_task,
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Screenshot Upload Verification
  const handleUploadScreenshot = async (file: File) => {
    if (isVerifyingScreenshot) return;
    setIsVerifyingScreenshot(true);

    const formData = new FormData();
    formData.append('screenshot', file);

    try {
      const res = await apiFetch(API_ENDPOINTS.lifeCompanion.verifyScreenshot, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        const isPassed = data.data.passed;
        const bannerTitle = isPassed ? '🌟 **Assignment Verified!**' : '❌ **Assignment Needs Revision**';

        const feedbackMsg: LifeCompanionChatMessage = {
          id: `verify_${Date.now()}`,
          sender: 'ai',
          text: `${bannerTitle}\n\n${data.data.feedback}`,
          task: data.data.next_task,
          action_type: data.data.next_action as any,
          passed: isPassed,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, feedbackMsg]);

        // Re-fetch active session to sync sticky header progress metrics & active task
        try {
          const sessRes = await apiFetch(API_ENDPOINTS.lifeCompanion.session);
          const sessData = await sessRes.json();
          if (sessData.success && sessData.data?.session) {
            setSession(sessData.data.session);
          }
        } catch (sErr) {
          console.error('Failed to sync session after verification:', sErr);
        }
      }
    } catch (err) {
      console.error('Failed to verify screenshot:', err);
    } finally {
      setIsVerifyingScreenshot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-purple-300 animate-pulse">Initializing Your AI Life Companion...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white relative">
      {/* ── 🎆 CINEMATIC FULL-SCREEN TYPEWRITER OVERLAY ───────────── */}
      {showIntroOverlay && (
        <div
          className={`fixed inset-0 z-50 w-screen h-screen min-h-screen bg-slate-950 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-12 text-center transition-all duration-1000 ${
            isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          {/* Background Ambient Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700" />

          <div className="max-w-6xl w-full relative z-10 space-y-10 flex flex-col items-center justify-center my-auto">
            {/* Glowing Big Quote Icon */}
            <div className="p-5 sm:p-6 rounded-3xl bg-purple-950/80 border border-purple-500/50 text-purple-300 w-max shadow-2xl shadow-purple-500/40">
              <Quote className="w-16 h-16 sm:w-24 sm:h-24" />
            </div>

            {/* FULL SCREEN DYNAMIC FONT MOTIVATIONAL DISPLAY */}
            <div className="min-h-[220px] sm:min-h-[300px] max-w-5xl flex items-center justify-center px-4 sm:px-8 w-full text-center">
              <h2
                className={`${
                  typedText.length > 90
                    ? 'text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-relaxed'
                    : typedText.length > 55
                    ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-normal'
                    : typedText.length > 30
                    ? 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight'
                    : 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none'
                } tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-200 drop-shadow-2xl transition-all duration-300`}
              >
                {typedText}
                <span className="inline-block w-2.5 sm:w-4 h-8 sm:h-12 ml-2 bg-purple-400 animate-pulse rounded-full align-middle" />
              </h2>
            </div>

            {/* Phase indicator & Skip */}
            <div className="flex flex-col items-center gap-6 pt-4">
              <div className="flex items-center gap-3">
                {[0, 1, 2].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-3 rounded-full transition-all duration-500 ${
                      introPhase === stepIdx
                        ? 'w-12 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/80'
                        : 'w-3 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={closeIntroOverlay}
                className="px-8 py-3.5 rounded-2xl bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 text-xs sm:text-base font-bold text-purple-200 hover:text-white transition-all shadow-2xl shadow-purple-500/30 flex items-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <span>Continue to Chat</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Navigation & Permanent AI Progress Tracker ─────────────── */}
      <header className="sticky top-0 z-30 border-b border-purple-900/30 bg-slate-950/90 backdrop-blur-xl shadow-xl">
        <div className="px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">AI Life Companion</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm">
                    PRO GROWTH
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/80">Life Understanding • Music Elevation • Earn Roadmaps</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetModal(true)}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Clear All Chats & Reset Progress"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All Chats</span>
            </button>

            {quote && (
              <button
                onClick={replayIntro}
                className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 transition-all text-xs font-semibold flex items-center gap-1.5"
                title="Replay Motivational Quote Intro"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replay Quote</span>
              </button>
            )}

            {session?.profile?.name && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-xs text-purple-200 transition-all"
              >
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold">{session.profile.name}</span>
                <span className="text-[10px] text-slate-400">({session.profile.gender})</span>
              </button>
            )}
          </div>
        </div>

        {/* Permanent Sticky AI Progress Tracker Dashboard Strip */}
        <div className="border-t border-purple-900/30 bg-slate-900/90 px-4 py-2.5 sm:px-6">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-purple-200 tracking-wide">
                {session?.milestone_name || `Milestone ${session?.current_milestone || 1}: Roadmap Execution`}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-purple-300 font-semibold truncate max-w-[180px] sm:max-w-xs">
                {session?.current_task?.title ? `Task: ${session.current_task.title}` : 'Active Growth Track'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {session?.completed_tasks_count || 0} / {session?.total_tasks_count || 5} Verified
              </span>
              <div className="flex items-center gap-2 w-28 sm:w-36">
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-md shadow-emerald-500/30"
                    style={{ width: `${Math.max(session?.progress_percent || 0, 5)}%` }}
                  />
                </div>
                <span className="text-xs font-black text-purple-200 shrink-0">
                  {session?.progress_percent || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Interactive Content Container ──────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col space-y-4">

        {/* Daily Motivational Quote Card Banner */}
        {quote && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/60 p-4 sm:p-5 border border-purple-500/25 shadow-lg">
            <div className="flex items-start gap-3">
              <Quote className="w-8 h-8 text-purple-400/60 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daily Motivation Before Guidance</span>
                </p>
                <p className="text-sm sm:text-base font-medium text-slate-100 italic leading-relaxed">{quote}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat History Window */}
        <div className="flex-1 min-h-[380px] bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4 my-auto">
              <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Heart className="w-10 h-10 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">How are you feeling today?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tell me what's on your mind — whether you feel sad, jobless, lost, or seeking a practical step-by-step roadmap to start earning online.
                </p>
              </div>

              {/* Quick Starter Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() =>
                    handleSendMessage('i am 21 year age i dont have job how can i earn monthly icome')
                  }
                  className="text-xs px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 transition-all text-left"
                >
                  "I am 21 years old, I don't have a job, how can I earn monthly income?"
                </button>
                <button
                  onClick={() => handleSendMessage('i know coding')}
                  className="text-xs px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 transition-all text-left"
                >
                  "I know coding & programming — what next?"
                </button>
                <button
                  onClick={() => handleSendMessage('i dont know any skill how can i start')}
                  className="text-xs px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 transition-all text-left"
                >
                  "I don't know any skills, how can I start?"
                </button>
                <button
                  onClick={() => handleSendMessage('what technology can I learn to earn monthly income?')}
                  className="text-xs px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 transition-all text-left"
                >
                  "What technology stacks can I monetize?"
                </button>
                <button
                  onClick={() => handleSendMessage('Can you recommend me peaceful music for sadness?')}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
                >
                  "Recommend uplifting music for my mood 🎵"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                      : msg.text.includes('❌')
                      ? 'bg-rose-950/80 text-rose-100 border-2 border-rose-500/80 rounded-bl-none shadow-rose-900/30'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  {/* Sender Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold mb-1 text-purple-300">
                    {msg.sender === 'user' ? (
                      <span>You</span>
                    ) : (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Growth Companion
                      </span>
                    )}
                  </div>

                  {/* Quote Reply Header (WhatsApp / Telegram style context preview) */}
                  {msg.reply_to && (
                    <div className="mb-2.5 p-2 rounded-xl bg-purple-950/80 border-l-4 border-purple-400 text-[11px] text-purple-200 shadow-inner">
                      <span className="block text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                        Replying to:
                      </span>
                      <span className="font-semibold truncate block">{msg.reply_to}</span>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Embedded Music Recommendations if present */}
                  {msg.music_recommendations && msg.music_recommendations.length > 0 && (
                    <MusicRecommendationWidget recommendations={msg.music_recommendations} />
                  )}

                  {/* Embedded Task Assignment if present */}
                  {msg.task && (
                    <AssignmentVerificationCard
                      task={msg.task}
                      isLatest={session?.current_task?.id === msg.task.id}
                      onCompleteVideo={() =>
                        handleSendMessage('Yes, I have completed the video', msg.task?.title || 'Video Assignment')
                      }
                      onUploadScreenshot={handleUploadScreenshot}
                      isSubmitting={isVerifyingScreenshot}
                    />
                  )}

                  {/* Interactive Quick Actionable Options (Only enabled on the LATEST message) */}
                  {idx === messages.length - 1 && msg.quick_options && msg.quick_options.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-2">
                      <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Your Action / Response:</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.quick_options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() =>
                              handleSendMessage(opt, msg.task?.title || msg.text.slice(0, 45))
                            }
                            disabled={isSending}
                            className="text-xs px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 hover:border-purple-400 text-purple-100 hover:text-white transition-all shadow-md font-medium text-left flex items-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
                          >
                            <span>{opt}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-purple-300 bg-slate-800/60 p-3 rounded-2xl w-max border border-slate-700/50">
              <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>AI is thinking & framing your guidance...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Dynamic Actionable Bottom Input Container ───────────────────────── */}
        <div className="sticky bottom-0 z-20 bg-slate-950/90 backdrop-blur-xl pt-2">
          {session?.next_action_state === 'awaiting_email' ? (
            /* Email Input Card */
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>Enter your email to receive daily learning task reminders & schedules:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Set Reminder</span>
                </button>
              </div>
            </div>
          ) : session?.next_action_state === 'awaiting_video_completion' ? (
            /* Video Completion Action Card */
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-emerald-200 font-medium">
                Finished watching your assigned {session?.current_task?.category || 'learning'} video on "{session?.current_task?.title || 'Tutorial'}"?
              </span>
              <button
                onClick={() => handleSendMessage('Yes, I completed the video')}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, I Completed It!</span>
              </button>
            </div>
          ) : (
            /* Standard Text Input Bar */
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message or query here..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 shadow-lg"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                disabled={!inputText.trim() || isSending}
                onClick={() => handleSendMessage()}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all transform active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── User Profile Quick Modal ──────────────────────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Welcome! Let's Personalize Your Guidance</h3>
                <p className="text-xs text-purple-300">Tell us a bit about yourself for tailored AI salutations</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Age</label>
                  <input
                    type="number"
                    min={12}
                    max={99}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) || 21 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender / Preference</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <option value="boy">Boy (salutation: "my boy")</option>
                    <option value="girl">Girl / Female (salutation: "my dear")</option>
                    <option value="other">Neutral (salutation: "my dear")</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <span>Start My Growth Journey</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Clear All Chats & Reset Confirmation Modal ──────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-950 border border-rose-500/30">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete All Chats & Reset?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-rose-950/30 p-3.5 rounded-xl border border-rose-900/40">
              Are you sure you want to permanently delete all past chat history, saved milestone progress, verified task submissions, and start completely fresh from scratch?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllChats}
                disabled={isResetting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'Deleting Everything...' : 'Yes, Delete Everything & Start Fresh'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
