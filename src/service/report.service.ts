import axios from "axios";
import { fetchAllWorklogs } from "./worklog.service";
import { fetchProjects } from "./project.service";
import { fetchBillings } from "./billing.service";
import { fetchDashboardWorkingTime } from "./dashboard.service";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export interface ReportFilterParams {
  dateRange?: [string, string];
  projectId?: string;
  userId?: string;
  status?: string;
}

export const fetchWorklogReportData = async (filters: ReportFilterParams = {}) => {
  const [worklogsRes, projectsRes, usersRes] = await Promise.all([
    fetchAllWorklogs({
      userId: filters.userId,
      projectId: filters.projectId,
      status: filters.status,
    }),
    fetchProjects({ status: "all" }),
    axios
      .get(`${backendURI}/users/list-active`)
      .then((res) => res.data)
      .catch(() =>
        axios
          .get(`${backendURI}/users?limit=1000`)
          .then((res) => res.data?.results || res.data || [])
          .catch(() => [])
      ),
  ]);

  const worklogs = worklogsRes?.results || worklogsRes || [];
  const projects = projectsRes?.results || projectsRes || [];
  const users = Array.isArray(usersRes) ? usersRes : usersRes?.results || [];

  return {
    worklogs,
    projects,
    users,
  };
};

export const fetchManagerReportData = async () => {
  const [projectsRes, billingsRes, workingTimeRes] = await Promise.all([
    fetchProjects({ status: "all" }),
    fetchBillings().catch(() => []),
    fetchDashboardWorkingTime(undefined, "month").catch(() => null),
  ]);

  const projects = projectsRes?.results || projectsRes || [];
  const billings = Array.isArray(billingsRes) ? billingsRes : billingsRes?.results || [];

  return {
    projects,
    billings,
    workingTimeStats: workingTimeRes,
  };
};
