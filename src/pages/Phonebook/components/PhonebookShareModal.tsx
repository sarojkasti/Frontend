import React, { useEffect } from "react";
import { Button, Form, Modal, Select, Switch, Typography, message } from "antd";
import {
  usePhonebookShareOptions,
  useUpdatePhonebookEntry,
} from "@/hooks/phonebook/usePhonebook";
import { PhonebookEntry } from "@/types/phonebook";

const { Text } = Typography;

interface PhonebookShareModalProps {
  open: boolean;
  entry: PhonebookEntry | null;
  onClose: () => void;
}

const PhonebookShareModal: React.FC<PhonebookShareModalProps> = ({
  open,
  entry,
  onClose,
}) => {
  const [form] = Form.useForm();
  const isShared = Form.useWatch("isShared", form);

  const { data: shareOptions, isLoading: shareOptionsLoading } =
    usePhonebookShareOptions();
  const { mutateAsync: updateEntry, isPending } = useUpdatePhonebookEntry();

  useEffect(() => {
    if (!open || !entry) return;
    form.setFieldsValue({
      isShared: entry.isShared,
      sharedWithUserIds: (entry.sharedWithUsers || []).map((u) => u.id),
      sharedWithRoleIds: (entry.sharedWithRoles || []).map((r) => r.id),
    });
  }, [open, entry, form]);

  const handleFinish = async (values: any) => {
    if (!entry) return;
    try {
      await updateEntry({
        id: entry.id,
        payload: {
          isShared: Boolean(values.isShared),
          sharedWithUserIds: values.isShared ? values.sharedWithUserIds || [] : [],
          sharedWithRoleIds: values.isShared ? values.sharedWithRoleIds || [] : [],
        },
      });
      message.success("Sharing settings updated");
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to update sharing");
    }
  };

  return (
    <Modal
      title={`Share Number — ${entry?.name || ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-3">
        <Form.Item
          name="isShared"
          label="Sharing"
          valuePropName="checked"
          extra={
            <Text type="secondary" className="text-xs">
              {isShared
                ? "Select specific people or roles to share this number with, or leave both empty to share with everyone."
                : "Sharing is disabled. Only you and Super Admin can view this number."}
            </Text>
          }
        >
          <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
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

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Save Sharing
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PhonebookShareModal;
