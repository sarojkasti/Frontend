import axios from "axios";
import { NotificationType } from "@/types/notification";

axios.defaults.withCredentials = true;
const backendURI = import.meta.env.VITE_BACKEND_URI;

export const fetchMyNotifications = async (userId: string, type?: NotificationType) => {
  const url = type
    ? `${backendURI}/notification/user/${userId}?type=${type}`
    : `${backendURI}/notification/user/${userId}`;
  const response = await axios.get(url);
  return response.data;
};

export const updateNotifications = async ({ id, userId }: { id: string; userId: string }) => {
  const response = await axios.patch(`${backendURI}/notification/read/${userId}/${id}`, {});
  return response.data;
};

export const markAllAsReadByType = async ({ userId, type }: { userId: string; type: NotificationType }) => {
  const response = await axios.patch(`${backendURI}/notification/read-all/${userId}/${type}`, {});
  return response.data;
};

// Send a notification for leave-related events
export const sendLeaveNotification = async (
  leaveId: string,
  recipientIds: string[],
  type: 'leave_requested' | 'leave_approved' | 'leave_approved_by_manager' | 'leave_rejected' | 'leave_needs_admin_approval'
) => {
  try {
    const response = await axios.post(`${backendURI}/notification/leave`, {
      leaveId,
      recipientIds,
      type
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// --- Web Push Notification API Services ---

export const fetchVapidPublicKey = async (): Promise<{ publicKey: string | null; enabled: boolean }> => {
  const response = await axios.get(`${backendURI}/notification/push/public-key`);
  return response.data;
};

export const savePushSubscriptionOnServer = async (
  subscription: any,
  userId?: string
) => {
  const payload = {
    ...subscription,
    userId,
    userAgent: navigator.userAgent,
  };
  const response = await axios.post(`${backendURI}/notification/push/subscribe`, payload);
  return response.data;
};

export const removePushSubscriptionFromServer = async (endpoint: string) => {
  const response = await axios.post(`${backendURI}/notification/push/unsubscribe`, { endpoint });
  return response.data;
};

export const sendTestPushNotification = async (userId?: string, deviceId?: string) => {
  const response = await axios.post(`${backendURI}/notification/push/test`, { userId, deviceId });
  return response.data;
};

export const sendCustomTestNotificationApi = async (payload: {
  userId: string;
  message: string;
  title?: string;
  link?: string;
  type?: NotificationType;
  sendPush?: boolean;
  sendInApp?: boolean;
  deviceId?: string;
}) => {
  const response = await axios.post(`${backendURI}/notification/test-custom`, payload);
  return response.data;
};

export const fetchPushSubscribers = async () => {
  const response = await axios.get(`${backendURI}/notification/push/subscribers`);
  return response.data;
};

export const fetchUsersForTarget = async () => {
  const response = await axios.get(`${backendURI}/notification/push/users-for-target`);
  return response.data;
};
