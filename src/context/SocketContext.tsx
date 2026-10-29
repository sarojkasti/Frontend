import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Socket } from "socket.io-client";
import { initializeSocket, disconnectSocket } from "@/service/socket";
import { useSession } from "@/context/SessionContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { App as AntdApp, notification as antdNotification } from "antd";
import { NotificationType, UserNotification } from "@/types/notification";
import { fetchMyNotifications, updateNotifications, markAllAsReadByType } from "@/service/notification.service";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: UserNotification[];
  isLoading: boolean;
  refetchNotifications: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (type?: NotificationType) => Promise<void>;
  joinModule: (moduleName: string) => void;
  leaveModule: (moduleName: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  refetchNotifications: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  joinModule: () => {},
  leaveModule: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, profile } = useSession();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Safely retrieve context notification if available inside AntdApp
  let notificationApi: any = null;
  try {
    const antdApp = AntdApp.useApp();
    notificationApi = antdApp?.notification;
  } catch (e) {
    notificationApi = null;
  }

  const userId = profile?.id || localStorage.getItem("userId") || "";

  // Fetch notifications for the logged in user
  const {
    data: notifications = [],
    isLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetchMyNotifications(userId);
      return Array.isArray(res) ? res : [];
    },
    enabled: !!userId && isAuthenticated,
    staleTime: 30000,
  });

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n: UserNotification) => !n.isRead && !n.isArchived).length;
  }, [notifications]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const sock = initializeSocket();
    if (!sock) return;

    setSocket(sock);

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    if (sock.connected) {
      setIsConnected(true);
    }

    // Handler for incoming real-time notifications
    const handleNotification = (data: any) => {
      // Invalidate notifications cache immediately for zero lag
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });

      const notif = data?.notification || data;
      const messageText = notif?.message || "You have a new update.";
      const type = notif?.type || NotificationType.GENERAL;

      // Invalidate relevant module queries if notification matches a module
      if (type === NotificationType.CLIENT || notif?.metadata?.module === "client") {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["client"] });
      } else if (type === NotificationType.PROJECT || notif?.metadata?.module === "project") {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
      } else if (type === NotificationType.DSA || notif?.metadata?.module === "dsa") {
        queryClient.invalidateQueries({ queryKey: ["dsa"] });
      } else if (type === NotificationType.TASK || type === NotificationType.WORKLOG) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["todo_tasks"] });
        queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      }

      // Show instant toast notification
      const notify = notificationApi || antdNotification;
      const typeLabel = typeof type === "string" ? type.toUpperCase() : "SYSTEM";
      notify.info({
        message: `${typeLabel} Alert`,
        description: messageText,
        placement: "topRight",
        duration: 5,
      });
    };

    // Handler for broadcast module updates
    const handleModuleProject = () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    };

    const handleModuleTask = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["todo_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    };

    const handleModuleClient = () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    };

    // Handler for read updates
    const handleRead = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    };

    sock.on("notification", handleNotification);
    sock.on("module_project", handleModuleProject);
    sock.on("module_task", handleModuleTask);
    sock.on("module_client", handleModuleClient);
    sock.on("notification_read", handleRead);
    sock.on("notification_bulk_read", handleRead);
    sock.on("notification_deleted", handleRead);
    sock.on("notification_archived", handleRead);

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.off("notification", handleNotification);
      sock.off("module_project", handleModuleProject);
      sock.off("module_task", handleModuleTask);
      sock.off("module_client", handleModuleClient);
      sock.off("notification_read", handleRead);
      sock.off("notification_bulk_read", handleRead);
      sock.off("notification_deleted", handleRead);
      sock.off("notification_archived", handleRead);
    };
  }, [isAuthenticated, userId, queryClient, notificationApi]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      await updateNotifications({ id, userId });
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    [userId, queryClient]
  );

  const markAllAsRead = useCallback(
    async (type?: NotificationType) => {
      if (!userId || !type) return;
      await markAllAsReadByType({ userId, type });
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    [userId, queryClient]
  );

  const joinModule = useCallback(
    (moduleName: string) => {
      if (socket && socket.connected && moduleName) {
        socket.emit("join_module", moduleName);
      }
    },
    [socket]
  );

  const leaveModule = useCallback(
    (moduleName: string) => {
      if (socket && socket.connected && moduleName) {
        socket.emit("leave_module", moduleName);
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCount,
        notifications,
        isLoading,
        refetchNotifications,
        markAsRead,
        markAllAsRead,
        joinModule,
        leaveModule,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
