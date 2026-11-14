import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  useWorkingYears,
  useWorkingYearConfig,
  useUpdateWorkingYearConfig,
  useCreateWorkingYear,
  useUpdateWorkingYear,
  useSetCurrentWorkingYear,
  useDeleteWorkingYear,
  useGenerateNextWorkingYear,
} from "@/hooks/workingYear/useWorkingYear";
import { WorkingYearType } from "@/types/workingYear";

const { Title, Text, Paragraph } = Typography;

export const NEPALI_MONTHS = [
  { value: 1, label: "01 - Baisakh (बैशाख)" },
  { value: 2, label: "02 - Jestha (जेठ)" },
  { value: 3, label: "03 - Ashadh (असार)" },
  { value: 4, label: "04 - Shrawan (साउन)" },
  { value: 5, label: "05 - Bhadra (भदौ) [Default]" },
  { value: 6, label: "06 - Ashwin (असोज)" },
  { value: 7, label: "07 - Kartik (कात्तिक)" },
  { value: 8, label: "08 - Mangsir (मंसिर)" },
  { value: 9, label: "09 - Poush (पुस)" },
  { value: 10, label: "10 - Magh (माघ)" },
  { value: 11, label: "11 - Falgun (फागुन)" },
  { value: 12, label: "12 - Chaitra (चैत)" },
];

export const getMonthName = (monthNumber?: number) => {
  const m = NEPALI_MONTHS.find((item) => item.value === monthNumber);
  return m ? m.label.split(" - ")[1] || `Month ${monthNumber}` : `Month ${monthNumber}`;
};

const WorkingYearManager: React.FC = () => {
  // Queries
  const { data: workingYears = [], isLoading: isLoadingList } = useWorkingYears();
  const { data: config, isLoading: isLoadingConfig } = useWorkingYearConfig();

  // Mutations
  const updateConfigMutation = useUpdateWorkingYearConfig();
  const createMutation = useCreateWorkingYear();
  const updateMutation = useUpdateWorkingYear();
  const setCurrentMutation = useSetCurrentWorkingYear();
  const deleteMutation = useDeleteWorkingYear();
  const generateNextMutation = useGenerateNextWorkingYear();

  // Forms & Modals state
  const [configForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingYear, setEditingYear] = useState<WorkingYearType | null>(null);

  // Sync config form values
  useEffect(() => {
    if (config) {
      configForm.setFieldsValue({
        defaultStartMonth: config.defaultStartMonth || 5,
        defaultStartDay: config.defaultStartDay || 1,
        description: config.description || "",
      });
    }
  }, [config, configForm]);

  // Handle saving config
  const handleSaveConfig = async (values: any) => {
    await updateConfigMutation.mutateAsync({
      defaultStartMonth: Number(values.defaultStartMonth),
      defaultStartDay: Number(values.defaultStartDay),
      description: values.description,
    });
  };

  // Open modal for Add
  const handleOpenAdd = () => {
    setEditingYear(null);
    modalForm.resetFields();

    // Suggest default values from the latest year if available
    let suggestedYear = 2081;
    if (workingYears.length > 0) {
      const maxYear = Math.max(...workingYears.map((wy) => wy.nepaliStartYear || 0));
      if (maxYear > 0) suggestedYear = maxYear + 1;
    }
    const endYearSlice = (suggestedYear + 1).toString().slice(-2);

    modalForm.setFieldsValue({
      name: `${suggestedYear.toString().slice(-2)}/${endYearSlice}`,
      nepaliStartYear: suggestedYear,
      nepaliStartMonth: config?.defaultStartMonth || 5,
      nepaliStartDay: config?.defaultStartDay || 1,
      isActive: true,
      isCurrent: false,
      description: "",
    });
    setModalVisible(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (record: WorkingYearType) => {
    setEditingYear(record);
    modalForm.setFieldsValue({
      name: record.name,
      nepaliStartYear: record.nepaliStartYear,
      nepaliStartMonth: record.nepaliStartMonth,
      nepaliStartDay: record.nepaliStartDay,
      isActive: record.isActive,
      isCurrent: record.isCurrent,
      description: record.description,
    });
    setModalVisible(true);
  };

  // Submit Modal (Add or Edit)
  const handleModalSubmit = async () => {
    try {
      const values = await modalForm.validateFields();
      if (editingYear) {
        await updateMutation.mutateAsync({
          id: editingYear.id,
          payload: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      setModalVisible(false);
      setEditingYear(null);
      modalForm.resetFields();
    } catch {
      // Form validation error
    }
  };

  // Format AD date range
  const formatADDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toISOString().split("T")[0];
    } catch {
      return dateStr;
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Fiscal Year",
      dataIndex: "name",
      key: "name",
      width: 160,
      render: (name: string, record: WorkingYearType) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span className="font-semibold text-gray-800 text-sm">FY {name}</span>
            {record.isCurrent && (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                CURRENT
              </Tag>
            )}
          </Space>
          <Text type="secondary" className="text-xs">
            Start Year: {record.nepaliStartYear} BS
          </Text>
        </Space>
      ),
    },
    {
      title: "Nepali Start Date",
      key: "nepaliStartDate",
      width: 200,
      render: (_: any, record: WorkingYearType) => (
        <div>
          <div className="font-medium text-gray-800">
            {record.nepaliStartYear}-
            {String(record.nepaliStartMonth).padStart(2, "0")}-
            {String(record.nepaliStartDay).padStart(2, "0")}
          </div>
          <Text type="secondary" className="text-xs">
            {getMonthName(record.nepaliStartMonth)} {record.nepaliStartDay}
          </Text>
        </div>
      ),
    },
    {
      title: "Gregorian Date Range (AD)",
      key: "adRange",
      width: 240,
      render: (_: any, record: WorkingYearType) => (
        <div>
          <div className="font-medium text-gray-700">
            {formatADDate(record.startDateAD)} &rarr; {formatADDate(record.endDateAD)}
          </div>
          <Text type="secondary" className="text-xs">
            Auto-converted from Nepali Calendar
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) =>
        isActive ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc?: string) => (
        <span className="text-gray-600 text-xs">{desc || "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      fixed: "right" as const,
      render: (_: any, record: WorkingYearType) => (
        <Space orientation="horizontal" size="small">
          {!record.isCurrent ? (
            <Popconfirm
              title="Set as Current Fiscal Year?"
              description={`This will make FY ${record.name} the active default working year for projects and worklogs.`}
              onConfirm={() => setCurrentMutation.mutate(record.id)}
              okText="Yes, Set Current"
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="link"
                icon={<CheckCircleOutlined />}
                loading={setCurrentMutation.isPending}
              >
                Set Current
              </Button>
            </Popconfirm>
          ) : (
            <Tooltip title="This is currently the active system fiscal year">
              <Button size="small" type="link" disabled icon={<CheckCircleOutlined />}>
                Active
              </Button>
            </Tooltip>
          )}

          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Edit
          </Button>

          {!record.isCurrent && (
            <Popconfirm
              title="Delete Working Year?"
              description={`Are you sure you want to delete FY ${record.name}? This action cannot be undone.`}
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                type="link"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Fiscal Year System Configuration */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined className="text-blue-600" />
            <span>Fiscal Year System Configuration</span>
          </div>
        }
        className="shadow-sm border-gray-200"
      >
        <Alert
          message="Default Fiscal Year Start Rule"
          description={
            <div>
              By default in Artha, new working/fiscal years begin on{" "}
              <strong>Bhadra 1 (Month 5, Day 1)</strong> of the Bikram Sambat (BS) calendar.
              You can adjust this standard start date below. Newly generated fiscal years will
              automatically use this boundary to compute English (AD) calendar conversion dates.
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          disabled={isLoadingConfig}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="defaultStartMonth"
                label="Default Start Month (BS)"
                rules={[{ required: true, message: "Please select start month" }]}
                tooltip="The Nepali Bikram Sambat month when a new fiscal year starts (e.g. Bhadra)"
              >
                <Select
                  options={NEPALI_MONTHS}
                  placeholder="Select Start Month"
                  className="w-full"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="defaultStartDay"
                label="Default Start Day (BS)"
                rules={[{ required: true, message: "Please enter start day" }]}
                tooltip="Day of the month in BS (typically 1)"
              >
                <InputNumber
                  min={1}
                  max={32}
                  className="w-full"
                  placeholder="1"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={10}>
              <Form.Item
                name="description"
                label="System Note / Description"
              >
                <Input placeholder="e.g. Standard Nepali Fiscal Year starting on Bhadra 1" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={updateConfigMutation.isPending}
            >
              Update Configuration
            </Button>
          </div>
        </Form>
      </Card>

      {/* 2. Configured Fiscal Years List */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span>Configured Fiscal Years (Working Years)</span>
            <Tag color="default" className="ml-2 font-normal">
              {workingYears.length} Years
            </Tag>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => generateNextMutation.mutate()}
              loading={generateNextMutation.isPending}
            >
              Generate Next FY
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
            >
              Add Fiscal Year
            </Button>
          </Space>
        }
        className="shadow-sm border-gray-200"
      >
        <Table
          columns={columns}
          dataSource={workingYears}
          rowKey="id"
          loading={isLoadingList}
          pagination={false}
          scroll={{ x: 900 }}
          rowClassName={(record) =>
            record.isCurrent ? "bg-blue-50/40 font-medium" : ""
          }
        />
      </Card>

      {/* 3. Add / Edit Fiscal Year Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span>{editingYear ? `Edit FY ${editingYear.name}` : "Add New Fiscal Year"}</span>
          </div>
        }
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingYear(null);
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        width={560}
      >
        <Paragraph type="secondary" className="text-xs mb-4">
          Start and end dates in the Gregorian (AD) calendar are computed automatically
          based on the Nepali Bikram Sambat start date and duration.
        </Paragraph>

        <Form form={modalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Fiscal Year Label"
                rules={[{ required: true, message: "Please enter FY name (e.g. 81/82)" }]}
                tooltip="Short label used across the application, e.g. 80/81 or 81/82"
              >
                <Input placeholder="e.g. 81/82" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nepaliStartYear"
                label="Nepali Start Year (BS)"
                rules={[{ required: true, message: "Please enter start year" }]}
                tooltip="Four-digit Bikram Sambat year, e.g. 2081"
              >
                <InputNumber
                  min={2000}
                  max={2099}
                  className="w-full"
                  placeholder="2081"
                  onChange={(val) => {
                    if (val && !editingYear) {
                      const nextSlice = (Number(val) + 1).toString().slice(-2);
                      const currentName = modalForm.getFieldValue("name");
                      if (!currentName || currentName.includes("/")) {
                        modalForm.setFieldsValue({
                          name: `${String(val).slice(-2)}/${nextSlice}`,
                        });
                      }
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nepaliStartMonth"
                label="Start Month (BS)"
                rules={[{ required: true, message: "Please select start month" }]}
              >
                <Select options={NEPALI_MONTHS} placeholder="Select month" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nepaliStartDay"
                label="Start Day (BS)"
                rules={[{ required: true, message: "Please enter start day" }]}
              >
                <InputNumber min={1} max={32} className="w-full" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description / Remarks">
            <Input.TextArea
              rows={2}
              placeholder="e.g. Fiscal Year 2081/2082 starting Bhadra 1, 2081"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkingYearManager;
