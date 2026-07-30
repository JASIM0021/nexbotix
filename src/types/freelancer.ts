export interface FreelancerSessionStatus {
  isConnected: boolean;
  freelancerUsername?: string;
  freelancerUserId?: number;
  profilePicture?: string;
  connectedAt?: string;
}

export interface FreelancerBotConfig {
  id?: string;
  isEnabled: boolean;
  skills: string[];
  minBudget: number;
  maxBudget: number;
  bidsPerDay: number;
  requiresApproval: boolean;
  profileSummary: string;
  exampleBids: string[];
  autoScheduleIntervalMins: number;
  dailyBidsCount: number;
  dailyBidsResetAt: string;
  lastRunAt?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface FreelancerPendingBid {
  id: string;
  token: string;
  projectId: number;
  projectTitle: string;
  projectUrl: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  proposedAmount: number;
  periodDays: number;
  proposalText: string;
  status: 'pending' | 'approved' | 'deleted' | 'expired' | 'failed';
  error?: string;
  createdAt: string;
}

export interface FreelancerBidLog {
  id: string;
  projectId: number;
  projectTitle: string;
  projectUrl: string;
  category: string;
  amount: number;
  periodDays: number;
  proposalText: string;
  status: 'submitted' | 'failed';
  error?: string;
  freelancerBidId?: number;
  createdAt: string;
}
