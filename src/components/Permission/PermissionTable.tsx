import {
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
  SearchOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import {
  Button,
  Table,
  Space,
  Tooltip,
  message,
  Popconfirm,
  Input,
  Tag,
  Card
} from 'antd';
import { useState, useRef } from 'react';
import { usePermission } from '../../hooks/permission/usePermission';
import { useSyncPermissions } from '../../hooks/permission/useSyncPermissions';
import { useDeletePermission } from '../../hooks/permission/useDeletePermission';
import Highlighter from 'react-highlight-words';

const getMethodColor = (method: string): string => {
  const m = (method || '').toUpperCase();
  switch (m) {
    case 'GET':
      return 'blue';
    case 'POST':
      return 'green';
    case 'PATCH':
      return 'orange';
    case 'PUT':
      return 'gold';
    case 'DELETE':
      return 'red';
    default:
      return 'default';
  }
};

const columns = (
  showEditModal: (record: any) => void,
  handleDelete: (id: string) => void,
  getColumnSearchProps: (dataIndex: string, title: string) => any,
  sortedInfo: any
) => [
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ...getColumnSearchProps('description', 'Description'),
    sorter: (a: any, b: any) => (a.description || '').localeCompare(b.description || ''),
    sortOrder: sortedInfo.columnKey === 'description' && sortedInfo.order,
    ellipsis: {
      showTitle: false
    },
    render: (description: string) => (
      <Tooltip placement="topLeft" title={description}>
        <span className="font-medium text-slate-800">{description || '-'}</span>
      </Tooltip>
    )
  },
  {
    title: 'Resource',
    dataIndex: 'resource',
    key: 'resource',
    width: 160,
    ...getColumnSearchProps('resource', 'Resource'),
    sorter: (a: any, b: any) => (a.resource || '').localeCompare(b.resource || ''),
    sortOrder: sortedInfo.columnKey === 'resource' && sortedInfo.order,
    render: (resource: string) => (
      <Tag color="geekblue" className="font-medium text-xs capitalize">
        {resource || '-'}
      </Tag>
    )
  },
  {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
    width: 110,
    sorter: (a: any, b: any) => (a.method || '').localeCompare(b.method || ''),
    sortOrder: sortedInfo.columnKey === 'method' && sortedInfo.order,
    filters: [
      { text: 'GET', value: 'get' },
      { text: 'POST', value: 'post' },
      { text: 'PATCH', value: 'patch' },
      { text: 'PUT', value: 'put' },
      { text: 'DELETE', value: 'delete' }
    ],
    onFilter: (value: any, record: any) =>
      record.method?.toLowerCase() === value.toLowerCase(),
    render: (method: string) => (
      <Tag
        color={getMethodColor(method)}
        className="font-bold text-xs uppercase px-2 py-0.5 rounded"
      >
        {method || '-'}
      </Tag>
    )
  },
  {
    title: 'Path',
    dataIndex: 'path',
    key: 'path',
    ...getColumnSearchProps('path', 'Path'),
    sorter: (a: any, b: any) => (a.path || '').localeCompare(b.path || ''),
    sortOrder: sortedInfo.columnKey === 'path' && sortedInfo.order,
    ellipsis: {
      showTitle: false
    },
    render: (path: string) => (
      <Tooltip placement="topLeft" title={path}>
        <code className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded font-mono border border-slate-200 inline-block max-w-[280px] truncate">
          {path || '-'}
        </code>
      </Tooltip>
    )
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 130,
    sorter: (a: any, b: any) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    sortOrder: sortedInfo.columnKey === 'createdAt' && sortedInfo.order,
    render: (date: string) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        {date ? new Date(date).toLocaleDateString() : '-'}
      </span>
    )
  },
  {
    title: 'Action',
    key: 'action',
    width: 130,
    align: 'center' as const,
    render: (_: any, record: any) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => showEditModal(record)}
        >
          Edit
        </Button>
        <Popconfirm
          title="Delete permission"
          description="Are you sure you want to delete this permission?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </Space>
    )
  }
];

const PermissionTable = ({ showEditModal }: { showEditModal: any }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: permissionData, isPending } = usePermission({ page, limit });
  const syncPermissions = useSyncPermissions();
  const deletePermission = useDeletePermission();

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<any>(null);
  const [sortedInfo, setSortedInfo] = useState<any>({});

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPage(pagination.current);
    setLimit(pagination.pageSize);
    setSortedInfo(sorter);
  };

  const handleSyncPermissions = async () => {
    try {
      await syncPermissions.mutateAsync();
      message.success('Permissions synced successfully from config modules!');
    } catch (error) {
      message.error('Failed to sync permissions');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePermission.mutateAsync(id);
      message.success('Permission deleted successfully!');
    } catch (error) {
      message.error('Failed to delete permission');
    }
  };

  const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: any) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: string, title: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
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
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) => {
      const val = record[dataIndex];
      return val ? val.toString().toLowerCase().includes(value.toLowerCase()) : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
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
      )
  });

  const totalCount = permissionData?.totalItems || permissionData?.totalCount || 0;

  const paginationOptions = {
    current: page,
    pageSize: limit,
    total: totalCount,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: (total: number, range: number[]) =>
      `${range[0]}-${range[1]} of ${total} permissions`
  };

  return (
    <Card className="shadow-sm rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-500 text-lg" />
          <span className="font-semibold text-slate-700">Permission Endpoints</span>
          <Tag color="blue">{totalCount} Total</Tag>
        </div>

        <Button
          type="default"
          icon={<SyncOutlined />}
          onClick={handleSyncPermissions}
          loading={syncPermissions.isPending}
        >
          Sync Permissions from Config
        </Button>
      </div>

      <Table
        loading={isPending}
        pagination={paginationOptions}
        dataSource={permissionData?.results || []}
        columns={columns(showEditModal, handleDelete, getColumnSearchProps, sortedInfo)}
        onChange={handleTableChange}
        rowKey="id"
        size="middle"
        className="overflow-x-auto"
      />
    </Card>
  );
};

export default PermissionTable;
