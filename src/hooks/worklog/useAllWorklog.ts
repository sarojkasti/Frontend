import { useQuery } from "@tanstack/react-query";
import { fetchAllWorklogs } from "../../service/worklog.service";

export interface WorklogFilters {
  status?: string;
  date?: string;
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  workingYearId?: string;
}

export const useAllWorklog = (filters: WorklogFilters = {}) => {
  return useQuery({
    queryKey: ["worklog-admin-all", filters],
    queryFn: async () => {
      return fetchAllWorklogs(filters);
    },
  });
};
