import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import * as trainingService from "@/service/training.service";
import { TrainingCourse } from "@/types/training";

export const useTrainingCourses = (params?: { category?: string; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["training-courses", params],
    queryFn: () => trainingService.fetchCourses(params),
  });
};

export const useTrainingBatches = (params?: { courseId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["training-batches", params],
    queryFn: () => trainingService.fetchBatches(params),
  });
};

export const useMyTrainings = () => {
  return useQuery({
    queryKey: ["my-trainings"],
    queryFn: trainingService.fetchMyTrainings,
  });
};

export const useMyPortfolio = () => {
  return useQuery({
    queryKey: ["my-cpd-portfolio"],
    queryFn: trainingService.fetchMyPortfolio,
  });
};

export const useTrainingAnalytics = () => {
  return useQuery({
    queryKey: ["training-analytics"],
    queryFn: trainingService.fetchTrainingAnalytics,
  });
};

export const useCourseCurriculum = (courseId: string | null) => {
  return useQuery({
    queryKey: ["training-curriculum", courseId],
    queryFn: () => trainingService.fetchCourseCurriculum(courseId!),
    enabled: Boolean(courseId),
  });
};

export const useCoursePlayer = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ["training-player", courseId],
    queryFn: () => trainingService.fetchCoursePlayerData(courseId!),
    enabled: Boolean(courseId),
  });
};

export const useMyCourseEnrollments = () => {
  return useQuery({
    queryKey: ["my-course-enrollments"],
    queryFn: trainingService.fetchMyCourseEnrollments,
  });
};

export const useCourseEnrollments = (courseId: string | null) => {
  return useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: () => trainingService.fetchCourseEnrollments(courseId!),
    enabled: Boolean(courseId),
  });
};

export const useLessonComments = (lessonId: string | null) => {
  return useQuery({
    queryKey: ["lesson-comments", lessonId],
    queryFn: () => trainingService.fetchLessonComments(lessonId!),
    enabled: Boolean(lessonId),
  });
};

export const useSelfEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => trainingService.selfEnrollCourse(courseId),
    onSuccess: () => {
      message.success("Enrolled in course!");
      queryClient.invalidateQueries({ queryKey: ["my-course-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to enroll");
    },
  });
};

export const useAdminEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, userIds, dueDate }: { courseId: string; userIds: string[]; dueDate?: string }) =>
      trainingService.adminEnrollCourse(courseId, userIds, dueDate),
    onSuccess: (data, vars) => {
      message.success(`Enrolled ${data.enrolledCount} student(s)`);
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-course-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["training-monitoring"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to enroll students");
    },
  });
};

export const useTrainingCategories = () => {
  return useQuery({
    queryKey: ["training-categories"],
    queryFn: trainingService.fetchTrainingCategories,
  });
};

export const useCreateTrainingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      trainingService.createTrainingCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-categories"] });
    },
  });
};

export const useDeleteTrainingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.deleteTrainingCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-categories"] });
    },
  });
};

export const useAdminMonitoringEnrollments = (enabled = true) => {
  return useQuery({
    queryKey: ["training-monitoring"],
    queryFn: trainingService.fetchAdminMonitoringEnrollments,
    enabled,
  });
};

export const useAdminRemoveEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.adminRemoveEnrollment(id),
    onSuccess: () => {
      message.success("Student unenrolled");
      queryClient.invalidateQueries({ queryKey: ["training-monitoring"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to unenroll");
    },
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TrainingCourse>) => trainingService.createCourse(payload),
    onSuccess: () => {
      message.success("Course created successfully");
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-analytics"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to create course");
    },
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => trainingService.createBatch(payload),
    onSuccess: () => {
      message.success("Batch scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["training-batches"] });
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-analytics"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to schedule batch");
    },
  });
};

export const useEnrollSelf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => trainingService.enrollSelfInBatch(batchId),
    onSuccess: (data) => {
      message.success(data.status === "waitlisted" ? "Waitlisted for batch" : "Successfully enrolled!");
      queryClient.invalidateQueries({ queryKey: ["training-batches"] });
      queryClient.invalidateQueries({ queryKey: ["my-trainings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Enrollment failed");
    },
  });
};

export const useNominateUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, userIds, remarks }: { batchId: string; userIds: string[]; remarks?: string }) =>
      trainingService.nominateUsersToBatch(batchId, userIds, remarks),
    onSuccess: (res) => {
      message.success(`Nominated ${res.added} user(s) successfully!`);
      queryClient.invalidateQueries({ queryKey: ["training-batches"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to nominate users");
    },
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, records }: { sessionId: string; records: any[] }) =>
      trainingService.markSessionAttendance(sessionId, records),
    onSuccess: () => {
      message.success("Attendance marked successfully");
      queryClient.invalidateQueries({ queryKey: ["training-batches"] });
      queryClient.invalidateQueries({ queryKey: ["my-trainings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to record attendance");
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, feedback }: { enrollmentId: string; feedback: any }) =>
      trainingService.submitTrainingFeedback(enrollmentId, feedback),
    onSuccess: () => {
      message.success("Feedback submitted. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["my-trainings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to submit feedback");
    },
  });
};

export const useCompleteEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => trainingService.completeEnrollmentAndIssueCertificate(enrollmentId),
    onSuccess: () => {
      message.success("Training marked completed & certificate issued!");
      queryClient.invalidateQueries({ queryKey: ["training-batches"] });
      queryClient.invalidateQueries({ queryKey: ["my-trainings"] });
      queryClient.invalidateQueries({ queryKey: ["my-cpd-portfolio"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to complete training");
    },
  });
};
