import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    const errorMessage = error.response.data?.message || "Server error occurred";
    throw new Error(errorMessage);
  } else if (error.request) {
    throw new Error("No response from server. Please check your connection.");
  } else {
    throw new Error("Error setting up request: " + error.message);
  }
};

export const fetchUsers = async ({
  status = "active",
  limit = 1000,
  page = 1,
  keywords = "",
}: {
  status?: string;
  limit?: number;
  page?: number;
  keywords?: string;
} = {}) => {
  try {
    const response = await axios.get(
      `${backendURI}/users?status=${status}&limit=${limit}&page=${page}&keywords=${keywords}`,
      {}
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchUserById = async ({ id }: { id: string | undefined }) => {
  const response = await axios.get(`${backendURI}/users/${id}`);
  return response.data;
};

export const createUser = async (payload: any) => {
  const response = await axios.post(`${backendURI}/users`, payload);
  return response.data;
};

export const createUserDetail = async ({ id, payload, query }: any) => {
  const hasFile =
    payload instanceof FormData &&
    (payload.has("documentFile") || payload.get("documentFile"));

  const endpoint = hasFile
    ? `${backendURI}/users/${id}/upload?option=${query}`
    : `${backendURI}/users/${id}?option=${query}`;

  const response = await axios.post(endpoint, payload, {
    headers: hasFile
      ? {
          "Content-Type": "multipart/form-data",
        }
      : undefined,
  });
  return response.data;
};

export const updateUser = async (id: string, payload: any) => {
  const response = await axios.patch(`${backendURI}/users/${id}`, payload);
  return response.data;
};

/**
 * Fetch active users (lightweight endpoint, no full user management permission required)
 * Used for dropdowns/selects in todo tasks, reports, etc.
 * Returns all active users without pagination limits.
 */
export const listActiveUsers = async () => {
  try {
    const response = await axios.get(`${backendURI}/users/list-active`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.results || [];
  } catch (error) {
    try {
      const fallback = await axios.get(`${backendURI}/users?limit=1000`);
      return Array.isArray(fallback.data)
        ? fallback.data
        : fallback.data?.results || [];
    } catch {
      return [];
    }
  }
};