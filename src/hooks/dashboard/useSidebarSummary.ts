import { useQuery } from "@tanstack/react-query";
import { fetchSidebarSummary, SidebarSummaryData } from "@/service/dashboard.service";
import { useWorkingYearContext } from "@/context/WorkingYearContext";

export const useSidebarSummary = () => {
  const { selectedWorkingYearId } = useWorkingYearContext();

  return useQuery<SidebarSummaryData>({
    queryKey: ["sidebar-summary", selectedWorkingYearId],
    queryFn: () => fetchSidebarSummary(selectedWorkingYearId || undefined),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
