import { io, Socket } from "socket.io-client";

const backendURI = import.meta.env.VITE_BACKEND_URI || "http://localhost:7777";

let socketInstance: Socket | null = null;

export function initializeSocket(): Socket | null {
  // If already connected or active, return existing instance
  if (socketInstance && (socketInstance.connected || socketInstance.active)) {
    return socketInstance;
  }

  // Get token from localStorage or 'Authentication' cookie
  let sessionToken = localStorage.getItem("access_token");
  if (!sessionToken) {
    const cookieString = document.cookie;
    const tokenMatch = cookieString.match(/(?:^|;\s*)Authentication=([^;]*)/);
    if (tokenMatch && tokenMatch[1]) {
      sessionToken = decodeURIComponent(tokenMatch[1]);
      localStorage.setItem("access_token", sessionToken);
    }
  }

  if (!sessionToken) {
    return null;
  }

  socketInstance = io(backendURI, {
    auth: {
      token: sessionToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socketInstance.on("connect", () => {
    console.log("[Socket] Connected to backend gateway:", socketInstance?.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[Socket] Gateway connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected from gateway:", reason);
  });

  return socketInstance;
}

export function getSocket(): Socket | null {
  if (!socketInstance || !socketInstance.connected) {
    return initializeSocket();
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
