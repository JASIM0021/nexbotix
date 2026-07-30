import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Check, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FreelancerPendingBid } from '@/types/freelancer';

export function FreelancerApprovalsTab() {
  const [bids, setBids] = useState<FreelancerPendingBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPendingBids = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.botPending);
      const json = await res.json();
      if (json.success && json.data) {
        setBids(json.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadPendingBids();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'delete') => {
    setActioningId(id);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(API_ENDPOINTS.freelancer.botPending, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess(action === 'approve' ? 'Bid successfully approved and submitted to Freelancer.com!' : 'Pending bid removed.');
        setBids(prev => prev.filter(b => b.id !== id));
      } else {
        setError(json.error || 'Failed to process action');
      }
    } catch {
      setError('Failed to contact server');
    }
    setActioningId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {error && (
        <div className={`rounded-xl p-4 text-xs leading-relaxed transition-all ${
          error.includes('SKILLS_REQUIREMENT_NOT_MET') || error.toLowerCase().includes('required skills')
            ? 'bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {error.includes('SKILLS_REQUIREMENT_NOT_MET') || error.toLowerCase().includes('required skills') ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                <span>Freelancer.com Skill Requirement Missing</span>
              </div>
              <p className="text-amber-800">
                Freelancer.com returned: <strong>"You must have the required skills to bid on this project."</strong>
              </p>
              <div className="bg-amber-100/90 p-3 rounded-lg text-amber-950 space-y-1.5 border border-amber-200">
                <p className="font-bold flex items-center gap-1 text-amber-900">
                  👉 Follow these 3 steps to fix & auto-trigger next time:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-amber-900 font-medium">
                  <li>Click the <strong className="text-sky-700 font-bold">"View Project on Freelancer.com ↗"</strong> button on the project card below to open the project details.</li>
                  <li>Click <strong className="text-amber-950">Add Skills</strong> on Freelancer.com to add all required skills to your Freelancer profile.</li>
                  <li>Return here and click <strong className="text-green-700 font-bold">"Approve & Submit Bid"</strong> again to submit your bid!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 font-medium">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-sky-600" />
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 text-sm font-bold">No Pending Approvals</p>
          <p className="text-gray-400 text-xs mt-1">Generated winning proposals requiring confirmation before submitting will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map(bid => (
            <div key={bid.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full uppercase">
                    {bid.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm">{bid.projectTitle}</h4>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">${bid.proposedAmount} {bid.currency}</p>
                  <p className="text-[10px] text-gray-400">Delivery: {bid.periodDays} days</p>
                </div>
              </div>

              {/* Proposal Text */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                {bid.proposalText}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
                <a
                  href={bid.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  View Project on Freelancer.com <ExternalLink size={12} />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(bid.id, 'delete')}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actioningId === bid.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Reject / Delete
                  </button>

                  <button
                    onClick={() => handleAction(bid.id, 'approve')}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actioningId === bid.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                    Approve & Submit Bid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
