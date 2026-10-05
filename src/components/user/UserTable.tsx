import { useUser } from "@/hooks/user/useUser";
import { Role } from "@/pages/Role/type";
import {
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Card, Table, TableProps, Input, Space, Tooltip } from "antd";
import { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserType } from "@/types/user";
import { PowerTable, PowerTableColumn, useTableSearch } from "@/components/Table";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { Tag } from "antd";
import { useIsMobile } from "@/hooks/useIsMobile";
import dayjs from "dayjs";

const UserTable = ({
  status,
  showModal,
  searchQuery = "",
  selectedUsers = [],
  setSelectedUsers,
  visibleColumnKeys,
}: {
  status: string;
  showModal: any;
  searchQuery?: string;
  selectedUsers?: any[];
  setSelectedUsers?: (users: any[]) => void;
  visibleColumnKeys?: string[];
}) => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: user, isPending } = useUser({
    status,
    limit: isMobile ? 100 : limit,
    page: isMobile ? 1 : page,
    keywords: searchQuery
  });

  const filteredUsers = useMemo(() => {
    const rawUsers: UserType[] = Array.isArray(user) ? user : user?.results || [];
    if (!searchQuery?.trim()) return rawUsers;
    const q = searchQuery.trim().toLowerCase();
    return rawUsers.filter((u: any) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const phone = (u.phoneNumber || u.phone || "").toString().toLowerCase();
      const empId = (u.employeeId || "").toString().toLowerCase();
      const roleName = (u.role?.displayName || u.role?.name || "").toLowerCase();
      const department = (u.profile?.department?.name || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        username.includes(q) ||
        phone.includes(q) ||
        empId.includes(q) ||
        roleName.includes(q) ||
        department.includes(q)
      );
    });
  }, [user, searchQuery]);

  const [sortedInfo, setSortedInfo] = useState<any>({});
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const toggleExpand = (id: string | number) => {
    const strId = String(id);
    setExpandedIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPage(pagination.current);
    setLimit(pagination.pageSize);
    setSortedInfo(sorter);
  };

  const { getColumnSearchProps } = useTableSearch({
    dataSource: filteredUsers,
  });
  const columns: PowerTableColumn<UserType>[] = useMemo(() => [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      defaultWidth: 200,
      required: true,
      ...getColumnSearchProps('name', 'Name'),
      sorter: (a: UserType, b: UserType) => (a.name || '').localeCompare(b.name || ''),
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
      render: (_: any, record: UserType) => (
        <Space size={8}>
          <Avatar
            size={25}
            icon={<UserOutlined />}
            src={
              record.avatar
                ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.avatar}`
                : undefined
            }
            className="shrink-0"
          />
          <Link to={`/user/${record.id}/`} className="text-blue-600 font-medium hover:underline">
            {record.name}
          </Link>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      defaultWidth: 200,
      ...getColumnSearchProps('email', 'Email'),
      sorter: (a: UserType, b: UserType) => (a.email || '').localeCompare(b.email || ''),
      sortOrder: sortedInfo.columnKey === 'email' && sortedInfo.order,
    },
    {
      title: "PhoneNumber",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      defaultWidth: 160,
      ...getColumnSearchProps('phoneNumber', 'Phone Number'),
      sorter: (a: any, b: any) => {
        const aPhone = a.phoneNumber || '';
        const bPhone = b.phoneNumber || '';
        return aPhone.localeCompare(bPhone);
      },
      sortOrder: sortedInfo.columnKey === 'phoneNumber' && sortedInfo.order,
    },
    {
      title: "Designation",
      dataIndex: "degination",
      key: "degination",
      defaultWidth: 160,
      ...getColumnSearchProps('role.name', 'Designation'),
      sorter: (a: UserType, b: UserType) => (a.role?.name || '').localeCompare(b.role?.name || ''),
      sortOrder: sortedInfo.columnKey === 'degination' && sortedInfo.order,
      render: (_: any, record: UserType) => record?.role?.name,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      defaultWidth: 140,
      ...getColumnSearchProps('role.name', 'Role'),
      sorter: (a: UserType, b: UserType) => (a.role?.name || '').localeCompare(b.role?.name || ''),
      sortOrder: sortedInfo.columnKey === 'role' && sortedInfo.order,
      render: (role: Role) => role?.name,
    },
    {
      title: "Joined Date",
      dataIndex: "joinedDate",
      key: "joinedDate",
      defaultWidth: 140,
      sorter: (a: UserType, b: UserType) => {
        const aDate = a.joinedDate || a.createdAt || '';
        const bDate = b.joinedDate || b.createdAt || '';
        return aDate.localeCompare(bDate);
      },
      sortOrder: sortedInfo.columnKey === 'joinedDate' && sortedInfo.order,
      render: (_: any, record: UserType) => {
        const date = record.joinedDate || record.createdAt;
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      defaultWidth: 100,
      required: true,
      fixed: "right",
      render: (_: any, record: UserType) => (
        <Space size="small">
          <Tooltip title="View User Details">
            <Link to={`/user/${record.id}`}>
              <Button 
                icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
                style={{ borderColor: '#91caff' }}
              />
            </Link>
          </Tooltip>
          <Tooltip title="Edit User">
            <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ], [getColumnSearchProps, sortedInfo, showModal]);
  const rowSelection: TableProps<UserType>["rowSelection"] = {
    selectedRowKeys: selectedUsers?.map((u: any) => u.id),
    onChange: (_selectedRowKeys: React.Key[], selectedRows: UserType[]) => {
      if (setSelectedUsers) {
        setSelectedUsers(selectedRows);
      }
    },
    getCheckboxProps: (record: UserType) => ({
      name: record.name,
    }),
  };
  const renderUserCard = (record: UserType) => {
    const isExpanded = expandedIds.includes(String(record.id));
    const roleName = (record.role as any)?.displayName || record.role?.name || "No Role";

    return (
      <div className="flex flex-col gap-2.5">
        {/* Tier 1: User Name & Email */}
        <div>
          <div
            onClick={() => navigate(`/user/${record.id}`)}
            className="font-bold text-base text-gray-900 hover:text-blue-600 hover:underline cursor-pointer truncate"
            title={record.name}
          >
            {record.name}
          </div>
          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {record.email || "No Email"}
          </div>
        </div>

        {/* Tier 2: Avatar + Role on Left, Action Buttons on Right */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-700 min-w-0">
            <Avatar
              size={22}
              icon={<UserOutlined />}
              src={
                record.avatar
                  ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.avatar}`
                  : undefined
              }
              className="shrink-0"
            />
            <span className="font-medium text-gray-700 truncate max-w-[170px]">
              {roleName}
            </span>
          </div>

          {/* Action Icons: View Details, Edit, Dropdown Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${record.id}`);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="View Details"
              aria-label="View Details"
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
                showModal(record);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="Edit User"
              aria-label="Edit User"
            />
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(record.id);
              }}
              className="text-gray-500 hover:text-blue-600 flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
              title="Toggle Details"
              aria-label="Toggle Details"
            />
          </div>
        </div>

        {/* Revealed Detail Card (when dropdown button clicked) */}
        {isExpanded && (
          <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 flex flex-col gap-2 bg-gray-50/80 rounded-lg p-3 text-xs text-gray-600">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Employee ID:</span>
              <span className="font-semibold text-gray-800 text-right">{record.employeeId || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Phone:</span>
              <span className="font-semibold text-gray-800 text-right">
                {record.phoneNumber || (record as any).phone || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Status:</span>
              <Tag color={record.status === "active" ? "success" : "error"}>
                {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "Active"}
              </Tag>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Joined Date:</span>
              <span className="font-semibold text-gray-800 text-right">
                {record.joinedDate ? dayjs(record.joinedDate).format("YYYY-MM-DD") : (record.createdAt ? dayjs(record.createdAt).format("YYYY-MM-DD") : "-")}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      styles={{ body: { padding: isMobile ? 0 : 12 } }}
      bordered={!isMobile}
      className={isMobile ? "bg-transparent border-0 shadow-none" : ""}
    >
      <PowerTable<UserType>
        loading={isPending}
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        enableResize
        visibleColumnKeys={visibleColumnKeys}
        persistenceKey="user_table"
        showToolbar={false}
        rowSelection={isMobile ? undefined : rowSelection}
        onChange={handleTableChange}
        pagination={
          isMobile
            ? false
            : {
                current: page,
                pageSize: limit,
                total: searchQuery?.trim() ? filteredUsers.length : (user?.totalItems || 0),
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: [5, 10, 20, 50],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }
        }
        renderMobileCard={renderUserCard}
      />
    </Card>
  );
};
export default UserTable;


