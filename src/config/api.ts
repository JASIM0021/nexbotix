// API Base URL Configuration
// - Development: Uses VITE_BACKEND_URL or localhost
// - Production: Regular API calls use relative URLs (proxied through Vercel rewrite)
//               SSE endpoints connect directly to backend (Vercel proxy doesn't support streaming)
const isDevelopment = import.meta.env.DEV;


// Trim any trailing slash from the backend URL to prevent double-slash paths
// (e.g. "https://api.example.com/" + "/api/send" → "https://api.example.com//api/send"
//  which triggers a Go 301 redirect that converts POST → GET → 405)
const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

export const API_BASE_URL = isDevelopment
  ? (rawBackendUrl || 'http://localhost:4000')
  : ''; // Production uses relative URLs -> Vercel proxy -> backend

// Direct backend URL for SSE endpoints (QR code stream, send progress)
// Vercel's rewrite proxy buffers responses and does NOT support Server-Sent Events.
// These endpoints MUST connect directly to the backend server.
export const SSE_BASE_URL = rawBackendUrl || API_BASE_URL;

// Full backend URL for the website chatbot embed script.
// The widget is loaded on external websites so it CANNOT use relative URLs.
// Falls back to the current origin in dev, but MUST be set via VITE_BACKEND_URL in production.
export const WIDGET_BASE_URL = rawBackendUrl || (isDevelopment ? 'http://localhost:4000' : (typeof window !== 'undefined' ? window.location.origin : ''));


export const API_ENDPOINTS = {
  whatsapp: {
    init: `${API_BASE_URL}/api/whatsapp/init`,
    pairPhone: `${API_BASE_URL}/api/whatsapp/pair-phone`,
    qr: `${SSE_BASE_URL}/api/whatsapp/qr`,           // SSE — direct to backend
    status: `${API_BASE_URL}/api/whatsapp/status`,
    disconnect: `${API_BASE_URL}/api/whatsapp/disconnect`,
    send: `${SSE_BASE_URL}/api/whatsapp/send`,         // SSE — direct to backend
    contacts: `${API_BASE_URL}/api/whatsapp/contacts`,
    sendBg: `${API_BASE_URL}/api/whatsapp/send-bg`,
    bgJobStatus: (id: string) => `${API_BASE_URL}/api/whatsapp/send-bg/${id}`,
    bgJobStop: (id: string) => `${API_BASE_URL}/api/whatsapp/send-bg/${id}`,
  },
  upload: {
    contacts: `${API_BASE_URL}/api/upload`,
    image: `${API_BASE_URL}/api/upload/image`,
  },
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    sendOtp: `${API_BASE_URL}/api/auth/send-otp`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
    login: `${API_BASE_URL}/api/auth/login`,
    me: `${API_BASE_URL}/api/auth/me`,
    sessions: `${API_BASE_URL}/api/auth/sessions`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    logoutAll: `${API_BASE_URL}/api/auth/logout-all`,
    googleLogin: `${API_BASE_URL}/api/auth/google`,
  },
  templates: {
    list: `${API_BASE_URL}/api/templates`,
    create: `${API_BASE_URL}/api/templates`,
    update: (id: number) => `${API_BASE_URL}/api/templates/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/templates/${id}`,
  },
  subscription: {
    status: `${API_BASE_URL}/api/subscription`,
    initiate: `${API_BASE_URL}/api/payment/initiate`,
    razorpayVerify: `${API_BASE_URL}/api/payment/razorpay/verify`,
    history: `${API_BASE_URL}/api/payment/history`,
    plans: `${API_BASE_URL}/api/subscription/plans`,
    validatePromo: `${API_BASE_URL}/api/payment/validate-promo`,
    currency: `${API_BASE_URL}/api/payment/currency`,
  },
  admin: {
    stats: `${API_BASE_URL}/api/admin/stats`,
    users: `${API_BASE_URL}/api/admin/users`,
    user: (id: string) => `${API_BASE_URL}/api/admin/users/${id}`,
    sendEmail: `${API_BASE_URL}/api/admin/email/promotional`,
    userActivity: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/activity`,
    updateUserPlan: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/plan`,
    updateUserServices: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/services`,
    invoices: `${API_BASE_URL}/api/admin/invoices`,
    invoice: (id: string) => `${API_BASE_URL}/api/admin/invoices/${id}`,
    approveInvoice: (id: string) => `${API_BASE_URL}/api/admin/invoices/${id}/approve`,
    plans: `${API_BASE_URL}/api/admin/plans`,
    plan: (name: string) => `${API_BASE_URL}/api/admin/plans/${name}`,
    promos: `${API_BASE_URL}/api/admin/promos`,
    promo: (id: string) => `${API_BASE_URL}/api/admin/promos/${id}`,
    serviceAvailability: `${API_BASE_URL}/api/admin/services/availability`,
    transactions: `${API_BASE_URL}/api/admin/transactions`,
    features: `${API_BASE_URL}/api/admin/features`,
    feature: (key: string) => `${API_BASE_URL}/api/admin/features/${key}`,
  },
  services: {
    availability: `${API_BASE_URL}/api/services/availability`,
    catalog: `${API_BASE_URL}/api/services/catalog`,
  },
  contacts: {
    list: `${API_BASE_URL}/api/contacts`,
    save: `${API_BASE_URL}/api/contacts`,
    delete: (id: string) => `${API_BASE_URL}/api/contacts/${id}`,
    deleteAll: `${API_BASE_URL}/api/contacts`,
  },
  schedule: {
    list: `${API_BASE_URL}/api/schedule`,
    create: `${API_BASE_URL}/api/schedule`,
    cancel: (id: string) => `${API_BASE_URL}/api/schedule/${id}`,
  },
  apiKeys: {
    list: `${API_BASE_URL}/api/apikeys`,
    create: `${API_BASE_URL}/api/apikeys`,
    revoke: (id: string) => `${API_BASE_URL}/api/apikeys/${id}`,
  },
  bot: {
    get: `${API_BASE_URL}/api/bot`,
    upsert: `${API_BASE_URL}/api/bot`,
    detectionLogs: `${API_BASE_URL}/api/bot/detection-logs`,
    detectionStats: `${API_BASE_URL}/api/bot/detection-stats`,
  },
  campaigns: {
    list: `${API_BASE_URL}/api/campaigns`,
    get: (id: string) => `${API_BASE_URL}/api/campaigns/${id}`,
    messages: (id: string) => `${API_BASE_URL}/api/campaigns/${id}/messages`,
    markReplyRead: (campaignId: string, msgId: string) =>
      `${API_BASE_URL}/api/campaigns/${campaignId}/messages/${msgId}/read-reply`,
    reply: (campaignId: string, msgId: string) =>
      `${API_BASE_URL}/api/campaigns/${campaignId}/messages/${msgId}/reply`,
  },
  security: {
    settings: `${API_BASE_URL}/api/settings/security`,
    heartbeat: `${API_BASE_URL}/api/activity/heartbeat`,
    userUsageStats: `${API_BASE_URL}/api/user/usage-stats`,
  },
  // ── Email (Omnichannel) ───────────────────────────────────────────────
  email: {
    smtp: `${API_BASE_URL}/api/email/smtp`,
    smtpTest: `${API_BASE_URL}/api/email/smtp/test`,
    send: `${SSE_BASE_URL}/api/email/send`,      // SSE — direct to backend
    inbox: `${API_BASE_URL}/api/email/inbox`,
    inboxMetadata: `${API_BASE_URL}/api/email/inbox/metadata`,
    updateInboxMetadata: (uid: string) => `${API_BASE_URL}/api/email/inbox/metadata/${uid}`,
    schedule: `${API_BASE_URL}/api/email/schedule`,
    cancelSchedule: (id: string) => `${API_BASE_URL}/api/email/schedule/${id}`,
    templates: `${API_BASE_URL}/api/email/templates`,
    deleteTemplate: (id: string) => `${API_BASE_URL}/api/email/templates/${id}`,
    bot: `${API_BASE_URL}/api/email/bot`,
    copyBot: `${API_BASE_URL}/api/email/bot/copy-from-whatsapp`,
    sent: `${API_BASE_URL}/api/email/sent`,
    sentHostinger: `${API_BASE_URL}/api/email/sent/hostinger`,
    sentHostingerMessage: (uid: string) => `${API_BASE_URL}/api/email/sent/hostinger/message/${uid}`,
    uploadDeck: `${API_BASE_URL}/api/email/deck`,
    summarizer: `${API_BASE_URL}/api/email/summarizer`,
    summarizerRunNow: `${API_BASE_URL}/api/email/summarizer/run-now`,
    inboxSummary: `${API_BASE_URL}/api/email/inbox/summary`,
    gmailOAuthUrl: `${API_BASE_URL}/api/email/gmail/oauth-url`,
    gmailExchangeCode: `${API_BASE_URL}/api/email/gmail/exchange-code`,
    gmailStatus: `${API_BASE_URL}/api/email/gmail/status`,
    gmailDisconnect: `${API_BASE_URL}/api/email/gmail/disconnect`,
  },
  // ── Facebook (Omnichannel) ────────────────────────────────────────────
  facebook: {
    oauthUrl:       `${API_BASE_URL}/api/facebook/oauth-url`,
    exchangeToken:  `${API_BASE_URL}/api/facebook/exchange-token`,
    status:         `${API_BASE_URL}/api/facebook/status`,
    disconnect:     `${API_BASE_URL}/api/facebook/disconnect`,
    pages:          `${API_BASE_URL}/api/facebook/pages`,
    selectPage:     `${API_BASE_URL}/api/facebook/pages/select`,
    posts:          `${API_BASE_URL}/api/facebook/posts`,
    post:           (id: string) => `${API_BASE_URL}/api/facebook/posts/${id}`,
    postInsights:   (id: string) => `${API_BASE_URL}/api/facebook/posts/${id}/insights`,
    schedule:       `${API_BASE_URL}/api/facebook/schedule`,
    cancelSchedule: (id: string) => `${API_BASE_URL}/api/facebook/schedule/${id}`,
    ogPreview:      `${API_BASE_URL}/api/facebook/og-preview`,
  },
  // ── LinkedIn (OAuth2 API) ─────────────────────────────────────────────
  linkedin: {
    credentials:    `${API_BASE_URL}/api/linkedin/credentials`,
    authUrl:        `${API_BASE_URL}/api/linkedin/auth-url`,
    disconnect:     `${API_BASE_URL}/api/linkedin/disconnect`,
    status:         `${API_BASE_URL}/api/linkedin/status`,
    posts:          `${API_BASE_URL}/api/linkedin/posts`,
    post:           (id: string) => `${API_BASE_URL}/api/linkedin/posts/${id}`,
    schedule:       `${API_BASE_URL}/api/linkedin/schedule`,
    cancelSchedule: (id: string) => `${API_BASE_URL}/api/linkedin/schedule/${id}`,
    bot:            `${API_BASE_URL}/api/linkedin/bot`,
    botRun:         `${API_BASE_URL}/api/linkedin/bot/run`,
    botSuggest:     `${API_BASE_URL}/api/linkedin/bot/suggest`,
    approveAction:  `${API_BASE_URL}/api/linkedin/approve-action`,
  },
  // ── SEO Extension ─────────────────────────────────────────────────────────
  seo: {
    config:     `${API_BASE_URL}/api/seo/config`,
    dashboard:  `${API_BASE_URL}/api/seo/dashboard`,
    pages:      `${API_BASE_URL}/api/seo/pages`,
    pageDetail: (url: string) => `${API_BASE_URL}/api/seo/pages/detail?url=${encodeURIComponent(url)}`,
    vitals:     `${API_BASE_URL}/api/seo/vitals`,
    issues:     `${API_BASE_URL}/api/seo/issues`,
    verify:     `${API_BASE_URL}/api/seo/verify`,
    autofix:    `${API_BASE_URL}/api/seo/autofix`,
    bot:        `${API_BASE_URL}/api/seo/bot`,
    botRun:     `${API_BASE_URL}/api/seo/bot/run`,
    trends:     (geo: string) => `${API_BASE_URL}/api/seo/trends?geo=${encodeURIComponent(geo)}`,
    gtm:        `${API_BASE_URL}/api/seo/gtm`,
    gtmVerify:  `${API_BASE_URL}/api/seo/gtm/verify`,
    resetData:  `${API_BASE_URL}/api/seo/data`,
    scan:       `${API_BASE_URL}/api/seo/scan`,
    scanStream: `${SSE_BASE_URL}/api/seo/scan/stream`,
  },
  // ── SEO Blog (GitHub App) ─────────────────────────────────────────────────────
  seoBlog: {
    installUrl:  `${API_BASE_URL}/api/seo/blog/install-url`,
    callback:    `${API_BASE_URL}/api/seo/blog/callback`,
    repos:       `${API_BASE_URL}/api/seo/blog/repos`,
    config:      `${API_BASE_URL}/api/seo/blog/config`,
    test:        `${API_BASE_URL}/api/seo/blog/test`,
    run:         `${API_BASE_URL}/api/seo/blog/run`,
    posts:       `${API_BASE_URL}/api/seo/blog/posts`,
    detect:      `${API_BASE_URL}/api/seo/blog/detect`,
    preview:     (id: string) => `${API_BASE_URL}/api/seo/blog/posts/${id}/preview`,
  },
  // ── Website Chatbot ───────────────────────────────────────────────────
  websiteChatbot: {
    config: `${API_BASE_URL}/api/website-chatbot/config`,
    crawl: `${API_BASE_URL}/api/website-chatbot/crawl`,
    script: `${API_BASE_URL}/api/website-chatbot/script`,
    chat: `${API_BASE_URL}/api/website-chatbot/chat`,
    leads: `${API_BASE_URL}/api/website-chatbot/leads`,
    submitLead: `${API_BASE_URL}/api/website-chatbot/leads/submit`,
  },
  // ── Leads Manager ──────────────────────────────────────────────────────────
	leads: {
		list:   `${API_BASE_URL}/api/leads`,
		delete: `${API_BASE_URL}/api/leads`,
		export: `${API_BASE_URL}/api/leads/export`,
		stats:  `${API_BASE_URL}/api/leads/stats`,
		share:  `${API_BASE_URL}/api/leads/share`,
		autopilot: `${API_BASE_URL}/api/leads/autopilot`,
		saveAutopilot: `${API_BASE_URL}/api/leads/autopilot/save`,
		sendDraft: `${API_BASE_URL}/api/leads/send-draft`,
	},
  health: `${API_BASE_URL}/api/health`,
  // ── Chatbot Demo (public marketing tool) ─────────────────────────────────
  chatbotDemo: {
    check: `${API_BASE_URL}/api/chatbot-demo/check`, // requires JWT
    get: (id: string) => `${API_BASE_URL}/api/public/chatbot-demo/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/public/chatbot-demo/${id}`,
    chat: (id: string) => `${API_BASE_URL}/api/public/chatbot-demo/${id}/chat`,
    lead: (id: string) => `${API_BASE_URL}/api/public/chatbot-demo/${id}/lead`,
  },
  adminChatbotDemo: {
    list: `${API_BASE_URL}/api/admin/chatbot-demos`,
    create: `${API_BASE_URL}/api/admin/chatbot-demos`,
    delete: (id: string) => `${API_BASE_URL}/api/admin/chatbot-demos/${id}`,
  },
  dataDeletion: {
    submit: `${API_BASE_URL}/api/data-deletion`,
  },
  adminDeletion: {
    list: `${API_BASE_URL}/api/admin/deletion-requests`,
    approve: (id: string) => `${API_BASE_URL}/api/admin/deletion-requests/${id}/approve`,
    reject: (id: string) => `${API_BASE_URL}/api/admin/deletion-requests/${id}/reject`,
  },
  // ── Influencer / Affiliate portal ─────────────────────────────────────────
  influencer: {
    me:        `${API_BASE_URL}/api/influencer/me`,
    dashboard: `${API_BASE_URL}/api/influencer/dashboard`,
  },
  adminInfluencer: {
    list:   `${API_BASE_URL}/api/admin/influencers`,
    create: `${API_BASE_URL}/api/admin/influencers`,
    update: (id: string) => `${API_BASE_URL}/api/admin/influencers/${id}`,
    payout: (id: string) => `${API_BASE_URL}/api/admin/influencers/${id}/payout`,
  },
  oauth: {
    approve: `${API_BASE_URL}/api/oauth/approve`,
  },
};

/**
 * Fetch wrapper that automatically attaches the Authorization header
 * from localStorage. Does not force Content-Type on FormData requests.
 */
export const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set JSON content-type when body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
};
