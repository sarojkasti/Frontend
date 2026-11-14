import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  getWorkingYears,
  getCurrentWorkingYear,
  getWorkingYearConfig,
  updateWorkingYearConfig,
  createWorkingYear,
  updateWorkingYear,
  setWorkingYearCurrent,
  deleteWorkingYear,
  generateNextWorkingYear
} from "@/service/workingYear.service";
import { WorkingYearType, WorkingYearConfigType } from "@/types/workingYear";

export const useWorkingYears = () => {
  return useQuery<WorkingYearType[]>({
    queryKey: ["working-years"],
    queryFn: getWorkingYears,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });
};

export const useCurrentWorkingYear = () => {
  return useQuery<WorkingYearType>({
    queryKey: ["current-working-year"],
    queryFn: getCurrentWorkingYear,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });
};

export const useWorkingYearConfig = () => {
  return useQuery<WorkingYearConfigType>({
    queryKey: ["working-year-config"],
    queryFn: getWorkingYearConfig,
    staleTime: 10 * 60 * 1000
  });
};

export const useUpdateWorkingYearConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<WorkingYearConfigType>) =>
      updateWorkingYearConfig(payload),
    onSuccess: () => {
      message.success("Fiscal Year configuration updated successfully");
      queryClient.invalidateQueries({ queryKey: ["working-year-config"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to update FY configuration");
    }
  });
};

export const useCreateWorkingYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<WorkingYearType>) => createWorkingYear(payload),
    onSuccess: () => {
      message.success("Working year created successfully");
      queryClient.invalidateQueries({ queryKey: ["working-years"] });
      queryClient.invalidateQueries({ queryKey: ["current-working-year"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to create working year");
    }
  });
};

export const useUpdateWorkingYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<WorkingYearType> }) =>
      updateWorkingYear(id, payload),
    onSuccess: () => {
      message.success("Working year updated successfully");
      queryClient.invalidateQueries({ queryKey: ["working-years"] });
      queryClient.invalidateQueries({ queryKey: ["current-working-year"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to update working year");
    }
  });
};

export const useSetCurrentWorkingYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setWorkingYearCurrent(id),
    onSuccess: () => {
      message.success("Current fiscal year changed successfully");
      queryClient.invalidateQueries({ queryKey: ["working-years"] });
      queryClient.invalidateQueries({ queryKey: ["current-working-year"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to set current working year");
    }
  });
};

export const useDeleteWorkingYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkingYear(id),
    onSuccess: (data) => {
      message.success(data?.message || "Working year deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["working-years"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to delete working year");
    }
  });
};

export const useGenerateNextWorkingYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateNextWorkingYear,
    onSuccess: (data) => {
      message.success(`Generated next fiscal year: ${data?.name}`);
      queryClient.invalidateQueries({ queryKey: ["working-years"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to generate next fiscal year");
    }
  });
};
