import { useQuery } from "@tanstack/react-query";
import { fetchWorklogs } from "../../service/worklog.service";

export const useWorklog = (status: string, workingYearId?: string) => {
  return useQuery({
    queryKey: ["worklog-all", status, workingYearId],
    queryFn: async () => {
      return fetchWorklogs(status, workingYearId);
    },
    enabled: !!status,
  });
};
