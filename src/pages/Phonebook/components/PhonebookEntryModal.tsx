import React, { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useCreatePhonebookCategory,
  useCreatePhonebookEntry,
  usePhonebookCategories,
  usePhonebookShareOptions,
  useUpdatePhonebookEntry,
} from "@/hooks/phonebook/usePhonebook";
import { useSession } from "@/context/SessionContext";
import { isAdminOrSuperRole } from "@/routes/AdminRoute";
import { PhonebookEntry } from "@/types/phonebook";

const { Text } = Typography;

interface PhonebookEntryModalProps {
  open: boolean;
  editingEntry: PhonebookEntry | null;
  onClose: () => void;
}

const PhonebookEntryModal: React.FC<PhonebookEntryModalProps> = ({
  open,
  editingEntry,
  onClose,
}) => {
  const { profile, permissionChecker } = useSession();
  const canManageCategories = isAdminOrSuperRole(profile, permissionChecker);

  const [form] = Form.useForm();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showInlineCategoryAdd, setShowInlineCategoryAdd] = useState(false);
  const isShared = Form.useWatch("isShared", form);

  const { data: categories = [], isLoading: categoriesLoading } =
    usePhonebookCategories();
  const { data: shareOptions, isLoading: shareOptionsLoading } =
    usePhonebookShareOptions();
  const { mutateAsync: createCategory, isPending: creatingCategory } =
    useCreatePhonebookCategory();
  const { mutateAsync: createEntry, isPending: creating } =
    useCreatePhonebookEntry();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdatePhonebookEntry();

  useEffect(() => {
    if (!open) return;
    setShowInlineCategoryAdd(false);
    setNewCategoryName("");
    if (editingEntry) {
      form.setFieldsValue({
        name: editingEntry.name,
        phoneNumber: editingEntry.phoneNumber,
        secondaryPhone: editingEntry.secondaryPhone || undefined,
        categoryId:
          editingEntry.categoryId || editingEntry.category?.id || undefined,
        notes: editingEntry.notes || undefined,
        isShared: editingEntry.isShared,
        sharedWithUserIds: (editingEntry.sharedWithUsers || []).map((u) => u.id),
        sharedWithRoleIds: (editingEntry.sharedWithRoles || []).map((r) => r.id),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isShared: true,
        sharedWithUserIds: [],
        sharedWithRoleIds: [],
      });
    }
  }, [open, editingEntry, form]);

  const handleAddCategory = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      message.warning("Please enter a category name");
      return;
    }
    try {
      const created = await createCategory({ name: trimmed });
      setNewCategoryName("");
      setShowInlineCategoryAdd(false);
      form.setFieldValue("categoryId", created.id);
      message.success(`Category "${created.name}" added`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add category");
    }
  };

  const handleFinish = async (values: any) => {
    const payload = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      secondaryPhone: values.secondaryPhone || undefined,
      categoryId: values.categoryId || undefined,
      notes: values.notes || undefined,
      isShared: Boolean(values.isShared),
      sharedWithUserIds: values.isShared ? values.sharedWithUserIds || [] : [],
      sharedWithRoleIds: values.isShared ? values.sharedWithRoleIds || [] : [],
    };

    try {
      if (editingEntry) {
        await updateEntry({ id: editingEntry.id, payload });
        message.success("Phonebook entry updated");
      } else {
        await createEntry(payload);
        message.success("Phonebook entry added");
      }
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to save entry");
    }
  };

  return (
    <Modal
      title={editingEntry ? "Edit Phonebook Number" : "Add Phonebook Number"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Name / Label"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. Office Reception, Courier, Bank RM" />
          </Form.Item>

          <Form.Item label="Category">
            <div className="flex gap-2">
              <Form.Item name="categoryId" noStyle>
                <Select
                  placeholder="Select category"
                  allowClear
                  showSearch
                  loading={categoriesLoading}
                  optionFilterProp="label"
                  className="flex-1"
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  dropdownRender={
                    canManageCategories
                      ? (menu) => (
                          <>
                            {menu}
                            <Divider style={{ margin: "8px 0" }} />
                            <Space style={{ padding: "0 8px 4px", width: "100%" }}>
                              <Input
                                placeholder="New category name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                loading={creatingCategory}
                                onClick={handleAddCategory}
                              >
                                Add
                              </Button>
                            </Space>
                          </>
                        )
                      : undefined
                  }
                />
              </Form.Item>
              {canManageCategories && (
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setShowInlineCategoryAdd((prev) => !prev)}
                  title="Add new category"
                >
                  New
                </Button>
              )}
            </div>
            {canManageCategories && showInlineCategoryAdd && (
              <div className="flex gap-2 mt-2">
                <Input
                  size="small"
                  placeholder="Enter new category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddCategory();
                  }}
                />
                <Button
                  size="small"
                  type="primary"
                  loading={creatingCategory}
                  onClick={() => handleAddCategory()}
                >
                  Save
                </Button>
              </div>
            )}
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. +977-98XXXXXXXX" />
          </Form.Item>

          <Form.Item name="secondaryPhone" label="Secondary Phone (Optional)">
            <Input placeholder="Optional alternate number" />
          </Form.Item>
        </div>

        <Form.Item
          name="isShared"
          label="Sharing"
          valuePropName="checked"
          extra={
            <Text type="secondary" className="text-xs">
              {isShared
                ? "Sharing is enabled. Select specific people or roles below, or leave both empty to share with everyone. Super Admin can always view all numbers."
                : "Sharing is disabled. Only you and Super Admin can view this number."}
            </Text>
          }
        >
          <Switch checkedChildren="Shared" unCheckedChildren="Private" />
        </Form.Item>

        {isShared && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="sharedWithUserIds" label="Share with Specific People">
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Select users"
                loading={shareOptionsLoading}
                optionFilterProp="label"
                options={(shareOptions?.users || []).map((u) => ({
                  label: u.name,
                  value: u.id,
                }))}
              />
            </Form.Item>

            <Form.Item name="sharedWithRoleIds" label="Share with Roles">
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Select roles"
                loading={shareOptionsLoading}
                optionFilterProp="label"
                options={(shareOptions?.roles || []).map((r) => ({
                  label: r.displayName || r.name,
                  value: r.id,
                }))}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item name="notes" label="Notes (Optional)">
          <Input.TextArea rows={2} placeholder="Any helpful context or remarks" />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {editingEntry ? "Save Changes" : "Add Number"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PhonebookEntryModal;
