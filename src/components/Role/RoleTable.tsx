import { Button } from "antd";
import { useState } from "react";
import { useRole } from "@/hooks/role/useRole";
import { EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { PowerTable, PowerTableColumn } from "@/components/Table";

export const ALL_ROLE_COLUMNS = [
  { key: "name", label: "Name", required: true },
  { key: "description", label: "Description" },
  { key: "createdAt", label: "Created At" },
  { key: "actions", label: "Actions", required: true },
];

const columns: PowerTableColumn[] = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    defaultWidth: 180,
    searchable: true,
    required: true,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    defaultWidth: 240,
    searchable: true,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    defaultWidth: 160,
    searchable: true,
  },
  {
    title: "Actions",
    key: "actions",
    defaultWidth: 240,
    required: true,
    fixed: "right",
    render: (_: any, record: any) => (
      <>
        <Link to={`/role/edit/${record.id}`}>
          <Button type="primary" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
        <Link to={`/role/permission/${record.id}`}>
          <Button type="default" style={{ marginLeft: 8 }}>
            Assign Permissions
          </Button>
        </Link>
      </>
    ),
  },
];

interface RoleTableProps {
  visibleColumnKeys?: string[];
}

const RoleTable = ({ visibleColumnKeys }: RoleTableProps = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: role, isPending } = useRole({ page, limit });

  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setLimit(pagination.pageSize);
  };

  const paginationOptions = {
    current: page,
    pageSize: limit,
    total: role?.totalItems,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: [5, 10, 20, 30, 50, 100],
    showTotal: (total: number, range: number[]) =>
      `${range[0]}-${range[1]} of ${total}`,
  };

  return (
    <PowerTable
      loading={isPending}
      pagination={paginationOptions}
      dataSource={role?.results}
      columns={columns}
      rowKey="id"
      onChange={handleTableChange}
      enableResize
      enableColumnSearch
      visibleColumnKeys={visibleColumnKeys}
      persistenceKey="role_table"
      showToolbar={false}
    />
  );
};

export default RoleTable;
