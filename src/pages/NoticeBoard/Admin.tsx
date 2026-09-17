import { useAllNoticeBoards } from "@/hooks/notice-board/useAllNoticeBoards";
import { useDeleteNoticeBoard } from "@/hooks/notice-board/useDeleteNoticeBoard";
import { useSession } from "@/context/SessionContext";
import { Button, Space, message, Popconfirm, Badge, Typography, Card, Tooltip, Input, Select } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MailOutlined, SearchOutlined, ArrowLeftOutlined, CloseOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useMemo } from "react";
import NoticeBoardDetail from "@/components/NoticeBoard/NoticeBoardDetail";
import Highlighter from "react-highlight-words";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title, Text } = Typography;

const NoticeBoardAdmin = () => {
  const { data: notices, isLoading } = useAllNoticeBoards();
  const { mutateAsync: deleteNoticeBoard } = useDeleteNoticeBoard();
  const { profile } = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const toggleExpandCard = (id: string | number) => {
    const strId = String(id);
    setExpandedCardIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };
  
  // For search functionality
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<any>(null);

  // Helper function to get unique values for autocomplete
  const getUniqueValues = (dataIndex: string | string[]) => {
    if (!notices) return [];
    
    const values = notices.map((item: any) => {
      if (Array.isArray(dataIndex)) {
        let value = item;
        for (const key of dataIndex) {
          value = value?.[key];
        }
        return value;
      }
      return item[dataIndex];
    }).filter(Boolean);
    
    return [...new Set(values)];
  };

  const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: any, confirm: any) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn('');
    confirm({ closeDropdown: false });
  };

  const getColumnSearchProps = (dataIndex: any, columnName: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
      const uniqueValues = getUniqueValues(dataIndex);
      const [currentValue, setCurrentValue] = useState('');

      const filteredOptions = currentValue
        ? uniqueValues.filter((value: any) =>
            value?.toString().toLowerCase().includes(currentValue.toLowerCase())
          )
        : uniqueValues.slice(0, 10);

      return (
        <div style={{ padding: 8 }}>
          <Select
            ref={searchInput}
            placeholder={`Search ${columnName}`}
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
              setCurrentValue('');
            }}
            onSearch={(value) => setCurrentValue(value)}
            showSearch
            allowClear
            style={{ width: 188, marginBottom: 8, display: 'block' }}
            filterOption={false}
            onDropdownVisibleChange={(open) => {
              if (open) {
                setCurrentValue('');
              }
            }}
          >
            {filteredOptions.map((value: any, index: number) => (
              <Select.Option key={`${value}-${index}`} value={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
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
              onClick={() => clearFilters && handleReset(clearFilters, confirm)}
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
    onFilter: (value: any, record: any) => {
      const recordValue = Array.isArray(dataIndex)
        ? dataIndex.reduce((obj, key) => obj?.[key], record)
        : record[dataIndex];
      
      return recordValue
        ? recordValue.toString().toLowerCase().includes(value.toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.focus(), 100);
      }
    },
    render: (text: any) =>
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
  });

  // Determine if the user has permission to manage notices
  const roleName = (profile?.role as any)?.name || '';
  
  const isAdmin = roleName === 'superuser' || 
                 roleName === 'admin' || 
                 roleName?.toLowerCase().includes('admin') ||
                 roleName?.toLowerCase().includes('super');
  
  const handleDelete = async (id: string) => {
    try {
      await deleteNoticeBoard({ id });
      message.success("Notice deleted successfully");
    } catch (error) {
      message.error("Failed to delete notice");
    }
  };

  const handleViewDetail = (id: string) => {
    setSelectedNotice(id);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedNotice(null);
  };

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    if (!searchQuery?.trim()) return notices;
    const q = searchQuery.toLowerCase();
    return notices.filter((n: any) => {
      const title = n.title || "";
      const description = n.description || "";
      const author = n.createdByUser?.name || n.createdByUser?.email || "";
      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        author.toLowerCase().includes(q)
      );
    });
  }, [notices, searchQuery]);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title', 'Title'),
      render: (text: string, record: any) => {
        const displayText = searchedColumn === 'title' ? (
          <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ''}
          />
        ) : text;
        
        const failedRecipients = record.emailFailedRecipients || [];

        return (
          <Space>
            <Link to={`/notice-board/edit/${record.id}`}>{displayText}</Link>
            {failedRecipients.length > 0 && (
              <Tooltip
                title={`Email failed for: ${failedRecipients
                  .map((user: any) => `${user.name || user.email} (${user.email})`)
                  .join(', ')}`}
              >
                <MailOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
            {record.emailSent && (
              <Tooltip title="Email sent">
                <MailOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Distribution',
      key: 'distribution',
      render: (_text: string, record: any) => (
        <Badge 
          status={record.sendToAll ? "success" : "warning"} 
          text={record.sendToAll ? "All Users" : "Selected Users/Roles"} 
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Read Statistics',
      key: 'readStats',
      render: (_text: string, record: any) => {
        const totalTargets = record.sendToAll 
          ? 'All Users' 
          : `${record.users?.length || 0} Users`;
        
        const readCount = record.readByUsers?.length || 0;
        
        return (
          <Text>
            Read by {readCount} / {totalTargets}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_text: string, record: any) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record.id)}
            size="small"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/notice-board/edit/${record.id}`)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this notice?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderNoticeCard = (record: any) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    const totalTargets = record.sendToAll ? 'All Users' : `${record.users?.length || 0} Users`;
    const readCount = record.readByUsers?.length || 0;
    const author = record.createdByUser?.name || record.createdByUser?.email || "Admin";

    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 text-sm block truncate">{record.title}</span>
            <span className="text-xs text-gray-500 block truncate">By {author}</span>
          </div>

          {/* Action Icons: View Details, Edit, Delete, Toggle Details */}
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />} 
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(record.id);
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
                navigate(`/notice-board/edit/${record.id}`);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="Edit Notice"
              aria-label="Edit Notice"
            />
            <Popconfirm
              title="Are you sure you want to delete this notice?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text"
                size="small" 
                danger 
                icon={<DeleteOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />} 
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-50 text-red-600"
                title="Delete Notice"
                aria-label="Delete Notice"
              />
            </Popconfirm>
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandCard(record.id);
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
              <span className="text-gray-500 font-medium shrink-0">Target Audience:</span>
              <Badge 
                status={record.sendToAll ? "success" : "warning"} 
                text={<span className="text-xs font-semibold">{totalTargets}</span>} 
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Date:</span>
              <span className="font-semibold text-gray-800 text-right">{new Date(record.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Read By:</span>
              <span className="font-semibold text-gray-800 text-right">{readCount} / {totalTargets}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <Card>
        <Text>You don't have permission to access this page.</Text>
      </Card>
    );
  }

  return (
    <div className="relative min-h-[400px]">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/notice-board')}
              title="Back to Notice Board"
            />
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              Notice Board Management
            </Title>
          </div>
        }
        extra={
          !isMobile && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/notice-board/create')}
            >
              Create Notice
            </Button>
          )
        }
        styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
      >
        {/* Mobile search bar toggle */}
        {isMobile && showMobileSearch && (
          <div className="mb-4">
            <Input.Search
              placeholder="Search notices by title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              autoFocus
              className="w-full shadow-sm"
            />
          </div>
        )}

        <ResponsiveTable
          tableProps={{
            columns: columns,
            dataSource: filteredNotices,
            rowKey: "id",
            loading: isLoading,
            pagination: isMobile ? false : { pageSize: 10 },
          }}
          renderMobileCard={renderNoticeCard}
        />

        {selectedNotice && (
          <NoticeBoardDetail
            visible={detailVisible}
            noticeId={selectedNotice}
            onClose={handleCloseDetail}
          />
        )}
      </Card>

      {/* Floating Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Search Notices"
          >
            {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
          </button>
          <button
            onClick={() => navigate('/notice-board/create')}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
            aria-label="Create Notice"
          >
            <PlusOutlined />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardAdmin;
