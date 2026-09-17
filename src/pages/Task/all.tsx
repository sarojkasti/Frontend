import AllTaskTable from "@/components/Task/AllTaskTable";
import TaskForm from "@/components/Task/TaskForm";
import { Button, Modal, Tabs, Select, Input, Space } from "antd";
import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { useProject } from "@/hooks/project/useProject";
import { useProjectTask } from "@/hooks/task/useProjectTask";
import { useQueryClient } from "@tanstack/react-query";
import useIsMobile from "@/hooks/useIsMobile";

const AllTask = () => {
  const [open, setOpen] = useState(false);
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const { isMobile } = useIsMobile();
  // Extract userRole and userId from profile (profile is UserType)
  const userRole = (profile as any)?.role?.name?.toLowerCase?.() || "";
  const userId = (profile as any)?.id;
  const hideAddTask = userRole === "auditsenior" || userRole === "auditjunior";
  const { data: projects, refetch } = useProject({ status: "active" });
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [editTaskData, setEditTaskData] = useState<any>(undefined);
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [globalSearchText, setGlobalSearchText] = useState('');
  // Fetch tasks dynamically for the selected project
  const { data: projectTasks } = useProjectTask({ id: selectedProjectId });
  // Refetch projects when modal opens to ensure we have the latest data
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      refetch();
    }
  }, [open, queryClient, refetch]);
  // Update users/tasks when project changes (for add)
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects?.find((p: any) => p.id?.toString() === projectId);
    setModalUsers(project?.users || []);
  };
  // For edit, get users/tasks from the task's project
  const getProjectForTask = (task: any) => {
    if (!task?.project?.id) return undefined;
    return projects?.find((p: any) => p.id?.toString() === task.project.id?.toString());
  };
  const handleAdd = () => {
    setEditTaskData(undefined);
    setSelectedProjectId(undefined);
    setModalUsers([]);
    setOpen(true);
  };
  const handleEdit = (task: any) => {
    setEditTaskData(task);
    const projectId = task?.project?.id?.toString() || task?.projectId?.toString();
    setSelectedProjectId(projectId);
    // Find the project and set users/tasks for the modal
    const project = projects?.find((p: any) => p.id?.toString() === projectId);
    setModalUsers(project?.users || []);
    setOpen(true);
  };
  const handleTaskFormSuccess = () => {
    // Refresh task data after successful operation
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    // Also invalidate projects in case task affected project data
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setOpen(false);
  };
  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0" style={{ position: 'relative' }}>
      {/* Search Bar - responsive: centered on desktop, full-width on mobile */}
      <div className={isMobile ? "mb-3 px-1" : ""} style={isMobile ? {} : { 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 10,
        top: '6px'
      }}>
        <Input.Search
          placeholder="Search all fields (name, ID, project, type)..."
          allowClear
          onChange={(e) => setGlobalSearchText(e.target.value)}
          onSearch={(value) => setGlobalSearchText(value)}
          style={{ width: isMobile ? '100%' : 400 }}
        />
      </div>
      <Tabs
        defaultActiveKey="1"
        renderTabBar={(props, DefaultTabBar) => (
          <div className="overflow-x-auto whitespace-nowrap px-4 sm:px-0">
            <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
          </div>
        )}
        tabBarStyle={
          isMobile
            ? {
                overflowX: "auto",
                whiteSpace: "nowrap",
                marginBottom: 12,
                paddingLeft: "16px",
                paddingRight: "16px",
              }
            : undefined
        }
        tabBarExtraContent={
          !hideAddTask ? (
            <Button 
              onClick={handleAdd}
              style={{ 
                background: '#e6f7ff', 
                color: '#1890ff', 
                borderColor: '#91d5ff', 
                fontWeight: 500 
              }}
            >
              Add Task
            </Button>
          ) : null
        }
        items={[
          {
            label: `TODO`,
            key: "1",
            children: <AllTaskTable status={"open"}  userRole={userRole} onEdit={handleEdit} externalSearchText={globalSearchText} />,
          },
          {
            label: `DOING`,
            key: "2",
            children: <AllTaskTable status={"in_progress"}  userRole={userRole} onEdit={handleEdit} externalSearchText={globalSearchText} />,
          },
          {
            label: `COMPLETED`,
            key: "3",
            children: <AllTaskTable status={"done"}  userRole={userRole} onEdit={handleEdit} externalSearchText={globalSearchText} />,
          },
        ]}
      />
      <Modal
        title={editTaskData ? "Edit Task" : "Add Task"}
        open={open}
        width={isMobile ? '95vw' : 800}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        {/* Project selection only for Add, not Edit */}
        {!editTaskData && (
          <Select
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="Select Project"
            value={selectedProjectId}
            onChange={handleProjectChange}
            options={projects?.map((p: any) => ({ value: p.id?.toString(), label: p.name }))}
          />
        )}
        <TaskForm
          users={modalUsers}
          tasks={projectTasks || []}
          editTaskData={editTaskData}
          handleCancel={() => setOpen(false)}
          projectId={selectedProjectId}
          onSuccess={handleTaskFormSuccess}
        />
      </Modal>
    </div>
  );
};
export default AllTask;