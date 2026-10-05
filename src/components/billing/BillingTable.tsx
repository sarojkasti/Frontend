import React, { useState } from "react";
import { useDeleteBilling } from "@/hooks/billing/useDeleteBilling";
import { BillingType } from "@/types/billing";
import { Button, Popconfirm, Space, Tag, message } from "antd";
import { PowerTable, PowerTableColumn } from "@/components/Table";

interface BillingTableProps {
  data: BillingType[];
  showModal: (billing?: BillingType) => void;
  onRefresh: () => void;
  visibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys: string[]) => void;
}

const BillingTable = ({
  data,
  showModal,
  onRefresh,
  visibleColumnKeys,
  onVisibleColumnKeysChange,
}: BillingTableProps) => {
  const { mutate: deleteBilling } = useDeleteBilling();
  const [loading, setLoading] = useState(false);
  const [sortedInfo, setSortedInfo] = useState<any>({});

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await deleteBilling(id.toString(), {
        onSuccess: () => {
          message.success("Billing entity deleted successfully");
          onRefresh();
        },
        onError: (error) => {
          message.error(`Failed to delete: ${error.message}`);
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: PowerTableColumn<BillingType>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      defaultWidth: 180,
      required: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
    },
    {
      title: "Short Name",
      dataIndex: "shortName",
      key: "shortName",
      defaultWidth: 130,
      sorter: (a, b) => (a.shortName || "").localeCompare(b.shortName || ""),
      sortOrder: sortedInfo.columnKey === "shortName" && sortedInfo.order,
      render: (text) => text || "N/A",
    },
    {
      title: "PAN Number",
      dataIndex: "pan_number",
      key: "pan_number",
      defaultWidth: 140,
      sorter: (a, b) => (a.pan_number || "").localeCompare(b.pan_number || ""),
      sortOrder: sortedInfo.columnKey === "pan_number" && sortedInfo.order,
      render: (text) => text || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      defaultWidth: 200,
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      sortOrder: sortedInfo.columnKey === "email" && sortedInfo.order,
      render: (text) => text || "N/A",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      defaultWidth: 140,
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      sortOrder: sortedInfo.columnKey === "phone" && sortedInfo.order,
      render: (text) => text || "N/A",
    },
    {
      title: "Reg. Number",
      dataIndex: "registration_number",
      key: "registration_number",
      defaultWidth: 140,
      defaultVisible: false,
      render: (text) => text || "N/A",
    },
    {
      title: "VAT Number",
      dataIndex: "vat_number",
      key: "vat_number",
      defaultWidth: 140,
      defaultVisible: false,
      render: (text) => text || "N/A",
    },
    {
      title: "Bank Name",
      dataIndex: "bank_name",
      key: "bank_name",
      defaultWidth: 160,
      defaultVisible: false,
      render: (text) => text || "N/A",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      defaultWidth: 180,
      defaultVisible: false,
      render: (text) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      defaultWidth: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === "status" && sortedInfo.order,
      render: (status: string) => {
        let color = "green";
        if (status === "suspended") {
          color = "orange";
        } else if (status === "archived") {
          color = "red";
        }
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this billing entity?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={loading}
          >
            <Button type="link" danger loading={loading}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PowerTable<BillingType>
      columns={columns}
      dataSource={data.map((item) => ({ ...item, key: item.id }))}
      rowKey="id"
      enableResize
      enableColumnSearch
      showToolbar={false}
      visibleColumnKeys={visibleColumnKeys}
      onVisibleColumnKeysChange={onVisibleColumnKeysChange}
      persistenceKey="billing_table"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: [5, 10, 20, 50],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      onChange={handleTableChange}
      bordered
    />
  );
};

export default BillingTable;
