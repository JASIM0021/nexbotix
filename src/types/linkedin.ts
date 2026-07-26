export interface LinkedInSessionStatus {
  isConnected: boolean;
  hasCredentials: boolean;
  hasPlatformAuth?: boolean;
  profileName?: string | null;
  profilePicture?: string | null;
  email?: string | null;
  connectedAt?: string | null;
  callbackUrl?: string | null;
}

export interface LinkedInBotConfig {
  isEnabled: boolean;
  keywords: string[];
  postsPerDay: number;
  schedule: 'daily' | 'off';
  postTime: string;        // "HH:MM" UTC
  postGapMinutes: number;  // gap between posts when postsPerDay > 1
  generateImage: boolean;
  requiresApproval?: boolean;
  adText?: string;
  systemPrompt?: string;
  engagementType?: 'technical' | 'marketing' | 'learning' | 'storytelling';
  lastRunAt?: string;
}

export interface LinkedInBotRunResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  postText?: string;
  hasImage: boolean;
  imageUrl?: string;
  createdAt?: string;
  requiresApproval?: boolean;
}

export interface LinkedInPost {
  id: string;
  text: string;
  imageUrl?: string;
  postUrl?: string;
  createdAt: string;
}

export interface LinkedInScheduledPost {
  id: string;
  text: string;
  imageUrl?: string;
  scheduledAt: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  error?: string;
  postUrl?: string;
  createdAt: string;
}

export interface CreateLinkedInPostPayload {
  text: string;
  imageUrl?: string;
  scheduledAt?: string;
}

export interface LinkedInPendingPost {
  id: string;
  userId: string;
  text: string;
  imageBase64?: string;
  imageMime?: string;
  imageUrl?: string;
  token: string;
  status: 'pending' | 'approved' | 'deleted' | 'expired';
  expiresAt: string;
  createdAt: string;
}
