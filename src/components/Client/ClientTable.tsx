import { useClient } from "@/hooks/client/useClient";
import {
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  CalendarOutlined,
  BankOutlined,
  HomeOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Table,
  Input,
  Space,
  Tooltip,
  TableProps,
  Tag
} from "antd";
import { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import {
  getSavedClientVisibleColumns,
  getSavedClientColumnWidths,
  saveClientColumnWidths,
  getSavedClientPageSize,
  saveClientPageSize
} from "./clientColumnsConfig";

// Header cell component supporting mouse drag column width resizing
const ResizableTitle = (props: any) => {
  const { onResize, width, children, columnKey, ...restProps } = props;

  if (!width || columnKey === "action") {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <th
      {...restProps}
      style={{
        ...restProps.style,
        position: "relative",
        userSelect: "none"
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 10,
          cursor: "col-resize",
          zIndex: 10
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = width;

          const onMouseMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            const newWidth = Math.max(70, startWidth + moveEvent.clientX - startX);
            onResize(newWidth);
          };

          const onMouseUp = (upEvent: MouseEvent) => {
            upEvent.preventDefault();
            upEvent.stopPropagation();
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }}
      />
    </th>
  );
};

interface ClientTableProps {
  status?: string;
  selectedClients?: any[];
  setSelectedClients?: (clients: any[]) => void;
  visibleColumnKeys?: string[];
}

const ClientTable = ({
  status,
  selectedClients = [],
  setSelectedClients,
  visibleColumnKeys = getSavedClientVisibleColumns()
}: ClientTableProps) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(getSavedClientPageSize());
  const { data: clientData, isPending } = useClient(status);

  // Column Widths State with localStorage Persistence
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    getSavedClientColumnWidths()
  );

  const handleResize = (key: string) => (newWidth: number) => {
    setColumnWidths((prev) => {
      const updated = { ...prev, [key]: newWidth };
      saveClientColumnWidths(updated);
      return updated;
    });
  };

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const searchInput = useRef<any>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: () => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPage(pagination.current);
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      saveClientPageSize(pagination.pageSize);
    }
    setSortedInfo(sorter);
  };

  const formatText = (text?: string) => {
    if (!text) return "-";
    return text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getColumnSearchProps = (dataIndex: string, title: string): any => {
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (path.includes(".")) {
          const keys = path.split(".");
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
      clientData?.forEach((record: any) => {
        const value = getValue(record, dataIndex);
        if (value) {
          values.add(value.toString());
        }
      });
      return Array.from(values).sort();
    };

    return {
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters
      }: any) => {
        const uniqueValues = getUniqueValues();
        const currentValue = selectedKeys[0] || "";
        const filteredOptions = currentValue
          ? uniqueValues
              .filter((val) =>
                val.toLowerCase().includes(currentValue.toLowerCase())
              )
              .slice(0, 10)
          : uniqueValues.slice(0, 10);

        return (
          <div style={{ padding: 8 }}>
            <Input
              ref={searchInput}
              placeholder={`Search ${title}`}
              value={currentValue}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() =>
                handleSearch(selectedKeys, confirm, dataIndex)
              }
              style={{ marginBottom: 8, display: "block" }}
            />
            {filteredOptions.length > 0 && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  marginBottom: 8,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4
                }}
              >
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      backgroundColor: "white",
                      borderBottom:
                        idx < filteredOptions.length - 1
                          ? "1px solid #f0f0f0"
                          : "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
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
                  setSearchText("");
                  setSearchedColumn("");
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
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: string, record: any) => {
        if (dataIndex.includes(".")) {
          const keys = dataIndex.split(".");
          let val = record;
          for (const key of keys) {
            if (!val) return false;
            val = val[key];
          }
          return val
            ? val.toString().toLowerCase().includes(value.toLowerCase())
            : false;
        }
        return record[dataIndex]
          ? record[dataIndex]
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase())
          : "";
      },
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
      render: (text: string) =>
        searchedColumn === dataIndex ? (
          <Highlighter
            highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ""}
          />
        ) : (
          text
        )
    };
  };

  // Full Column Definitions List with Resizable Headers
  const allColumnsMap = useMemo(() => {
    return {
      name: {
        title: "Client Name",
        dataIndex: "name",
        key: "name",
        width: columnWidths["name"] || 220,
        onHeaderCell: () => ({
          width: columnWidths["name"] || 220,
          onResize: handleResize("name"),
          columnKey: "name"
        }),
        ...getColumnSearchProps("name", "Client Name"),
        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
        render: (name: string, record: any) => (
          <div>
            <strong
              className="text-slate-800 cursor-pointer hover:text-blue-600"
              onClick={() => navigate(`/client/view/${record.id}`)}
            >
              {name}
            </strong>
          </div>
        )
      },
      shortName: {
        title: "Short Name",
        dataIndex: "shortName",
        key: "shortName",
        width: columnWidths["shortName"] || 140,
        onHeaderCell: () => ({
          width: columnWidths["shortName"] || 140,
          onResize: handleResize("shortName"),
          columnKey: "shortName"
        }),
        render: (short: string) => (short ? <Tag color="blue">{short}</Tag> : "-")
      },
      panNo: {
        title: "PAN Number",
        dataIndex: "panNo",
        key: "panNo",
        width: columnWidths["panNo"] || 150,
        onHeaderCell: () => ({
          width: columnWidths["panNo"] || 150,
          onResize: handleResize("panNo"),
          columnKey: "panNo"
        }),
        ...getColumnSearchProps("panNo", "PAN Number"),
        render: (pan: string) =>
          pan ? (
            <span className="font-mono text-slate-700 flex items-center gap-1">
              <IdcardOutlined style={{ color: "#1677ff" }} /> {pan}
            </span>
          ) : (
            "-"
          )
      },
      legalStatus: {
        title: "Legal Status",
        dataIndex: "legalStatus",
        key: "legalStatus",
        width: columnWidths["legalStatus"] || 170,
        onHeaderCell: () => ({
          width: columnWidths["legalStatus"] || 170,
          onResize: handleResize("legalStatus"),
          columnKey: "legalStatus"
        }),
        ...getColumnSearchProps("legalStatus.name", "Legal Status"),
        sorter: (a: any, b: any) => {
          const aName = a.legalStatus?.name || a.legalStatusEnum || "";
          const bName = b.legalStatus?.name || b.legalStatusEnum || "";
          return aName.localeCompare(bName);
        },
        sortOrder: sortedInfo.columnKey === "legalStatus" && sortedInfo.order,
        render: (_: any, record: any) => {
          const statusName = record.legalStatus?.name;
          const statusEnum = record.legalStatusEnum;
          if (statusName) return <span className="font-medium">{statusName}</span>;
          if (statusEnum) return <span className="font-medium">{formatText(statusEnum)}</span>;
          return "-";
        }
      },
      industryNature: {
        title: "Industry Nature",
        dataIndex: "industryNature",
        key: "industryNature",
        width: columnWidths["industryNature"] || 220,
        onHeaderCell: () => ({
          width: columnWidths["industryNature"] || 220,
          onResize: handleResize("industryNature"),
          columnKey: "industryNature"
        }),
        ...getColumnSearchProps("industryNature.name", "Industry Nature"),
        sorter: (a: any, b: any) => {
          const aName = a.industryNature?.name || a.industryNatureEnum || "";
          const bName = b.industryNature?.name || b.industryNatureEnum || "";
          return aName.localeCompare(bName);
        },
        sortOrder: sortedInfo.columnKey === "industryNature" && sortedInfo.order,
        render: (_: any, record: any) => {
          const natureName = record.industryNature?.name;
          const natureEnum = record.industryNatureEnum;
          if (natureName) return natureName;
          if (natureEnum) return formatText(natureEnum);
          return "-";
        }
      },
      businessSize: {
        title: "Business Size",
        dataIndex: "businessSize",
        key: "businessSize",
        width: columnWidths["businessSize"] || 140,
        onHeaderCell: () => ({
          width: columnWidths["businessSize"] || 140,
          onResize: handleResize("businessSize"),
          columnKey: "businessSize"
        }),
        ...getColumnSearchProps("businessSize.name", "Business Size"),
        render: (_: any, record: any) => {
          const sizeName = record.businessSize?.name;
          const sizeEnum = record.businessSizeEnum;
          const val = sizeName || (sizeEnum ? formatText(sizeEnum) : null);
          return val ? <Tag color="purple">{val}</Tag> : "-";
        }
      },
      registeredDate: {
        title: "Registered Date",
        dataIndex: "registeredDate",
        key: "registeredDate",
        width: columnWidths["registeredDate"] || 140,
        onHeaderCell: () => ({
          width: columnWidths["registeredDate"] || 140,
          onResize: handleResize("registeredDate"),
          columnKey: "registeredDate"
        }),
        render: (date: any) =>
          date ? (
            <span className="text-slate-600 text-xs flex items-center gap-1">
              <CalendarOutlined /> {dayjs(date).format("MMM DD, YYYY")}
            </span>
          ) : (
            "-"
          )
      },
      contact: {
        title: "Contact Info",
        key: "contact",
        width: columnWidths["contact"] || 190,
        onHeaderCell: () => ({
          width: columnWidths["contact"] || 190,
          onResize: handleResize("contact"),
          columnKey: "contact"
        }),
        render: (_: any, record: any) => {
          const phone = record.mobileNo || record.telephoneNo || record.phone;
          const email = record.email;
          if (!phone && !email) return "-";
          return (
            <Space direction="vertical" size={2}>
              {phone && (
                <span className="text-xs text-slate-700 flex items-center gap-1">
                  <PhoneOutlined style={{ color: "#52c41a" }} /> {phone}
                </span>
              )}
              {email && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <MailOutlined /> {email}
                </span>
              )}
            </Space>
          );
        }
      },
      address: {
        title: "Location / District",
        key: "address",
        width: columnWidths["address"] || 180,
        onHeaderCell: () => ({
          width: columnWidths["address"] || 180,
          onResize: handleResize("address"),
          columnKey: "address"
        }),
        render: (_: any, record: any) => {
          const loc = formatText(record.localJurisdiction || record.district || record.state);
          return loc ? (
            <span className="text-xs text-slate-700 flex items-center gap-1">
              <HomeOutlined style={{ color: "#fa8c16" }} /> {loc}
            </span>
          ) : (
            "-"
          );
        }
      },
      status: {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: columnWidths["status"] || 120,
        onHeaderCell: () => ({
          width: columnWidths["status"] || 120,
          onResize: handleResize("status"),
          columnKey: "status"
        }),
        render: (st: string) => {
          const s = String(st || "active").toLowerCase();
          if (s === "active") return <Tag color="success">Active</Tag>;
          if (s === "suspended") return <Tag color="warning">Suspended</Tag>;
          if (s === "archive" || s === "archived") return <Tag color="error">Archived</Tag>;
          return <Tag>{formatText(s)}</Tag>;
        }
      },
      action: {
        title: "Action",
        key: "action",
        fixed: "right" as const,
        width: columnWidths["action"] || 100,
        onHeaderCell: () => ({
          width: columnWidths["action"] || 100,
          onResize: handleResize("action"),
          columnKey: "action"
        }),
        render: (_: any, record: any) => (
          <Space size="middle">
            <Tooltip title="View Client">
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/client/view/${record.id}`)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Edit Client">
              <Link to={`/client/edit/${record.id}`}>
                <Button type="primary" icon={<EditOutlined />} size="small" />
              </Link>
            </Tooltip>
          </Space>
        )
      }
    };
  }, [searchedColumn, searchText, sortedInfo, columnWidths, navigate]);

  // Construct active visible columns array (Action always at the very end!)
  const activeColumns = useMemo(() => {
    const filteredKeys = visibleColumnKeys.filter((k) => k !== "action");
    const activeCols = filteredKeys
      .map((key) => (allColumnsMap as any)[key])
      .filter(Boolean);

    if ((allColumnsMap as any)["action"]) {
      activeCols.push((allColumnsMap as any)["action"]);
    }
    return activeCols;
  }, [visibleColumnKeys, allColumnsMap]);

  // Row Selection (Multi-Selector)
  const rowSelection: TableProps<any>["rowSelection"] = {
    type: "checkbox",
    selectedRowKeys: selectedClients?.map((c) => c.id) || [],
    onChange: (_selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedClients?.(selectedRows);
    }
  };

  return (
    <Card bodyStyle={{ padding: 12 }}>
      <Table
        components={{
          header: {
            cell: ResizableTitle
          }
        }}
        loading={isPending}
        dataSource={clientData || []}
        columns={activeColumns}
        rowSelection={rowSelection}
        onChange={handleTableChange}
        rowKey="id"
        size="small"
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: limit,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} clients`
        }}
      />
    </Card>
  );
};

export default ClientTable;
