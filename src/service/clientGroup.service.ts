import axios from "axios";
axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export interface ClientGroupItem {
  id: string;
  name: string;
  code?: string;
  primaryContactPerson?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  headOfficeAddress?: string;
  description?: string;
  status: 'active' | 'inactive';
  memberCount?: number;
  activeProjectsCount?: number;
  partnerInCharge?: { id: string; name: string; email?: string; avatar?: string };
  contacts?: Array<{
    id: string;
    name: string;
    designation: string;
    department?: string;
    mobileNo?: string;
    telephoneNo?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const fetchClientGroups = async (): Promise<ClientGroupItem[]> => {
  const response = await axios.get(`${backendURI}/client-groups`);
  return response.data;
};

export const fetchClientGroupById = async (id: string): Promise<any> => {
  const response = await axios.get(`${backendURI}/client-groups/${id}`);
  return response.data;
};

export const fetchGroupLedger = async (id: string): Promise<any> => {
  const response = await axios.get(`${backendURI}/client-groups/${id}/ledger`);
  return response.data;
};

export const createClientGroup = async (payload: any): Promise<ClientGroupItem> => {
  const response = await axios.post(`${backendURI}/client-groups`, payload);
  return response.data;
};

export const updateClientGroup = async (id: string, payload: any): Promise<ClientGroupItem> => {
  const response = await axios.patch(`${backendURI}/client-groups/${id}`, payload);
  return response.data;
};

export const deleteClientGroup = async (id: string): Promise<any> => {
  const response = await axios.delete(`${backendURI}/client-groups/${id}`);
  return response.data;
};

export const addGroupContact = async (groupId: string, payload: any): Promise<any> => {
  const response = await axios.post(`${backendURI}/client-groups/${groupId}/contacts`, payload);
  return response.data;
};

export const deleteGroupContact = async (contactId: string): Promise<any> => {
  const response = await axios.delete(`${backendURI}/client-groups/contacts/${contactId}`);
  return response.data;
};

export const assignClientsToGroup = async (groupId: string, clientIds: string[]): Promise<any> => {
  const response = await axios.post(`${backendURI}/client-groups/${groupId}/assign-clients`, { clientIds });
  return response.data;
};
