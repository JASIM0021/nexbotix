import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, FileSearch, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOPagesResponse, SEOPage, SEOIssue } from '@/types/seo';

function ScorePill({ score }: { score: number }) {
  const cls = score >= 80
    ? 'bg-green-50 text-green-700 border-green-200'
    : score >= 50
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>{score}</span>
  );
}

function IssueCounts({ issues }: { issues: SEOIssue[] }) {
  const safeIssues = issues || [];
  const crit = safeIssues.filter(i => i.severity === 'critical').length;
  const warn = safeIssues.filter(i => i.severity === 'warning').length;
  const info = safeIssues.filter(i => i.severity === 'info').length;
  return (
    <div className="flex items-center gap-2 text-xs">
      {crit > 0 && <span className="flex items-center gap-0.5 text-red-500"><AlertCircle size={11} />{crit}</span>}
      {warn > 0 && <span className="flex items-center gap-0.5 text-amber-500"><AlertTriangle size={11} />{warn}</span>}
      {info > 0 && <span className="flex items-center gap-0.5 text-blue-400"><Info size={11} />{info}</span>}
      {crit === 0 && warn === 0 && info === 0 && <span className="text-green-500 font-semibold">Clean</span>}
    </div>
  );
}

const LIMIT = 20;

export function SEOPagesTab() {
  const [data, setData] = useState<SEOPagesResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SEOPage | null>(null);

  const load = useCallback(async (off: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.seo.pages}?limit=${LIMIT}&offset=${off}`);
      const json = await res.json();
      if (json.success && json.data) {
        const normalized = {
          ...json.data,
          pages: (json.data.pages || []).map((page: any) => ({
            ...page,
            issues: page.issues || [],
          })),
        };
        setData(normalized);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(offset); }, [load, offset]);

  if (loading && !data) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-emerald-500" />
    </div>
  );

  if (!data || data.total === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <FileSearch size={36} className="text-gray-300 mb-4" />
      <h3 className="text-base font-bold text-gray-800 mb-2">No pages tracked yet</h3>
      <p className="text-sm text-gray-500">Once your embed script is installed, visited pages will appear here.</p>
    </div>
  );

  const totalPages = Math.ceil(data.total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.total} page{data.total !== 1 ? 's' : ''} tracked</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0 || loading}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= data.total || loading}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Page</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Issues</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">LCP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Visits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.pages.map(page => (
                <tr
                  key={page.id}
                  onClick={() => setSelected(selected?.id === page.id ? null : page)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-gray-700 truncate max-w-[200px] sm:max-w-[300px]">{page.path || '/'}</span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-gray-300 hover:text-emerald-500 flex-shrink-0"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    {page.title && <p className="text-[10px] text-gray-400 truncate max-w-[200px] sm:max-w-[300px] mt-0.5">{page.title}</p>}
                  </td>
                  <td className="px-4 py-3"><ScorePill score={page.seoScore} /></td>
                  <td className="px-4 py-3"><IssueCounts issues={page.issues} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                    {page.lcp > 0 ? `${Math.round(page.lcp)}ms` : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{page.visitCount}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {page.lastVisitedAt ? new Date(page.lastVisitedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">{selected.title || selected.path || '/'}</h4>
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                {selected.url} <ExternalLink size={10} />
              </a>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Score', value: selected.seoScore },
              { label: 'LCP', value: selected.lcp > 0 ? `${Math.round(selected.lcp)}ms` : '—' },
              { label: 'CLS', value: selected.cls > 0 ? selected.cls.toFixed(3) : '—' },
              { label: 'Visits', value: selected.visitCount },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">{s.label}</p>
                <p className="text-lg font-extrabold text-gray-800 leading-snug">{s.value}</p>
              </div>
            ))}
          </div>

          {(selected.issues || []).length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Issues</p>
              {(selected.issues || []).map(iss => (
                <div key={iss.code} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  iss.severity === 'critical' ? 'bg-red-50 border-red-100' :
                  iss.severity === 'warning' ? 'bg-amber-50 border-amber-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  {iss.severity === 'critical' ? <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" /> :
                   iss.severity === 'warning' ? <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" /> :
                   <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />}
                  <p className="text-xs text-gray-700">{iss.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 font-semibold">No issues — this page is clean!</p>
          )}
        </div>
      )}
    </div>
  );
}
