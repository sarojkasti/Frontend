import axios from "axios";
import {
  TrainingCourse,
  TrainingBatch,
  TrainingEnrollment,
  TrainingAttendance,
  CpdPortfolio,
  TrainingAnalytics,
  CoursePlayerData,
  TrainingAccessPolicy,
  TrainingLesson,
  TrainingLessonComment,
  TrainingModule,
  TrainingCategory,
  AdminMonitoringEnrollment,
} from "@/types/training";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

// Courses
export const fetchCourses = async (params?: { category?: string; status?: string; search?: string }): Promise<TrainingCourse[]> => {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  const res = await axios.get(`${backendURI}/training/courses?${query.toString()}`);
  return res.data;
};

export const fetchCourseById = async (id: string): Promise<TrainingCourse> => {
  const res = await axios.get(`${backendURI}/training/courses/${id}`);
  return res.data;
};

export const createCourse = async (payload: Partial<TrainingCourse>): Promise<TrainingCourse> => {
  const res = await axios.post(`${backendURI}/training/courses`, payload);
  return res.data;
};

export const updateCourse = async (id: string, payload: Partial<TrainingCourse>): Promise<TrainingCourse> => {
  const res = await axios.patch(`${backendURI}/training/courses/${id}`, payload);
  return res.data;
};

export const deleteCourse = async (id: string): Promise<{ message: string }> => {
  const res = await axios.delete(`${backendURI}/training/courses/${id}`);
  return res.data;
};

// LMS Curriculum, Timing Policy, Enrollment & Player
export const getLessonStreamUrl = (lessonId: string) =>
  `${backendURI}/training/lessons/${lessonId}/stream`;

export const fetchCourseCurriculum = async (courseId: string): Promise<{
  course: TrainingCourse;
  modules: TrainingModule[];
  accessPolicy: TrainingAccessPolicy | null;
}> => {
  const res = await axios.get(`${backendURI}/training/courses/${courseId}/curriculum`);
  return res.data;
};

export const createModule = async (courseId: string, payload: Partial<TrainingModule>): Promise<TrainingModule> => {
  const res = await axios.post(`${backendURI}/training/courses/${courseId}/modules`, payload);
  return res.data;
};

export const deleteModule = async (moduleId: string) => {
  const res = await axios.delete(`${backendURI}/training/modules/${moduleId}`);
  return res.data;
};

export const createLesson = async (moduleId: string, payload: Partial<TrainingLesson>): Promise<TrainingLesson> => {
  const res = await axios.post(`${backendURI}/training/modules/${moduleId}/lessons`, payload);
  return res.data;
};

export const deleteLesson = async (lessonId: string) => {
  const res = await axios.delete(`${backendURI}/training/lessons/${lessonId}`);
  return res.data;
};

export const uploadLessonFile = async (lessonId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${backendURI}/training/lessons/${lessonId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const upsertAccessPolicy = async (courseId: string, payload: TrainingAccessPolicy) => {
  const res = await axios.post(`${backendURI}/training/courses/${courseId}/access-policy`, payload);
  return res.data;
};

export const adminEnrollCourse = async (courseId: string, userIds: string[], dueDate?: string) => {
  const res = await axios.post(`${backendURI}/training/courses/${courseId}/enroll-users`, { userIds, dueDate });
  return res.data;
};

export const selfEnrollCourse = async (courseId: string) => {
  const res = await axios.post(`${backendURI}/training/courses/${courseId}/self-enroll`, {});
  return res.data;
};

export const fetchCourseEnrollments = async (courseId: string): Promise<TrainingEnrollment[]> => {
  const res = await axios.get(`${backendURI}/training/courses/${courseId}/enrollments`);
  return res.data;
};

export const fetchMyCourseEnrollments = async (): Promise<TrainingEnrollment[]> => {
  const res = await axios.get(`${backendURI}/training/my-courses`);
  return res.data;
};

export const fetchCoursePlayerData = async (courseId: string): Promise<CoursePlayerData> => {
  const res = await axios.get(`${backendURI}/training/learn/${courseId}`);
  return res.data;
};

export const updateLessonProgress = async (
  lessonId: string,
  payload: {
    status?: 'not_started' | 'in_progress' | 'completed';
    lastPositionSeconds?: number;
    watchedSeconds?: number;
    timeSpentSeconds?: number;
    completionPercent?: number;
  }
) => {
  const res = await axios.post(`${backendURI}/training/lessons/${lessonId}/progress`, payload);
  return res.data;
};

export const addQuizQuestion = async (lessonId: string, payload: any) => {
  const res = await axios.post(`${backendURI}/training/lessons/${lessonId}/quiz-questions`, payload);
  return res.data;
};

export const deleteQuizQuestion = async (questionId: string) => {
  const res = await axios.delete(`${backendURI}/training/quiz-questions/${questionId}`);
  return res.data;
};

export const submitQuizAttempt = async (lessonId: string, answers: Record<string, string[]>) => {
  const res = await axios.post(`${backendURI}/training/lessons/${lessonId}/quiz-attempt`, { answers });
  return res.data;
};

export const fetchLessonComments = async (lessonId: string): Promise<TrainingLessonComment[]> => {
  const res = await axios.get(`${backendURI}/training/lessons/${lessonId}/comments`);
  return res.data;
};

export const createLessonComment = async (lessonId: string, content: string, parentId?: string) => {
  const res = await axios.post(`${backendURI}/training/lessons/${lessonId}/comments`, { content, parentId });
  return res.data;
};

// Dynamic Categories & Admin Monitoring
export const fetchTrainingCategories = async (): Promise<TrainingCategory[]> => {
  const res = await axios.get(`${backendURI}/training/categories`);
  return res.data;
};

export const createTrainingCategory = async (payload: { name: string; description?: string }): Promise<TrainingCategory> => {
  const res = await axios.post(`${backendURI}/training/categories`, payload);
  return res.data;
};

export const deleteTrainingCategory = async (id: string) => {
  const res = await axios.delete(`${backendURI}/training/categories/${id}`);
  return res.data;
};

export const fetchAdminMonitoringEnrollments = async (): Promise<AdminMonitoringEnrollment[]> => {
  const res = await axios.get(`${backendURI}/training/monitoring/enrollments`);
  return res.data;
};

export const adminRemoveEnrollment = async (enrollmentId: string) => {
  const res = await axios.delete(`${backendURI}/training/monitoring/enrollments/${enrollmentId}`);
  return res.data;
};

// Batches
export const fetchBatches = async (params?: { courseId?: string; status?: string }): Promise<TrainingBatch[]> => {
  const query = new URLSearchParams();
  if (params?.courseId) query.append("courseId", params.courseId);
  if (params?.status) query.append("status", params.status);
  const res = await axios.get(`${backendURI}/training/batches?${query.toString()}`);
  return res.data;
};

export const fetchBatchById = async (id: string): Promise<TrainingBatch> => {
  const res = await axios.get(`${backendURI}/training/batches/${id}`);
  return res.data;
};

export const createBatch = async (payload: any): Promise<TrainingBatch> => {
  const res = await axios.post(`${backendURI}/training/batches`, payload);
  return res.data;
};

export const updateBatch = async (id: string, payload: any): Promise<TrainingBatch> => {
  const res = await axios.patch(`${backendURI}/training/batches/${id}`, payload);
  return res.data;
};

export const deleteBatch = async (id: string): Promise<{ message: string }> => {
  const res = await axios.delete(`${backendURI}/training/batches/${id}`);
  return res.data;
};

// Enrollment & Nominations
export const enrollSelfInBatch = async (batchId: string): Promise<TrainingEnrollment> => {
  const res = await axios.post(`${backendURI}/training/batches/${batchId}/enroll`, {});
  return res.data;
};

export const nominateUsersToBatch = async (batchId: string, userIds: string[], remarks?: string) => {
  const res = await axios.post(`${backendURI}/training/batches/${batchId}/nominate`, { userIds, remarks });
  return res.data;
};

export const cancelEnrollment = async (enrollmentId: string) => {
  const res = await axios.delete(`${backendURI}/training/enrollments/${enrollmentId}`);
  return res.data;
};

export const fetchMyTrainings = async (): Promise<TrainingEnrollment[]> => {
  const res = await axios.get(`${backendURI}/training/my-trainings`);
  return res.data;
};

export const fetchMyPortfolio = async (): Promise<CpdPortfolio> => {
  const res = await axios.get(`${backendURI}/training/my-portfolio`);
  return res.data;
};

// Attendance
export const fetchSessionAttendance = async (sessionId: string): Promise<TrainingAttendance[]> => {
  const res = await axios.get(`${backendURI}/training/sessions/${sessionId}/attendance`);
  return res.data;
};

export const markSessionAttendance = async (
  sessionId: string,
  records: Array<{ userId: string; status: 'present' | 'absent' | 'excused' | 'late'; remarks?: string }>
) => {
  const res = await axios.post(`${backendURI}/training/sessions/${sessionId}/attendance`, { records });
  return res.data;
};

// Feedback & Completion
export const submitTrainingFeedback = async (
  enrollmentId: string,
  feedback: { contentRating: number; trainerRating: number; overallRating: number; comment?: string; suggestions?: string }
) => {
  const res = await axios.post(`${backendURI}/training/enrollments/${enrollmentId}/feedback`, feedback);
  return res.data;
};

export const completeEnrollmentAndIssueCertificate = async (enrollmentId: string) => {
  const res = await axios.post(`${backendURI}/training/enrollments/${enrollmentId}/complete`, {});
  return res.data;
};

export const fetchTrainingAnalytics = async (): Promise<TrainingAnalytics> => {
  const res = await axios.get(`${backendURI}/training/analytics`);
  return res.data;
};
