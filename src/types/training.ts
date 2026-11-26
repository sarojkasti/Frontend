export interface TrainingCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminMonitoringEnrollment {
  id: string;
  courseId: string;
  course?: {
    id: string;
    code: string;
    title: string;
    category: string;
  } | null;
  student?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  enrollmentType: 'self' | 'nominated';
  nominatedBy?: { id: string; name: string } | null;
  status: string;
  progressPercent: number;
  quizScore?: number | null;
  timeSpentSeconds: number;
  dueDate?: string | null;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
  certificateNumber?: string | null;
  createdAt: string;
}

export interface TrainingCourse {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  cpdHours: number;
  durationMinutes: number;
  targetRoles?: string[];
  isMandatory: boolean;
  prerequisites?: string;
  materialsUrl?: string;
  status: 'active' | 'draft' | 'archived';
  courseType?: 'self_paced' | 'instructor_led' | 'hybrid';
  allowSelfEnrollment?: boolean;
  strictSystemOnly?: boolean;
  sequentialLock?: boolean;
  passingScore?: number;
  instructorId?: string;
  instructor?: { id: string; name: string; email?: string };
  accessPolicy?: TrainingAccessPolicy | null;
  modules?: TrainingModule[];
  batches?: TrainingBatch[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingAccessPolicy {
  id?: string;
  courseId?: string;
  mode: 'always' | 'allow_window' | 'ban_window';
  allowedDays: number[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
  exemptRoles?: string[];
  validFromDate?: string | null;
  validUntilDate?: string | null;
  policyNote?: string | null;
}

export interface TrainingQuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TrainingQuizQuestion {
  id: string;
  lessonId?: string;
  questionText: string;
  questionType: 'single' | 'multiple';
  options: TrainingQuizOption[];
  points: number;
  sortOrder?: number;
}

export interface TrainingLessonProgress {
  id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  lastPositionSeconds: number;
  watchedSeconds: number;
  timeSpentSeconds: number;
  completionPercent: number;
  completedAt?: string;
}

export interface TrainingLesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'document' | 'rich_text' | 'quiz';
  hasFile?: boolean;
  mimeType?: string;
  originalFileName?: string;
  richTextContent?: string | null;
  durationMinutes: number;
  durationSeconds?: number;
  sortOrder: number;
  isRequired: boolean;
  passingScore?: number;
  quizQuestions?: TrainingQuizQuestion[];
  isLocked?: boolean;
  progress?: TrainingLessonProgress;
}

export interface TrainingModule {
  id: string;
  courseId?: string;
  title: string;
  description?: string;
  sortOrder: number;
  isPublished?: boolean;
  lessons: TrainingLesson[];
}

export interface CoursePlayerData {
  course: TrainingCourse;
  enrollment: {
    id: string;
    status: string;
    progressPercent: number;
    lastLessonId?: string;
    dueDate?: string;
    certificateNumber?: string;
    completedAt?: string;
  } | null;
  accessStatus: {
    allowed: boolean;
    reason?: string;
  };
  accessPolicy: TrainingAccessPolicy | null;
  modules: TrainingModule[];
}

export interface TrainingLessonComment {
  id: string;
  lessonId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role?: { name: string; displayName?: string };
  };
}

export interface TrainingSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  dateNepali?: string;
  startTime: string;
  endTime: string;
  venueOrLink?: string;
  description?: string;
  isCompleted: boolean;
}

export interface TrainingBatch {
  id: string;
  batchName: string;
  deliveryMode: 'in_person' | 'virtual' | 'hybrid' | 'self_paced';
  venueOrLink?: string;
  maxCapacity: number;
  course?: TrainingCourse;
  internalTrainer?: {
    id: string;
    name: string;
    email: string;
    role?: { name: string; displayName?: string };
  };
  externalTrainerName?: string;
  externalTrainerOrg?: string;
  startDate: string;
  endDate: string;
  startDateNepali?: string;
  endDateNepali?: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  sessions?: TrainingSession[];
  enrollments?: TrainingEnrollment[];
  createdAt?: string;
}

export interface TrainingEnrollment {
  id: string;
  batch: TrainingBatch;
  user: {
    id: string;
    name: string;
    email: string;
    role?: { name: string; displayName?: string };
  };
  enrollmentType: 'self' | 'nominated';
  nominatedBy?: { id: string; name: string };
  status: 'enrolled' | 'waitlisted' | 'completed' | 'failed' | 'dropped';
  quizScore?: number;
  isPassed: boolean;
  completedAt?: string;
  certificateNumber?: string;
  attendances?: TrainingAttendance[];
  feedback?: TrainingFeedback;
}

export interface TrainingAttendance {
  id: string;
  session: TrainingSession;
  enrollment: TrainingEnrollment;
  user: { id: string; name: string; email: string };
  status: 'present' | 'absent' | 'excused' | 'late';
  remarks?: string;
}

export interface TrainingFeedback {
  id: string;
  contentRating: number;
  trainerRating: number;
  overallRating: number;
  comment?: string;
  suggestions?: string;
}

export interface CpdPortfolio {
  userId: string;
  totalCompletedTrainings: number;
  totalCpdHours: number;
  targetAnnualCpdHours: number;
  courseHistory: Array<{
    enrollmentId: string;
    courseCode: string;
    courseTitle: string;
    category: string;
    cpdHours: number;
    certificateNumber?: string;
    completedAt?: string;
    batchName?: string;
  }>;
}

export interface TrainingAnalytics {
  totalCourses: number;
  totalBatches: number;
  totalEnrollments: number;
  completedTrainings: number;
  categoryDistribution: Record<string, number>;
}
