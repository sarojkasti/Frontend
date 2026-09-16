import ProjectForm from "@/components/project/ProjectForm";
import ProjectTable from "@/components/project/ProjectTable";
import ProjectExportModal from "@/components/project/ProjectExportModal";
import ProjectExportPage from "@/components/project/ProjectExportPage";
import { ProjectType } from "@/types/project";
import {
  Modal,
  Tabs,
  Button,
  Space,
  Tooltip,
  Card,
  Form,
  Row,
  Col,
  DatePicker,
  Select,
  Popover,
  Checkbox,
  Input,
  Divider
} from "antd";
import React, { useCallback, useState, useMemo } from "react";
import {
  DownloadOutlined,
  FilterOutlined,
  SettingOutlined,
  SearchOutlined,
  HolderOutlined
} from "@ant-design/icons";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { useSession } from "@/context/SessionContext";
import { useProject } from "@/hooks/project/useProject";
import useIsMobile from "@/hooks/useIsMobile";
import {
  ALL_PROJECT_COLUMNS,
  getSavedVisibleColumns,
  saveVisibleColumns
} from "@/components/project/projectColumnsConfig";

const ProjectPage: React.FC = () => {
  const { isMobile } = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editTaskGroupData, setEditTaskGroupData] = useState<ProjectType | undefined>(undefined);

  // Lifted state
  const [selectedProjects, setSelectedProjects] = useState<ProjectType[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>("1");
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [isExportViewOpen, setIsExportViewOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Visible columns state with local storage persistence
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(getSavedVisibleColumns());
  const [columnSearchText, setColumnSearchText] = useState("");
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  const deleteProjectMutation = useDeleteProject();
  const { profile, permissions } = useSession();

  const userRole = (profile as any)?.role?.name?.toLowerCase();
  const hideCreateDelete = userRole === "auditsenior" || userRole === "auditjunior";

  // Dynamic permission check based on backend permission configuration
  const canExportProject = useMemo(() => {
    if (!profile) return false;

    // Retrieve permissions array from profile.role.permission or session permissions
    const rawPerms = (profile as any)?.role?.permission || permissions || (profile as any)?.permissions || [];

    if (!Array.isArray(rawPerms) || rawPerms.length === 0) {
      return false;
    }

    return rawPerms.some((perm: any) => {
      if (typeof perm === "string") {
        const lower = perm.toLowerCase();
        return (
          lower === "all" ||
          lower.includes("export") ||
          lower.includes("/projects/export") ||
          lower.includes("/projects/:id/export")
        );
      }
      if (typeof perm === "object" && perm !== null) {
        const path = String(perm.path || perm.route || "").toLowerCase();
        const description = String(perm.description || perm.name || "").toLowerCase();
        return (
          path.includes("export") ||
          description.includes("export")
        );
      }
      return false;
    });
  }, [profile, permissions]);

  const { data: allProjects } = useProject({
    status: "all",
    fields: "customer,projectLead,projectManager,natureOfWork,completion",
  });

  const applyFilters = (values: any) => {
    setAdvancedFilters(values);
  };

  const resetFilters = () => {
    form.resetFields();
    setAdvancedFilters({});
  };

  const handleToggleColumn = (key: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      // Add key before action
      const withoutAction = visibleColumnKeys.filter((k) => k !== "action" && k !== key);
      updated = [...withoutAction, key, "action"];
    } else {
      updated = visibleColumnKeys.filter((k) => k !== key);
      if (!updated.includes("action")) updated.push("action");
    }
    setVisibleColumnKeys(updated);
    saveVisibleColumns(updated);
  };

  const handleSelectAllColumns = () => {
    const allKeys = ALL_PROJECT_COLUMNS.map((c) => c.key).filter((k) => k !== "action");
    allKeys.push("action");
    setVisibleColumnKeys(allKeys);
    saveVisibleColumns(allKeys);
  };

  const handleResetDefaultColumns = () => {
    const defaultKeys = ALL_PROJECT_COLUMNS.filter((c) => c.defaultVisible)
      .map((c) => c.key)
      .filter((k) => k !== "action");
    defaultKeys.push("action");
    setVisibleColumnKeys(defaultKeys);
    saveVisibleColumns(defaultKeys);
  };

  // Drag and drop reordering logic for column selector
  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedKey || draggedKey === targetKey || targetKey === "action" || draggedKey === "action") {
      return;
    }

    const currentKeys = visibleColumnKeys.filter((k) => k !== "action");
    const sourceIdx = currentKeys.indexOf(draggedKey);
    const targetIdx = currentKeys.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...currentKeys];
      const [removed] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, removed);
      updated.push("action");
      setVisibleColumnKeys(updated);
      saveVisibleColumns(updated);
    }
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
  };

  const handleDeleteSelected = () => {
    Modal.confirm({
      title: "Are you sure you want to delete these projects?",
      content: `This will delete ${selectedProjects.length} project(s).`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const ids = selectedProjects
          .map((p) => p.id)
          .filter((id) => id !== undefined) as number[];
        ids.forEach((id) => {
          deleteProjectMutation.mutate({ id: id.toString() });
        });
        setSelectedProjects([]);
      },
    });
  };

  const showModal = useCallback((project?: ProjectType) => {
    setEditTaskGroupData(project);
    setOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditTaskGroupData(undefined);
    setOpen(false);
  }, []);

  // Ordered options for column selector (active ordered keys + unselected remaining keys + action)
  const orderedColumnList = useMemo(() => {
    const map = new Map(ALL_PROJECT_COLUMNS.map((col) => [col.key, col]));

    const result: any[] = [];
    const addedKeys = new Set<string>();

    // 1. Add keys from visibleColumnKeys in order (excluding action)
    visibleColumnKeys.forEach((key) => {
      if (key !== "action" && map.has(key)) {
        result.push(map.get(key));
        addedKeys.add(key);
      }
    });

    // 2. Add unselected remaining columns
    ALL_PROJECT_COLUMNS.forEach((col) => {
      if (col.key !== "action" && !addedKeys.has(col.key)) {
        result.push(col);
      }
    });

    // 3. Always append action at the end
    const actionCol = map.get("action");
    if (actionCol) {
      result.push(actionCol);
    }

    if (!columnSearchText) return result;
    return result.filter((col) =>
      col.title.toLowerCase().includes(columnSearchText.toLowerCase())
    );
  }, [visibleColumnKeys, columnSearchText]);

  // Column Selector Popover Content
  const columnPopoverContent = (
    <div style={{ width: 280 }}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-slate-700">Customize Columns</span>
        <Space size={4}>
          <Button size="small" type="link" onClick={handleSelectAllColumns} style={{ padding: 0 }}>
            Select All
          </Button>
          <span className="text-slate-300">|</span>
          <Button size="small" type="link" onClick={handleResetDefaultColumns} style={{ padding: 0 }}>
            Reset
          </Button>
        </Space>
      </div>

      <Input
        size="small"
        placeholder="Search column..."
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        value={columnSearchText}
        onChange={(e) => setColumnSearchText(e.target.value)}
        className="mb-2"
        allowClear
      />

      <div style={{ fontSize: "11px", color: "#888", marginBottom: 6 }}>
        Drag <HolderOutlined /> handle to reorder column position
      </div>

      <Divider style={{ margin: "6px 0" }} />

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {orderedColumnList.map((col) => {
          const isChecked = visibleColumnKeys.includes(col.key);
          const isDisabled = !!col.required;
          const isAction = col.key === "action";

          return (
            <div
              key={col.key}
              draggable={!isAction}
              onDragStart={(e) => !isAction && handleDragStart(e, col.key)}
              onDragOver={(e) => !isAction && handleDragOver(e, col.key)}
              onDragEnd={handleDragEnd}
              className={`py-1.5 px-2 mb-1 rounded flex items-center justify-between border ${
                draggedKey === col.key ? "bg-blue-50 border-blue-300" : "bg-white border-slate-100"
              } hover:bg-slate-50 transition-colors`}
              style={{ cursor: isAction ? "default" : "grab" }}
            >
              <div className="flex items-center gap-2">
                {!isAction ? (
                  <HolderOutlined style={{ color: "#bfbfbf", cursor: "grab" }} />
                ) : (
                  <span style={{ width: 14 }} />
                )}
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => handleToggleColumn(col.key, e.target.checked)}
                >
                  <span style={{ fontSize: "13px", fontWeight: col.required ? 600 : 400 }}>
                    {col.title}
                  </span>
                </Checkbox>
              </div>
              {isAction && (
                <span className="text-xs text-slate-400 font-mono px-1 bg-slate-100 rounded">
                  Fixed End
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isExportViewOpen) {
    return (
      <ProjectExportPage
        onBack={() => setIsExportViewOpen(false)}
        selectedProjects={selectedProjects}
        allProjects={allProjects || []}
        visibleColumnKeys={visibleColumnKeys}
        activeTabKey={activeTabKey}
        showFilters={showFilters}
        advancedFilters={advancedFilters}
        canExportProject={canExportProject}
      />
    );
  }

  return (
    <>
      {/* Mobile Actions Toolbar */}
      {isMobile && (
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          {!hideCreateDelete && (
            <Button type="primary" size="small" onClick={() => showModal()}>
              + Create Project
            </Button>
          )}
          <Button
            size="small"
            icon={<FilterOutlined />}
            onClick={() => {
              if (showFilters) resetFilters();
              setShowFilters(!showFilters);
            }}
            type={showFilters ? "primary" : "default"}
          >
            Filters
          </Button>
          <Popover
            content={columnPopoverContent}
            trigger="click"
            placement="bottomRight"
            open={columnPopoverOpen}
            onOpenChange={setColumnPopoverOpen}
          >
            <Button size="small" icon={<SettingOutlined />}>Columns</Button>
          </Popover>
          {canExportProject && (
            <Button size="small" icon={<DownloadOutlined />} onClick={() => setIsExportViewOpen(true)} />
          )}
          {!hideCreateDelete && selectedProjects.length > 0 && (
            <Button
              danger
              size="small"
              loading={deleteProjectMutation.isPending}
              onClick={handleDeleteSelected}
            >
              Delete ({selectedProjects.length})
            </Button>
          )}
        </div>
      )}

      <Tabs
        activeKey={activeTabKey}
        onChange={(key) => {
          setActiveTabKey(key);
          if (showFilters) {
            setShowFilters(false);
            resetFilters();
          }
        }}
        tabBarStyle={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
        className="project-tabs"
        renderTabBar={(props, DefaultTabBar) => (
          <>
            <div className="overflow-x-auto whitespace-nowrap">
              <DefaultTabBar {...props} />
            </div>
            {showFilters && (
              <Card className="mb-4">
                <Form form={form} layout="vertical" onFinish={applyFilters} initialValues={{}}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="dateRange" label="Date Range">
                        <DatePicker.RangePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="clientId" label="Client">
                        <Select
                          placeholder="Select client"
                          allowClear
                          options={allProjects
                            ?.map((p: any) => ({
                              label: p.customer?.name,
                              value: p.customer?.id,
                            }))
                            .filter(
                              (v: any, i: any, a: any) =>
                                a.findIndex((t: any) => t.value === v.value) === i
                            )}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="projectLeadId" label="Project Lead">
                        <Select
                          placeholder="Select project lead"
                          allowClear
                          options={allProjects
                            ?.map((p: any) => ({
                              label: p.projectLead?.name,
                              value: p.projectLead?.id,
                            }))
                            .filter(
                              (v: any, i: any, a: any) =>
                                a.findIndex((t: any) => t.value === v.value) === i
                            )}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="projectManagerId" label="Project Manager">
                        <Select
                          placeholder="Select project manager"
                          allowClear
                          options={allProjects
                            ?.map((p: any) => ({
                              label: p.projectManager?.name,
                              value: p.projectManager?.id,
                            }))
                            .filter(
                              (v: any, i: any, a: any) =>
                                a.findIndex((t: any) => t.value === v.value) === i
                            )}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="natureOfWork" label="Nature of Work">
                        <Select
                          placeholder="Select nature of work"
                          allowClear
                          options={allProjects
                            ?.map((p: any) => {
                              const name =
                                typeof p.natureOfWork === "object"
                                    ? p.natureOfWork?.name
                                    : p.natureOfWork;
                              const id =
                                typeof p.natureOfWork === "object"
                                    ? p.natureOfWork?.id
                                    : p.natureOfWork;
                              return { label: name, value: id };
                            })
                            .filter(
                              (v: any, i: any, a: any) =>
                                a.findIndex((t: any) => t.value === v.value) === i
                            )}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="status" label="Status">
                        <Select
                          placeholder="Select status"
                          allowClear
                          options={[
                            { label: "Active", value: "active" },
                            { label: "Suspended", value: "suspended" },
                            { label: "Archived", value: "archived" },
                            { label: "Signed Off", value: "signed_off" },
                            { label: "Completed", value: "completed" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div className="flex justify-end mt-4">
                    <Button style={{ marginRight: 8 }} onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Apply Filters
                    </Button>
                  </div>
                </Form>
              </Card>
            )}
          </>
        )}
        defaultActiveKey="1"
        tabBarExtraContent={
          isMobile ? undefined : (
            <Space size={10}>
              {/* Edit Columns Button alongside Advanced Filters */}
              <Popover
                content={columnPopoverContent}
                trigger="click"
                placement="bottomRight"
                open={columnPopoverOpen}
                onOpenChange={setColumnPopoverOpen}
              >
                <Button icon={<SettingOutlined />}>Edit Columns</Button>
              </Popover>

              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  if (showFilters) resetFilters();
                  setShowFilters(!showFilters);
                }}
                type={showFilters ? "primary" : "default"}
              >
                Advanced Filters
              </Button>

              {!hideCreateDelete && (
                <Button
                  danger
                  loading={deleteProjectMutation.isPending}
                  disabled={selectedProjects.length === 0}
                  onClick={handleDeleteSelected}
                >
                  Delete
                </Button>
              )}
              {canExportProject && (
                <Tooltip title="Download / Export Helper">
                  <Button onClick={() => setIsExportViewOpen(true)}>
                    <DownloadOutlined />
                  </Button>
                </Tooltip>
              )}
              {!hideCreateDelete && (
                <Button type="primary" onClick={() => showModal()}>
                  Create Project
                </Button>
              )}
            </Space>
          )
        }
        items={[
          {
            label: `Active`,
            key: "1",
            children: (
              <ProjectTable
                showModal={showModal}
                status="active"
                advancedFilters={advancedFilters}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showFilters={showFilters}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            label: `Completed`,
            key: "2",
            children: (
              <ProjectTable
                showModal={showModal}
                status="completed"
                advancedFilters={advancedFilters}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showFilters={showFilters}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            label: `Signed Off`,
            key: "3",
            children: (
              <ProjectTable
                showModal={showModal}
                status="signed_off"
                advancedFilters={advancedFilters}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showFilters={showFilters}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            label: `Suspended`,
            key: "4",
            children: (
              <ProjectTable
                showModal={showModal}
                status="suspended"
                advancedFilters={advancedFilters}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showFilters={showFilters}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            label: `Archived`,
            key: "5",
            children: (
              <ProjectTable
                showModal={showModal}
                status="archive"
                advancedFilters={advancedFilters}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showFilters={showFilters}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
        ]}
      />

      {open && (
        <Modal
          title={editTaskGroupData ? "Edit Project" : "Create New Project"}
          footer={null}
          open={open}
          onCancel={handleCancel}
          width="min(1100px, 95vw)"
          style={{ top: 24 }}
          bodyStyle={{ paddingTop: 12 }}
        >
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <ProjectForm editProjectData={editTaskGroupData} handleCancel={handleCancel} />
          </div>
        </Modal>
      )}

      <ProjectExportModal
        open={downloadModalOpen}
        onCancel={() => setDownloadModalOpen(false)}
        selectedProjects={selectedProjects}
        allProjects={allProjects || []}
        visibleColumnKeys={visibleColumnKeys}
        activeTabKey={activeTabKey}
        showFilters={showFilters}
        advancedFilters={advancedFilters}
      />
    </>
  );
};

export default ProjectPage;
