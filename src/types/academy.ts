export interface AcademyCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  guides?: AcademyGuide[];
  faqs?: AcademyFaq[];
  created_at?: string;
  updated_at?: string;
}

export interface VideoChapter {
  title: string;
  timestamp: number; // in seconds
}

export interface AcademyProgress {
  id: string;
  isCompleted: boolean;
  completedAt?: string;
  lastPositionSeconds: number;
}

export interface AcademyGuide {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoChapters?: VideoChapter[];
  targetRoles?: string[];
  associatedRoutes?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTimeMinutes: number;
  isFeatured: boolean;
  isOnboardingChecklist: boolean;
  checklistOrder: number;
  sortOrder: number;
  isActive: boolean;
  category?: AcademyCategory;
  userProgress?: AcademyProgress | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyFaq {
  id: string;
  question: string;
  answer: string;
  associatedRoutes?: string[];
  sortOrder: number;
  isActive: boolean;
  category?: AcademyCategory;
}

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  estimatedReadTimeMinutes: number;
  videoDurationSeconds?: number;
  hasVideo: boolean;
  checklistOrder: number;
  isCompleted: boolean;
}

export interface OnboardingChecklistResponse {
  total: number;
  completed: number;
  progressPercent: number;
  items: OnboardingChecklistItem[];
}

export interface ContextualHelpResponse {
  route: string;
  guides: AcademyGuide[];
  faqs: AcademyFaq[];
}
