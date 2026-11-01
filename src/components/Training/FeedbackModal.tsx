import React from "react";
import { Modal, Form, Rate, Input } from "antd";
import { useSubmitFeedback } from "@/hooks/training/useTraining";
import { TrainingEnrollment } from "@/types/training";

interface FeedbackModalProps {
  enrollment: TrainingEnrollment | null;
  open: boolean;
  onCancel: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ enrollment, open, onCancel }) => {
  const [form] = Form.useForm();
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  const handleFinish = (values: any) => {
    if (!enrollment?.id) return;
    submitFeedback(
      { enrollmentId: enrollment.id, feedback: values },
      {
        onSuccess: () => {
          form.resetFields();
          onCancel();
        },
      }
    );
  };

  return (
    <Modal
      title={`Course Evaluation & Feedback: ${enrollment?.batch?.course?.title || "Training"}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={560}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(85vh - 100px)",
        },
      }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          contentRating: 5,
          trainerRating: 5,
          overallRating: 5,
        }}
      >
        <Form.Item
          name="contentRating"
          label="Course Content & Clarity"
          rules={[{ required: true }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item
          name="trainerRating"
          label="Instructor / Trainer Delivery"
          rules={[{ required: true }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item
          name="overallRating"
          label="Overall Practical Applicability"
          rules={[{ required: true }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item name="comment" label="What did you find most useful?">
          <Input.TextArea rows={3} placeholder="Key takeaways from this program..." />
        </Form.Item>

        <Form.Item name="suggestions" label="Suggestions for future sessions">
          <Input.TextArea rows={2} placeholder="Any topics you'd like covered next..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;
