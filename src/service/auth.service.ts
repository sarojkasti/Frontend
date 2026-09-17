import axios from "axios";

const backendURI = import.meta.env.VITE_BACKEND_URI;

export const validateResetToken = async (token: string) => {
  try {
    const response = await axios.get(
      `${backendURI}/auth/validate-reset-token?token=${token}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.put(`${backendURI}/auth/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (payload: any) => {
  const response = await axios.post(`${backendURI}/auth/login`, payload, {
    withCredentials: true,
  });
  // Store token from response body in localStorage for Socket.io
  if (response.data && response.data.token) {
    localStorage.setItem("access_token", response.data.token);
  }
  return response;
};

export const getProfile = async () => {
  const response = await axios.get(`${backendURI}/auth/profile`, {
    withCredentials: true,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(
    `${backendURI}/logout`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const resetPassword = async (resetPasswordDto: {
  token: string;
  password: string;
  confirmPassword?: string;
}) => {
  try {
    // Make sure to include confirmPassword if it's not provided
    const payload = {
      ...resetPasswordDto,
      confirmPassword:
        resetPasswordDto.confirmPassword || resetPasswordDto.password,
    };
    const response = await axios.put(
      `${backendURI}/auth/reset-password`,
      payload,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    // Let the error propagate to be handled by the calling component
    throw error;
  }
};