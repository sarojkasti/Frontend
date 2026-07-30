import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../../service/user.service";

export const useUser = ({ status = "active", limit = 1000, page = 1, keywords = "" }: { status?: string, limit?: number, page?: number, keywords?: string } = {}) => {
  return useQuery({
    queryKey: ["users", status, limit, page, keywords],
    queryFn: () => fetchUsers({ status, limit, page, keywords }),
  });
};
