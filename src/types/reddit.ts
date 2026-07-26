export interface RedditSessionStatus {
  isConnected: boolean;
  hasPlatformAuth: boolean;
  redditUsername?: string;
  profilePicture?: string;
  connectedAt?: string;
  callbackUrl?: string;
}

export interface RedditPost {
  id: string;
  title: string;
  text: string;
  subreddit: string;
  postUrl?: string;
  createdAt: string;
}

export interface RedditScheduledPost {
  id: string;
  title: string;
  text: string;
  subreddit: string;
  scheduledAt: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  error?: string;
  postUrl?: string;
  createdAt: string;
}

export interface CreateRedditPostPayload {
  title: string;
  text: string;
  subreddit: string;
  scheduledAt?: string;
}
