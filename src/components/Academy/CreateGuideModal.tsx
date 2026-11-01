import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  Button,
  Divider,
} from "antd";
import { AcademyCategory, AcademyGuide } from "@/types/academy";
import { useCreateGuide, useUpdateGuide } from "@/hooks/academy/useAcademy";

const { TextArea } = Input;
const { Option } = Select;

interface CreateGuideModalProps {
  open: boolean;
  categories: AcademyCategory[];
  initialValues?: AcademyGuide | null;
  onClose: () => void;
}

const COMMON_ROUTES = [
  { label: "Dashboard (/)", value: "/" },
  { label: "Projects (/projects)", value: "/projects" },
  { label: "New Project (/projects/new)", value: "/projects/new" },
  { label: "Timesheets / Worklogs (/worklogs-all)", value: "/worklogs-all" },
  { label: "Leave Management (/leave)", value: "/leave" },
  { label: "Attendance (/attendance)", value: "/attendance" },
  { label: "Clients (/clients)", value: "/clients" },
  { label: "Billing (/billing)", value: "/billing" },
  { label: "Training & CPD (/training)", value: "/training" },
];

export const CreateGuideModal: React.FC<CreateGuideModalProps> = ({
  open,
  categories,
  initialValues,
  onClose,
}) => {
  const [form] = Form.useForm();
  const { mutate: createGuide, isPending: isCreating } = useCreateGuide();
  const { mutate: updateGuide, isPending: isUpdating } = useUpdateGuide();

  const isEdit = !!initialValues;

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          title: initialValues.title,
          slug: initialValues.slug,
          categoryId: initialValues.category?.id,
          summary: initialValues.summary,
          content: initialValues.content,
          videoUrl: initialValues.videoUrl,
          videoDurationSeconds: initialValues.videoDurationSeconds,
          difficulty: initialValues.difficulty || "beginner",
          estimatedReadTimeMinutes: initialValues.estimatedReadTimeMinutes || 5,
          associatedRoutes: initialValues.associatedRoutes || [],
          targetRoles: initialValues.targetRoles || ["all"],
          isFeatured: initialValues.isFeatured ?? false,
          isOnboardingChecklist: initialValues.isOnboardingChecklist ?? false,
          checklistOrder: initialValues.checklistOrder || 0,
          sortOrder: initialValues.sortOrder || 0,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          difficulty: "beginner",
          estimatedReadTimeMinutes: 5,
          targetRoles: ["all"],
          isFeatured: false,
          isOnboardingChecklist: false,
          sortOrder: 0,
          checklistOrder: 0,
        });
      }
    }
  }, [open, initialValues, form]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      const generatedSlug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      form.setFieldsValue({ slug: generatedSlug });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && initialValues) {
        updateGuide(
          { id: initialValues.id, payload: values },
          {
            onSuccess: () => {
              form.resetFields();
              onClose();
            },
          }
        );
      } else {
        createGuide(values, {
          onSuccess: () => {
            form.resetFields();
            onClose();
          },
        });
      }
    } catch (err) {
      // validation error
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered={true}
      width={760}
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: "80vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "8px",
        },
      }}
      title={
        <span className="text-base font-semibold text-gray-800">
          {isEdit ? "Edit Software Guide" : "Create New Software Guide"}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
            className="bg-blue-600"
          >
            {isEdit ? "Update Guide" : "Publish Guide"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-1 mx-0 w-full">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={16}>
            <Form.Item
              name="title"
              label="Guide Title"
              rules={[{ required: true, message: "Please enter guide title" }]}
            >
              <Input
                placeholder="e.g. How to Submit Daily Worklogs with Dual BS/AD Verification"
                onChange={handleTitleChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select placeholder="Select Category">
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="slug"
              label="URL Slug"
              rules={[{ required: true, message: "Please enter unique slug" }]}
            >
              <Input placeholder="e.g. daily-worklogs-guide" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="difficulty" label="Difficulty">
              <Select>
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="estimatedReadTimeMinutes" label="Read Time (Min)">
              <InputNumber min={1} max={60} className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="summary" label="Short Summary">
          <TextArea
            rows={2}
            placeholder="A brief 1-2 sentence preview shown on search cards and contextual help..."
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="Guide Content (Markdown format supported: ### Headers, * Lists, > Notes, **Bold**)"
          rules={[{ required: true, message: "Please enter guide content" }]}
        >
          <TextArea
            rows={8}
            placeholder="Write clear, step-by-step instructions. You can use markdown like:&#10;### Step 1: Navigate to Projects&#10;Click the New Project button...&#10;> Note: Ensure dates are in Nepali format."
          />
        </Form.Item>

        <Divider className="my-3" />

        <Row gutter={[16, 0]}>
          <Col xs={24} md={16}>
            <Form.Item
              name="videoUrl"
              label="Video Embed / Tutorial URL (Optional)"
              help="YouTube Embed URL (e.g. https://www.youtube.com/embed/...) or MP4 URL"
            >
              <Input placeholder="https://www.youtube.com/embed/..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="videoDurationSeconds" label="Video Duration (Sec)">
              <InputNumber min={0} step={30} className="w-full" placeholder="e.g. 180" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="associatedRoutes"
              label="Contextual Help Routes"
              help="Pages where this guide will automatically appear in the Help Drawer"
            >
              <Select
                mode="tags"
                placeholder="Select or enter routes e.g. /projects"
                options={COMMON_ROUTES}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="targetRoles" label="Target User Roles">
              <Select mode="multiple" placeholder="Select roles">
                <Option value="all">All Roles</Option>
                <Option value="junior_audit">Junior Auditor</Option>
                <Option value="senior_audit">Senior Auditor</Option>
                <Option value="manager">Manager</Option>
                <Option value="partner">Partner</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]} className="pt-2">
          <Col xs={12} sm={6}>
            <Form.Item name="isFeatured" label="Featured Guide" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item
              name="isOnboardingChecklist"
              label="Onboarding Task"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="checklistOrder" label="Checklist Order">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="sortOrder" label="Sort Order">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
