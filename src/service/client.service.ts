import axios from "axios";
axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchClients = async (status?: string) => {
  const url = status 
    ? `${backendURI}/clients?status=${status}` 
    : `${backendURI}/clients`;
  const response = await axios.get(url, {});
  return response.data;
};

export const fetchClientById = async ({ id }: { id: string | undefined }) => {
  const response = await axios.get(`${backendURI}/clients/${id}`);
  return response.data;
};

export const createClient = async (payload: any) => {
  const response = await axios.post(`${backendURI}/clients`, payload);
  return response.data;
};

export const editClient = async ({
  payload,
  id,
}: {
  payload: any;
  id: string;
}) => {
  const response = await axios.patch(
    `${backendURI}/clients/${id}`,
    payload
  );
  return response.data;
};

// Portal Credentials APIs
export const fetchPortalCredentials = async (clientId: string) => {
  const response = await axios.get(`${backendURI}/clients/${clientId}/portal-credentials`);
  return response.data;
};

export const fetchPortalCredentialById = async (clientId: string, credentialId: string) => {
  const response = await axios.get(`${backendURI}/clients/${clientId}/portal-credentials/${credentialId}`);
  return response.data;
};

export const createPortalCredential = async (clientId: string, payload: any) => {
  const response = await axios.post(`${backendURI}/clients/${clientId}/portal-credentials`, payload);
  return response.data;
};

export const updatePortalCredential = async (clientId: string, credentialId: string, payload: any) => {
  const response = await axios.patch(
    `${backendURI}/clients/${clientId}/portal-credentials/${credentialId}`,
    payload
  );
  return response.data;
};

export const deletePortalCredential = async (clientId: string, credentialId: string) => {
  const response = await axios.delete(`${backendURI}/clients/${clientId}/portal-credentials/${credentialId}`);
  return response.data;
};

// Similarity Check & Duplicate Detection APIs
export const checkClientSimilarity = async ({
  name,
  pan,
  excludeId
}: {
  name?: string;
  pan?: string;
  excludeId?: string;
}) => {
  const params: any = {};
  if (name) params.name = name;
  if (pan) params.pan = pan;
  if (excludeId) params.excludeId = excludeId;
  const response = await axios.get(`${backendURI}/clients/similarity-check`, { params });
  return response.data;
};

export const fetchDuplicationAuditReport = async () => {
  const response = await axios.get(`${backendURI}/clients/duplication-audit`);
  return response.data;
};

// Timeline & Board Member APIs
export const fetchClientTimeline = async (clientId: string) => {
  const response = await axios.get(`${backendURI}/clients/${clientId}/timeline`);
  return response.data;
};

export const createClientTimelineEvent = async (clientId: string, payload: any) => {
  const response = await axios.post(`${backendURI}/clients/${clientId}/timeline`, payload);
  return response.data;
};

export const deleteClientTimelineEvent = async (clientId: string, eventId: string) => {
  const response = await axios.delete(`${backendURI}/clients/${clientId}/timeline/${eventId}`);
  return response.data;
};

export const addClientBoardMember = async (clientId: string, payload: any) => {
  const response = await axios.post(`${backendURI}/clients/${clientId}/board-members`, payload);
  return response.data;
};

// Licenses & Renewal Reminder APIs
export const fetchClientLicenses = async (clientId: string) => {
  const response = await axios.get(`${backendURI}/clients/${clientId}/licenses`);
  return response.data;
};

export const createClientLicense = async (clientId: string, payload: any) => {
  const response = await axios.post(`${backendURI}/clients/${clientId}/licenses`, payload);
  return response.data;
};

export const updateClientLicense = async (clientId: string, licenseId: string, payload: any) => {
  const response = await axios.patch(`${backendURI}/clients/${clientId}/licenses/${licenseId}`, payload);
  return response.data;
};

export const deleteClientLicense = async (clientId: string, licenseId: string) => {
  const response = await axios.delete(`${backendURI}/clients/${clientId}/licenses/${licenseId}`);
  return response.data;
};

// Other Important Info APIs
export const fetchClientOtherInfo = async (clientId: string) => {
  const response = await axios.get(`${backendURI}/clients/${clientId}/other-info`);
  return response.data;
};

export const createClientOtherInfo = async (clientId: string, payload: any) => {
  const response = await axios.post(`${backendURI}/clients/${clientId}/other-info`, payload);
  return response.data;
};

export const updateClientOtherInfo = async (clientId: string, infoId: string, payload: any) => {
  const response = await axios.patch(`${backendURI}/clients/${clientId}/other-info/${infoId}`, payload);
  return response.data;
};

export const deleteClientOtherInfo = async (clientId: string, infoId: string) => {
  const response = await axios.delete(`${backendURI}/clients/${clientId}/other-info/${infoId}`);
  return response.data;
};

// Recurring Projects APIs
export const fetchClientRecurringProjects = async (clientId: string) => {
  const response = await axios.get(`${backendURI}/projects/recurring/client/${clientId}`);
  return response.data;
};

export const createRecurringProject = async (payload: any) => {
  const response = await axios.post(`${backendURI}/projects/recurring`, payload);
  return response.data;
};

export const updateRecurringProject = async (id: string, payload: any) => {
  const response = await axios.patch(`${backendURI}/projects/recurring/${id}`, payload);
  return response.data;
};

export const deleteRecurringProject = async (id: string) => {
  const response = await axios.delete(`${backendURI}/projects/recurring/${id}`);
  return response.data;
};

export const triggerRecurringProject = async (id: string) => {
  const response = await axios.post(`${backendURI}/projects/recurring/${id}/trigger`);
  return response.data;
};
