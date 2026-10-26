import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const NotificationRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/?openNotifications=true", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center text-gray-500 text-sm">
        Opening notifications...
      </div>
    </div>
  );
};

export default NotificationRedirect;
