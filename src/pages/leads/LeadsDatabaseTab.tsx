import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Search, Filter, Trash2, Download, MessageSquare, Mail, Loader2, ChevronLeft, ChevronRight, CheckSquare, Square, Star, Globe, Phone, RefreshCw, X, Save, Copy, Share2 } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface Lead {
	id: string;
	name: string;
	address?: string;
	phone?: string;
	website?: string;
	email?: string;
	category?: string;
	rating?: number;
	reviews?: number;
	status?: string;
	notes?: string;
	draftSubject?: string;
	draftBody?: string;
}

const STATUS_COLORS: Record<string, string> = {
	new: 'bg-slate-850 border-slate-700 text-slate-300',
	email_sent: 'bg-blue-950/40 border-blue-900/60 text-blue-400',
	whatsapp_sent: 'bg-green-950/40 border-green-900/60 text-green-400',
	followup_1: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	reminder_1: 'bg-amber-950/40 border-amber-900/60 text-amber-400',
	interested: 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400',
	not_interested: 'bg-rose-950/40 border-rose-900/60 text-rose-400',
	email_drafted: 'bg-violet-950/40 border-violet-900/60 text-violet-400',
	follwup1: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup2: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup3: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup4: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup5: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup6: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup7: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup8: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup9: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup10: 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400',
	follwup1_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup2_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup3_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup4_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup5_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup6_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup7_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup8_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup9_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
	follwup10_drafted: 'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400',
};

const STATUS_LABELS: Record<string, string> = {
	new: 'New',
	email_sent: 'Email Sent',
	whatsapp_sent: 'WhatsApp Sent',
	followup_1: 'Follow-up 1',
	reminder_1: 'Reminder 1',
	interested: 'Interested',
	not_interested: 'Not Interested',
	email_drafted: 'Outreach Draft',
	follwup1: 'Follow-up 1 Sent',
	follwup2: 'Follow-up 2 Sent',
	follwup3: 'Follow-up 3 Sent',
	follwup4: 'Follow-up 4 Sent',
	follwup5: 'Follow-up 5 Sent',
	follwup6: 'Follow-up 6 Sent',
	follwup7: 'Follow-up 7 Sent',
	follwup8: 'Follow-up 8 Sent',
	follwup9: 'Follow-up 9 Sent',
	follwup10: 'Follow-up 10 Sent',
	follwup1_drafted: 'Follow-up 1 Draft',
	follwup2_drafted: 'Follow-up 2 Draft',
	follwup3_drafted: 'Follow-up 3 Draft',
	follwup4_drafted: 'Follow-up 4 Draft',
	follwup5_drafted: 'Follow-up 5 Draft',
	follwup6_drafted: 'Follow-up 6 Draft',
	follwup7_drafted: 'Follow-up 7 Draft',
	follwup8_drafted: 'Follow-up 8 Draft',
	follwup9_drafted: 'Follow-up 9 Draft',
	follwup10_drafted: 'Follow-up 10 Draft',
};

export function LeadsDatabaseTab() {
	const navigate = useNavigate();

	const [leads, setLeads] = useState<Lead[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(50);
	const [loading, setLoading] = useState(false);

	// Filters
	const [search, setSearch] = useState('');
	const [niche, setNiche] = useState('');
	const [location, setLocation] = useState('');
	const [hasPhone, setHasPhone] = useState(false);
	const [hasEmail, setHasEmail] = useState(false);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleting, setDeleting] = useState(false);
	const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);

	// Sharing leads modal state
	const [showShareModal, setShowShareModal] = useState(false);
	const [recipientEmail, setRecipientEmail] = useState('');
	const [sharing, setSharing] = useState(false);
	const [shareSuccess, setShareSuccess] = useState<string | null>(null);
	const [shareError, setShareError] = useState<string | null>(null);

	// Review draft modal state
	const [reviewDraftLead, setReviewDraftLead] = useState<Lead | null>(null);
	const [draftSubject, setDraftSubject] = useState('');
	const [draftBody, setDraftBody] = useState('');
	const [isSendingDraft, setIsSendingDraft] = useState(false);

	// Lead Editing Drawer state
	const [activeLead, setActiveLead] = useState<Lead | null>(null);
	const [editFields, setEditFields] = useState<Partial<Lead>>({});
	const [saving, setSaving] = useState(false);

	const handleOpenDrawer = (lead: Lead) => {
		setActiveLead(lead);
		setEditFields({
			name: lead.name,
			phone: lead.phone || '',
			email: lead.email || '',
			website: lead.website || '',
			category: lead.category || '',
			address: lead.address || '',
			status: lead.status || 'new',
			notes: lead.notes || '',
		});
	};

	const handleCloseDrawer = () => {
		setActiveLead(null);
		setEditFields({});
	};

	const handleAIPrompt = (lead: Lead, platform: 'chatgpt' | 'claude' | 'perplexity' | 'copy') => {
		let tone = "local professional tone";
		if (lead.address) {
			const addr = lead.address.toLowerCase();
			if (addr.includes("spain") || addr.includes("españa") || addr.includes("madrid") || addr.includes("barcelona")) {
				tone = "Spanish with native Spain tone and vocabulary";
			} else if (addr.includes("germany") || addr.includes("deutschland") || addr.includes("berlin") || addr.includes("munich")) {
				tone = "German with professional Germany tone";
			} else if (addr.includes("france") || addr.includes("paris")) {
				tone = "French with professional France tone";
			} else if (addr.includes("italy") || addr.includes("italia") || addr.includes("rome") || addr.includes("milan")) {
				tone = "Italian with professional Italy tone";
			}
		}

		const prompt = `Write a cold email outreach campaign for this business:

Business Name: ${lead.name || 'N/A'}
Address: ${lead.address || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Email: ${lead.email || 'N/A'}
Website: ${lead.website || 'N/A'}
Category: ${lead.category || 'Software Services'}

Requirements:
1. Write a highly compelling email subject line.
2. Write a personalized email body offering possible software and automation services matching their business category.
3. Write the email in the local language/tone suited for this location (${tone}). Keep it professional, concise, and focused on value.`;

		navigator.clipboard.writeText(prompt).catch(() => {});

		if (platform === 'copy') {
			setCopiedLeadId(lead.id);
			setTimeout(() => {
				setCopiedLeadId(null);
			}, 1500);
		} else if (platform === 'chatgpt') {
			window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank');
		} else if (platform === 'perplexity') {
			window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`, '_blank');
		} else if (platform === 'claude') {
			window.open('https://claude.ai/new', '_blank');
		}
	};

	const handleOpenDraft = (lead: Lead) => {
		setReviewDraftLead(lead);
		setDraftSubject(lead.draftSubject || '');
		setDraftBody((lead.draftBody || '').replace(/<br\s*\/?>/gi, '\n'));
	};

	const handleSendDraft = async () => {
		if (!reviewDraftLead) return;
		setIsSendingDraft(true);
		try {
			const bodyWithBr = draftBody.replace(/\n/g, '<br>');
			const res = await apiFetch(API_ENDPOINTS.leads.sendDraft, {
				method: 'POST',
				body: JSON.stringify({
					leadId: reviewDraftLead.id,
					subject: draftSubject,
					body: bodyWithBr,
				}),
			});
			const json = await res.json();
			if (json.success) {
				setLeads(prev =>
					prev.map(l =>
						l.id === reviewDraftLead.id
							? {
									...l,
									status: l.status?.replace('_drafted', '') || 'email_sent',
									draftSubject: undefined,
									draftBody: undefined,
							  }
							: l
					)
				);
				setReviewDraftLead(null);
				alert('AI Outreach email sent successfully!');
			} else {
				alert(json.error || 'Failed to send email');
			}
		} catch (err) {
			alert('Network error sending draft');
		} finally {
			setIsSendingDraft(false);
		}
	};

	const handleCloseShareModal = () => {
		setShowShareModal(false);
		setRecipientEmail('');
		setShareError(null);
		setShareSuccess(null);
	};

	const handleShareLeads = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!recipientEmail || selectedIds.size === 0) return;

		setSharing(true);
		setShareError(null);
		setShareSuccess(null);

		try {
			const response = await apiFetch(API_ENDPOINTS.leads.share, {
				method: 'POST',
				body: JSON.stringify({
					recipientEmail: recipientEmail.trim(),
					leadIds: Array.from(selectedIds),
				}),
			});
			const res = await response.json();
			if (res.success) {
				setShareSuccess(res.message || 'Leads successfully shared!');
				setRecipientEmail('');
				setTimeout(() => {
					setShowShareModal(false);
					setShareSuccess(null);
					setSelectedIds(new Set()); // Deselect shared leads
					fetchLeads(); // Refresh leads
				}, 2000);
			} else {
				setShareError(res.error || 'Failed to share leads');
			}
		} catch (err: any) {
			setShareError('Failed to connect to server');
		} finally {
			setSharing(false);
		}
	};

	const handleSaveLead = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeLead) return;

		setSaving(true);
		try {
			const response = await apiFetch(`${API_ENDPOINTS.leads.list}/${activeLead.id}`, {
				method: 'PUT',
				body: JSON.stringify(editFields),
			});
			const res = await response.json();
			if (res.success) {
				handleCloseDrawer();
				fetchLeads();
			} else {
				alert('Failed to update lead: ' + (res.error || 'Unknown error'));
			}
		} catch (err: any) {
			console.error('Failed to save lead:', err);
			alert('Failed to save lead: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const fetchLeads = async () => {
		setLoading(true);
		try {
			// Construct query params
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			});

			if (search.trim()) params.append('q', search.trim());
			if (niche.trim()) params.append('niche', niche.trim());
			if (location.trim()) params.append('location', location.trim());
			if (hasPhone) params.append('has_phone', 'true');
			if (hasEmail) params.append('has_email', 'true');

			const response = await apiFetch(`${API_ENDPOINTS.leads.list}?${params.toString()}`);
			const res = await response.json();
			if (res.success && res.data) {
				setLeads(res.data.leads || []);
				setTotal(res.data.total || 0);
			}
		} catch (err) {
			console.error('Failed to load leads:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeads();
		// Reset page when filters change
	}, [page, limit, hasPhone, hasEmail, niche, location]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchLeads();
	};

	const handleSelectAll = () => {
		if (selectedIds.size === leads.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(leads.map(l => l.id)));
		}
	};

	const handleSelectOne = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		setSelectedIds(next);
	};

	const handleDeleteSelected = async () => {
		if (selectedIds.size === 0) return;
		if (!confirm(`Are you sure you want to delete the ${selectedIds.size} selected leads?`)) return;

		setDeleting(true);
		try {
			const response = await apiFetch(API_ENDPOINTS.leads.delete, {
				method: 'DELETE',
				body: JSON.stringify({ ids: Array.from(selectedIds) }),
			});
			const res = await response.json();

			if (res.success) {
				setSelectedIds(new Set());
				// If we deleted all items on current page, go back a page
				if (leads.length === selectedIds.size && page > 1) {
					setPage(prev => prev - 1);
				} else {
					fetchLeads();
				}
			}
		} catch (err) {
			console.error('Failed to delete leads:', err);
		} finally {
			setDeleting(false);
		}
	};

	const handleExport = (format: 'excel' | 'csv') => {
		const params = new URLSearchParams({
			format,
		});

		if (search.trim()) params.append('q', search.trim());
		if (niche.trim()) params.append('niche', niche.trim());
		if (location.trim()) params.append('location', location.trim());
		if (hasPhone) params.append('has_phone', 'true');
		if (hasEmail) params.append('has_email', 'true');

		// Trigger download via window.open
		window.open(`${API_ENDPOINTS.leads.export}?${params.toString()}`, '_blank');
	};

	// Campaign Bridging
	const handleWhatsAppCampaign = () => {
		const selectedLeads = leads.filter(l => selectedIds.has(l.id));
		const validContacts = selectedLeads
			.filter(l => l.phone)
			.map(l => ({
				id: l.id,
				phone: l.phone!.replace(/\D/g, ''), // raw digits
				name: l.name,
			}));

		if (validContacts.length === 0) {
			alert('None of the selected leads have phone numbers.');
			return;
		}

		sessionStorage.setItem('temp_leads_whatsapp', JSON.stringify(validContacts));
		navigate('/whatsapp');
	};

	const handleEmailCampaign = () => {
		const selectedLeads = leads.filter(l => selectedIds.has(l.id));
		const validEmails = selectedLeads
			.filter(l => l.email)
			.map(l => ({
				email: l.email!,
				name: l.name,
			}));

		if (validEmails.length === 0) {
			alert('None of the selected leads have email addresses.');
			return;
		}

		sessionStorage.setItem('temp_leads_email', JSON.stringify(validEmails));
		navigate('/email');
	};

	const totalPages = Math.ceil(total / limit) || 1;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
						<Database className="text-amber-500" />
						<span>Leads Database</span>
					</h2>
					<p className="text-slate-400 text-sm mt-1">
						Browse and filter scraped leads, export to Excel, or directly broadcast marketing campaigns.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<a
						href="https://github.com/TodayInTech-in/nexbotx-leads-generator-P/releases/download/v2.0.0/nexbotx-leads-generator-v2.0.0.zip"
						download="nexbotx-leads-generator-v2.0.0.zip"
						target="_blank"
						rel="noreferrer"
						className="px-3 py-2 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-blue-500/20"
					>
						<Download size={14} className="animate-pulse" />
						<span>Download Extension</span>
					</a>
					<button
						onClick={fetchLeads}
						disabled={loading}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
					>
						{loading ? (
							<Loader2 size={14} className="animate-spin text-amber-500" />
						) : (
							<RefreshCw size={14} className="text-amber-500" />
						)}
						<span>Reload Data</span>
					</button>
					<button
						onClick={() => handleExport('excel')}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
					>
						<Download size={14} />
						<span>Export Excel</span>
					</button>
					<button
						onClick={() => handleExport('csv')}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
					>
						<Download size={14} />
						<span>Export CSV</span>
					</button>
				</div>
			</div>

			{/* Filters Panel */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
				<form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="md:col-span-2 relative">
						<Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
						<input
							type="text"
							placeholder="Search by business name, category, or address..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
						/>
					</div>

					<div className="flex gap-2">
						<button
							type="submit"
							className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1 transition-colors"
						>
							<Filter size={13} />
							<span>Search</span>
						</button>
						<button
							type="button"
							onClick={() => {
								setSearch('');
								setNiche('');
								setLocation('');
								setHasPhone(false);
								setHasEmail(false);
								setPage(1);
								setTimeout(fetchLeads, 50);
							}}
							className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-500 rounded-xl text-xs border border-slate-900 transition-colors"
						>
							Reset
						</button>
					</div>

					{/* Checkboxes */}
					<div className="flex items-center gap-4 text-xs md:justify-end">
						<label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white">
							<input
								type="checkbox"
								checked={hasPhone}
								onChange={e => { setPage(1); setHasPhone(e.target.checked); }}
								className="rounded bg-slate-950 border-slate-800 text-amber-600 focus:ring-amber-500"
							/>
							<span>With Phone</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white">
							<input
								type="checkbox"
								checked={hasEmail}
								onChange={e => { setPage(1); setHasEmail(e.target.checked); }}
								className="rounded bg-slate-950 border-slate-800 text-amber-600 focus:ring-amber-500"
							/>
							<span>With Email</span>
						</label>
					</div>
				</form>
			</div>

			{/* Bulk Actions Header (Only visible when items selected) */}
			{selectedIds.size > 0 && (
				<div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
					<div className="text-amber-400 font-semibold">
						{selectedIds.size} leads selected
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleWhatsAppCampaign}
							className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							<MessageSquare size={13} fill="white" />
							<span>WhatsApp Campaign</span>
						</button>
						<button
							onClick={handleEmailCampaign}
							className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							<Mail size={13} />
							<span>Email Campaign</span>
						</button>
						<button
							onClick={() => setShowShareModal(true)}
							className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							<Share2 size={13} />
							<span>Share Leads</span>
						</button>
						<button
							onClick={handleDeleteSelected}
							disabled={deleting}
							className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							{deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
							<span>Delete</span>
						</button>
					</div>
				</div>
			)}

			{/* Table Container */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none border-l-2 border-l-transparent">
								<th className="p-4 w-12 text-center">
									<button onClick={handleSelectAll} className="text-slate-500 hover:text-white transition-colors">
										{selectedIds.size === leads.length && leads.length > 0 ? (
											<CheckSquare size={16} className="text-amber-500" />
										) : (
											<Square size={16} />
										)}
									</button>
								</th>
								<th className="p-4">Business Name</th>
								<th className="p-4">Phone</th>
								<th className="p-4">Email</th>
								<th className="p-4">Status</th>
								<th className="p-4">Website</th>
								<th className="p-4">Category</th>
								<th className="p-4 text-center">Rating</th>
								<th className="p-4">Address</th>
								<th className="p-4 text-center">AI Outreach</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800/40 text-xs">
							{loading ? (
								<tr>
									<td colSpan={10} className="p-12 text-center text-slate-500">
										<Loader2 size={24} className="animate-spin mx-auto text-amber-500 mb-2" />
										<span>Loading leads from database...</span>
									</td>
								</tr>
							) : leads.length === 0 ? (
								<tr>
									<td colSpan={10} className="p-12 text-center text-slate-500 italic">
										No leads found. Scrape some listings first or adjust your filters.
									</td>
								</tr>
							) : (
								leads.map(lead => {
									const isSelected = selectedIds.has(lead.id);
									return (
										<tr
											key={lead.id}
											onClick={() => handleOpenDrawer(lead)}
											className={`hover:bg-slate-800/30 transition-all cursor-pointer border-l-2 ${
												isSelected ? 'bg-amber-950/15 border-l-amber-500' : 'border-l-transparent hover:border-l-slate-700/60'
											}`}
										>
											<td className="p-4 text-center" onClick={e => e.stopPropagation()}>
												<button
													onClick={() => handleSelectOne(lead.id)}
													className="text-slate-500 hover:text-white transition-colors"
												>
													{isSelected ? (
														<CheckSquare size={16} className="text-amber-500" />
													) : (
														<Square size={16} />
													)}
												</button>
											</td>
											<td className="p-4 font-bold text-slate-100 hover:text-white transition-colors max-w-xs truncate">{lead.name}</td>
											<td className="p-4 whitespace-nowrap">
												{lead.phone ? (
													<span className="flex items-center gap-1.5 text-slate-300 font-medium">
														<Phone size={12} className="text-slate-500 shrink-0" />
														<span>{lead.phone}</span>
													</span>
												) : (
													<span className="text-slate-700/60">-</span>
												)}
											</td>
											<td className="p-4">
												{lead.email ? (
													<span className="text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
														{lead.email}
													</span>
												) : (
													<span className="text-slate-700/60">-</span>
												)}
											</td>
											<td className="p-4" onClick={e => e.stopPropagation()}>
												<span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold whitespace-nowrap ${
													STATUS_COLORS[lead.status || 'new']
												}`}>
													{STATUS_LABELS[lead.status || 'new']}
												</span>
											</td>
											<td className="p-4" onClick={e => e.stopPropagation()}>
												{lead.website ? (
													<a
														href={lead.website.startsWith('http') ? lead.website : `http://${lead.website}`}
														target="_blank"
														rel="noreferrer"
														className="text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1.5 font-medium truncate max-w-[150px]"
													>
														<Globe size={12} className="shrink-0 text-amber-500/70" />
														<span>{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
													</a>
												) : (
													<span className="text-slate-700/60">-</span>
												)}
											</td>
											<td className="p-4">
												{lead.category ? (
													<span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded text-[10px] font-semibold">
														{lead.category}
													</span>
												) : (
													<span className="text-slate-700/60">-</span>
												)}
											</td>
											<td className="p-4 text-center">
												{lead.rating ? (
													<span className="inline-flex items-center gap-1 font-bold text-slate-300">
														<span>{lead.rating.toFixed(1)}</span>
														<Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
														{lead.reviews !== undefined && (
															<span className="text-slate-600 text-[10px] font-normal">({lead.reviews})</span>
														)}
													</span>
												) : (
													<span className="text-slate-700/60">-</span>
												)}
											</td>
											<td className="p-4 text-slate-400 max-w-xs truncate" title={lead.address}>
												{lead.address || <span className="text-slate-700/60">-</span>}
											</td>
											<td className="p-4 text-center" onClick={e => e.stopPropagation()}>
												<div className="flex items-center justify-center gap-1">
													{lead.status && lead.status.endsWith('_drafted') && (
														<button
															onClick={() => handleOpenDraft(lead)}
															title="Review & Send AI Draft"
															className="text-[9px] font-extrabold tracking-wider text-white bg-indigo-600 border border-indigo-500 hover:bg-indigo-700 px-1.5 py-0.5 rounded transition-all active:scale-95 whitespace-nowrap flex items-center gap-0.5"
														>
															<Mail size={9} />
															REVIEW
														</button>
													)}
													<button
														onClick={() => handleAIPrompt(lead, 'chatgpt')}
														title="Copy & Open in ChatGPT"
														className="text-[9px] font-extrabold tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 hover:bg-emerald-900/50 hover:text-emerald-300 px-1.5 py-0.5 rounded transition-all active:scale-95 whitespace-nowrap"
													>
														GPT
													</button>
													<button
														onClick={() => handleAIPrompt(lead, 'claude')}
														title="Copy prompt & open Claude"
														className="text-[9px] font-extrabold tracking-wider text-amber-500 bg-amber-950/20 border border-amber-900/30 hover:bg-amber-900/50 hover:text-amber-400 px-1.5 py-0.5 rounded transition-all active:scale-95 whitespace-nowrap"
													>
														CLAUDE
													</button>
													<button
														onClick={() => handleAIPrompt(lead, 'perplexity')}
														title="Copy & Open in Perplexity"
														className="text-[9px] font-extrabold tracking-wider text-cyan-400 bg-cyan-950/20 border border-cyan-900/30 hover:bg-cyan-900/50 hover:text-cyan-300 px-1.5 py-0.5 rounded transition-all active:scale-95 whitespace-nowrap"
													>
														PPLX
													</button>
													<button
														onClick={() => handleAIPrompt(lead, 'copy')}
														title="Copy outreach prompt to clipboard"
														className={`text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded transition-all active:scale-95 whitespace-nowrap flex items-center gap-0.5 ${
															copiedLeadId === lead.id
																? 'text-green-400 bg-green-950/20 border border-green-900/30'
																: 'text-slate-300 bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/40 hover:text-white'
														}`}
													>
														<Copy size={9} />
														{copiedLeadId === lead.id ? 'COPIED!' : 'COPY'}
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination footer */}
				{total > 0 && (
					<div className="bg-slate-950/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
						<span className="text-xs text-slate-500">
							Showing <strong className="text-slate-300">{total === 0 ? 0 : (page - 1) * limit + 1}</strong> to{' '}
							<strong className="text-slate-300">
								{Math.min(page * limit, total)}
							</strong>{' '}
							of <strong className="text-slate-300">{total}</strong> leads
						</span>

						<div className="flex items-center gap-4 shrink-0">
							<div className="flex items-center gap-1.5 text-xs text-slate-500">
								<span>Show:</span>
								<select
									value={limit}
									onChange={e => {
										setLimit(Number(e.target.value));
										setPage(1);
									}}
									className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl py-1 px-2.5 focus:outline-none focus:border-amber-500"
								>
									<option value={10}>10</option>
									<option value={20}>20</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							</div>

							<div className="flex items-center gap-2">
								<button
									onClick={() => setPage(p => Math.max(p - 1, 1))}
									disabled={page === 1}
									className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 rounded-lg transition-colors"
								>
									<ChevronLeft size={16} />
								</button>
								<span className="text-xs text-slate-400 font-semibold select-none px-2">
									Page {page} of {totalPages}
								</span>
								<button
									onClick={() => setPage(p => Math.min(p + 1, totalPages))}
									disabled={page === totalPages}
									className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 rounded-lg transition-colors"
								>
									<ChevronRight size={16} />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Lead Details & Editing Drawer */}
			{activeLead && (
				<div className="fixed inset-0 z-50 flex justify-end">
					{/* Backdrop */}
					<div 
						className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
						onClick={handleCloseDrawer}
					/>

					{/* Sliding Panel */}
					<div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 animate-slide-in">
						{/* Header */}
						<div className="p-5 border-b border-slate-800 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-white">Lead Details</h3>
								<p className="text-slate-400 text-xs mt-0.5 font-medium">Edit information and track status</p>
							</div>
							<button 
								onClick={handleCloseDrawer}
								className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						{/* Scrollable Form */}
						<form onSubmit={handleSaveLead} className="flex-1 overflow-y-auto p-5 space-y-5">
							{/* Business Name */}
							<div>
								<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Business Name</label>
								<input
									type="text"
									required
									value={editFields.name || ''}
									onChange={e => setEditFields(prev => ({ ...prev, name: e.target.value }))}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{/* Phone */}
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone</label>
									<input
										type="text"
										value={editFields.phone || ''}
										onChange={e => setEditFields(prev => ({ ...prev, phone: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500"
									/>
								</div>
								{/* Website */}
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Website</label>
									<input
										type="text"
										value={editFields.website || ''}
										onChange={e => setEditFields(prev => ({ ...prev, website: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{/* Email */}
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
									<input
										type="email"
										value={editFields.email || ''}
										onChange={e => setEditFields(prev => ({ ...prev, email: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500"
									/>
								</div>
								{/* Category */}
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
									<input
										type="text"
										value={editFields.category || ''}
										onChange={e => setEditFields(prev => ({ ...prev, category: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500"
									/>
								</div>
							</div>

							{/* Address */}
							<div>
								<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Address</label>
								<input
									type="text"
									value={editFields.address || ''}
									onChange={e => setEditFields(prev => ({ ...prev, address: e.target.value }))}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500"
								/>
							</div>

							{/* Status Tracker */}
							<div>
								<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Follow-up Tracking</label>
								<select
									value={editFields.status || 'new'}
									onChange={e => setEditFields(prev => ({ ...prev, status: e.target.value }))}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
								>
									<option value="new">New (Uncontacted)</option>
									<option value="email_sent">Email Sent</option>
									<option value="whatsapp_sent">WhatsApp Sent</option>
									<option value="followup_1">Follow-up 1</option>
									<option value="reminder_1">Reminder 1</option>
									<option value="interested">Interested</option>
									<option value="not_interested">Not Interested</option>
								</select>
							</div>

							{/* Notes */}
							<div>
								<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Internal Notes & History</label>
								<textarea
									rows={4}
									value={editFields.notes || ''}
									placeholder="Add details about your interaction, next steps, or specific requests..."
									onChange={e => setEditFields(prev => ({ ...prev, notes: e.target.value }))}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500 resize-none font-sans"
								/>
							</div>

							{/* Footer Buttons */}
							<div className="pt-4 flex items-center gap-3 border-t border-slate-800">
								<button
									type="submit"
									disabled={saving}
									className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-900/30"
								>
									{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
									<span>Save Changes</span>
								</button>
								<button
									type="button"
									onClick={handleCloseDrawer}
									className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-750 transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Share Leads Modal */}
			{showShareModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
					<div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
							<h3 className="font-bold text-white text-sm flex items-center gap-2">
								<Share2 className="text-indigo-500" size={16} />
								<span>Share Leads</span>
							</h3>
							<button onClick={handleCloseShareModal} className="text-slate-400 hover:text-white transition-colors">
								<X size={16} />
							</button>
						</div>
						<form onSubmit={handleShareLeads} className="p-5 space-y-4">
							<p className="text-xs text-slate-400 leading-relaxed">
								You are sharing <strong className="text-slate-200">{selectedIds.size} selected leads</strong>. Enter the recipient email address below to copy these leads directly to their account database.
							</p>

							{shareError && (
								<div className="p-2.5 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-400">
									{shareError}
								</div>
							)}

							{shareSuccess && (
								<div className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-400">
									{shareSuccess}
								</div>
							)}

							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient Email Address</label>
								<input
									type="email"
									required
									value={recipientEmail}
									onChange={e => setRecipientEmail(e.target.value)}
									placeholder="user-b@example.com"
									className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
								/>
							</div>

							<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
								<button
									type="button"
									onClick={handleCloseShareModal}
									className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={sharing || !recipientEmail}
									className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
								>
									{sharing ? (
										<>
											<Loader2 size={12} className="animate-spin" />
											<span>Sharing...</span>
										</>
									) : (
										<span>Share Now</span>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Review Draft Modal */}
			{reviewDraftLead && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<h3 className="text-sm font-bold text-white flex items-center gap-1.5">
								<Mail size={16} className="text-indigo-400" />
								Review AI Email Pitch to {reviewDraftLead.name}
							</h3>
							<button
								onClick={() => setReviewDraftLead(null)}
								className="text-slate-400 hover:text-white transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient</label>
								<div className="text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex flex-col md:flex-row md:justify-between gap-1.5">
									<span><strong>Name:</strong> {reviewDraftLead.name}</span>
									<span><strong>Email:</strong> {reviewDraftLead.email}</span>
									<span><strong>Status:</strong> {STATUS_LABELS[reviewDraftLead.status || 'new']}</span>
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Subject</label>
								<input
									type="text"
									value={draftSubject}
									onChange={e => setDraftSubject(e.target.value)}
									className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Body (HTML/Markdown)</label>
								<textarea
									rows={8}
									value={draftBody}
									onChange={e => setDraftBody(e.target.value)}
									className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-700 leading-relaxed font-mono"
								/>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => setReviewDraftLead(null)}
								className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSendDraft}
								disabled={isSendingDraft || !draftSubject || !draftBody}
								className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-lg"
							>
								{isSendingDraft ? (
									<>
										<Loader2 size={12} className="animate-spin" />
										<span>Sending Email...</span>
									</>
								) : (
									<>
										<span>Approve &amp; Send</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
