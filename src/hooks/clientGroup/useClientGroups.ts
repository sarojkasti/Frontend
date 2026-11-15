import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientGroups,
  fetchClientGroupById,
  fetchGroupLedger,
  createClientGroup,
  updateClientGroup,
  deleteClientGroup,
  assignClientsToGroup,
  ClientGroupItem
} from "@/service/clientGroup.service";
import { message } from "antd";

export const useClientGroups = () => {
  return useQuery<ClientGroupItem[]>({
    queryKey: ["client-groups"],
    queryFn: fetchClientGroups,
    staleTime: 60 * 1000
  });
};

export const useClientGroupById = (id?: string) => {
  return useQuery({
    queryKey: ["client-group", id],
    queryFn: () => fetchClientGroupById(id!),
    enabled: Boolean(id)
  });
};

export const useGroupLedger = (id?: string) => {
  return useQuery({
    queryKey: ["group-ledger", id],
    queryFn: () => fetchGroupLedger(id!),
    enabled: Boolean(id)
  });
};

export const useCreateClientGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientGroup,
    onSuccess: () => {
      message.success("Client Group created successfully");
      queryClient.invalidateQueries({ queryKey: ["client-groups"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to create Client Group");
    }
  });
};

export const useUpdateClientGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateClientGroup(id, payload),
    onSuccess: (_, variables) => {
      message.success("Client Group updated successfully");
      queryClient.invalidateQueries({ queryKey: ["client-groups"] });
      queryClient.invalidateQueries({ queryKey: ["client-group", variables.id] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to update Client Group");
    }
  });
};

export const useDeleteClientGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientGroup,
    onSuccess: () => {
      message.success("Client Group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["client-groups"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to delete Client Group");
    }
  });
};

export const useAssignClientsToGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: string; clientIds: string[] }) =>
      assignClientsToGroup(groupId, clientIds),
    onSuccess: (data, variables) => {
      message.success(data?.message || "Clients assigned to group successfully");
      queryClient.invalidateQueries({ queryKey: ["client-groups"] });
      queryClient.invalidateQueries({ queryKey: ["client-group", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-duplication-audit"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to assign clients");
    }
  });
};
