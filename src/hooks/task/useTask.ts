import { fetchTasks } from "@/service/task.service";
import { useQuery } from "@tanstack/react-query";

export const useTasks = ({
  status,
  workingYearId,
}: {
  status: string;
  workingYearId?: string;
}) => {
  return useQuery({
    queryKey: ["tasks", status, workingYearId],
    queryFn: async () => {
      return fetchTasks({ status, workingYearId });
    },
  });
};
