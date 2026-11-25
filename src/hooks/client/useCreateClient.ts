import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../service/client.service";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

interface UseCreateClientOptions {
  skipNavigate?: boolean;
}

export const useCreateClient = (options?: UseCreateClientOptions) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: any) => {
      return createClient(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      message.success(`Client "${data?.name || "New Client"}" created successfully`);
      if (!options?.skipNavigate) {
        navigate("/client");
      }
    },
    onError: (err: any) => {
      const apiMsg = err?.response?.data?.message;
      const errText = Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg;
      message.error(errText || "Failed to create client. Please check required fields.");
    },
  });
};
