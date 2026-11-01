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
  batches?: TrainingBatch[];
  createdAt?: string;
  updatedAt?: string;
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
