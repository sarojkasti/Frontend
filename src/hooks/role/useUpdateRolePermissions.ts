import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRolePermissions } from "../../service/role.service";

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) => // Changed from number[] to string[]
      updateRolePermissions({ id, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};