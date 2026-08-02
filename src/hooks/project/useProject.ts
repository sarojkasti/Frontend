import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../../service/project.service";

export const useProject = ({ status, fields }: { status?: string; fields?: string }) => {
  return useQuery({
    queryKey: ["projects", status || "all", fields || ""],
    queryFn: async () => {
      return fetchProjects({ status: status || "all", fields });
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
