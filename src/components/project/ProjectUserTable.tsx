import React, { useMemo } from "react";
import { ProjectType } from "@/types/project";
import { PowerTable, getGlobalPaginationConfig } from "@/components/Table";
import { Tag } from "antd";

interface ProjectDetailProps {
  project: ProjectType;
  id?: number;
}

const ProjectUserTable: React.FC<ProjectDetailProps> = ({ project }) => {
  const users = project?.users || [];

  const paginationConfig = useMemo(() => {
    return getGlobalPaginationConfig(
      {
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: [5, 10, 20, 50],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`,
      },
      {
        pageSize: 10,
        total: users.length,
        hideOnSinglePage: true,
      }
    );
  }, [users.length]);

  const userColumns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text: string) => text || "-",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => text || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => text || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (!status) return "-";
        const isAct = String(status).toLowerCase() === "active";
        return <Tag color={isAct ? "green" : "default"}>{status}</Tag>;
      },
    },
  ];

  return (
    <PowerTable
      dataSource={users}
      columns={userColumns}
      rowKey={(r: any) => r.id || r.username || Math.random().toString()}
      pagination={paginationConfig}
      showToolbar={false}
      enableResize
      enableColumnSearch={false}
      size="small"
    />
  );
};

export default ProjectUserTable;
