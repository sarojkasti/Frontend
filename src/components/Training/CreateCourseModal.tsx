import React, { useState } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useCreateCourse,
  useCreateTrainingCategory,
  useTrainingCategories,
} from "@/hooks/training/useTraining";

const { TextArea } = Input;

interface CreateCourseModalProps {
  open: boolean;
  onCancel: () => void;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ open, onCancel }) => {
  const [form] = Form.useForm();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showInlineCategoryAdd, setShowInlineCategoryAdd] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } =
    useTrainingCategories();
  const { mutateAsync: createCategory, isPending: creatingCategory } =
    useCreateTrainingCategory();
  const { mutate: createCourse, isPending } = useCreateCourse();

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
      form.setFieldValue("category", created.name);
      message.success(`Category "${created.name}" added`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add category");
    }
  };

  const handleFinish = (values: any) => {
    createCourse(values, {
      onSuccess: () => {
        form.resetFields();
        setShowInlineCategoryAdd(false);
        setNewCategoryName("");
        onCancel();
      },
    });
  };

  return (
    <Modal
      title="Create New LMS Course"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={780}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          level: "beginner",
          cpdHours: 0,
          durationMinutes: 60,
          isMandatory: false,
          status: "active",
          courseType: "self_paced",
          allowSelfEnrollment: false,
          strictSystemOnly: true,
          sequentialLock: false,
          passingScore: 70,
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="code"
              label="Course Code"
              rules={[{ required: true, message: "Enter course code (e.g. LMS-001)" }]}
            >
              <Input placeholder="e.g. LMS-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="title"
              label="Course Title"
              rules={[{ required: true, message: "Enter course title" }]}
            >
              <Input placeholder="e.g. Audit Methodology & Risk Assessment" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item label="Category" required>
              <div className="flex gap-2">
                <Form.Item
                  name="category"
                  noStyle
                  rules={[{ required: true, message: "Select or add a category" }]}
                >
                  <Select
                    placeholder="Select category"
                    showSearch
                    loading={categoriesLoading}
                    optionFilterProp="label"
                    className="flex-1"
                    options={categories.map((c) => ({
                      label: c.name,
                      value: c.name,
                    }))}
                    dropdownRender={(menu) => (
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
                    )}
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setShowInlineCategoryAdd((prev) => !prev)}
                  title="Add new category"
                >
                  New
                </Button>
              </div>
              {showInlineCategoryAdd && (
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
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="level" label="Skill Level">
              <Select
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item name="durationMinutes" label="Estimated Duration (Mins)">
              <InputNumber min={5} step={15} className="w-full" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="passingScore" label="Quiz Pass Score (%)">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="cpdHours"
              label="Credit Hours (Optional)"
              tooltip="Optional learning / CPD credit hours"
            >
              <InputNumber min={0} step={0.5} className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="allowSelfEnrollment"
              label="Open Self-Enrollment"
              valuePropName="checked"
            >
              <Switch checkedChildren="Open" unCheckedChildren="Admin Only" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="strictSystemOnly"
              label="System-Only Viewing"
              valuePropName="checked"
            >
              <Switch checkedChildren="Strict" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="sequentialLock"
              label="Sequential Lesson Lock"
              valuePropName="checked"
            >
              <Switch checkedChildren="Locked" unCheckedChildren="Free" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Course Description & Learning Outcomes">
          <TextArea rows={3} placeholder="Overview of what learners will cover..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCourseModal;
