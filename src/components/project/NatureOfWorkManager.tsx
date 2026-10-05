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
import { DownloadOutlined } from "@ant-design/icons";
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

const NatureOfWorkManager: React.FC = () => {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [natureModalOpen, setNatureModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingNature, setEditingNature] = useState<NatureOfWork | null>(null);
  const [editingGroup, setEditingGroup] = useState<NatureOfWorkGroup | null>(null);

  const [natureForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  const [isExportViewOpen, setIsExportViewOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>("nature");

  const { data: natures = [], isLoading: isNaturesLoading } = useNatureOfWorkList(includeInactive);
  const { data: groups = [], isLoading: isGroupsLoading } = useNatureOfWorkGroupList();
  const { data: allNaturesForExport = [], isLoading: isAllNaturesLoading } = useNatureOfWorkList(true);

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
    { title: "Name", dataIndex: "name", key: "name", defaultWidth: 200 },
    { title: "Short Name", dataIndex: "shortName", key: "shortName", defaultWidth: 140 },
    {
      title: "Group",
      key: "group",
      defaultWidth: 160,
      render: (_: unknown, record: NatureOfWork) => record.group?.name || "-",
    },
    {
      title: "Status",
      key: "status",
      defaultWidth: 120,
      render: (_: unknown, record: NatureOfWork) =>
        record.isActive === false ? <Tag color="default">Inactive</Tag> : <Tag color="green">Active</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: unknown, record: NatureOfWork) => (
        <Space>
          <Button type="link" onClick={() => openEditNatureModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this project type?"
            description="It can only be deleted when no project depends on it."
            onConfirm={() => handleDeleteNature(record.id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const groupColumns: PowerTableColumn<NatureOfWorkGroup>[] = [
    { title: "Name", dataIndex: "name", key: "name", defaultWidth: 200 },
    { title: "Description", dataIndex: "description", key: "description", defaultWidth: 250, render: (v: string) => v || "-" },
    { title: "Rank", dataIndex: "rank", key: "rank", defaultWidth: 100, render: (v: number) => v ?? 0 },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: unknown, record: NatureOfWorkGroup) => (
        <Space>
          <Button type="link" onClick={() => openEditGroupModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this group?"
            description="Group deletion is blocked if project types are still attached."
            onConfirm={() => handleDeleteGroup(record.id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
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
        natures={allNaturesForExport.length > 0 ? allNaturesForExport : natures}
        groups={groups}
        initialTab={activeTabKey as "nature" | "groups"}
        isLoading={isNaturesLoading || isGroupsLoading || isAllNaturesLoading}
      />
    );
  }

  return (
    <>
      <Card
        title={
          <Typography.Title level={3} style={{ margin: 0 }}>
            Nature of Work Management
          </Typography.Title>
        }
        extra={
          <Tooltip title="Download Nature of Work & Groups in Excel">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => setIsExportViewOpen(true)}
            >
              Export to Excel
            </Button>
          </Tooltip>
        }
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={(k) => setActiveTabKey(k as "nature" | "groups")}
          items={[
            {
              key: "nature",
              label: "Nature of Work",
              children: (
                <>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <Space wrap>
                      <Button type="primary" onClick={openCreateNatureModal}>
                        Add Nature of Work
                      </Button>
                      <Space>
                        <span>Show inactive</span>
                        <Switch checked={includeInactive} onChange={setIncludeInactive} />
                      </Space>
                    </Space>
                    <Space>
                      {natureCustomizer}
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          setActiveTabKey("nature");
                          setIsExportViewOpen(true);
                        }}
                      >
                        Export Natures
                      </Button>
                    </Space>
                  </div>
                  <PowerTable<NatureOfWork>
                    rowKey="id"
                    loading={isNaturesLoading}
                    columns={natureColumns}
                    dataSource={natures}
                    enableResize
                    enableColumnSearch
                    visibleColumnKeys={natureVisibleKeys}
                    showToolbar={false}
                    persistenceKey="nature_of_work_table"
                    pagination={false}
                  />
                </>
              ),
            },
            {
              key: "groups",
              label: "Nature Groups",
              children: (
                <>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <Button type="primary" onClick={openCreateGroupModal}>
                      Add Group
                    </Button>
                    <Space>
                      {groupCustomizer}
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          setActiveTabKey("groups");
                          setIsExportViewOpen(true);
                        }}
                      >
                        Export Groups
                      </Button>
                    </Space>
                  </div>
                  <PowerTable<NatureOfWorkGroup>
                    rowKey="id"
                    loading={isGroupsLoading}
                    columns={groupColumns}
                    dataSource={groups}
                    enableResize
                    enableColumnSearch
                    visibleColumnKeys={groupVisibleKeys}
                    showToolbar={false}
                    persistenceKey="nature_group_table"
                    pagination={false}
                  />
                </>
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
                  <Tag color={project.status === "active" ? "green" : "gold"}>{project.status}</Tag>
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
