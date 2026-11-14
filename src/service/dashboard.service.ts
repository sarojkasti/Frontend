import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchDashboardAttendance = async (date?: string) => {
  const params = date ? { date } : {};
  const response = await axios.get(`${backendURI}/dashboard/attendance`, { params });
  return response.data;
};

export const fetchDashboardWorkingTime = async (date?: string, period?: 'day' | 'week' | 'month') => {
  const params: any = {};
  if (date) params.date = date;
  if (period) params.period = period;
  const response = await axios.get(`${backendURI}/dashboard/working-time`, { params });
  return response.data;
};

export interface SidebarSummaryData {
  counts: {
    // Recent in last 30 days (around a month)
    projects: number;
    clients: number;
    users: number;
    tasks: number;
    notices: number;
    // Totals
    totalProjects?: number;
    totalClients?: number;
    totalUsers?: number;
    totalTasks?: number;
    totalNotices?: number;
    newProjectsThisWeek?: number;
    newClientsThisWeek?: number;
    pendingTasks?: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string };
  }>;
  recentClients: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string };
  }>;
  recentUsers?: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string };
  }>;
  recentActivity: Array<{
    id: string;
    type: 'project' | 'client';
    title: string;
    action: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string };
    link: string;
  }>;
}

export const fetchSidebarSummary = async (workingYearId?: string): Promise<SidebarSummaryData> => {
  const params: any = {};
  if (workingYearId) params.workingYearId = workingYearId;
  const response = await axios.get(`${backendURI}/dashboard/sidebar-summary`, { params });
  return response.data;
};
