import React, { useState, useEffect } from 'react';
import { useFetchTaskGroups } from '@/hooks/taskGroup/useFetchTaskGroups';
import { useFetchTaskSuper } from '@/hooks/taskSuper/useFetchTaskSuper';
import { useTaskSuperExcel } from '@/hooks/taskSuper/useTaskSuperExcel';
import { Button, Empty, Modal, Spin, Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import TaskGroupForm from '../TaskGroup/TaskGroupForm';
import { TaskGroupsTable } from '../TaskGroup';
import { hasPermission } from '@/utils/utils';
import { permissionConfig } from '@/utils/permission-config';
import { useQueryClient } from '@tanstack/react-query';
import { TaskGroupType } from '@/types/taskSuper';

const { Title } = Typography;

const TaskSuperDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isTaskGroupModalOpen, setIsTaskGroupModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  const { exportToExcel } = useTaskSuperExcel();
  const { data: taskSuper, isPending: isTaskSuperLoading } = useFetchTaskSuper(id as string);
  const { data: taskGroups, isPending: isTaskGroupsLoading } = useFetchTaskGroups({
    taskSuperId: id as string,
    limit: pageSize,
    page: page,
  });

  const handleGoBack = () => {
    navigate('/task-template');
  };

  const openTaskGroupModal = () => {
    setIsTaskGroupModalOpen(true);
  };

  const closeTaskGroupModal = () => {
    setIsTaskGroupModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['taskGroups', id] });
  };

  if (isTaskSuperLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!taskSuper) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Empty description="Category not found" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="text"
            shape="circle"
            icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
            onClick={handleGoBack}
            className="flex items-center justify-center -ml-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 shrink-0"
            title="Back to Task Templates"
          />
          <Title level={3} className="m-0 truncate">
            {taskSuper.name}
          </Title>
        </div>
        <Space size={8} wrap>
          {hasPermission(permissionConfig.CREATE_TASK_GROUP) && (
            <Button type="primary" onClick={openTaskGroupModal}>
              Add Task Group
            </Button>
          )}
          <Button
            onClick={() => {
              exportToExcel({ ...taskSuper, taskGroup: taskGroups });
            }}
          >
            Export to Excel
          </Button>
        </Space>
      </div>

      {isTaskGroupsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spin />
        </div>
      ) : taskGroups && taskGroups.length > 0 ? (
        <TaskGroupsTable
          taskSuperId={id as string}
          data={taskGroups}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <Empty description="No Task Groups found" />
      )}

      <Modal
        title="Add Task Group"
        open={isTaskGroupModalOpen}
        onCancel={closeTaskGroupModal}
        footer={null}
        width={600}
      >
        <TaskGroupForm handleCancel={closeTaskGroupModal} fixedTaskSuperId={id} />
      </Modal>
    </div>
  );
};

export default TaskSuperDetails;