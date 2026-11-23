import { useQuery } from "@tanstack/react-query";
import {
  fetchRecentChanges,
  RecentChangesFilterParams,
  RecentChangesData,
} from "@/service/dashboard.service";

export const useRecentChanges = (params: RecentChangesFilterParams = {}) => {
  return useQuery<RecentChangesData>({
    queryKey: ["recent-changes-report", params],
    queryFn: () => fetchRecentChanges(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
