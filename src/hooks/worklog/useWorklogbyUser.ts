import { useQuery } from "@tanstack/react-query";
import { fetchWorklogsByUser } from "../../service/worklog.service";

export const useWorklogbyUser = (status?: string, workingYearId?: string) => {
  return useQuery({
    queryKey: ["worklog-user", status, workingYearId],
    queryFn: async () => {
      return fetchWorklogsByUser(status, workingYearId);
    },
  });
};
