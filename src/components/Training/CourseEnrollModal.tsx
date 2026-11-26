import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, message } from "antd";
import { useAdminEnrollCourse } from "@/hooks/training/useTraining";
import { listActiveUsers } from "@/service/user.service";
import { TrainingCourse } from "@/types/training";

interface CourseEnrollModalProps {
  open: boolean;
  course: TrainingCourse | null;
  onClose: () => void;
}

const CourseEnrollModal: React.FC<CourseEnrollModalProps> = ({
  open,
  course,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { mutateAsync: enrollUsers, isPending } = useAdminEnrollCourse();

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    listActiveUsers()
      .then((res) => setUsers(Array.isArray(res) ? res : res?.results || []))
      .catch(() => message.error("Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const handleFinish = async (values: any) => {
    if (!course) return;
    await enrollUsers({
      courseId: course.id,
      userIds: values.userIds,
      dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : undefined,
    });
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Enroll Students — ${course?.title || ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-3">
        <Form.Item
          name="userIds"
          label="Select Students / Employees"
          rules={[{ required: true, message: "Select at least one user" }]}
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            loading={loadingUsers}
            placeholder="Search and select users to enroll"
            optionFilterProp="label"
            options={users.map((u) => ({
              label: `${u.name} (${u.email})`,
              value: u.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="dueDate" label="Completion Due Date (Optional)">
          <DatePicker className="w-full" />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Enroll Selected Students
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CourseEnrollModal;
