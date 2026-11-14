import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../../service/project.service";

export const useProject = ({
  status,
  fields,
  workingYearId,
  tab,
}: {
  status?: string;
  fields?: string;
  workingYearId?: string;
  tab?: string;
} = {}) => {
  return useQuery({
    queryKey: ["projects", status || "all", fields || "", workingYearId || "all", tab || ""],
    queryFn: async () => {
      return fetchProjects({ status: status || "all", fields, workingYearId, tab });
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
