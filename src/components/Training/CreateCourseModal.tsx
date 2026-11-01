import React from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col } from "antd";
import { useCreateCourse } from "@/hooks/training/useTraining";

const { TextArea } = Input;

interface CreateCourseModalProps {
  open: boolean;
  onCancel: () => void;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ open, onCancel }) => {
  const [form] = Form.useForm();
  const { mutate: createCourse, isPending } = useCreateCourse();

  const handleFinish = (values: any) => {
    createCourse(values, {
      onSuccess: () => {
        form.resetFields();
        onCancel();
      },
    });
  };

  return (
    <Modal
      title="Create New Training Course"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={720}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(88vh - 100px)",
          padding: "16px 20px",
        },
      }}
      destroyOnClose
    >
      <div className="overflow-x-hidden w-full">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            level: "beginner",
            cpdHours: 2.0,
            durationMinutes: 120,
            isMandatory: false,
            status: "active",
          }}
        >
          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={12} className="px-2">
              <Form.Item
                name="code"
                label="Course Code"
                className="mb-3"
                rules={[{ required: true, message: "Please input course code (e.g. TRN-AUD-01)" }]}
              >
                <Input placeholder="e.g. TRN-AUD-01" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="px-2">
              <Form.Item
                name="title"
                label="Course Title"
                className="mb-3"
                rules={[{ required: true, message: "Please enter course title" }]}
              >
                <Input placeholder="e.g. NFRS 9 Financial Instruments Masterclass" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={12} className="px-2">
              <Form.Item
                name="category"
                label="Category"
                className="mb-3"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select
                  placeholder="Select category"
                  options={[
                    { value: "Audit", label: "Audit & Assurance" },
                    { value: "Taxation", label: "Taxation & VAT" },
                    { value: "NFRS/NAS", label: "NFRS / NAS Accounting Standards" },
                    { value: "Compliance", label: "Compliance, Ethics & AML" },
                    { value: "Tools/Excel", label: "Tools, Excel & Data Analytics" },
                    { value: "Soft Skills", label: "Soft Skills & Client Communication" },
                    { value: "Leadership", label: "Leadership & Team Management" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="px-2">
              <Form.Item name="level" label="Skill Level" className="mb-3">
                <Select
                  options={[
                    { value: "beginner", label: "Beginner / Trainee" },
                    { value: "intermediate", label: "Intermediate / Senior" },
                    { value: "advanced", label: "Advanced / Manager & Partner" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={8} className="px-2">
              <Form.Item
                name="cpdHours"
                label="CPD Credit Hours"
                className="mb-3"
                tooltip="Continuing Professional Development credit hours recognized for staff"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={0.5} step={0.5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} className="px-2">
              <Form.Item name="durationMinutes" label="Duration (Minutes)" className="mb-3">
                <InputNumber min={15} step={15} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} className="px-2">
              <Form.Item name="isMandatory" label="Mandatory Training" valuePropName="checked" className="mb-3">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={12} className="px-2">
              <Form.Item name="targetRoles" label="Target Roles" className="mb-3">
                <Select
                  mode="multiple"
                  placeholder="Applicable roles (leave empty for all)"
                  options={[
                    { value: "auditjunior", label: "Audit Junior / Trainee" },
                    { value: "auditsenior", label: "Audit Senior" },
                    { value: "projectmanager", label: "Project Manager" },
                    { value: "administrator", label: "Administrator" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="px-2">
              <Form.Item name="prerequisites" label="Prerequisites" className="mb-3">
                <Input placeholder="e.g. Basic knowledge of Nepal Audit Standards" />
              </Form.Item>
            </Col>
          </Row>

          <div className="px-2">
            <Form.Item name="description" label="Course Description & Learning Outcomes" className="mb-2">
              <TextArea rows={3} placeholder="Detailed overview of what participants will learn..." />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateCourseModal;
