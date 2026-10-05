import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchAttendences = async () => {
  const response = await axios.get(`${backendURI}/attendance`);
  return response.data;
};

export const fetchAllUsersAttendences = async () => {
  const response = await axios.get(`${backendURI}/attendance/all-users`);
  return response.data;
};

export const fetchTodayAllUsersAttendences = async () => {
  const response = await axios.get(`${backendURI}/attendance/today-all-users`);
  return response.data;
};

export const fetchDateWiseAllUsersAttendences = async (date: string) => {
  const response = await axios.get(`${backendURI}/attendance/date-wise-all-users?date=${date}`);
  return response.data;
};
export const fetchAttendenceById = async ({ id }: { id: string }) => {
  const response = await axios.get(`${backendURI}/attendance/user/${id}`);

  return response.data;
};
export const fetchAttendence = async ({ id }: { id: string }) => {
  const response = await axios.get(`${backendURI}/attendance/${id}`);
  return response.data;
};


export const createAttendence = async (payload: any) => {
  const response = await axios.post(`${backendURI}/attendance`, payload);
  return response.data;
};
export const updateAttendence = async ({ payload ,id}: {payload:any,id:string}) => {
  const response = await axios.patch(`${backendURI}/attendance/${id}`, payload);
  return response.data;
};

export const getMyAttendence = async () => {
  const response = await axios.get(`${backendURI}/attendance/today-attendence?`);
  return response.data;
};

export interface ExportAttendanceParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  departmentId?: string;
}

export const fetchExportAttendance = async (params: ExportAttendanceParams = {}) => {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.userId) queryParams.append("userId", params.userId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
  try {
    const response = await axios.get(`${backendURI}/attendance/export${queryStr}`);
    return response.data;
  } catch (error) {
    console.warn("Failed to fetch /attendance/export, falling back to /attendance/all-users:", error);
    const fallbackResponse = await axios.get(`${backendURI}/attendance/all-users`);
    return fallbackResponse.data;
  }
};

