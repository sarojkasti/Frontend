import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

// Fetch project timeline
export const getProjectTimeline = async (projectId: number) => {
  const response = await axios.get(`${backendURI}/projects/${projectId}/timeline`);
  return response.data;
};

export const fetchProjects = async ({ status, fields }: { status: string; fields?: string }) => {
  const params = new URLSearchParams({ status: status || 'all' });
  if (fields) params.append('fields', fields);
  const response = await axios.get(`${backendURI}/projects?${params.toString()}`);
  return response.data;
};

export const fetchProject = async ({ id }: { id: string | undefined }) => {
  if (!id) {
    throw new Error("Project ID is required");
  }
  const response = await axios.get(`${backendURI}/projects/${id}`);
  return response.data;
};

export const createProject = async (payload: any) => {
  const response = await axios.post(`${backendURI}/projects`, payload);
  return response.data;
};

export const editProject = async ({
  payload,
  id,
}: {
  payload: any;
  id: string;
}) => {
  const response = await axios.patch(`${backendURI}/projects/${id}`, payload);
  return response.data;
};

export const deleteProject = async ({
  id,
  deleteTasks = false,
}: {
  id: string | number;
  deleteTasks?: boolean;
}) => {
  const response = await axios.delete(`${backendURI}/projects/${id}`, {
    params: { deleteTasks },
  });
  return response.data;
};

export const completeProject = async (id: string) => {
  const response = await axios.post(`${backendURI}/projects/${id}/complete`);
  return response.data;
};

export const exportProjectExcel = async (id: string) => {
  const response = await axios.get(`${backendURI}/projects/${id}/export`, {
    responseType: 'blob',
  });
  return response.data;
};
