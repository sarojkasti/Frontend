import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import * as academyService from "@/service/academy.service";
import { AcademyGuide, AcademyCategory, AcademyFaq } from "@/types/academy";

export const useAcademyCategories = () => {
  return useQuery({
    queryKey: ["academy-categories"],
    queryFn: academyService.fetchAcademyCategories,
  });
};

export const useAcademyGuides = (params?: { categoryId?: string; search?: string; featured?: boolean }) => {
  return useQuery({
    queryKey: ["academy-guides", params],
    queryFn: () => academyService.fetchAcademyGuides(params),
  });
};

export const useGuideBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["academy-guide", slug],
    queryFn: () => academyService.fetchGuideBySlug(slug),
    enabled: !!slug,
  });
};

export const useContextualHelp = (route: string) => {
  return useQuery({
    queryKey: ["academy-contextual-help", route],
    queryFn: () => academyService.fetchContextualHelp(route),
    enabled: !!route,
  });
};

export const useOnboardingChecklist = () => {
  return useQuery({
    queryKey: ["academy-onboarding-checklist"],
    queryFn: academyService.fetchOnboardingChecklist,
  });
};

export const useAcademyFaqs = (categoryId?: string) => {
  return useQuery({
    queryKey: ["academy-faqs", categoryId],
    queryFn: () => academyService.fetchAcademyFaqs(categoryId),
  });
};

export const useRecordGuideProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      guideId,
      payload,
    }: {
      guideId: string;
      payload: { isCompleted?: boolean; lastPositionSeconds?: number };
    }) => academyService.recordGuideProgress(guideId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-onboarding-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["academy-guides"] });
      queryClient.invalidateQueries({ queryKey: ["academy-contextual-help"] });
    },
  });
};

export const useCreateGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AcademyGuide>) => academyService.createAcademyGuide(payload),
    onSuccess: () => {
      message.success("Guide created successfully");
      queryClient.invalidateQueries({ queryKey: ["academy-guides"] });
      queryClient.invalidateQueries({ queryKey: ["academy-categories"] });
      queryClient.invalidateQueries({ queryKey: ["academy-contextual-help"] });
      queryClient.invalidateQueries({ queryKey: ["academy-onboarding-checklist"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to create guide");
    },
  });
};

export const useUpdateGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademyGuide> }) =>
      academyService.updateAcademyGuide(id, payload),
    onSuccess: () => {
      message.success("Guide updated successfully");
      queryClient.invalidateQueries({ queryKey: ["academy-guides"] });
      queryClient.invalidateQueries({ queryKey: ["academy-categories"] });
      queryClient.invalidateQueries({ queryKey: ["academy-contextual-help"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to update guide");
    },
  });
};

export const useDeleteGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academyService.deleteAcademyGuide(id),
    onSuccess: () => {
      message.success("Guide deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["academy-guides"] });
      queryClient.invalidateQueries({ queryKey: ["academy-categories"] });
      queryClient.invalidateQueries({ queryKey: ["academy-contextual-help"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to delete guide");
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AcademyCategory>) => academyService.createAcademyCategory(payload),
    onSuccess: () => {
      message.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["academy-categories"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to create category");
    },
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AcademyFaq>) => academyService.createAcademyFaq(payload),
    onSuccess: () => {
      message.success("FAQ created successfully");
      queryClient.invalidateQueries({ queryKey: ["academy-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["academy-contextual-help"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to create FAQ");
    },
  });
};
