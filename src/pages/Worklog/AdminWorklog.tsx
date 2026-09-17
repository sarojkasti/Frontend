import AdminWorklogTable from "@/components/Worklog/AdminWorklogTable";
import { Card, Button, Radio } from "antd";
import { useState } from "react";
import WorklogCalendar from "@/components/Worklog/WorklogCalendar";
import { useSession } from "@/context/SessionContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

const WorklogAdmin = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const profilePermissions = (profile as any)?.role?.permission;
  
  // Check if user has permission to access all worklog page
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const hasAllWorklogPermission = Array.isArray(profilePermissions) && profilePermissions.some(
    (perm: any) => perm.path === '/worklogs/allworklog' && perm.method?.toLowerCase() === 'get'
  );
  
  if (!hasAllWorklogPermission) {
    return (
      <Card>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Permission Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
          <Button type="primary" onClick={() => navigate("/worklogs-all")}>
            Go Back
          </Button>
        </div>
      </Card>
    );
  }
  
  const viewControls = (
    <Radio.Group 
      value={viewMode} 
      onChange={(e) => setViewMode(e.target.value)}
      optionType="button"
      buttonStyle="solid"
      size={isMobile ? "small" : "middle"}
    >
      <Radio.Button value="list">List</Radio.Button>
      <Radio.Button value="calendar">Calendar</Radio.Button>
    </Radio.Group>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/worklogs-all")}
            title="Back to My Worklogs"
          />
          <h1 className="text-lg md:text-xl font-bold m-0 text-gray-800">All Worklogs Admin</h1>
        </div>
        {viewControls}
      </div>
      {viewMode === 'calendar' ? (
        <div className="mb-4">
          <WorklogCalendar />
        </div>
      ) : (
        <AdminWorklogTable />
      )}
    </div>
  );
};

export default WorklogAdmin;