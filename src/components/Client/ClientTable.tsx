import { useClient } from "@/hooks/client/useClient";
import { EditOutlined, SearchOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Table, Input, Space, Tooltip } from "antd";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TableToolbar from "../Table/TableToolbar";
import Highlighter from 'react-highlight-words';

interface ClientTableProps {
  status?: string;
}

const ClientTable = ({ status }: ClientTableProps) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: client, isPending } = useClient(status);
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
      client?.forEach((record: any) => {
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
      title: "",
      dataIndex: "id",
      key: "id",
      render: () => <Checkbox type="checkbox" />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps('name', 'Name'),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
    },
    {
      title: "Legal Status",
      dataIndex: "legalStatus",
      key: "legalStatus",
      ...getColumnSearchProps('legalStatus.name', 'Legal Status'),
      sorter: (a: any, b: any) => {
        const aName = a.legalStatus?.name || a.legalStatusEnum || '';
        const bName = b.legalStatus?.name || b.legalStatusEnum || '';
        return aName.localeCompare(bName);
      },
      sortOrder: sortedInfo.columnKey === 'legalStatus' && sortedInfo.order,
      render: (_: any, record: any) => {
        const statusName = record.legalStatus?.name;
        const statusEnum = record.legalStatusEnum;
        
        if (statusName) return statusName;
        if (statusEnum) {
          return statusEnum.split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return '-';
      }
    },
    {
      title: "Industry Nature",
      dataIndex: "industryNature",
      key: "industryNature",
      ...getColumnSearchProps('industryNature.name', 'Industry Nature'),
      sorter: (a: any, b: any) => {
        const aName = a.industryNature?.name || a.industryNatureEnum || '';
        const bName = b.industryNature?.name || b.industryNatureEnum || '';
        return aName.localeCompare(bName);
      },
      sortOrder: sortedInfo.columnKey === 'industryNature' && sortedInfo.order,
      render: (_: any, record: any) => {
        const natureName = record.industryNature?.name;
        const natureEnum = record.industryNatureEnum;
        
        if (natureName) return natureName;
        if (natureEnum) {
          return natureEnum.split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return '-';
      }
    },
    {
      title: "Business Size",
      dataIndex: "businessSize",
      key: "businessSize",
      ...getColumnSearchProps('businessSize.name', 'Business Size'),
      sorter: (a: any, b: any) => {
        const aName = a.businessSize?.name || a.businessSizeEnum || '';
        const bName = b.businessSize?.name || b.businessSizeEnum || '';
        return aName.localeCompare(bName);
      },
      sortOrder: sortedInfo.columnKey === 'businessSize' && sortedInfo.order,
      render: (_: any, record: any) => {
        const sizeName = record.businessSize?.name;
        const sizeEnum = record.businessSizeEnum;
        
        if (sizeName) return sizeName;
        if (sizeEnum) {
          return sizeEnum.split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return '-';
      }
    },
    {
      title: "Contact",
      key: "contact",
      render: (_: any, record: any) => {
        const phone = record.mobileNo || record.telephoneNo || record.phone;
        const email = record.email;
        const displayVal = phone || email || '-';
        const tooltipText = phone && email ? `Email: ${email}` : (email ? `Email: ${email}` : (phone ? `Phone: ${phone}` : undefined));
        return (
          <Tooltip title={tooltipText}>
            <span style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {displayVal}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Action", 
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/client/view/${record.id}`)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Link to={`/client/edit/${record.id}`}>
              <Button type="primary" icon={<EditOutlined />} size="small" />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Table
        loading={isPending}
        dataSource={client || []}
        columns={columns}
        onChange={handleTableChange}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: limit,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
    </Card>
  );
};

export default ClientTable;
