import { useMutation } from "@tanstack/react-query";
import { logout } from "../../service/auth.service";
import useQueryClient from "../useQueryClient";
import { clearAuth } from "@/utils/auth";
import { useSession } from "@/context/SessionContext";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logoutSession } = useSession();

  const handleClearAndRedirect = () => {
    try {
      // Invalidate and purge all React Query caches
      queryClient.clear();
      // Clear cookies and localStorage
      clearAuth();
      // Reset React session state
      logoutSession?.();
    } finally {
      // Direct hard redirect to /login to ensure completely fresh React state
      // and prevent stale session context from bouncing the user back to /
      window.location.replace("/login");
    }
  };

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      handleClearAndRedirect();
    },
    onError: () => {
      // Even if backend call fails or session is already expired, force logout cleanly
      handleClearAndRedirect();
    },
  });
};