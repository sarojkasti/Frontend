import axios from "axios";
import {
  CreatePhonebookCategoryPayload,
  CreatePhonebookPayload,
  PhonebookCategory,
  PhonebookClientsResponse,
  PhonebookEntry,
  PhonebookHistoryItem,
  PhonebookShareOptions,
  UpdatePhonebookPayload,
} from "@/types/phonebook";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchPhonebookEntries = async (): Promise<PhonebookEntry[]> => {
  const response = await axios.get(`${backendURI}/phonebook`);
  return response.data;
};

export const fetchPhonebookClients = async (): Promise<PhonebookClientsResponse> => {
  const response = await axios.get(`${backendURI}/phonebook/clients`);
  return response.data;
};

export const fetchPhonebookCategories = async (): Promise<PhonebookCategory[]> => {
  const response = await axios.get(`${backendURI}/phonebook/categories`);
  return response.data;
};

export const createPhonebookCategory = async (
  payload: CreatePhonebookCategoryPayload
): Promise<PhonebookCategory> => {
  const response = await axios.post(`${backendURI}/phonebook/categories`, payload);
  return response.data;
};

export const deletePhonebookCategory = async (id: string): Promise<void> => {
  await axios.delete(`${backendURI}/phonebook/categories/${id}`);
};

export const fetchPhonebookShareOptions = async (): Promise<PhonebookShareOptions> => {
  const response = await axios.get(`${backendURI}/phonebook/share-options`);
  return response.data;
};

export const createPhonebookEntry = async (
  payload: CreatePhonebookPayload
): Promise<PhonebookEntry> => {
  const response = await axios.post(`${backendURI}/phonebook`, payload);
  return response.data;
};

export const updatePhonebookEntry = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdatePhonebookPayload;
}): Promise<PhonebookEntry> => {
  const response = await axios.patch(`${backendURI}/phonebook/${id}`, payload);
  return response.data;
};

export const deletePhonebookEntry = async (id: string): Promise<void> => {
  await axios.delete(`${backendURI}/phonebook/${id}`);
};

export const fetchPhonebookHistory = async (
  id: string
): Promise<PhonebookHistoryItem[]> => {
  const response = await axios.get(`${backendURI}/phonebook/${id}/history`);
  return response.data;
};
