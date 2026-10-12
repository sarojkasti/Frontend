import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchWorklogs = async (status?: string) => {
  let url = `${backendURI}/worklogs`;
  if (status && status !== 'all') {
    url += `?status=${status}`;
  }
  const response = await axios.get(url);
  return response.data;
};

export const fetchWorklogsByUser = async (status?: string) => {
  let url = `${backendURI}/worklogs/user`;
  if (status && status !== 'all') {
    url += `?status=${status}`;
  }
  const response = await axios.get(url);
  return response.data;
}

export const fetchAllWorklogs = async (filters: { status?: string, date?: string, userId?: string, projectId?: string, startDate?: string, endDate?: string }) => {
  let url = `${backendURI}/worklogs/allworklog`;
  const queryParams = [];
  
  if (filters.status && filters.status !== 'all') {
    queryParams.push(`status=${filters.status}`);
  }
  
  if (filters.startDate && filters.endDate) {
    queryParams.push(`startDate=${filters.startDate}`);
    queryParams.push(`endDate=${filters.endDate}`);
  } else if (filters.date) {
    queryParams.push(`date=${filters.date}`);
  }
  
  if (filters.userId) {
    queryParams.push(`userId=${filters.userId}`);
  }
  
  if (filters.projectId) {
    queryParams.push(`projectId=${filters.projectId}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await axios.get(url);
  return response.data;
};

export const fetchProjectWorklogs = async ({ projectId }: { projectId: string }) => {
  const response = await axios.get(`${backendURI}/projects/${projectId}/worklogs`);
  return response.data;
};

export const fetchWorklog = async ({ id }: { id: string }) => {
  const response = await axios.get(`${backendURI}/worklogs/${id}`);

  return response.data;
};

export const fetchWorklogById = async ({ id }: { id: string | undefined }) => {
  const response = await axios.get(`${backendURI}/worklogs/task/${id}`);

  return response.data;
};

export const checkWorklogAllowed = async ({ taskId }: { taskId: string }) => {
  const response = await axios.get(`${backendURI}/worklogs/task/${taskId}/allowed`);
  return response.data;
};

export const createWorklog = async (payload: any) => {
  const response = await axios.post(`${backendURI}/worklogs`, payload);
  return response.data;
};
export const editWorklog = async ({
  remark,
  status,
  rejectedRemark,
  approvedBy,
  rejectBy,
  id,
}: {
  remark?: string;
  status?: any;
  rejectedRemark?: string;
  approvedBy?: string;
  rejectBy?: string;
  id: string;
}) => {
  const payload: any = {};
  if (status) payload.status = status;
  if (remark) payload.remark = remark;
  if (rejectedRemark) payload.rejectedRemark = rejectedRemark;
  if (approvedBy) payload.approvedBy = approvedBy;
  if (rejectBy) payload.rejectBy = rejectBy;
  
  const response = await axios.patch(`${backendURI}/worklogs/${id}`, payload);
  return response.data;
};

export const bulkApproveWorklogs = async ({ worklogIds }: { worklogIds: string[] }) => {
  const response = await axios.patch(`${backendURI}/worklogs/bulk-approve`, { worklogIds });
  return response.data;
};

export const bulkRejectWorklogs = async ({ worklogIds, rejectedRemark }: { worklogIds: string[]; rejectedRemark?: string }) => {
  const response = await axios.patch(`${backendURI}/worklogs/bulk-reject`, { worklogIds, rejectedRemark });
  return response.data;
};

export const editingWorklog = async ({
  date,
  startTime,
  endTime,
  description,
  approvedBy,
  requestTo,
  status,
  id,
}: {
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  approvedBy?: string;
  requestTo?: string;
  status?: any;
  id: string;
}) => {
  const response = await axios.patch(`${backendURI}/worklogs/${id}`, {date, startTime, endTime, description, approvedBy, requestTo, status});
  return response.data;
};

export const deleteWorklog = async ({ id }: { id: string }) => {
  const response = await axios.delete(`${backendURI}/worklogs/${id}`);
  return response.data;
};
