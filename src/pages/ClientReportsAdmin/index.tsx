import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Switch,
  List
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  EditOutlined,
  PaperClipOutlined,
  SaveOutlined
} from "@ant-design/icons";
import {
  useClientReportById,
  useCreateClientReport,
  useCreateMultipleClientReports,
  useUpdateClientReport,
  useUpdateReportAccess,
  useDeleteClientReport,
  useBulkUpdateReportAccess,
  useAddFilesToReport,
  useRemoveFileFromReport,
  useUpdateReportFileDisplayName,
  useAccessibleProjects,
  useStaffReports
} from "@/hooks/clientReport";
import { useDocumentTypesForCustomer, useDocumentTypes } from "@/hooks/clientReport/useClientReportDocumentTypes";
import {
  ClientReportType,
  ClientReportFileType,
  ReportAccessStatus,
  UpdateReportAccessPayload
} from "@/types/clientReport";
import {
  formatNepaliFiscalYear,
  getNepaliFiscalYearOptions
} from "@/utils/fiscalYear";
import { formatDistanceToNow, format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const backendURI = import.meta.env.VITE_BACKEND_URI;

const ClientReportsAdmin: React.FC = () => {
  const isMobile = useIsMobile();
  const [filterStatus, setFilterStatus] = useState<ReportAccessStatus | undefined>();
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>();
  const [filterDocumentTypeId, setFilterDocumentTypeId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ClientReportType | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedCustomerForForm, setSelectedCustomerForForm] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [accessForm] = Form.useForm();

  const { data: reports, isLoading } = useStaffReports({
    accessStatus: filterStatus,
    customerId: filterCustomerId,
    documentTypeId: filterDocumentTypeId
  });

  // Fetch all projects accessible to the current staff user (respects project-level assignment).
  // From this we derive both the client dropdown list and the project dropdown list.
  const { data: accessibleProjects } = useAccessibleProjects();

  // Unique clients derived from accessible projects
  const clientOptions = useMemo(() => {
    if (!accessibleProjects) return [];
    const seen = new Set<string>();
    return accessibleProjects
      .filter((p) => p.customer && !seen.has(p.customer.id) && seen.add(p.customer.id))
      .map((p) => ({ id: p.customer!.id, name: p.customer!.name }));
  }, [accessibleProjects]);

  // Projects for the currently selected customer (used in upload + edit project dropdown)
  const projectsForCustomer = useMemo(() => {
    if (!accessibleProjects || !selectedCustomerForForm) return [];
    return accessibleProjects.filter((p) => p.customer?.id === selectedCustomerForForm);
  }, [accessibleProjects, selectedCustomerForForm]);

  const { data: documentTypesForCustomer } = useDocumentTypesForCustomer(selectedCustomerForForm);
  const { data: allDocumentTypes } = useDocumentTypes({ isActive: true });
  const { mutate: createReport, isPending: creating } = useCreateClientReport();
  const { mutate: createMultipleReports, isPending: creatingMultiple } = useCreateMultipleClientReports();
  const { mutate: updateReport, isPending: updating } = useUpdateClientReport();
  const { mutate: updateAccess, isPending: updatingAccess } = useUpdateReportAccess();
  const { mutate: deleteReport } = useDeleteClientReport();
  const { mutate: bulkUpdateAccess } = useBulkUpdateReportAccess();
  const { mutate: addFiles, isPending: addingFiles } = useAddFilesToReport();
  const { mutate: removeFile } = useRemoveFileFromReport();
  const { mutate: updateFileDisplayName } = useUpdateReportFileDisplayName();
  const fiscalYearOptions = useMemo(() => getNepaliFiscalYearOptions(), []);

  // Fetch fresh report detail when editing (ensures files are always up-to-date)
  const { data: reportDetail } = useClientReportById(selectedReport?.id || "");

  // Re-apply projectId when projectsForCustomer changes (handles edit-modal open scenario)
  useEffect(() => {
    const projectId = selectedReport?.projectId ?? selectedReport?.project?.id;
    if (isEditModalOpen && projectId) {
      editForm.setFieldValue("projectId", projectId);
    }
  }, [projectsForCustomer, isEditModalOpen, selectedReport?.projectId, selectedReport?.project?.id]);

  // Re-apply documentTypeId when document types finish loading (fixes auto-select in edit modal)
  useEffect(() => {
    const documentTypeId = selectedReport?.documentTypeId ?? selectedReport?.documentType?.id;
    if (isEditModalOpen && documentTypeId && documentTypesForCustomer?.length) {
      editForm.setFieldValue("documentTypeId", documentTypeId);
    }
  }, [documentTypesForCustomer, isEditModalOpen, selectedReport?.documentTypeId, selectedReport?.documentType?.id]);

  // State for inline editing file display names
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState("");

  const handleOpenEditModal = (report: ClientReportType) => {
    const projectId = report.projectId ?? report.project?.id;
    const documentTypeId = report.documentTypeId ?? report.documentType?.id;

    setSelectedReport(report);
    setSelectedCustomerForForm(report.customerId);
    editForm.setFieldsValue({
      title: report.title,
      description: report.description,
      projectId,
      documentTypeId,
      fiscalYear: report.fiscalYear,
      isVisible: report.isVisible
    });
    setIsEditModalOpen(true);
  };

  const handleEditReport = (values: any) => {
    if (!selectedReport) return;

    updateReport(
      { id: selectedReport.id, payload: values },
      {
        onSuccess: () => {
          message.success("Report updated successfully");
          setIsEditModalOpen(false);
          setSelectedReport(null);
          editForm.resetFields();
          setSelectedCustomerForForm(undefined);
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || "Failed to update report");
        }
      }
    );
  };

  const handleCreateReport = (values: any) => {
    const fileList = values.file?.fileList;
    if (!fileList || fileList.length === 0) {
      message.error("Please select at least one file");
      return;
    }

    const files = fileList.map((f: any) => f.originFileObj).filter(Boolean);
    if (files.length === 0) {
      message.error("Please select at least one file");
      return;
    }

    const { file: _, ...rest } = values;

    if (files.length === 1) {
      createReport(
        { ...rest, file: files[0] },
        {
          onSuccess: () => {
            message.success("Report uploaded successfully");
            setIsModalOpen(false);
            form.resetFields();
            setSelectedCustomerForForm(undefined);
          },
          onError: (err: any) => {
            message.error(err.response?.data?.message || "Failed to upload report");
          }
        }
      );
    } else {
      createMultipleReports(
        { ...rest, files },
        {
          onSuccess: () => {
            message.success(`${files.length} reports uploaded successfully`);
            setIsModalOpen(false);
            form.resetFields();
            setSelectedCustomerForForm(undefined);
          },
          onError: (err: any) => {
            message.error(err.response?.data?.message || "Failed to upload reports");
          }
        }
      );
    }
  };

  const handleUpdateAccess = (values: UpdateReportAccessPayload) => {
    if (!selectedReport) return;

    updateAccess(
      { id: selectedReport.id, payload: values },
      {
        onSuccess: () => {
          message.success("Access updated successfully");
          setIsAccessModalOpen(false);
          setSelectedReport(null);
          accessForm.resetFields();
        },
        onError: () => {
          message.error("Failed to update access");
        }
      }
    );
  };

  const handleBulkAccess = (accessStatus: ReportAccessStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select reports first");
      return;
    }

    bulkUpdateAccess(
      { ids: selectedRowKeys, accessStatus },
      {
        onSuccess: () => {
          message.success(`Access updated for ${selectedRowKeys.length} reports`);
          setSelectedRowKeys([]);
        },
        onError: () => {
          message.error("Failed to update access");
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteReport(id, {
      onSuccess: () => {
        message.success("Report deleted successfully");
      },
      onError: () => {
        message.error("Failed to delete report");
      }
    });
  };

  const getStatusTag = (status: ReportAccessStatus) => {
    switch (status) {
      case ReportAccessStatus.ACCESSIBLE:
        return <Tag color="success" icon={<CheckCircleOutlined />}>Accessible</Tag>;
      case ReportAccessStatus.PENDING:
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>;
      case ReportAccessStatus.REVOKED:
        return <Tag color="error" icon={<StopOutlined />}>Revoked</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: ClientReportType) => {
        const files = record.files || [];
        const fileCount = files.length;
        return (
          <div>
            <div className="font-medium">{title}</div>
            {fileCount > 0 ? (
              <Tooltip title={files.map(f => f.displayFileName || f.originalFileName).join(", ")}>
                <Text type="secondary" className="text-xs">
                  <PaperClipOutlined /> {fileCount} file{fileCount > 1 ? "s" : ""}
                </Text>
              </Tooltip>
            ) : (
              <Text type="secondary" className="text-xs">
                {record.displayFileName || record.originalFileName || "No files"}
              </Text>
            )}
          </div>
        );
      }
    },
    {
      title: "Client",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) => customer?.name || "-"
    },
    {
      title: "Project",
      dataIndex: "project",
      key: "project",
      render: (project: any) => project?.name || "-"
    },
    {
      title: "Document Type",
      dataIndex: "documentType",
      key: "documentType",
      render: (documentType: any) => documentType?.name ? (
        <Tag icon={<FileTextOutlined />}>{documentType.name}</Tag>
      ) : "-"
    },
    {
      title: "Fiscal Year",
      dataIndex: "fiscalYear",
      key: "fiscalYear",
      render: (year: number) => formatNepaliFiscalYear(year)
    },
    {
      title: "Access Status",
      dataIndex: "accessStatus",
      key: "accessStatus",
      render: (status: ReportAccessStatus) => getStatusTag(status)
    },
    {
      title: "Visible",
      dataIndex: "isVisible",
      key: "isVisible",
      render: (visible: boolean, record: ClientReportType) => (
        <Switch
          checked={visible}
          checkedChildren={<EyeOutlined />}
          unCheckedChildren={<EyeInvisibleOutlined />}
          onChange={(checked) => {
            updateReport(
              { id: record.id, payload: { isVisible: checked } },
              {
                onSuccess: () => {
                  message.success(
                    `Report ${checked ? "shown" : "hidden"} successfully`
                  );
                },
                onError: () => {
                  message.error("Failed to update visibility");
                }
              }
            );
          }}
        />
      )
    },
    {
      title: "Uploaded",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Tooltip title={format(new Date(date), "PPpp")}>
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </Tooltip>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ClientReportType) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Button
            size="small"
            onClick={() => {
              setSelectedReport(record);
              accessForm.setFieldsValue({
                accessStatus: record.accessStatus,
                accessNotes: record.accessNotes
              });
              setIsAccessModalOpen(true);
            }}
          >
            Access
          </Button>
          <Popconfirm
            title="Delete this report?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate stats
  const stats = {
    total: reports?.length || 0,
    accessible: reports?.filter((r) => r.accessStatus === ReportAccessStatus.ACCESSIBLE).length || 0,
    pending: reports?.filter((r) => r.accessStatus === ReportAccessStatus.PENDING).length || 0,
    revoked: reports?.filter((r) => r.accessStatus === ReportAccessStatus.REVOKED).length || 0
  };

  return (
    <div className="p-4">
      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Reports" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Accessible"
              value={stats.accessible}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Revoked"
              value={stats.revoked}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Bulk Actions */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <Space wrap className={isMobile ? "w-full" : ""}>
            <Select
              style={{ width: isMobile ? '100%' : 200 }}
              placeholder="Filter by Client"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              onChange={setFilterCustomerId}
            >
              {clientOptions.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.name}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: isMobile ? '100%' : 180 }}
              placeholder="Filter by Document Type"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              onChange={setFilterDocumentTypeId}
            >
              {allDocumentTypes?.map((type: any) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: isMobile ? '100%' : 150 }}
              placeholder="Filter by Status"
              allowClear
              onChange={setFilterStatus}
            >
              <Option value={ReportAccessStatus.PENDING}>Pending</Option>
              <Option value={ReportAccessStatus.ACCESSIBLE}>Accessible</Option>
              <Option value={ReportAccessStatus.REVOKED}>Revoked</Option>
            </Select>
          </Space>
          <Space className={isMobile ? "w-full justify-end mt-2" : ""}>
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text type="secondary">{selectedRowKeys.length} selected</Text>
                <Button
                  type="primary"
                  onClick={() => handleBulkAccess(ReportAccessStatus.ACCESSIBLE)}
                >
                  Grant Access
                </Button>
                <Button onClick={() => handleBulkAccess(ReportAccessStatus.REVOKED)}>
                  Revoke Access
                </Button>
              </Space>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Upload Report
            </Button>
          </Space>
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[])
          }}
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Client Report"
        open={isModalOpen}
        centered
        className="client-report-upload-modal"
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedCustomerForForm(undefined);
        }}
        footer={null}
        width={isMobile ? '95vw' : 1100}
        bodyStyle={{ overflow: "hidden" }}
      >
        <Form
          form={form}
          layout="vertical"
          className="client-report-upload-form"
          onFinish={handleCreateReport}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Report Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Enter report title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="Client"
                rules={[{ required: true, message: "Please select client" }]}
              >
                <Select
                  placeholder="Select client"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    setSelectedCustomerForForm(value);
                    form.setFieldValue("projectId", undefined);
                    form.setFieldValue("documentTypeId", undefined);
                  }}
                >
                  {clientOptions.map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Enter description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectId" label="Project">
                <Select
                  placeholder={selectedCustomerForForm ? "Select project (optional)" : "Select client first"}
                  disabled={!selectedCustomerForForm}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {projectsForCustomer.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="documentTypeId" label="Document Type">
                <Select
                  placeholder={selectedCustomerForForm ? "Select document type (optional)" : "Select client first"}
                  allowClear
                  disabled={!selectedCustomerForForm}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {documentTypesForCustomer?.map((type: any) => (
                    <Option key={type.id} value={type.id}>
                      {type.name} {type.isGlobal && "(Global)"}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fiscalYear" label="Fiscal Year">
                <Select
                  placeholder="Select fiscal year"
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    option?.label && typeof option.label === "string"
                      ? option.label.toLowerCase().includes(input.toLowerCase())
                      : false
                  }
                  options={fiscalYearOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isVisible" label="Visibility" initialValue={false}>
                <Select>
                  <Option value={true}>Visible to Client</Option>
                  <Option value={false}>Hidden from Client</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="file"
            label="File(s)"
            rules={[{ required: true, message: "Please select at least one file" }]}
          >
            <Upload beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />}>Select File(s)</Button>
            </Upload>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
                setSelectedCustomerForForm(undefined);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={creating || creatingMultiple}>
              Upload
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Access Update Modal */}
      <Modal
        title="Update Report Access"
        open={isAccessModalOpen}
        onCancel={() => {
          setIsAccessModalOpen(false);
          setSelectedReport(null);
          accessForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={accessForm}
          layout="vertical"
          onFinish={handleUpdateAccess}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text strong>{selectedReport?.title}</Text>
            <br />
            <Text type="secondary">{selectedReport?.customer?.name}</Text>
          </div>

          <Form.Item
            name="accessStatus"
            label="Access Status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={ReportAccessStatus.PENDING}>
                <Space>
                  <ClockCircleOutlined style={{ color: "#faad14" }} />
                  Pending Payment
                </Space>
              </Option>
              <Option value={ReportAccessStatus.ACCESSIBLE}>
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  Accessible (Payment Done)
                </Space>
              </Option>
              <Option value={ReportAccessStatus.REVOKED}>
                <Space>
                  <StopOutlined style={{ color: "#ff4d4f" }} />
                  Access Revoked
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item name="accessNotes" label="Notes">
            <TextArea rows={3} placeholder="Add notes (optional)" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsAccessModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updatingAccess}>
              Update Access
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        title="Edit Report"
        open={isEditModalOpen}
        centered
        className="client-report-upload-modal"
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedReport(null);
          editForm.resetFields();
          setSelectedCustomerForForm(undefined);
        }}
        footer={null}
        width={isMobile ? '95vw' : 1100}
        bodyStyle={{ overflow: "hidden" }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditReport}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text type="secondary">Client: </Text>
            <Text strong>{selectedReport?.customer?.name}</Text>
          </div>

          <Form.Item
            name="title"
            label="Report Title"
            rules={[{ required: true, message: "Please enter title" }]}
          >
            <Input placeholder="Enter report title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          {/* Legacy single-file section (reports with filePath but no files[] entries) */}
          {selectedReport && !((reportDetail?.files ?? selectedReport?.files)?.length) && selectedReport.filePath && (
            <div className="mb-4">
              <Text strong className="block mb-2">Attached File</Text>
              <List
                size="small"
                bordered
                dataSource={[selectedReport]}
                renderItem={() => (
                  <List.Item
                    actions={[
                      editingFileId === '__legacy__' ? (
                        <Button
                          key="save"
                          size="small"
                          type="link"
                          icon={<SaveOutlined />}
                          onClick={() => {
                            updateReport(
                              { id: selectedReport.id, payload: { displayFileName: editingFileName } },
                              {
                                onSuccess: (updatedReport) => {
                                  message.success("File name updated");
                                  setEditingFileId(null);
                                  setEditingFileName("");
                                  setSelectedReport(updatedReport);
                                }
                              }
                            );
                          }}
                        >
                          Save
                        </Button>
                      ) : (
                        <>
                          <Button
                            key="view"
                            size="small"
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => window.open(`${backendURI}/client-reports/${selectedReport.id}/download`, "_blank")}
                          >
                            View
                          </Button>
                          <Button
                            key="edit"
                            size="small"
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingFileId('__legacy__');
                              setEditingFileName(selectedReport.displayFileName || selectedReport.originalFileName || "");
                            }}
                          >
                            Rename
                          </Button>
                        </>
                      ),
                      <Popconfirm
                        key="delete"
                        title="Delete this report?"
                        description="Removing the only file will permanently delete this report."
                        onConfirm={() => {
                          deleteReport(selectedReport.id, {
                            onSuccess: () => {
                              message.success("Report deleted");
                              setIsEditModalOpen(false);
                              setSelectedReport(null);
                              editForm.resetFields();
                            },
                            onError: () => message.error("Failed to delete report")
                          });
                        }}
                      >
                        <Button size="small" type="link" danger icon={<DeleteOutlined />}>
                          Remove
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <div className="flex-1">
                      {editingFileId === '__legacy__' ? (
                        <Input
                          size="small"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onPressEnter={() => {
                            updateReport(
                              { id: selectedReport.id, payload: { displayFileName: editingFileName } },
                              {
                                onSuccess: (updatedReport) => {
                                  message.success("File name updated");
                                  setEditingFileId(null);
                                  setEditingFileName("");
                                  setSelectedReport(updatedReport);
                                }
                              }
                            );
                          }}
                        />
                      ) : (
                        <Text>
                          <PaperClipOutlined className="mr-1" />
                          {selectedReport.displayFileName || selectedReport.originalFileName || selectedReport.filePath}
                        </Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Files Management Section */}
          {selectedReport && ((reportDetail?.files ?? selectedReport?.files)?.length || 0) > 0 && (
            <div className="mb-4">
              <Text strong className="block mb-2">Attached Files</Text>
              <List
                size="small"
                bordered
                dataSource={reportDetail?.files ?? selectedReport?.files ?? []}
                renderItem={(file: ClientReportFileType) => (
                  <List.Item
                    actions={[
                      editingFileId === file.id ? (
                        <Button
                          key="save"
                          size="small"
                          type="link"
                          icon={<SaveOutlined />}
                          onClick={() => {
                            updateFileDisplayName(
                              { reportId: selectedReport.id, fileId: file.id, displayFileName: editingFileName },
                              {
                                onSuccess: (updatedReport) => {
                                  message.success("File name updated");
                                  setEditingFileId(null);
                                  setEditingFileName("");
                                  setSelectedReport(updatedReport);
                                }
                              }
                            );
                          }}
                        >
                          Save
                        </Button>
                      ) : (
                        <>
                          <Button
                            key="view"
                            size="small"
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => window.open(`${backendURI}/client-reports/${selectedReport.id}/files/${file.id}/download`, "_blank")}
                          >
                            View
                          </Button>
                          <Button
                            key="edit"
                            size="small"
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingFileId(file.id);
                              setEditingFileName(file.displayFileName || file.originalFileName);
                            }}
                          >
                            Rename
                          </Button>
                        </>
                      ),
                      <Popconfirm
                        key="delete"
                        title="Remove this file?"
                        onConfirm={() => {
                          removeFile(
                            { reportId: selectedReport.id, fileId: file.id },
                            {
                              onSuccess: (updatedReport) => {
                                message.success("File removed");
                                setSelectedReport(updatedReport);
                              },
                              onError: () => message.error("Failed to remove file")
                            }
                          );
                        }}
                      >
                        <Button size="small" type="link" danger icon={<DeleteOutlined />}>
                          Remove
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <div className="flex-1">
                      {editingFileId === file.id ? (
                        <Input
                          size="small"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onPressEnter={() => {
                            updateFileDisplayName(
                              { reportId: selectedReport.id, fileId: file.id, displayFileName: editingFileName },
                              {
                                onSuccess: (updatedReport) => {
                                  message.success("File name updated");
                                  setEditingFileId(null);
                                  setEditingFileName("");
                                  setSelectedReport(updatedReport);
                                }
                              }
                            );
                          }}
                        />
                      ) : (
                        <Text>
                          <PaperClipOutlined className="mr-1" />
                          {file.displayFileName || file.originalFileName}
                        </Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Add More Files */}
          {selectedReport && (
            <div className="mb-4">
              <Upload
                beforeUpload={() => false}
                multiple
                onChange={(info) => {
                  const newFiles = info.fileList
                    .filter((f: any) => f.originFileObj)
                    .map((f: any) => f.originFileObj);
                  if (newFiles.length > 0 && info.file.status !== "removed") {
                    // Only trigger on the last file added
                    const lastFile = info.fileList[info.fileList.length - 1];
                    if (lastFile.uid === info.file.uid) {
                      addFiles(
                        { id: selectedReport.id, files: newFiles },
                        {
                          onSuccess: (updatedReport) => {
                            message.success("Files added successfully");
                            setSelectedReport(updatedReport);
                            info.fileList.length = 0; // Clear the upload list
                          },
                          onError: () => message.error("Failed to add files")
                        }
                      );
                    }
                  }
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} loading={addingFiles} size="small">
                  Add More Files
                </Button>
              </Upload>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="Project"
              >
                <Select 
                  placeholder="Select project (optional)" 
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {projectsForCustomer.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="documentTypeId" label="Document Type">
                <Select 
                  placeholder="Select document type (optional)" 
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {(documentTypesForCustomer ?? allDocumentTypes)?.map((type: any) => (
                    <Option key={type.id} value={type.id}>
                      {type.name} {type.isGlobal && "(Global)"}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="fiscalYear" label="Fiscal Year">
            <Select
              placeholder="Select fiscal year"
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={fiscalYearOptions}
            />
          </Form.Item>

          <Form.Item name="isVisible" label="Visibility">
            <Select>
              <Option value={true}>Visible to Client</Option>
              <Option value={false}>Hidden from Client</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setIsEditModalOpen(false);
              setSelectedReport(null);
              editForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={updating}>
              Update Report
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientReportsAdmin;
