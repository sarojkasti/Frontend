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
