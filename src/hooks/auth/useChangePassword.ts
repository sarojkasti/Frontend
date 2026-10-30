import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../../service/auth.service";

export interface ChangePasswordDto {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => changePassword(data),
  });
};
