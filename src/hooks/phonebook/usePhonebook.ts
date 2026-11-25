import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPhonebookCategory,
  createPhonebookEntry,
  deletePhonebookCategory,
  deletePhonebookEntry,
  fetchPhonebookCategories,
  fetchPhonebookClients,
  fetchPhonebookEntries,
  fetchPhonebookHistory,
  fetchPhonebookShareOptions,
  updatePhonebookEntry,
} from "@/service/phonebook.service";
import {
  CreatePhonebookCategoryPayload,
  CreatePhonebookPayload,
  UpdatePhonebookPayload,
} from "@/types/phonebook";

export const PHONEBOOK_KEYS = {
  entries: ["phonebook", "entries"] as const,
  clients: ["phonebook", "clients"] as const,
  categories: ["phonebook", "categories"] as const,
  shareOptions: ["phonebook", "share-options"] as const,
  history: (id: string) => ["phonebook", "history", id] as const,
};

export const usePhonebookEntries = () => {
  return useQuery({
    queryKey: PHONEBOOK_KEYS.entries,
    queryFn: fetchPhonebookEntries,
  });
};

export const usePhonebookClients = () => {
  return useQuery({
    queryKey: PHONEBOOK_KEYS.clients,
    queryFn: fetchPhonebookClients,
  });
};

export const usePhonebookCategories = () => {
  return useQuery({
    queryKey: PHONEBOOK_KEYS.categories,
    queryFn: fetchPhonebookCategories,
  });
};

export const usePhonebookShareOptions = () => {
  return useQuery({
    queryKey: PHONEBOOK_KEYS.shareOptions,
    queryFn: fetchPhonebookShareOptions,
  });
};

export const usePhonebookHistory = (id: string | null, enabled = false) => {
  return useQuery({
    queryKey: PHONEBOOK_KEYS.history(id || ""),
    queryFn: () => fetchPhonebookHistory(id!),
    enabled: Boolean(id) && enabled,
  });
};

export const useCreatePhonebookEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePhonebookPayload) => createPhonebookEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.entries });
    },
  });
};

export const useUpdatePhonebookEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePhonebookPayload }) =>
      updatePhonebookEntry({ id, payload }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.entries });
      queryClient.invalidateQueries({
        queryKey: PHONEBOOK_KEYS.history(variables.id),
      });
    },
  });
};

export const useDeletePhonebookEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePhonebookEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.entries });
    },
  });
};

export const useCreatePhonebookCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePhonebookCategoryPayload) =>
      createPhonebookCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.categories });
    },
  });
};

export const useDeletePhonebookCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePhonebookCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: PHONEBOOK_KEYS.entries });
    },
  });
};
