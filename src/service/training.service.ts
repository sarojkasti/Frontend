import axios from "axios";
import {
  TrainingCourse,
  TrainingBatch,
  TrainingEnrollment,
  TrainingAttendance,
  CpdPortfolio,
  TrainingAnalytics,
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
