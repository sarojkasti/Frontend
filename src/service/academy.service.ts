import axios from "axios";
import {
  AcademyCategory,
  AcademyGuide,
  AcademyFaq,
  AcademyProgress,
  OnboardingChecklistResponse,
  ContextualHelpResponse,
} from "@/types/academy";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

// Categories
export const fetchAcademyCategories = async (): Promise<AcademyCategory[]> => {
  const res = await axios.get(`${backendURI}/academy/categories`);
  return res.data;
};

export const createAcademyCategory = async (payload: Partial<AcademyCategory>): Promise<AcademyCategory> => {
  const res = await axios.post(`${backendURI}/academy/categories`, payload);
  return res.data;
};

export const updateAcademyCategory = async (id: string, payload: Partial<AcademyCategory>): Promise<AcademyCategory> => {
  const res = await axios.patch(`${backendURI}/academy/categories/${id}`, payload);
  return res.data;
};

export const deleteAcademyCategory = async (id: string): Promise<any> => {
  const res = await axios.delete(`${backendURI}/academy/categories/${id}`);
  return res.data;
};

// Contextual Help & Onboarding
export const fetchContextualHelp = async (route: string): Promise<ContextualHelpResponse> => {
  const res = await axios.get(`${backendURI}/academy/context?route=${encodeURIComponent(route)}`);
  return res.data;
};

export const fetchOnboardingChecklist = async (): Promise<OnboardingChecklistResponse> => {
  const res = await axios.get(`${backendURI}/academy/onboarding`);
  return res.data;
};

// Guides
export const fetchAcademyGuides = async (params?: {
  categoryId?: string;
  search?: string;
  featured?: boolean;
}): Promise<AcademyGuide[]> => {
  const query = new URLSearchParams();
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.search) query.append("search", params.search);
  if (params?.featured !== undefined) query.append("featured", String(params.featured));
  const res = await axios.get(`${backendURI}/academy/guides?${query.toString()}`);
  return res.data;
};

export const fetchGuideBySlug = async (slug: string): Promise<AcademyGuide> => {
  const res = await axios.get(`${backendURI}/academy/guides/by-slug/${slug}`);
  return res.data;
};

export const fetchGuideById = async (id: string): Promise<AcademyGuide> => {
  const res = await axios.get(`${backendURI}/academy/guides/${id}`);
  return res.data;
};

export const createAcademyGuide = async (payload: Partial<AcademyGuide>): Promise<AcademyGuide> => {
  const res = await axios.post(`${backendURI}/academy/guides`, payload);
  return res.data;
};

export const updateAcademyGuide = async (id: string, payload: Partial<AcademyGuide>): Promise<AcademyGuide> => {
  const res = await axios.patch(`${backendURI}/academy/guides/${id}`, payload);
  return res.data;
};

export const deleteAcademyGuide = async (id: string): Promise<any> => {
  const res = await axios.delete(`${backendURI}/academy/guides/${id}`);
  return res.data;
};

// Progress
export const recordGuideProgress = async (
  guideId: string,
  payload: { isCompleted?: boolean; lastPositionSeconds?: number }
): Promise<AcademyProgress> => {
  const res = await axios.post(`${backendURI}/academy/guides/${guideId}/progress`, payload);
  return res.data;
};

// FAQs
export const fetchAcademyFaqs = async (categoryId?: string): Promise<AcademyFaq[]> => {
  const query = categoryId ? `?categoryId=${categoryId}` : "";
  const res = await axios.get(`${backendURI}/academy/faqs${query}`);
  return res.data;
};

export const createAcademyFaq = async (payload: Partial<AcademyFaq>): Promise<AcademyFaq> => {
  const res = await axios.post(`${backendURI}/academy/faqs`, payload);
  return res.data;
};

export const deleteAcademyFaq = async (id: string): Promise<any> => {
  const res = await axios.delete(`${backendURI}/academy/faqs/${id}`);
  return res.data;
};
