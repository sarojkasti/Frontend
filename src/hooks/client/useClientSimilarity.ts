import { useQuery } from "@tanstack/react-query";
import { checkClientSimilarity, fetchDuplicationAuditReport } from "@/service/client.service";

export const useClientSimilarity = (name?: string, pan?: string, excludeId?: string) => {
  const shouldFetch = Boolean((name && name.trim().length >= 3) || (pan && pan.trim().length >= 5));

  return useQuery({
    queryKey: ["client-similarity", name, pan, excludeId],
    queryFn: () => checkClientSimilarity({ name, pan, excludeId }),
    enabled: shouldFetch,
    staleTime: 10 * 1000,
  });
};

export const useDuplicationAuditReport = () => {
  return useQuery({
    queryKey: ["client-duplication-audit"],
    queryFn: fetchDuplicationAuditReport,
    staleTime: 30 * 1000,
  });
};
