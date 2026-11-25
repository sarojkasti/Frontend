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
    clientReports?: number;
    clientUsers?: number;
    tasks: number;
    notices: number;
    phonebook?: number;
    // Weekly counts (last 7 days)
    weeklyProjects?: number;
    weeklyClients?: number;
    weeklyUsers?: number;
    weeklyClientReports?: number;
    weeklyClientUsers?: number;
    weeklyTasks?: number;
    weeklyNotices?: number;
    weeklyPhonebook?: number;
    // Totals
    totalProjects?: number;
    totalClients?: number;
    totalUsers?: number;
    totalClientReports?: number;
    totalClientUsers?: number;
    totalTasks?: number;
    totalNotices?: number;
    totalPhonebook?: number;
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
  recentClientReports?: Array<{
    id: string;
    name: string;
    clientName?: string;
    documentType?: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string } | null;
  }>;
  recentClientUsers?: Array<{
    id: string;
    name: string;
    email?: string;
    clientName?: string;
    status?: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string } | null;
  }>;
  recentTasks?: Array<{
    id: string;
    name: string;
    status?: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string } | null;
  }>;
  recentNotices?: Array<{
    id: string;
    name: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string } | null;
  }>;
  recentPhonebook?: Array<{
    id: string;
    name: string;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string } | null;
  }>;
  recentUpdatedProjects?: SidebarSummaryData['recentProjects'];
  recentUpdatedClients?: SidebarSummaryData['recentClients'];
  recentUpdatedUsers?: SidebarSummaryData['recentUsers'];
  recentUpdatedClientReports?: SidebarSummaryData['recentClientReports'];
  recentUpdatedClientUsers?: SidebarSummaryData['recentClientUsers'];
  recentUpdatedTasks?: SidebarSummaryData['recentTasks'];
  recentUpdatedNotices?: SidebarSummaryData['recentNotices'];
  recentUpdatedPhonebook?: SidebarSummaryData['recentPhonebook'];
  recentActivity: Array<{
    id: string;
    type: 'project' | 'client' | 'client_report' | 'client_user';
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

export interface RecentChangesFilterParams {
  type?: string;
  days?: number | string;
  startDate?: string;
  endDate?: string;
  action?: 'all' | 'created' | 'updated';
  search?: string;
  limit?: number | string;
}

export interface RecentChangeItem {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  workingYear?: string;
  clientName?: string;
  clientId?: string;
  managerName?: string;
  leadName?: string;
  panNo?: string;
  groupName?: string;
  state?: string;
  district?: string;
  email?: string;
  username?: string;
  role?: string;
  avatar?: string;
  documentType?: string;
  fileName?: string;
  fileSize?: number;
  accessStatus?: string;
  phoneNumber?: string;
  clientNames?: string;
  lastLoginAt?: string;
  action: 'created' | 'updated';
  isUpdated: boolean;
  createdAt: string;
  updatedAt: string;
  primaryDate: string;
  creator?: { id: string; name: string; email?: string; avatar?: string } | null;
  updater?: { id: string; name: string; email?: string; avatar?: string } | null;
}

export interface TimelineFeedItem {
  id: string;
  entityType: 'project' | 'client' | 'user' | 'client_report' | 'client_user';
  entityLabel: string;
  title: string;
  subtitle: string;
  status?: string;
  action: 'created' | 'updated';
  primaryDate: string;
  createdAt: string;
  updatedAt: string;
  actor?: { id: string; name: string; email?: string; avatar?: string } | null;
  link: string;
  badgeColor: string;
}

export interface RecentChangesData {
  summary: {
    totalRecords: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    counts: {
      projects: number;
      clients: number;
      users: number;
      clientReports: number;
      clientUsers: number;
    };
  };
  projects: RecentChangeItem[];
  clients: RecentChangeItem[];
  users: RecentChangeItem[];
  clientReports: RecentChangeItem[];
  clientUsers: RecentChangeItem[];
  allTimeline: TimelineFeedItem[];
}

export const fetchRecentChanges = async (
  params: RecentChangesFilterParams = {}
): Promise<RecentChangesData> => {
  const response = await axios.get(`${backendURI}/dashboard/recent-changes`, { params });
  return response.data;
};
