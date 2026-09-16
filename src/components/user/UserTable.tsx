import { useUser } from "@/hooks/user/useUser";
import { Role } from "@/pages/Role/type";
import { EditOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Table, TableProps, Input, Space, Tooltip } from "antd";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { UserType } from "@/types/user";
import Highlighter from 'react-highlight-words';
import ResponsiveTable from "@/components/ui/MobileCardList";
import { Tag } from "antd";
const UserTable = ({ status, showModal }: { status: string, showModal: any }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: user, isPending } = useUser({ status, limit, page, keywords: "" });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const searchInput = useRef<any>(null);
  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPage(pagination.current);
    setLimit(pagination.pageSize);
    setSortedInfo(sorter);
  };
  const getColumnSearchProps = (dataIndex: string, title: string): any => {
    // Get unique values for autocomplete
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (path.includes('.')) {
          const keys = path.split('.');
          let val = obj;
          for (const key of keys) {
            if (!val) return null;
            val = val[key];
          }
          return val;
        }
        return obj[path];
      };
      const values = new Set<string>();
      user?.results?.forEach((record: any) => {
        const value = getValue(record, dataIndex);
        if (value) {
          values.add(value.toString());
        }
      });
      return Array.from(values).sort();
    };
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const uniqueValues = getUniqueValues();
        const currentValue = selectedKeys[0] || '';
        const filteredOptions = currentValue 
          ? uniqueValues.filter(val => 
              val.toLowerCase().includes(currentValue.toLowerCase())
            ).slice(0, 10)
          : uniqueValues.slice(0, 10);
        return (
          <div style={{ padding: 8 }}>
            <Input
              ref={searchInput}
              placeholder={`Search ${title}`}
              value={currentValue}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
              style={{ marginBottom: 8, display: 'block' }}
            />
            {filteredOptions.length > 0 && (
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto', 
                marginBottom: 8,
                border: '1px solid #d9d9d9',
                borderRadius: 4
              }}>
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      borderBottom: idx < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    onClick={() => {
                      setSelectedKeys([option]);
                      handleSearch([option], confirm, dataIndex);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  setSelectedKeys([]);
                  setSearchText('');
                  setSearchedColumn('');
                  confirm({ closeDropdown: false });
                }}
                size="small"
                style={{ width: 90 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        );
      },
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) => {
      if (dataIndex.includes('.')) {
        const keys = dataIndex.split('.');
        let val = record;
        for (const key of keys) {
          if (!val) return false;
          val = val[key];
        }
        return val ? val.toString().toLowerCase().includes(value.toLowerCase()) : false;
      }
      return record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '';
    },
    onFilterDropdownVisibleChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
    };
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps('name', 'Name'),
      sorter: (a: UserType, b: UserType) => (a.name || '').localeCompare(b.name || ''),
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
      render: (_: any, record: UserType) => (
        <>
          <Avatar size={25} style={{ backgroundColor: `#${(Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0')}${(Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0')}${(Math.floor(Math.random() * 128) + 128).toString(16).padStart(2, '0')}` }}>{record?.name?.charAt(0)}</Avatar> &nbsp; &nbsp;
          <Link to={`/user/${record.id}/`} className="text-blue-600 font-medium hover:underline">{record.name}</Link>
        </>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps('email', 'Email'),
      sorter: (a: UserType, b: UserType) => (a.email || '').localeCompare(b.email || ''),
      sortOrder: sortedInfo.columnKey === 'email' && sortedInfo.order,
    },
    {
      title: "PhoneNumber",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
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
      ...getColumnSearchProps('role.name', 'Designation'),
      sorter: (a: UserType, b: UserType) => (a.role?.name || '').localeCompare(b.role?.name || ''),
      sortOrder: sortedInfo.columnKey === 'degination' && sortedInfo.order,
      render: (_: any, record: UserType) => record?.role?.name,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      ...getColumnSearchProps('role.name', 'Role'),
      sorter: (a: UserType, b: UserType) => (a.role?.name || '').localeCompare(b.role?.name || ''),
      sortOrder: sortedInfo.columnKey === 'role' && sortedInfo.order,
      render: (role: Role) => role.name,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
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
  ];
  const rowSelection: TableProps<UserType>["rowSelection"] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: UserType[]) => {
    },
    getCheckboxProps: (record: UserType) => ({
      name: record.name,
    }),
  };
  const renderUserCard = (record: UserType) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={record.avatar ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.avatar}` : undefined}>
            {record.name ? record.name[0] : "U"}
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{record.name}</div>
            <div className="text-xs text-gray-500 truncate">{record.email}</div>
          </div>
        </div>
        <Tag color="blue" className="shrink-0">{record.role?.name || "User"}</Tag>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
        <div>ID: <span className="font-medium text-gray-800">{record.employeeId || '-'}</span></div>
        <div>Phone: <span className="font-medium text-gray-800">{record.phone || '-'}</span></div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Link to={`/user/${record.id}`}>
          <Button size="small" icon={<EyeOutlined style={{ color: '#1677ff' }} />}>View</Button>
        </Link>
        <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
      </div>
    </div>
  );

  return (
    <Card styles={{ body: { padding: '12px' } }}>
      <ResponsiveTable<UserType>
        tableProps={{
          loading: isPending,
          dataSource: user?.results,
          columns: columns,
          rowSelection: rowSelection,
          onChange: handleTableChange,
          pagination: {
            current: page,
            pageSize: limit,
            total: user?.totalItems || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          },
          size: "small",
          rowKey: "id",
        }}
        renderMobileCard={renderUserCard}
      />
    </Card>
  );
};
export default UserTable;


