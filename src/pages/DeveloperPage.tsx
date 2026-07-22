import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { ProfileModal } from '@/components/ProfileModal';
import {
  Key, MessageSquare, Mail, Cpu, Code2, Copy, Check,
  LayoutDashboard, ChevronLeft, Plus, Trash2, LogOut,
  User, Shield, Globe, X, Terminal, Zap,
} from 'lucide-react';

type Tab = 'overview' | 'keys' | 'whatsapp' | 'email' | 'mcp';

interface APIKeyInfo {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsed: string | null;
}

interface ConnectedAgentInfo {
  id: string;
  client_id: string;
  name: string;
  scope: string;
  created_at: string;
  expires_at: string;
}

export function DeveloperPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [apiKeys, setApiKeys] = useState<APIKeyInfo[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgentInfo[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [revokingAgent, setRevokingAgent] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [emailCodeTab, setEmailCodeTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [mcpClient, setMcpClient] = useState<'opencode' | 'claudecode' | 'claude' | 'cursor' | 'generic'>('opencode');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadKeys();
    loadConnectedAgents();
  }, []);

  function loadKeys() {
    setKeysLoading(true);
    apiFetch(API_ENDPOINTS.apiKeys.list)
      .then(r => r.json())
      .then(d => { if (d.success) setApiKeys(d.data ?? []); })
      .finally(() => setKeysLoading(false));
  }

  function loadConnectedAgents() {
    setAgentsLoading(true);
    apiFetch('/api/oauth/connected-agents')
      .then(r => r.json())
      .then(d => { if (d.success) setConnectedAgents(d.data ?? []); })
      .finally(() => setAgentsLoading(false));
  }

  async function revokeAgent(clientId: string) {
    if (!confirm('Are you sure you want to disconnect this AI agent? It will lose access to your WhatsApp actions immediately.')) return;
    setRevokingAgent(clientId);
    try {
      const res = await apiFetch(`/api/oauth/connected-agents/revoke?client_id=${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
      });
      const d = await res.json();
      if (d.success) {
        setConnectedAgents(prev => prev.filter(a => a.client_id !== clientId));
      }
    } finally {
      setRevokingAgent(null);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setNewKeyFull(d.data.key);
        setNewKeyName('');
        loadKeys();
      }
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    await apiFetch(API_ENDPOINTS.apiKeys.revoke(id), { method: 'DELETE' });
    setApiKeys(prev => prev.filter(k => k.id !== id));
    setRevoking(null);
    setConfirmRevoke(null);
  }

  function copySnippet(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  }

  function CodeBlock({ id, code, language = 'bash' }: { id: string; code: string; language?: string }) {
    return (
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
          <span className="text-xs text-gray-400 font-mono">{language}</span>
          <button
            onClick={() => copySnippet(id, code)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copiedSnippet === id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copiedSnippet === id ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  function MethodBadge({ method }: { method: 'GET' | 'POST' | 'DELETE' }) {
    const cls = method === 'GET'
      ? 'bg-green-100 text-green-700'
      : method === 'POST'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-red-100 text-red-700';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${cls}`}>
        {method}
      </span>
    );
  }

  function EndpointHeader({ method, path, description }: { method: 'GET' | 'POST' | 'DELETE'; path: string; description: string }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MethodBadge method={method} />
          <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg">{path}</code>
        </div>
        <span className="text-sm text-gray-500 sm:ml-2">{description}</span>
      </div>
    );
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'keys', label: 'API Keys', icon: <Key size={16} /> },
    { id: 'whatsapp', label: 'WhatsApp API', icon: <MessageSquare size={16} /> },
    { id: 'email', label: 'Email API', icon: <Mail size={16} /> },
    { id: 'mcp', label: 'MCP Integration', icon: <Cpu size={16} /> },
  ];

  // ── code snippets ───────────────────────────────────────────────────────────
  const waSendCurl = `curl -X POST https://nexbotix.online/api/v1/send \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "919876543210",
    "message": { "text": "Hello! This is a test message." }
  }'`;

  const waSendJs = `const res = await fetch('https://nexbotix.online/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'bsk_your_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '919876543210',
    message: { text: 'Hello! This is a test message.' }
  })
});
const data = await res.json();
console.log(data);`;

  const waSendPython = `import requests

response = requests.post(
    'https://nexbotix.online/api/v1/send',
    headers={
        'X-API-Key': 'bsk_your_key',
        'Content-Type': 'application/json'
    },
    json={
        'phone': '919876543210',
        'message': {'text': 'Hello! This is a test message.'}
    }
)
print(response.json())`;

  const waBulkCurl = `curl -X POST https://nexbotix.online/api/v1/send \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contacts": [
      { "phone": "919876543210", "name": "Raj" },
      { "phone": "918765432109", "name": "Priya" }
    ],
    "message": { "text": "Hi {{name}}, check out our latest offer!" }
  }'`;

  const emailSendCurl = `curl -X POST https://nexbotix.online/api/v1/email/send \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "message": {
      "subject": "Your order is confirmed",
      "bodyHtml": "<h1>Hi!</h1><p>Your order has been placed.</p>",
      "bodyText": "Your order has been placed."
    }
  }'`;

  const emailSendJs = `const res = await fetch('https://nexbotix.online/api/v1/email/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'bsk_your_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    message: {
      subject: 'Your order is confirmed',
      bodyHtml: '<h1>Hi!</h1><p>Your order has been placed.</p>'
    }
  })
});
const data = await res.json();
console.log(data);`;

  const emailSendPython = `import requests

response = requests.post(
    'https://nexbotix.online/api/v1/email/send',
    headers={
        'X-API-Key': 'bsk_your_key',
        'Content-Type': 'application/json'
    },
    json={
        'email': 'user@example.com',
        'message': {
            'subject': 'Your order is confirmed',
            'bodyHtml': '<h1>Hi!</h1><p>Your order has been placed.</p>'
        }
    }
)
print(response.json())`;

  const mcpOpenCodeCmd = `# Step 1: Add NexBotix MCP Server
opencode mcp add nexbotix --url https://nexbotix.online/api/mcp

# Step 2: Authenticate (opens browser for 1-Click OAuth Login)
opencode mcp auth nexbotix`;

  const mcpClaudeCodeCmd = `claude mcp add --transport http whatsapp https://nexbotix.online/api/mcp \\
  -H "X-API-Key: your_bsk_key" \\
  -s user`;

  const mcpClaudeConfig = `{
  "mcpServers": {
    "whatsapp": {
      "url": "https://nexbotix.online/api/mcp",
      "headers": {
        "X-API-Key": "bsk_your_key"
      }
    }
  }
}`;

  const mcpCursorConfig = `{
  "mcpServers": {
    "whatsapp": {
      "url": "https://nexbotix.online/api/mcp",
      "headers": {
        "X-API-Key": "bsk_your_key"
      }
    }
  }
}`;

  const mcpInitCurl = `# Step 1 — Initialize
curl -X POST https://nexbotix.online/api/mcp \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}'

# Step 2 — List tools
curl -X POST https://nexbotix.online/api/mcp \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Step 3 — Send a WhatsApp message
curl -X POST https://nexbotix.online/api/mcp \\
  -H "X-API-Key: bsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"whatsapp_send_message","arguments":{"phone":"919876543210","message":"Hello from MCP!"}}}'`;

  // ── section renderers ───────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div>
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 mb-3">
            <Code2 size={14} className="text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">API + MCP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Developer Hub</h1>
          <p className="text-gray-500">Integrate NexBotix into your apps with our REST API, or connect AI agents via our WhatsApp MCP server.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { tab: 'whatsapp' as Tab, icon: <MessageSquare size={20} className="text-green-600" />, bg: 'bg-green-50 border-green-200 hover:border-green-400', title: 'WhatsApp API', desc: 'Send messages, bulk broadcast, and schedule via REST' },
            { tab: 'email' as Tab, icon: <Mail size={20} className="text-blue-600" />, bg: 'bg-blue-50 border-blue-200 hover:border-blue-400', title: 'Email API', desc: 'Trigger transactional or bulk email programmatically' },
            { tab: 'mcp' as Tab, icon: <Cpu size={20} className="text-violet-600" />, bg: 'bg-violet-50 border-violet-200 hover:border-violet-400', title: 'MCP Server', desc: 'Connect Claude Desktop, Cursor, or any AI agent' },
          ].map(card => (
            <button key={card.tab} onClick={() => setActiveTab(card.tab)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${card.bg}`}>
              <div className="mb-3">{card.icon}</div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{card.title}</p>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Base URL</p>
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700">
            <Globe size={14} className="text-gray-400 flex-shrink-0" />
            <code className="flex-1 text-sm font-mono text-green-400">https://nexbotix.online</code>
            <button onClick={() => copySnippet('baseurl', 'https://nexbotix.online')}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              {copiedSnippet === 'baseurl' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copiedSnippet === 'baseurl' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Authentication</p>
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key size={14} className="text-violet-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">API Key (recommended for server-to-server)</span>
              </div>
              <code className="text-sm font-mono text-gray-800">X-API-Key: bsk_your_key</code>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">JWT Bearer (user session)</span>
              </div>
              <code className="text-sm font-mono text-gray-800">Authorization: Bearer {'<jwt_token>'}</code>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Rate Limits</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Limit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  ['API Key requests', '100 req / min'],
                  ['WhatsApp bulk (contacts)', '50 per call'],
                  ['Email bulk (contacts)', '50 per call'],
                  ['MCP tools/call', '100 req / min'],
                ].map(([limit, value]) => (
                  <tr key={limit}>
                    <td className="px-4 py-3 text-gray-700">{limit}</td>
                    <td className="px-4 py-3 font-mono text-gray-900 font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderKeys() {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">API Keys</h1>
          <p className="text-gray-500 text-sm">Generate API keys to authenticate server-to-server requests. Keys are shown only once — store them securely.</p>
        </div>

        {/* Create form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Create a new key</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="Key name, e.g. production-server"
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button
              onClick={createKey}
              disabled={creatingKey || !newKeyName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus size={15} />
              {creatingKey ? 'Generating…' : 'Generate Key'}
            </button>
          </div>
        </div>

        {/* New key banner */}
        {newKeyFull && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  ✅ Your new API key — copy it now, it won't be shown again
                </p>
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all">{newKeyFull}</code>
                  <button
                    onClick={() => copySnippet('newkey', newKeyFull)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                  >
                    {copiedSnippet === 'newkey' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedSnippet === 'newkey' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <button onClick={() => setNewKeyFull(null)} className="text-green-600 hover:text-green-800 flex-shrink-0 mt-0.5">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {keysLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading keys…</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <Key size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No API keys yet — create one above</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Preview</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Used</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apiKeys.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{k.keyPreview}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3 text-right">
                        {confirmRevoke === k.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-red-600">Revoke?</span>
                            <button onClick={() => revokeKey(k.id)} disabled={revoking === k.id}
                              className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg disabled:opacity-50">
                              {revoking === k.id ? '…' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmRevoke(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmRevoke(k.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors">
                            <Trash2 size={12} /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {apiKeys.map(k => (
                <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{k.name}</p>
                    {confirmRevoke === k.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => revokeKey(k.id)} disabled={revoking === k.id}
                          className="text-xs text-white bg-red-600 px-2 py-0.5 rounded">{revoking === k.id ? '…' : 'Revoke'}</button>
                        <button onClick={() => setConfirmRevoke(null)} className="text-xs text-gray-400">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRevoke(k.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <code className="text-xs font-mono text-gray-500 break-all">{k.keyPreview}</code>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Created {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</span>
                    <span>Last used {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderWhatsApp() {
    const snippets: Record<typeof codeTab, string> = { curl: waSendCurl, js: waSendJs, python: waSendPython };
    const langs: Record<typeof codeTab, string> = { curl: 'bash', js: 'javascript', python: 'python' };
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">WhatsApp API</h1>
          <p className="text-gray-500 text-sm">Send messages, run bulk campaigns, and manage scheduled sends via REST. Requires WhatsApp connected and an active subscription.</p>
        </div>

        {/* Send endpoint */}
        <div className="mb-8">
          <EndpointHeader method="POST" path="/api/v1/send" description="Send to one contact or up to 50 contacts at once" />
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-xs font-mono text-gray-700 space-y-1">
            <p className="text-gray-400 font-sans text-xs uppercase tracking-wide font-semibold mb-2">Required headers</p>
            <p><span className="text-blue-600">X-API-Key</span>: bsk_your_key</p>
            <p><span className="text-blue-600">Content-Type</span>: application/json</p>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</p>
          <CodeBlock id="wa-req" language="json" code={`{
  "phone": "919876543210",      // single recipient — OR use contacts[]
  "contacts": [                  // bulk (max 50)
    { "phone": "919876543210", "name": "Raj" }
  ],
  "message": {
    "text": "Hello {{name}}!",
    "imageUrl": "https://..."   // optional
  },
  "schedule_at": "2025-12-01T09:00:00Z"  // optional — ISO 8601
}`} />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Response</p>
          <CodeBlock id="wa-res" language="json" code={`// Immediate send
{ "success": true, "sent": 1, "failed": 0, "total": 1 }

// Scheduled
{ "success": true, "scheduled": true, "job_id": "abc123", "scheduled_at": "2025-12-01T09:00:00Z", "total": 1 }`} />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-2">Code Examples</p>
          <div className="flex gap-1 mb-3">
            {(['curl', 'js', 'python'] as const).map(t => (
              <button key={t} onClick={() => setCodeTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${codeTab === t ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'curl' ? 'cURL' : t === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
          <CodeBlock id={`wa-code-${codeTab}`} language={langs[codeTab]} code={snippets[codeTab]} />
        </div>

        {/* Bulk example */}
        <div className="mb-8">
          <p className="text-base font-semibold text-gray-800 mb-3">Bulk Send Example</p>
          <CodeBlock id="wa-bulk" language="bash" code={waBulkCurl} />
        </div>

        {/* Schedules */}
        <div className="mb-8">
          <EndpointHeader method="GET" path="/api/v1/schedules" description="List all scheduled messages" />
          <CodeBlock id="wa-list-sched" language="bash" code={`curl https://nexbotix.online/api/v1/schedules \\
  -H "X-API-Key: bsk_your_key"`} />
        </div>

        <div className="mb-4">
          <EndpointHeader method="DELETE" path="/api/v1/schedules/{id}" description="Cancel a pending scheduled message" />
          <CodeBlock id="wa-cancel-sched" language="bash" code={`curl -X DELETE https://nexbotix.online/api/v1/schedules/JOB_ID \\
  -H "X-API-Key: bsk_your_key"`} />
        </div>
      </div>
    );
  }

  function renderEmail() {
    const snippets: Record<typeof emailCodeTab, string> = { curl: emailSendCurl, js: emailSendJs, python: emailSendPython };
    const langs: Record<typeof emailCodeTab, string> = { curl: 'bash', js: 'javascript', python: 'python' };
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Email API</h1>
          <p className="text-gray-500 text-sm">Trigger transactional or bulk emails programmatically. Requires Email service subscription with SMTP configured.</p>
        </div>

        <div className="mb-8">
          <EndpointHeader method="POST" path="/api/v1/email/send" description="Send to one or up to 50 email recipients" />
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-xs font-mono text-gray-700 space-y-1">
            <p className="text-gray-400 font-sans text-xs uppercase tracking-wide font-semibold mb-2">Required headers</p>
            <p><span className="text-blue-600">X-API-Key</span>: bsk_your_key</p>
            <p><span className="text-blue-600">Content-Type</span>: application/json</p>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</p>
          <CodeBlock id="email-req" language="json" code={`{
  "email": "user@example.com",     // single — OR use contacts[]
  "contacts": [                      // bulk (max 50)
    { "email": "user@example.com", "name": "John" }
  ],
  "message": {
    "subject": "Your order is confirmed",
    "bodyHtml": "<h1>Hi {{name}}!</h1><p>Your order has been placed.</p>",
    "bodyText": "Hi! Your order has been placed."  // optional fallback
  },
  "schedule_at": "2025-12-01T09:00:00Z"  // optional
}`} />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Response</p>
          <CodeBlock id="email-res" language="json" code={`{ "success": true, "sent": 1, "failed": 0, "total": 1 }`} />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-2">Code Examples</p>
          <div className="flex gap-1 mb-3">
            {(['curl', 'js', 'python'] as const).map(t => (
              <button key={t} onClick={() => setEmailCodeTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${emailCodeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'curl' ? 'cURL' : t === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
          <CodeBlock id={`email-code-${emailCodeTab}`} language={langs[emailCodeTab]} code={snippets[emailCodeTab]} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>Note:</strong> The <code className="font-mono text-blue-900 bg-blue-100 px-1 rounded">{'{{name}}'}</code> placeholder in <code className="font-mono text-blue-900 bg-blue-100 px-1 rounded">bodyHtml</code> is automatically replaced with each contact's name when using the <code className="font-mono text-blue-900 bg-blue-100 px-1 rounded">contacts[]</code> array.
        </div>
      </div>
    );
  }

  function renderMCP() {
    const mcpConfigs: Record<typeof mcpClient, string> = {
      opencode: mcpOpenCodeCmd,
      claudecode: mcpClaudeCodeCmd,
      claude: mcpClaudeConfig,
      cursor: mcpCursorConfig,
      generic: `URL: https://nexbotix.online/api/mcp
Transport: Streamable HTTP
Protocol Version: 2024-11-05
Auth Header: X-API-Key: bsk_your_key`,
    };
    const mcpConfigPaths: Record<typeof mcpClient, string> = {
      opencode: 'Run in your terminal (`~/.config/opencode/opencode.jsonc`)',
      claudecode: 'Run once in your terminal — no config file needed',
      claude: '~/Library/Application Support/Claude/claude_desktop_config.json',
      cursor: '.cursor/mcp.json (project root)',
      generic: 'Any MCP Streamable HTTP client',
    };

    const messagingTools = [
      { name: 'whatsapp_get_status', desc: 'Check WhatsApp connection state' },
      { name: 'whatsapp_send_message', desc: 'Send text or image to one number' },
      { name: 'whatsapp_send_bulk', desc: 'Broadcast to up to 50 contacts' },
      { name: 'whatsapp_schedule_message', desc: 'Schedule a future message' },
      { name: 'whatsapp_get_contacts', desc: 'List contacts from active session' },
      { name: 'whatsapp_list_schedules', desc: 'View pending scheduled messages' },
      { name: 'whatsapp_cancel_schedule', desc: 'Cancel a scheduled send' },
    ];
    const botTools = [
      { name: 'whatsapp_bot_get_config', desc: 'Read current bot configuration' },
      { name: 'whatsapp_bot_setup', desc: 'Create or update the AI bot' },
      { name: 'whatsapp_bot_enable', desc: 'Turn the bot on' },
      { name: 'whatsapp_bot_disable', desc: 'Turn the bot off' },
      { name: 'whatsapp_bot_add_excluded', desc: 'Mute a phone number' },
      { name: 'whatsapp_bot_remove_excluded', desc: 'Unmute a phone number' },
      { name: 'whatsapp_bot_detection_stats', desc: 'Spam detection statistics' },
    ];

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">MCP Integration</h1>
          <p className="text-gray-500 text-sm">
            NexBotix exposes a <strong className="text-gray-700">Model Context Protocol (MCP)</strong> server over Streamable HTTP.
            Connect Claude Desktop, Cursor, Windsurf, or any MCP-compatible AI agent to control WhatsApp using natural language.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Endpoint</p>
          <div className="flex items-center gap-2 flex-wrap">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800">
              https://nexbotix.online/api/mcp
            </code>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
            <span><strong>Auth:</strong> X-API-Key header</span>
            <span><strong>Protocol:</strong> JSON-RPC 2.0</span>
            <span><strong>Version:</strong> MCP 2024-11-05</span>
          </div>
        </div>

        {/* Connected OAuth AI Agents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Shield size={16} className="text-violet-600" />
                Connected AI Agents (OAuth)
              </h2>
              <p className="text-xs text-gray-500">Manage AI applications (like ChatGPT, Claude, etc.) authorized to access your account via OAuth.</p>
            </div>
            <button onClick={loadConnectedAgents} disabled={agentsLoading}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium">
              {agentsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {agentsLoading && connectedAgents.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading connected agents...</div>
            ) : connectedAgents.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No AI agents currently connected via OAuth. Connect your account inside ChatGPT using <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">https://nexbotix.online/api/mcp</code>.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {connectedAgents.map(a => (
                  <div key={a.client_id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{a.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 font-mono font-bold rounded-full">Active</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono truncate mb-1">Client ID: {a.client_id}</p>
                      <p className="text-[11px] text-gray-400">
                        Connected on: {new Date(a.created_at).toLocaleDateString()} at {new Date(a.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => revokeAgent(a.client_id)}
                        disabled={revokingAgent === a.client_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                        <Trash2 size={13} />
                        {revokingAgent === a.client_id ? 'Revoking...' : 'Revoke Access'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client setup */}
        <div className="mb-8">
          <p className="text-base font-semibold text-gray-800 mb-3">Client Configuration</p>
          <div className="flex flex-wrap gap-1 mb-4">
            {([
              { id: 'opencode' as const, label: 'OpenCode', badge: 'New' },
              { id: 'claudecode' as const, label: 'Claude Code', badge: 'Easiest' },
              { id: 'claude' as const, label: 'Claude Desktop' },
              { id: 'cursor' as const, label: 'Cursor' },
              { id: 'generic' as const, label: 'Generic' },
            ]).map(c => (
              <button key={c.id} onClick={() => setMcpClient(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${mcpClient === c.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c.label}
                {'badge' in c && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${mcpClient === c.id ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>{c.badge}</span>}
              </button>
            ))}
          </div>

          {mcpClient === 'opencode' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-mono">{mcpConfigPaths.opencode}</p>
              </div>
              <CodeBlock id="mcp-config-opencode" language="bash" code={mcpConfigs.opencode} />
              <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-900 space-y-1">
                <p><strong>OpenCode Integration Highlights:</strong></p>
                <p>• <strong>1-Click OAuth Login:</strong> Running <code className="bg-violet-100 px-1.5 py-0.5 rounded font-mono">opencode mcp auth nexbotix</code> opens your browser to securely authorize without copying API keys.</p>
                <p>• <strong>API Key Fallback:</strong> If you prefer API keys or CI/CD pipelines, pass <code className="bg-violet-100 px-1.5 py-0.5 rounded font-mono">-H "X-API-Key: your_key"</code> during <code className="bg-violet-100 px-1.5 py-0.5 rounded font-mono">mcp add</code>.</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Verify with: <code className="font-mono bg-gray-100 px-1 rounded">opencode mcp list</code></p>
            </div>
          ) : mcpClient === 'claudecode' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-mono">{mcpConfigPaths.claudecode}</p>
              </div>
              <CodeBlock id="mcp-config-claudecode" language="bash" code={mcpConfigs.claudecode} />
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 space-y-1">
                <p><strong>What each flag does:</strong></p>
                <p><code className="bg-green-100 px-1 rounded">--transport http</code> — use Streamable HTTP (MCP 2024-11-05)</p>
                <p><code className="bg-green-100 px-1 rounded">whatsapp</code> — the name shown in Claude Code's MCP list</p>
                <p><code className="bg-green-100 px-1 rounded">-H "X-API-Key: ..."</code> — your NexBotix API key header</p>
                <p><code className="bg-green-100 px-1 rounded">-s user</code> — saves to your user-level config (available across all projects)</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Verify with: <code className="font-mono bg-gray-100 px-1 rounded">claude mcp list</code></p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-mono">{mcpConfigPaths[mcpClient]}</p>
              <CodeBlock
                id={`mcp-config-${mcpClient}`}
                language={mcpClient === 'generic' ? 'text' : 'json'}
                code={mcpConfigs[mcpClient]}
              />
            </div>
          )}
        </div>

        {/* Tools table */}
        <div className="mb-8">
          <p className="text-base font-semibold text-gray-800 mb-4">Available Tools (14)</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MessageSquare size={12} /> Messaging (7)
              </p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {messagingTools.map((t, i) => (
                  <div key={t.name} className={`flex items-center gap-3 px-4 py-3 ${i < messagingTools.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    <code className="text-xs font-mono text-violet-700 flex-1 min-w-0 truncate">{t.name}</code>
                    <span className="text-xs text-gray-500 hidden sm:block">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Zap size={12} /> Bot Management (7)
              </p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {botTools.map((t, i) => (
                  <div key={t.name} className={`flex items-center gap-3 px-4 py-3 ${i < botTools.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    <code className="text-xs font-mono text-violet-700 flex-1 min-w-0 truncate">{t.name}</code>
                    <span className="text-xs text-gray-500 hidden sm:block">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Test with cURL */}
        <div className="mb-4">
          <p className="text-base font-semibold text-gray-800 mb-3">
            <Terminal size={16} className="inline mr-2 text-gray-500" />
            Test with cURL
          </p>
          <CodeBlock id="mcp-test" language="bash" code={mcpInitCurl} />
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-800">
          <strong>Tip:</strong> Once configured, you can ask your AI agent: <em>"Send a WhatsApp message to 919876543210 saying hello"</em> — it will call the <code className="font-mono bg-violet-100 px-1 rounded">whatsapp_send_message</code> tool automatically.
        </div>
      </div>
    );
  }

  const contentMap: Record<Tab, () => React.ReactNode> = {
    overview: renderOverview,
    keys: renderKeys,
    whatsapp: renderWhatsApp,
    email: renderEmail,
    mcp: renderMCP,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <img src="/icon-192.png" alt="NexBotix" className="w-8 h-8 rounded-xl object-contain shadow-sm" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Developer Hub</h1>
              <p className="text-xs text-gray-500 mt-0.5">API Keys · REST API · MCP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden sm:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              title="View Profile"
            >
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white shrink-0">
                <User size={14} />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav pills */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === item.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Desktop sidebar */}
        <aside className="hidden sm:block w-56 flex-shrink-0 bg-white border-r border-gray-200 min-h-full">
          <nav className="sticky top-16 pt-6 pb-4">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-violet-50 text-violet-700 font-semibold border-l-2 border-violet-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                }`}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8">
          <div className="max-w-3xl">
            {contentMap[activeTab]()}
          </div>
        </main>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
}
