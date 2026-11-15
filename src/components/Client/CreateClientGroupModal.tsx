import React, { useMemo } from "react";
import { Modal, Form, Input, Select, Row, Col } from "antd";
import { useCreateClientGroup } from "@/hooks/clientGroup/useClientGroups";
import { listActiveUsers } from "@/service/user.service";
import { useQuery } from "@tanstack/react-query";

interface CreateClientGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newGroup: any) => void;
  initialName?: string;
}

export const CreateClientGroupModal: React.FC<CreateClientGroupModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialName = "",
}) => {
  const [form] = Form.useForm();
  const { mutate: createGroup, isPending } = useCreateClientGroup();
  const { data: usersData } = useQuery({
    queryKey: ["active-users-dropdown"],
    queryFn: listActiveUsers,
    staleTime: 60 * 1000,
  });

  const activeUsers = useMemo(() => {
    const rawList = Array.isArray(usersData)
      ? usersData
      : Array.isArray((usersData as any)?.results)
      ? (usersData as any).results
      : Array.isArray((usersData as any)?.users)
      ? (usersData as any).users
      : [];

    return rawList.map((u: any) => ({
      label: `${u.name || u.username || "User"} (${u.email || "no email"})`,
      value: u.id,
    }));
  }, [usersData]);

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialName) {
        form.setFieldsValue({
          name: initialName,
          code: initialName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase(),
        });
      }
    }
  }, [open, initialName, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createGroup(values, {
        onSuccess: (newGroup) => {
          form.resetFields();
          onClose();
          if (onSuccess) onSuccess(newGroup);
        },
      });
    } catch (e) {
      // Form validation error
    }
  };

  return (
    <Modal
      title={
        <div>
          <div className="text-base font-bold text-slate-800">Create New Client Group</div>
          <div className="text-xs text-slate-500 font-normal">
            Group related sister concerns, joint ventures, or branch offices under a single corporate umbrella.
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isPending}
      okText="Create Group"
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Group Name"
              rules={[
                { required: true, message: "Please enter group name" },
                { min: 2, message: "At least 2 characters" },
              ]}
            >
              <Input placeholder="e.g. Hanuman Group, Artha Holdings" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="code" label="Short Code">
              <Input placeholder="e.g. HANUMAN" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="primaryContactPerson" label="Central Contact Person">
              <Input placeholder="e.g. Ram Prasad (MD)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="primaryPhone" label="Central Phone / Mobile">
              <Input placeholder="e.g. 9851000000 / 01-4400000" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="primaryEmail"
              label="Central Email"
              rules={[{ type: "email", message: "Enter a valid email" }]}
            >
              <Input placeholder="e.g. info@hanumangroup.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="partnerInChargeId" label="Partner in Charge / Lead">
              <Select
                placeholder="Assign internal partner"
                options={activeUsers}
                showSearch
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="headOfficeAddress" label="Head Office Address">
          <Input placeholder="e.g. Babarmahal, Kathmandu" />
        </Form.Item>

        <Form.Item name="description" label="Notes / Description">
          <Input.TextArea rows={2} placeholder="Optional notes about this corporate group" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateClientGroupModal;
