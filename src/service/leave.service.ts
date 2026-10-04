import axios from "axios";
import {
  CreateLeaveDto as ImportedCreateLeaveDto,
  UpdateLeaveDto as ImportedUpdateLeaveDto,
  LeaveType as ImportedLeaveType,
} from "../types/leave";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export type CreateLeaveDto = ImportedCreateLeaveDto;
export type UpdateLeaveDto = ImportedUpdateLeaveDto;
export type LeaveType = ImportedLeaveType;

export const fetchLeaves = async (status?: string) => {
  const response = await axios.get(`${backendURI}/leave`, {
    params: status ? { status } : {},
  });
  return response.data;
};

export const createLeave = async (payload: CreateLeaveDto) => {
  try {
    const response = await axios.post(`${backendURI}/leave`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateLeave = async (id: string, payload: UpdateLeaveDto) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.patch(`${backendURI}/leave/${cleanId}`, payload);
  return response.data;
};

export const deleteLeave = async (id: string) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.delete(`${backendURI}/leave/${cleanId}`);
  return response.data;
};

export const approveLeave = async (id: string, notifyAdmins?: string[]) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const body: { notifyAdmins?: string[] } = {};
  if (notifyAdmins && notifyAdmins.length > 0) {
    body.notifyAdmins = notifyAdmins;
  }
  const response = await axios.patch(`${backendURI}/leave/${cleanId}/approve`, body);
  return response.data;
};

export const rejectLeave = async (id: string, userId: string) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.patch(`${backendURI}/leave/${cleanId}/reject`, { userId });
  return response.data;
};

// Clarification workflow APIs
export const requestLeaveClarification = async (id: string, notes: string) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.patch(
    `${backendURI}/leave/${cleanId}/clarification/request`,
    { notes }
  );
  return response.data;
};

export const respondLeaveClarification = async (id: string, responseText: string) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.patch(
    `${backendURI}/leave/${cleanId}/clarification/respond`,
    { response: responseText }
  );
  return response.data;
};

// Leave Balance & Ledger APIs
export const fetchUserLeaveBalances = async (userId: string, year?: number) => {
  const params: any = {};
  if (year) params.year = year;
  const response = await axios.get(`${backendURI}/leave/balance/${userId}`, { params });
  return response.data;
};

export const fetchMyLeaveBalances = async (year?: number) => {
  const params: any = {};
  if (year) params.year = year;
  const response = await axios.get(`${backendURI}/leave/balance/my`, { params });
  return response.data;
};

export const fetchMyLeaveLedger = async (year?: number, leaveTypeId?: string) => {
  const params: any = {};
  if (year) params.year = year;
  if (leaveTypeId) params.leaveTypeId = leaveTypeId;
  const response = await axios.get(`${backendURI}/leave/balance/ledger/my`, { params });
  return response.data;
};

export const fetchUserLeaveLedger = async (
  userId: string,
  year?: number,
  leaveTypeId?: string
) => {
  const params: any = {};
  if (year) params.year = year;
  if (leaveTypeId) params.leaveTypeId = leaveTypeId;
  const cleanId = encodeURIComponent(String(userId).trim().replace(/['"]/g, ""));
  const response = await axios.get(`${backendURI}/leave/balance/ledger/${cleanId}`, {
    params,
  });
  return response.data;
};

export const fetchUserLeaves = async (status?: string) => {
  const params: any = {};
  if (status && status !== "all") params.status = status;
  const endpoint = "/leave/my-leaves";
  const response = await axios.get(`${backendURI}${endpoint}`, { params });
  return response.data;
};

export const fetchLeavesForUser = async (userId: string, status?: string) => {
  const params: any = {};
  if (status && status !== "all") params.status = status;
  const response = await axios.get(
    `${backendURI}/leave/user/${encodeURIComponent(String(userId))}`,
    { params }
  );
  return response.data;
};

export const getPendingApprovals = async () => {
  const response = await axios.get(`${backendURI}/leave/approvals/pending`);
  return response.data;
};

export const getLeaveCalendarView = async (
  from: string,
  to: string,
  projectId?: string
) => {
  const response = await axios.get(`${backendURI}/leave/calendar/view`, {
    params: { from, to, ...(projectId && { projectId }) },
  });
  return response.data;
};

export const allocateLeaveToUser = async (payload: {
  userId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  carriedOverDays?: number;
}) => {
  const response = await axios.post(`${backendURI}/leave/balance/allocate`, payload);
  return response.data;
};

export const allocateLeaveToAllUsers = async (payload: {
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
}) => {
  const response = await axios.post(`${backendURI}/leave/balance/allocate-all`, payload);
  return response.data;
};

export const carryOverLeave = async (payload: {
  fromYear: number;
  toYear: number;
  userIds?: string[];
  leaveTypeIds?: string[];
}) => {
  const response = await axios.post(`${backendURI}/leave/balance/carry-over`, payload);
  return response.data;
};

export const getUserLeaveBalancesByYear = async (userId: string, year: number) => {
  const response = await axios.get(
    `${backendURI}/leave/balance/user/${userId}/year/${year}`
  );
  return response.data;
};

/** @deprecated */
export const approveLeaveByLead = async (id: string, userId: string) => {
  const cleanId = encodeURIComponent(String(id).trim().replace(/['"]/g, ""));
  const response = await axios.patch(
    `${backendURI}/leave/${cleanId}/approve/manager`,
    { userId }
  );
  return response.data;
};

/** @deprecated */
export const approveLeaveByManager = async (
  id: string,
  userId: string,
  notifyAdmins?: string[]
) => {
  return approveLeave(id, notifyAdmins);
};

/** @deprecated */
export const approveLeaveByPM = async (id: string, userId: string) => {
  return approveLeave(id);
};

/** @deprecated */
export const approveLeaveByAdmin = async (id: string, userId: string) => {
  return approveLeave(id);
};