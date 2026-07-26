export interface UserProfile {
  name: string;
  age: number;
  gender: string;
}

export interface MusicRecommendation {
  title: string;
  artist: string;
  category: string;
  youtube_url: string;
  embed_id: string;
  description: string;
}

export interface LearningTask {
  id: string;
  title: string;
  category: string;
  description: string;
  youtube_url?: string;
  embed_id?: string;
  estimated_minutes?: number;
  verification_type?: 'confirm_button' | 'text_question' | 'screenshot';
  verification_prompt?: string;
  is_completed?: boolean;
  completed_at?: string;
}

export interface LifeCompanionSession {
  id: string;
  user_id: string;
  profile: UserProfile;
  current_emotion: string;
  next_action_state: 'chat' | 'awaiting_email' | 'awaiting_video_completion' | 'awaiting_conceptual_answer' | 'awaiting_screenshot' | 'completed_milestone_1' | 'awaiting_track_switch_confirmation';
  email?: string;
  email_reminders_enabled?: boolean;
  music_recommendations?: MusicRecommendation[];
  current_task?: LearningTask;
  completed_tasks_count?: number;
  total_tasks_count?: number;
  current_milestone?: number;
  milestone_name?: string;
  progress_percent?: number;
}

export interface LifeCompanionChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  emotion?: string;
  salutation?: string;
  quote?: string;
  music_recommendations?: MusicRecommendation[];
  task?: LearningTask;
  action_type?: 'chat' | 'email_input' | 'video_completion' | 'screenshot_input';
  quick_options?: string[];
  reply_to?: string;
  screenshot_url?: string;
  feedback?: string;
  passed?: boolean;
  created_at: string;
}

export interface VerifyScreenshotResponse {
  passed: boolean;
  feedback: string;
  next_task?: LearningTask;
  next_action: string;
}
