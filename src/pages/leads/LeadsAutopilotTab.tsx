import { useState, useEffect } from 'react';
import { Sparkles, Save, Loader2, Globe, Clock, RefreshCw, Send, Check } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface AutopilotConfig {
	enabled: boolean;
	timeOfDay: string;
	timezone: string;
	prompt: string;
	outreachMode: string;
	followupMode: string;
	senderBusinessName: string;
	senderDescription: string;
	senderServices: string[];
	senderWebsite: string;
	followupEnabled: boolean;
	followupInterval: string;
	followupPrompt: string;
}

const DEFAULT_CONFIG: AutopilotConfig = {
	enabled: false,
	timeOfDay: '10:00',
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
	prompt: 'Pitch our services professionally, keeping it concise (under 150 words) with a clear call-to-action to schedule a short 10-minute demo.',
	outreachMode: 'autopilot',
	followupMode: 'autopilot',
	senderBusinessName: '',
	senderDescription: '',
	senderServices: [],
	senderWebsite: '',
	followupEnabled: false,
	followupInterval: '1_week',
	followupPrompt: 'Politely refer back to our previous message, asking if they have had a chance to check it out. Offer to answer any initial questions.',
};

const TIMEZONES: string[] = (() => {
	try {
		return Intl.supportedValuesOf('timeZone');
	} catch (e) {
		return [
			'UTC',
			'Africa/Cairo',
			'Africa/Johannesburg',
			'Africa/Lagos',
			'America/Anchorage',
			'America/Argentina/Buenos_Aires',
			'America/Bogota',
			'America/Caracas',
			'America/Chicago',
			'America/Denver',
			'America/Halifax',
			'America/Los_Angeles',
			'America/Mexico_City',
			'America/New_York',
			'America/Phoenix',
			'America/Santiago',
			'America/Sao_Paulo',
			'America/St_Johns',
			'Asia/Bangkok',
			'Asia/Dubai',
			'Asia/Hong_Kong',
			'Asia/Jakarta',
			'Asia/Jerusalem',
			'Asia/Kabul',
			'Asia/Karachi',
			'Asia/Kolkata',
			'Asia/Manila',
			'Asia/Riyadh',
			'Asia/Seoul',
			'Asia/Shanghai',
			'Asia/Singapore',
			'Asia/Taipei',
			'Asia/Tehran',
			'Asia/Tokyo',
			'Atlantic/Azores',
			'Atlantic/Cape_Verde',
			'Australia/Adelaide',
			'Australia/Brisbane',
			'Australia/Darwin',
			'Australia/Melbourne',
			'Australia/Perth',
			'Australia/Sydney',
			'Europe/Amsterdam',
			'Europe/Athens',
			'Europe/Berlin',
			'Europe/Brussels',
			'Europe/Dublin',
			'Europe/Helsinki',
			'Europe/Istanbul',
			'Europe/London',
			'Europe/Madrid',
			'Europe/Moscow',
			'Europe/Paris',
			'Europe/Rome',
			'Pacific/Auckland',
			'Pacific/Fiji',
			'Pacific/Honolulu',
		];
	}
})();

export function LeadsAutopilotTab() {
	const [config, setConfig] = useState<AutopilotConfig>(DEFAULT_CONFIG);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isCrawling, setIsCrawling] = useState(false);
	const [crawlUrl, setCrawlUrl] = useState('');
	const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
	const [servicesText, setServicesText] = useState('');

	useEffect(() => {
		const loadConfig = async () => {
			try {
				const res = await apiFetch(API_ENDPOINTS.leads.autopilot);
				const json = await res.json();
				if (json.success && json.data) {
					const data = json.data;
					setConfig({
						enabled: data.enabled ?? false,
						timeOfDay: data.timeOfDay || '10:00',
						timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
						prompt: data.prompt || '',
						outreachMode: data.outreachMode || 'autopilot',
						followupMode: data.followupMode || 'autopilot',
						senderBusinessName: data.senderBusinessName || '',
						senderDescription: data.senderDescription || '',
						senderServices: data.senderServices || [],
						senderWebsite: data.senderWebsite || '',
						followupEnabled: data.followupEnabled ?? false,
						followupInterval: data.followupInterval || '1_week',
						followupPrompt: data.followupPrompt || '',
					});
					setServicesText((data.senderServices || []).join(', '));
					if (data.senderWebsite) {
						setCrawlUrl(data.senderWebsite);
					}
				}
			} catch (err) {
				console.error('Failed to load autopilot config', err);
			} finally {
				setIsLoading(false);
			}
		};
		loadConfig();
	}, []);

	const showToast = (msg: string, ok: boolean) => {
		setToast({ msg, ok });
		setTimeout(() => setToast(null), 4000);
	};

	const handleCrawl = async () => {
		const targetUrl = crawlUrl.trim();
		if (!targetUrl) {
			showToast('Please enter a valid website URL', false);
			return;
		}

		// Ensure it has protocol
		const url = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;

		setIsCrawling(true);
		try {
			const res = await apiFetch(API_ENDPOINTS.websiteChatbot.crawl, {
				method: 'POST',
				body: JSON.stringify({ url }),
			});
			const json = await res.json();
			if (json.success && json.data) {
				const data = json.data;
				setConfig(prev => ({
					...prev,
					senderBusinessName: data.businessName || prev.senderBusinessName,
					senderDescription: data.description || prev.senderDescription,
					senderServices: data.services || prev.senderServices,
					senderWebsite: url,
				}));
				setServicesText((data.services || []).join(', '));
				showToast('Business profile generated and filled successfully!', true);
			} else {
				showToast(json.error || 'Failed to crawl website', false);
			}
		} catch (err) {
			showToast('Network error during crawl', false);
		} finally {
			setIsCrawling(false);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		// Parse services from text input
		const parsedServices = servicesText
			.split(',')
			.map(s => s.trim())
			.filter(Boolean);

		const updatedConfig = {
			...config,
			senderServices: parsedServices,
		};

		try {
			const res = await apiFetch(API_ENDPOINTS.leads.saveAutopilot, {
				method: 'POST',
				body: JSON.stringify(updatedConfig),
			});
			const json = await res.json();
			if (json.success) {
				showToast('Autopilot configuration saved!', true);
				setConfig(updatedConfig);
			} else {
				showToast(json.error || 'Failed to save configuration', false);
			}
		} catch (err) {
			showToast('Network error — could not save', false);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-12">
				<Loader2 className="animate-spin text-amber-500" size={32} />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Title Card */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
				<div className="absolute top-0 right-0 p-8 opacity-5">
					<Sparkles size={160} className="text-amber-500" />
				</div>
				<div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<h1 className="text-xl font-bold text-white flex items-center gap-2">
							<Sparkles size={20} className="text-amber-500" /> Leads Auto Pilot Co-Pilot
						</h1>
						<p className="text-slate-400 text-xs mt-1.5 max-w-xl">
							Automate daily cold outreach emails and scheduled follow-ups using AI-generated copy. Autopilot runs securely in the background once configured.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
							config.enabled || config.followupEnabled
								? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-400'
								: 'bg-slate-850 border border-slate-700 text-slate-400'
						}`}>
							<span className={`w-1.5 h-1.5 rounded-full ${config.enabled || config.followupEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
							{config.enabled || config.followupEnabled ? 'Active' : 'Inactive'}
						</span>
					</div>
				</div>
			</div>

			{/* Configuration Panels */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Column 1 & 2: Business Profile & Autopilot Details */}
				<div className="lg:col-span-2 space-y-6">
					{/* 1. Sender Business Profile */}
					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
						<h2 className="text-sm font-bold text-white flex items-center gap-2">
							<Globe size={16} className="text-amber-500" /> 1. My Business Profile
						</h2>
						<p className="text-xs text-slate-400">
							Define your business details so the AI co-pilot can draft highly personalized pitches on your behalf.
						</p>

						{/* Crawl URL Input */}
						<div className="pt-2">
							<label className="block text-xs font-semibold text-slate-300 mb-1.5">
								Autofill via Website Crawler
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="e.g. nexbotix.online"
									value={crawlUrl}
									onChange={e => setCrawlUrl(e.target.value)}
									className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
								/>
								<button
									onClick={handleCrawl}
									disabled={isCrawling}
									className="bg-amber-600 text-white font-semibold px-4 rounded-xl text-xs hover:bg-amber-700 disabled:bg-slate-850 disabled:text-slate-600 flex items-center gap-1.5 shrink-0 transition-colors"
								>
									{isCrawling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
									{isCrawling ? 'Crawling...' : 'Crawl & Autofill'}
								</button>
							</div>
						</div>

						<hr className="border-slate-800 my-4" />

						{/* Profile Details Inputs */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-semibold text-slate-300 mb-1.5">
									Company Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={config.senderBusinessName}
									onChange={e => setConfig(prev => ({ ...prev, senderBusinessName: e.target.value }))}
									placeholder="Your business name"
									className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-slate-300 mb-1.5">
									Company Website
								</label>
								<input
									type="text"
									value={config.senderWebsite}
									onChange={e => setConfig(prev => ({ ...prev, senderWebsite: e.target.value }))}
									placeholder="https://yourwebsite.com"
									className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-semibold text-slate-300 mb-1.5">
								Business Description &amp; Value Proposition <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								value={config.senderDescription}
								onChange={e => setConfig(prev => ({ ...prev, senderDescription: e.target.value }))}
								placeholder="Describe what your business does and the main value you provide..."
								className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all leading-relaxed resize-y"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold text-slate-300 mb-1.5">
								Services Offered (comma-separated)
							</label>
							<input
								type="text"
								value={servicesText}
								onChange={e => setServicesText(e.target.value)}
								placeholder="e.g. Lead generation, WhatsApp Marketing, SEO Optimization"
								className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
							/>
						</div>
					</div>

					{/* 2. Cold Outreach settings */}
					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-bold text-white flex items-center gap-2">
								<Send size={16} className="text-amber-500" /> 2. Cold Outreach Autopilot
							</h2>
							<button
								onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
								className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.enabled ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700'}`}
							>
								<span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${config.enabled ? 'translate-x-5' : ''}`} />
							</button>
						</div>
						<p className="text-xs text-slate-400">
							When active, the AI pilot will run daily to write and send personalized pitch emails to newly collected leads that have not been contacted.
						</p>

						{config.enabled && (
							<div className="pt-2 space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
											<Clock size={13} /> Time of Day
										</label>
										<input
											type="time"
											value={config.timeOfDay}
											onChange={e => setConfig(prev => ({ ...prev, timeOfDay: e.target.value }))}
											className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
										/>
									</div>

									<div>
										<label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
											<Globe size={13} /> Timezone
										</label>
										<select
											value={config.timezone}
											onChange={e => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
											className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
										>
											{TIMEZONES.map(tz => (
												<option key={tz} value={tz}>{tz}</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-xs font-semibold text-slate-300 mb-1.5">
											Outreach Option
										</label>
										<select
											value={config.outreachMode}
											onChange={e => setConfig(prev => ({ ...prev, outreachMode: e.target.value }))}
											className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
										>
											<option value="autopilot">Autopilot (Auto-send)</option>
											<option value="copilot">Co-pilot (Save draft)</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-300 mb-1.5">
										AI Custom Instructions / Outreach Pitch Context
									</label>
									<textarea
										rows={3}
										value={config.prompt}
										onChange={e => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
										placeholder="e.g. Introduce nexBotix as an omnichannel WhatsApp and Email marketing automation dashboard..."
										className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all leading-relaxed resize-y"
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Column 3: Follow-up Settings */}
				<div className="space-y-6">
					{/* 3. Follow-up Pilot settings */}
					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-bold text-white flex items-center gap-2">
								<Clock size={16} className="text-amber-500" /> 3. Follow-up Autopilot
							</h2>
							<button
								onClick={() => setConfig(prev => ({ ...prev, followupEnabled: !prev.followupEnabled }))}
								className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.followupEnabled ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700'}`}
							>
								<span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${config.followupEnabled ? 'translate-x-5' : ''}`} />
							</button>
						</div>
						<p className="text-xs text-slate-400">
							Keep prospects warm by setting automated follow-up sequences. The pilot checks previously contacted leads and sends friendly follow-up emails at your chosen intervals.
						</p>

						{config.followupEnabled && (
							<div className="pt-2 space-y-4">
								<div>
									<label className="block text-xs font-semibold text-slate-300 mb-1.5">
										Follow-up Frequency
									</label>
									<select
										value={config.followupInterval}
										onChange={e => setConfig(prev => ({ ...prev, followupInterval: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
									>
										<option value="1_week">Every 1 Week (7 days)</option>
										<option value="2_weeks">Every 2 Weeks (14 days)</option>
										<option value="1_month">Every Month (30 days)</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-300 mb-1.5">
										Follow-up Option (Autopilot vs Co-pilot)
									</label>
									<select
										value={config.followupMode}
										onChange={e => setConfig(prev => ({ ...prev, followupMode: e.target.value }))}
										className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
									>
										<option value="autopilot">Autopilot (Auto-generate &amp; send)</option>
										<option value="copilot">Co-pilot (Save draft for review)</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-300 mb-1.5">
										AI Custom Follow-up Instructions
									</label>
									<textarea
										rows={4}
										value={config.followupPrompt}
										onChange={e => setConfig(prev => ({ ...prev, followupPrompt: e.target.value }))}
										placeholder="e.g. Ask if they have any questions about the demo link, keep the tone warm and conversational."
										className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all leading-relaxed resize-y"
									/>
								</div>
							</div>
						)}
					</div>

					{/* 4. Action Save Button */}
					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
						<button
							onClick={handleSave}
							disabled={isSaving || (!config.senderBusinessName && (config.enabled || config.followupEnabled))}
							className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-md"
						>
							{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
							{isSaving ? 'Saving Settings...' : 'Save Autopilot Settings'}
						</button>
						{!config.senderBusinessName && (config.enabled || config.followupEnabled) && (
							<p className="text-[10px] text-rose-400 text-center font-semibold">
								⚠ Company name is required when Autopilot is enabled
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Toast Message Alert */}
			{toast && (
				<div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-xs text-white font-medium flex items-center gap-1.5 transition-all ${
					toast.ok ? 'bg-emerald-600' : 'bg-rose-600'
				}`}>
					{toast.ok ? <Check size={14} /> : null}
					{toast.msg}
				</div>
			)}
		</div>
	);
}
export default LeadsAutopilotTab;
