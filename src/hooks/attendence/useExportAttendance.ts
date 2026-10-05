import { useQuery } from "@tanstack/react-query";
import { fetchExportAttendance, ExportAttendanceParams } from "@/service/attendence.service";

export const useExportAttendance = (params: ExportAttendanceParams = {}, enabled = true) => {
  return useQuery({
    queryKey: ["attendance-export", params],
    queryFn: () => fetchExportAttendance(params),
    enabled,
    staleTime: 30000,
  });
};
