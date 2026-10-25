import React, { useMemo, useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import NatureExportPage from "./NatureExportPage";

const { Text } = Typography;
import {
  NatureOfWork,
  NatureOfWorkGroup,
  NatureOfWorkMigrationStrategy,
} from "@/service/natureOfWork.service";
import {
  useActiveAffectedProjects,
  useCreateNatureOfWork,
  useCreateNatureOfWorkGroup,
  useDeleteNatureOfWork,
  useDeleteNatureOfWorkGroup,
  useMigrateNatureOfWork,
  useNatureOfWorkGroupList,
  useNatureOfWorkList,
  useUpdateNatureOfWork,
  useUpdateNatureOfWorkGroup,
} from "@/hooks/natureOfWork/useNatureOfWork";

type EditAction = "in_place" | "fallback" | "duplicate" | "transfer";

interface NatureOfWorkManagerProps {
  onBackSettings?: () => void;
}

const NatureOfWorkManager: React.FC<NatureOfWorkManagerProps> = ({ onBackSettings }) => {
  const [natureModalOpen, setNatureModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingNature, setEditingNature] = useState<NatureOfWork | null>(null);
  const [editingGroup, setEditingGroup] = useState<NatureOfWorkGroup | null>(null);

  const [natureForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  const [isExportViewOpen, setIsExportViewOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>("nature");

  const { data: natures = [], isLoading: isNaturesLoading } = useNatureOfWorkList(true);
  const { data: groups = [], isLoading: isGroupsLoading } = useNatureOfWorkGroupList();

  const { data: activeAffectedProjects = [], isLoading: isActiveAffectedLoading } = useActiveAffectedProjects(
    editingNature?.id,
    natureModalOpen && !!editingNature,
  );

  const createNatureMutation = useCreateNatureOfWork();
  const updateNatureMutation = useUpdateNatureOfWork();
  const deleteNatureMutation = useDeleteNatureOfWork();
  const migrateNatureMutation = useMigrateNatureOfWork();

  const createGroupMutation = useCreateNatureOfWorkGroup();
  const updateGroupMutation = useUpdateNatureOfWorkGroup();
  const deleteGroupMutation = useDeleteNatureOfWorkGroup();

  const otherNatureOptions = useMemo(() => {
    if (!editingNature) return natures;
    return natures.filter((nature) => nature.id !== editingNature.id);
  }, [natures, editingNature]);

  // Sort natures by group name alphabetically by default, then by name
  const sortedNatures = useMemo(() => {
    return [...natures].sort((a, b) => {
      const groupA = (typeof a.group === "object" ? a.group?.name : a.group) || "";
      const groupB = (typeof b.group === "object" ? b.group?.name : b.group) || "";
      if (groupA && groupB) {
        const cmp = groupA.localeCompare(groupB);
        if (cmp !== 0) return cmp;
      } else if (groupA && !groupB) {
        return -1; // Grouped items first
      } else if (!groupA && groupB) {
        return 1;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [natures]);

  // Sort groups by rank ascending by default, then by name
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined && a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [groups]);

  const openCreateNatureModal = () => {
    setEditingNature(null);
    natureForm.resetFields();
    natureForm.setFieldsValue({
      isActive: true,
      editAction: "in_place",
    });
    setNatureModalOpen(true);
  };

  const openEditNatureModal = (record: NatureOfWork) => {
    setEditingNature(record);
    natureForm.resetFields();
    natureForm.setFieldsValue({
      name: record.name,
      shortName: record.shortName,
      groupId: record.groupId || record.group?.id,
      isActive: record.isActive !== false,
      editAction: "in_place",
    });
    setNatureModalOpen(true);
  };

  const closeNatureModal = () => {
    setNatureModalOpen(false);
    setEditingNature(null);
    natureForm.resetFields();
  };

  const openCreateGroupModal = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ rank: 0 });
    setGroupModalOpen(true);
  };

  const openEditGroupModal = (record: NatureOfWorkGroup) => {
    setEditingGroup(record);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      name: record.name,
      description: record.description,
      rank: record.rank || 0,
    });
    setGroupModalOpen(true);
  };

  const closeGroupModal = () => {
    setGroupModalOpen(false);
    setEditingGroup(null);
    groupForm.resetFields();
  };

  const handleDeleteNature = async (id: string) => {
    try {
      await deleteNatureMutation.mutateAsync(id);
      message.success("Nature of Work deleted");
    } catch (error: any) {
      message.error(error?.message || "Failed to delete nature of work");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroupMutation.mutateAsync(id);
      message.success("Group deleted");
    } catch (error: any) {
      message.error(error?.message || "Failed to delete group");
    }
  };

  const handleSaveNature = async () => {
    try {
      const values = await natureForm.validateFields();

      if (!editingNature) {
        await createNatureMutation.mutateAsync({
          name: values.name,
          shortName: values.shortName,
          groupId: values.groupId,
          isActive: values.isActive,
        });
        message.success("Nature of Work created");
        closeNatureModal();
        return;
      }

      const action: EditAction = values.editAction || "in_place";

      if (action === "in_place") {
        await updateNatureMutation.mutateAsync({
          id: editingNature.id,
          payload: {
            name: values.name,
            shortName: values.shortName,
            groupId: values.groupId,
            isActive: values.isActive,
          },
        });
        message.success("Nature of Work updated");
        closeNatureModal();
        return;
      }

      if (action === "transfer") {
        await migrateNatureMutation.mutateAsync({
          sourceNatureOfWorkId: editingNature.id,
          strategy: NatureOfWorkMigrationStrategy.TRANSFER,
          targetNatureOfWorkId: values.targetNatureOfWorkId,
        });
        message.success("Project type transferred with dependency-safe migration");
        closeNatureModal();
        return;
      }

      if (action === "fallback") {
        await migrateNatureMutation.mutateAsync({
          sourceNatureOfWorkId: editingNature.id,
          strategy: NatureOfWorkMigrationStrategy.FALLBACK,
          newName: values.newName,
          newShortName: values.newShortName,
          newGroupId: values.newGroupId,
        });
        message.success("Fallback created and active projects updated");
        closeNatureModal();
        return;
      }

      await migrateNatureMutation.mutateAsync({
        sourceNatureOfWorkId: editingNature.id,
        strategy: NatureOfWorkMigrationStrategy.DUPLICATE,
        newName: values.newName,
        newShortName: values.newShortName,
        newGroupId: values.newGroupId,
        projectIdsToMigrate: values.projectIdsToMigrate,
      });
      message.success("Duplicate created and selected projects migrated");
      closeNatureModal();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || "Failed to save nature of work");
    }
  };

  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (!editingGroup) {
        await createGroupMutation.mutateAsync(values);
        message.success("Group created");
      } else {
        await updateGroupMutation.mutateAsync({ id: editingGroup.id, payload: values });
        message.success("Group updated");
      }
      closeGroupModal();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || "Failed to save group");
    }
  };

  const selectedAction: EditAction = Form.useWatch("editAction", natureForm) || "in_place";

  const natureColumns: PowerTableColumn<NatureOfWork>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 220,
      defaultWidth: 220,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string) => (
        <span className="font-semibold text-slate-800">{text}</span>
      ),
    },
    {
      title: "Short Name",
      dataIndex: "shortName",
      key: "shortName",
      width: 130,
      defaultWidth: 130,
      sorter: (a, b) => (a.shortName || "").localeCompare(b.shortName || ""),
      render: (text: string) =>
        text ? (
          <Tag color="blue" className="font-mono text-xs">
            {text}
          </Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: "Group",
      dataIndex: ["group", "name"],
      key: "group",
      width: 170,
      defaultWidth: 170,
      sorter: (a, b) => {
        const gA = a.group?.name || "";
        const gB = b.group?.name || "";
        if (!gA && !gB) return 0;
        if (!gA) return 1;
        if (!gB) return -1;
        return gA.localeCompare(gB);
      },
      render: (_: unknown, record: NatureOfWork) =>
        record.group?.name ? (
          <Tag
            icon={<FolderOutlined />}
            color="cyan"
            className="rounded-md font-medium text-xs inline-flex items-center gap-1"
          >
            {record.group.name}
          </Tag>
        ) : (
          <span className="text-slate-400 italic text-xs">Unassigned</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      width: 110,
      sorter: (a: any, b: any) => Number(b.isActive !== false) - Number(a.isActive !== false),
      defaultWidth: 120,
      render: (_: unknown, record: NatureOfWork) =>
        record.isActive === false ? <Tag color="default">Inactive</Tag> : <Tag color="blue">Active</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      defaultWidth: 110,

      required: true,
      fixed: "right",
      render: (_: unknown, record: NatureOfWork) => (
        <Space>
          <Tooltip title="Edit project type">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#1677ff", fontSize: "15px" }} />}
              onClick={() => openEditNatureModal(record)}
              className="hover:bg-blue-50 text-blue-600 rounded-md"
            />
          </Tooltip>


          <Popconfirm
            title="Delete this project type?"
            description="It can only be deleted when no project depends on it."
            onConfirm={() => handleDeleteNature(record.id)}
          >
            <Tooltip title="Delete project type">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: "15px" }} />}
                className="hover:bg-red-50 text-red-600 rounded-md"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const groupColumns: PowerTableColumn<NatureOfWorkGroup>[] = [
    {
      title: "Group Name",
      dataIndex: "name",
      key: "name",
      width: 220,
      defaultWidth: 220,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string) => (
        <span className="font-semibold text-slate-800">{text}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 280,
      defaultWidth: 280,
      render: (v: string) =>
        v ? <span className="text-slate-600 text-xs">{v}</span> : <span className="text-slate-400">-</span>,
    },
    {
      title: "Display Rank",
      dataIndex: "rank",
      key: "rank",
      width: 120,
      defaultWidth: 120,
      sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
      render: (v: number) => (
        <Tag color="default" className="font-mono text-xs">
          Rank #{v ?? 0}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      defaultWidth: 110,

      required: true,
      fixed: "right",
      render: (_: unknown, record: NatureOfWorkGroup) => (
        <Space>
          <Tooltip title="Edit group">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#1677ff", fontSize: "15px" }} />}
              onClick={() => openEditGroupModal(record)}
              className="hover:bg-blue-50 text-blue-600 rounded-md"
            />
          </Tooltip>


          <Popconfirm
            title="Delete this group?"
            description="Group deletion is blocked if project types are still attached."
            onConfirm={() => handleDeleteGroup(record.id)}
          >
            <Tooltip title="Delete group">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: "15px" }} />}
                className="hover:bg-red-50 text-red-600 rounded-md"
              />
            </Tooltip>

  
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { visibleColumnKeys: natureVisibleKeys, columnCustomizer: natureCustomizer } =
    useColumnVisibility({
      persistenceKey: "nature_of_work_table",
      columns: natureColumns,
    });

  const { visibleColumnKeys: groupVisibleKeys, columnCustomizer: groupCustomizer } =
    useColumnVisibility({
      persistenceKey: "nature_group_table",
      columns: groupColumns,
    });

  if (isExportViewOpen) {
    return (
      <NatureExportPage
        onBack={() => setIsExportViewOpen(false)}
        natures={natures}
        groups={groups}
        initialTab={activeTabKey as "nature" | "groups"}
        isLoading={isNaturesLoading || isGroupsLoading}
      />
    );
  }

  return (
    <>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {onBackSettings && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBackSettings}
              className="flex items-center justify-center font-medium"
            >
              Back to Settings
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
              Nature of Work Management
            </h1>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Manage project work nature types, categories, and hierarchical groups
            </p>
          </div>
        </div>
        <Tooltip title="Download Nature of Work & Groups in Excel">
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => setIsExportViewOpen(true)}
            className="font-medium"
          >
            Export to Excel
          </Button>
        </Tooltip>
      </div>

      <Card styles={{ body: { padding: 16 } }} className="shadow-xs border-slate-200">
        <Tabs
          activeKey={activeTabKey}
          onChange={(k) => setActiveTabKey(k as "nature" | "groups")}
          tabBarExtraContent={
            activeTabKey === "nature" ? (
              <Space size={8}>
                {natureCustomizer}
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateNatureModal}>
                  Add Nature of Work
                </Button>
              </Space>
            ) : (
              <Space size={8}>
                {groupCustomizer}
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGroupModal}>
                  Add Group
                </Button>
              </Space>
            )
          }
          items={[
            {
              key: "nature",
              label: "Nature of Work",
              children: (
                <PowerTable<NatureOfWork>
                  rowKey="id"
                  loading={isNaturesLoading}
                  columns={natureColumns}
                  dataSource={sortedNatures}
                  enableResize
                  enableColumnSearch
                  visibleColumnKeys={natureVisibleKeys}
                  showToolbar={false}
                  persistenceKey="nature_of_work_table"
                  size="small"
                  tableScrollX="max-content"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  }}
                />
              ),
            },
            {
              key: "groups",
              label: "Nature Groups",
              children: (
                <PowerTable<NatureOfWorkGroup>
                  rowKey="id"
                  loading={isGroupsLoading}
                  columns={groupColumns}
                  dataSource={sortedGroups}
                  enableResize
                  enableColumnSearch
                  visibleColumnKeys={groupVisibleKeys}
                  showToolbar={false}
                  persistenceKey="nature_group_table"
                  size="small"
                  tableScrollX="max-content"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingNature ? "Edit Nature of Work" : "Add Nature of Work"}
        open={natureModalOpen}
        onOk={handleSaveNature}
        onCancel={closeNatureModal}
        okText={editingNature ? "Save" : "Create"}
        confirmLoading={
          createNatureMutation.isPending ||
          updateNatureMutation.isPending ||
          migrateNatureMutation.isPending
        }
        width={900}
        destroyOnClose
        centered
        styles={{ body: { maxHeight: "calc(85vh - 130px)", overflowY: "auto" } }}
      >
        {editingNature ? (
          <Alert
            showIcon
            type="info"
            style={{ marginBottom: 16 }}
            message="Editing a project type that may be in use"
            description="Projects currently using this type are listed below. Pick the option that matches what you want to happen to them."
          />
        ) : null}

        {editingNature ? (
          <List
            size="small"
            bordered
            loading={isActiveAffectedLoading}
            style={{ marginBottom: 16 }}
            header={`Active projects using this type (${activeAffectedProjects.length})`}
            dataSource={activeAffectedProjects}
            locale={{ emptyText: "No active projects currently depend on this type." }}
            renderItem={(project: any) => (
              <List.Item>
                <Space>
                  <strong>{project.name}</strong>
                  <Tag color={project.status === "active" ? "blue" : "gold"}>{project.status}</Tag>
                </Space>
              </List.Item>
            )}
          />
        ) : null}

        <Form form={natureForm} layout="vertical" initialValues={{ isActive: true, editAction: "in_place" }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="shortName"
            label="Short Name"
            rules={[{ required: true, message: "Please input short name" }]}
          >
            <Input maxLength={20} />
          </Form.Item>

          <Form.Item name="groupId" label="Nature Group">
            <Select
              allowClear
              placeholder="Select group"
              options={groups.map((group) => ({ value: group.id, label: group.name }))}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          {editingNature ? (
            <Form.Item
              name="editAction"
              label="How should this change be applied?"
              tooltip="Pick the strategy that best matches your intent. The options below explain what happens to existing projects."
            >
              <Radio.Group style={{ width: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio value="in_place" style={{ alignItems: "flex-start" }}>
                    <div>
                      <Text strong>Just rename / edit this type</Text>
                      <div>
                        <Text type="secondary">
                          Updates this project type directly. All existing projects keep using it
                          and simply see the new name/group.
                        </Text>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="transfer" style={{ alignItems: "flex-start" }}>
                    <div>
                      <Text strong>Merge into another existing type</Text>
                      <div>
                        <Text type="secondary">
                          Moves every project from this type to another one you pick, then retires
                          this type. Use when two types mean the same thing.
                        </Text>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="duplicate" style={{ alignItems: "flex-start" }}>
                    <div>
                      <Text strong>Create a new type and move selected projects</Text>
                      <div>
                        <Text type="secondary">
                          Creates a brand-new type with the details below and moves only the
                          projects you choose. The original type stays as-is for the rest.
                        </Text>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="fallback" style={{ alignItems: "flex-start" }}>
                    <div>
                      <Text strong>Create a new type for future projects only</Text>
                      <div>
                        <Text type="secondary">
                          Creates a new type with the details below for all future projects. The
                          current type is kept but deactivated so old projects keep their history.
                        </Text>
                      </div>
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          ) : null}

          {editingNature && selectedAction === "transfer" ? (
            <>
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="All projects will be moved"
                description="Every project currently on this type will be reassigned to the target type. This type will then be deactivated."
              />
              <Form.Item
                name="targetNatureOfWorkId"
                label="Merge into this type"
                rules={[{ required: true, message: "Please select a target project type" }]}
              >
                <Select
                  placeholder="Select the type to merge into"
                  options={otherNatureOptions.map((nature) => ({
                    value: nature.id,
                    label: `${nature.name} (${nature.shortName})`,
                  }))}
                />
              </Form.Item>
            </>
          ) : null}

          {editingNature && selectedAction === "duplicate" ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="A new project type will be created"
              description="Fill in the new type's details below, then pick which active projects should switch over to it."
            />
          ) : null}

          {editingNature && selectedAction === "fallback" ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="A new project type will be created for future use"
              description="Existing projects keep their current type (which will be deactivated). Use the new type below for any new projects going forward."
            />
          ) : null}

          {editingNature && (selectedAction === "fallback" || selectedAction === "duplicate") ? (
            <>
              <Form.Item
                name="newName"
                label="New Type Name"
                rules={[{ required: true, message: "Please input the new name" }]}
              >
                <Input placeholder="e.g. Tax Audit FY24" />
              </Form.Item>

              <Form.Item
                name="newShortName"
                label="New Short Name"
                rules={[{ required: true, message: "Please input new short name" }]}
              >
                <Input maxLength={20} placeholder="e.g. TAX24" />
              </Form.Item>

              <Form.Item name="newGroupId" label="New Group">
                <Select
                  allowClear
                  placeholder="Select group (optional)"
                  options={groups.map((group) => ({ value: group.id, label: group.name }))}
                />
              </Form.Item>
            </>
          ) : null}

          {editingNature && selectedAction === "duplicate" ? (
            <Form.Item
              name="projectIdsToMigrate"
              label="Projects to move to the new type"
              tooltip="Only the projects you select here will use the new type. The rest remain on the original."
              rules={
                activeAffectedProjects.length > 0
                  ? [{ required: true, message: "Please select at least one active project" }]
                  : []
              }
            >
              <Select
                mode="multiple"
                placeholder={
                  activeAffectedProjects.length === 0
                    ? "No active projects use this type"
                    : "Select projects to migrate"
                }
                disabled={activeAffectedProjects.length === 0}
                options={activeAffectedProjects.map((project: any) => ({
                  value: project.id,
                  label: project.name,
                }))}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={editingGroup ? "Edit Group" : "Add Group"}
        open={groupModalOpen}
        onOk={handleSaveGroup}
        onCancel={closeGroupModal}
        okText={editingGroup ? "Save" : "Create"}
        confirmLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
        destroyOnClose
        centered
        styles={{ body: { maxHeight: "calc(85vh - 130px)", overflowY: "auto" } }}
      >
        <Form form={groupForm} layout="vertical" initialValues={{ rank: 0 }}>
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: "Please input group name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="rank" label="Rank">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NatureOfWorkManager;
