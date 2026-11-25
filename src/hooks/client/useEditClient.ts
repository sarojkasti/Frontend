import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editClient } from "../../service/client.service";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

export const useEditClient = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ payload, id }: any) => {
      return editClient({ payload, id });
    },
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
        queryClient.invalidateQueries({ queryKey: ["client-timeline", variables.id] });
      }
      message.success("Client updated successfully");
      navigate(variables?.id ? `/client/view/${variables.id}` : "/client");
    },
    onError: (err: any) => {
      const apiMsg = err?.response?.data?.message;
      const errText = Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg;
      message.error(errText || "Failed to update client.");
    },
  });
};
