import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, History } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FreelancerBidLog } from '@/types/freelancer';

export function FreelancerHistoryTab() {
  const [bids, setBids] = useState<FreelancerBidLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.botHistory);
      const json = await res.json();
      if (json.success && json.data) {
        setBids(json.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-sky-600" />
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <History size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 text-sm font-bold">No Placed Bids Logged</p>
          <p className="text-gray-400 text-xs mt-1">Bids submitted automatically or approved via the pipeline will log here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map(bid => (
            <div key={bid.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      bid.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {bid.status}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(bid.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{bid.projectTitle}</h4>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">${bid.amount}</p>
                  <p className="text-[10px] text-gray-400">{bid.periodDays} days</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                {bid.proposalText}
              </div>

              {bid.error && (
                <p className="text-xs text-red-600 font-semibold">Error: {bid.error}</p>
              )}

              {bid.projectUrl && (
                <div className="pt-2 border-t border-gray-100">
                  <a
                    href={bid.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Project on Freelancer.com <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
