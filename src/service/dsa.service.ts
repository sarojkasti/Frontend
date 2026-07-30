import axios from "axios";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

const DSA_API = "/dsa";

export const createDsa = async (data: any) => {
  const response = await axios.post(`${backendURI}${DSA_API}`, data);
  return response.data;
};

export const getDsaByProject = async (projectId: string) => {
  const response = await axios.get(`${backendURI}${DSA_API}/project/${projectId}`);
  return response.data;
};

export const approveDsa = async (id: string, data: any) => {
  const response = await axios.patch(`${backendURI}${DSA_API}/${id}/approve`, data);
  return response.data;
};

export const rejectDsa = async (id: string, data: any) => {
  const response = await axios.patch(`${backendURI}${DSA_API}/${id}/reject`, data);
  return response.data;
};

export const settleDsa = async (id: string, data: any) => {
  const response = await axios.patch(`${backendURI}${DSA_API}/${id}/settle`, data);
  return response.data;
};

export const verifyDsa = async (id: string) => {
  const response = await axios.patch(`${backendURI}${DSA_API}/${id}/verify`, {});
  return response.data;
};
