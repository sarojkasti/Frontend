import axios from "axios";
import { WorkingYearType, WorkingYearConfigType } from "@/types/workingYear";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const getWorkingYears = async (): Promise<WorkingYearType[]> => {
  const response = await axios.get(`${backendURI}/working-years`);
  return response.data;
};

export const getCurrentWorkingYear = async (): Promise<WorkingYearType> => {
  const response = await axios.get(`${backendURI}/working-years/current`);
  return response.data;
};

export const getWorkingYearConfig = async (): Promise<WorkingYearConfigType> => {
  const response = await axios.get(`${backendURI}/working-years/config`);
  return response.data;
};

export const updateWorkingYearConfig = async (
  payload: Partial<WorkingYearConfigType>
): Promise<WorkingYearConfigType> => {
  const response = await axios.patch(`${backendURI}/working-years/config`, payload);
  return response.data;
};

export const generateNextWorkingYear = async (): Promise<WorkingYearType> => {
  const response = await axios.post(`${backendURI}/working-years/generate-next`);
  return response.data;
};

export const createWorkingYear = async (
  payload: Partial<WorkingYearType>
): Promise<WorkingYearType> => {
  const response = await axios.post(`${backendURI}/working-years`, payload);
  return response.data;
};

export const updateWorkingYear = async (
  id: string,
  payload: Partial<WorkingYearType>
): Promise<WorkingYearType> => {
  const response = await axios.patch(`${backendURI}/working-years/${id}`, payload);
  return response.data;
};

export const setWorkingYearCurrent = async (id: string): Promise<WorkingYearType> => {
  const response = await axios.patch(`${backendURI}/working-years/${id}/set-current`);
  return response.data;
};

export const deleteWorkingYear = async (id: string): Promise<{ message: string }> => {
  const response = await axios.delete(`${backendURI}/working-years/${id}`);
  return response.data;
};
