import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  TimePicker,
  Typography,
  Upload,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCourseCurriculum,
  useCourseEnrollments,
} from "@/hooks/training/useTraining";
import {
  addQuizQuestion,
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  deleteQuizQuestion,
  uploadLessonFile,
  upsertAccessPolicy,
} from "@/service/training.service";
import { TrainingCourse, TrainingLesson } from "@/types/training";

const { Text } = Typography;

interface CourseBuilderModalProps {
  open: boolean;
  course: TrainingCourse | null;
  onClose: () => void;
}

const DAYS_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const CourseBuilderModal: React.FC<CourseBuilderModalProps> = ({
  open,
  course,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [moduleForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [policyForm] = Form.useForm();
  const [quizForm] = Form.useForm();

  const [addingLessonModuleId, setAddingLessonModuleId] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<TrainingLesson | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  const { data: curriculum, isLoading } = useCourseCurriculum(
    open && course ? course.id : null
  );
  const { data: enrollments = [], isLoading: enrollmentsLoading } =
    useCourseEnrollments(open && course ? course.id : null);

  const lessonContentType = Form.useWatch("contentType", lessonForm);
  const policyMode = Form.useWatch("mode", policyForm);

  useEffect(() => {
    if (!open || !curriculum) return;
    const p = curriculum.accessPolicy;
    policyForm.setFieldsValue({
      mode: p?.mode || "always",
      allowedDays: p?.allowedDays || [0, 1, 2, 3, 4, 5, 6],
      timeRange:
        p?.startTime && p?.endTime
          ? [dayjs(p.startTime, "HH:mm"), dayjs(p.endTime, "HH:mm")]
          : [dayjs("09:00", "HH:mm"), dayjs("18:00", "HH:mm")],
      validFromDate: p?.validFromDate || undefined,
      validUntilDate: p?.validUntilDate || undefined,
      policyNote: p?.policyNote || undefined,
    });
  }, [open, curriculum, policyForm]);

  const refreshCurriculum = () => {
    if (!course) return;
    queryClient.invalidateQueries({ queryKey: ["training-curriculum", course.id] });
    queryClient.invalidateQueries({ queryKey: ["training-courses"] });
  };

  const handleCreateModule = async (values: any) => {
    if (!course) return;
    try {
      await createModule(course.id, values);
      moduleForm.resetFields();
      refreshCurriculum();
      message.success("Module added");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add module");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule(moduleId);
      refreshCurriculum();
      message.success("Module deleted");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to delete module");
    }
  };

  const handleCreateLesson = async (values: any) => {
    if (!addingLessonModuleId) return;
    try {
      await createLesson(addingLessonModuleId, values);
      lessonForm.resetFields();
      setAddingLessonModuleId(null);
      refreshCurriculum();
      message.success("Lesson added");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add lesson");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteLesson(lessonId);
      refreshCurriculum();
      message.success("Lesson deleted");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to delete lesson");
    }
  };

  const handleFileUpload = async (lessonId: string, file: File) => {
    setUploadingLessonId(lessonId);
    try {
      await uploadLessonFile(lessonId, file);
      refreshCurriculum();
      message.success("Content uploaded to private LMS storage");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploadingLessonId(null);
    }
  };

  const handleSavePolicy = async (values: any) => {
    if (!course) return;
    setSavingPolicy(true);
    try {
      const startTime = values.timeRange?.[0]?.format("HH:mm");
      const endTime = values.timeRange?.[1]?.format("HH:mm");
      await upsertAccessPolicy(course.id, {
        mode: values.mode,
        allowedDays: values.allowedDays || [0, 1, 2, 3, 4, 5, 6],
        startTime,
        endTime,
        timezone: "Asia/Kathmandu",
        validFromDate: values.validFromDate || null,
        validUntilDate: values.validUntilDate || null,
        policyNote: values.policyNote || null,
      });
      refreshCurriculum();
      message.success("Timing policy saved");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to save policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleAddQuizQuestion = async (values: any) => {
    if (!quizLesson) return;
    const options = [
      { id: "a", text: values.optionA, isCorrect: values.correct === "a" },
      { id: "b", text: values.optionB, isCorrect: values.correct === "b" },
      ...(values.optionC
        ? [{ id: "c", text: values.optionC, isCorrect: values.correct === "c" }]
        : []),
      ...(values.optionD
        ? [{ id: "d", text: values.optionD, isCorrect: values.correct === "d" }]
        : []),
    ];
    try {
      await addQuizQuestion(quizLesson.id, {
        questionText: values.questionText,
        questionType: "single",
        options,
        points: values.points || 1,
      });
      quizForm.resetFields();
      refreshCurriculum();
      message.success("Question added");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add question");
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <VideoCameraOutlined className="text-blue-600" />;
      case "pdf":
      case "document":
        return <FilePdfOutlined className="text-red-500" />;
      case "quiz":
        return <QuestionCircleOutlined className="text-purple-600" />;
      default:
        return <FileTextOutlined className="text-emerald-600" />;
    }
  };

  const modules = curriculum?.modules || [];

  return (
    <Modal
      title={`Manage Course — ${course?.title || ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      centered
      destroyOnClose
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <Tabs
          items={[
            {
              key: "curriculum",
              label: "Curriculum (Modules & Lessons)",
              children: (
                <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
                  <Card size="small" title="Add Module">
                    <Form
                      form={moduleForm}
                      layout="inline"
                      onFinish={handleCreateModule}
                      className="flex flex-wrap gap-2"
                    >
                      <Form.Item
                        name="title"
                        rules={[{ required: true, message: "Module title required" }]}
                        className="flex-1 min-w-[220px]"
                      >
                        <Input placeholder="Module title (e.g. Module 1: Audit Planning)" />
                      </Form.Item>
                      <Form.Item name="description" className="flex-1 min-w-[200px]">
                        <Input placeholder="Short description (optional)" />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                        Add Module
                      </Button>
                    </Form>
                  </Card>

                  {modules.length === 0 ? (
                    <Empty description="No modules yet. Add your first module above." />
                  ) : (
                    <Collapse
                      defaultActiveKey={modules.map((m) => m.id)}
                      items={modules.map((mod) => ({
                        key: mod.id,
                        label: (
                          <div className="flex items-center justify-between pr-2">
                            <span className="font-semibold">
                              {mod.title}{" "}
                              <Tag className="ml-2">{mod.lessons?.length || 0} lessons</Tag>
                            </span>
                          </div>
                        ),
                        extra: (
                          <Space onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setAddingLessonModuleId(mod.id);
                                lessonForm.setFieldsValue({
                                  contentType: "video",
                                  durationMinutes: 15,
                                  isRequired: true,
                                });
                              }}
                            >
                              Add Lesson
                            </Button>
                            <Popconfirm
                              title="Delete module and all its lessons?"
                              onConfirm={() => handleDeleteModule(mod.id)}
                            >
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                        children: (
                          <div className="space-y-2">
                            {(mod.lessons || []).length === 0 ? (
                              <Text type="secondary" className="text-xs">
                                No lessons in this module yet.
                              </Text>
                            ) : (
                              (mod.lessons || []).map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getContentIcon(lesson.contentType)}
                                    <div>
                                      <div className="font-medium text-sm text-slate-900">
                                        {lesson.title}
                                      </div>
                                      <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                                        <span>{lesson.contentType.toUpperCase()}</span>
                                        <span>• {lesson.durationMinutes} min</span>
                                        {lesson.originalFileName && (
                                          <Tag color="green" className="m-0 text-[11px]">
                                            File: {lesson.originalFileName}
                                          </Tag>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <Space size="small">
                                    {(lesson.contentType === "video" ||
                                      lesson.contentType === "pdf" ||
                                      lesson.contentType === "document") && (
                                      <Upload
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                          handleFileUpload(lesson.id, file);
                                          return false;
                                        }}
                                      >
                                        <Button
                                          size="small"
                                          icon={<UploadOutlined />}
                                          loading={uploadingLessonId === lesson.id}
                                        >
                                          {lesson.hasFile ? "Replace File" : "Upload File"}
                                        </Button>
                                      </Upload>
                                    )}
                                    {lesson.contentType === "quiz" && (
                                      <Button
                                        size="small"
                                        icon={<QuestionCircleOutlined />}
                                        onClick={() => setQuizLesson(lesson)}
                                      >
                                        Questions ({lesson.quizQuestions?.length || 0})
                                      </Button>
                                    )}
                                    <Popconfirm
                                      title="Delete this lesson?"
                                      onConfirm={() => handleDeleteLesson(lesson.id)}
                                    >
                                      <Button size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                  </Space>
                                </div>
                              ))
                            )}
                          </div>
                        ),
                      }))}
                    />
                  )}
                </div>
              ),
            },
            {
              key: "timing",
              label: (
                <span>
                  <ClockCircleOutlined className="mr-1" />
                  Timing Policy
                </span>
              ),
              children: (
                <Form
                  form={policyForm}
                  layout="vertical"
                  onFinish={handleSavePolicy}
                  className="max-w-xl"
                >
                  <Form.Item
                    name="mode"
                    label="Access Schedule Mode"
                    extra="Control when enrolled students can stream or view course content."
                  >
                    <Select
                      options={[
                        { label: "Always Accessible (24/7)", value: "always" },
                        {
                          label: "Allow Only During Selected Window",
                          value: "allow_window",
                        },
                        {
                          label: "Ban / Block During Selected Window",
                          value: "ban_window",
                        },
                      ]}
                    />
                  </Form.Item>

                  {policyMode && policyMode !== "always" && (
                    <>
                      <Form.Item name="allowedDays" label="Applicable Days">
                        <Checkbox.Group options={DAYS_OPTIONS} />
                      </Form.Item>

                      <Form.Item
                        name="timeRange"
                        label="Time Window (Asia/Kathmandu)"
                        rules={[{ required: true, message: "Select start and end time" }]}
                      >
                        <TimePicker.RangePicker format="HH:mm" />
                      </Form.Item>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Form.Item name="validFromDate" label="Valid From Date (Optional)">
                      <Input type="date" />
                    </Form.Item>
                    <Form.Item name="validUntilDate" label="Valid Until Date (Optional)">
                      <Input type="date" />
                    </Form.Item>
                  </div>

                  <Form.Item name="policyNote" label="Policy Note (Optional)">
                    <Input.TextArea rows={2} placeholder="e.g. Study allowed before 9 AM and after 6 PM" />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" loading={savingPolicy}>
                    Save Timing Policy
                  </Button>
                </Form>
              ),
            },
            {
              key: "enrollments",
              label: (
                <span>
                  <TeamOutlined className="mr-1" />
                  Student Progress ({enrollments.length})
                </span>
              ),
              children: enrollmentsLoading ? (
                <Spin />
              ) : enrollments.length === 0 ? (
                <Empty description="No students enrolled in this course yet." />
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {enrollments.map((enr: any) => (
                    <div
                      key={enr.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 border border-slate-200 rounded bg-white"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {enr.user?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {enr.user?.email} •{" "}
                          {enr.enrollmentType === "nominated" ? "Admin Enrolled" : "Self Enrolled"}
                          {enr.dueDate && ` • Due: ${dayjs(enr.dueDate).format("YYYY-MM-DD")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Progress
                          percent={Math.round(Number(enr.progressPercent || 0))}
                          size="small"
                          className="w-36 m-0"
                        />
                        <Tag color={enr.status === "completed" ? "green" : "blue"}>
                          {enr.status}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Add Lesson Modal */}
      <Modal
        title="Add Lesson"
        open={Boolean(addingLessonModuleId)}
        onCancel={() => {
          setAddingLessonModuleId(null);
          lessonForm.resetFields();
        }}
        onOk={() => lessonForm.submit()}
        destroyOnClose
      >
        <Form form={lessonForm} layout="vertical" onFinish={handleCreateLesson}>
          <Form.Item
            name="title"
            label="Lesson Title"
            rules={[{ required: true, message: "Enter lesson title" }]}
          >
            <Input placeholder="e.g. Introduction to Risk Assessment" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="contentType" label="Content Type" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: "Video (Private Stream)", value: "video" },
                  { label: "PDF Document (In-App)", value: "pdf" },
                  { label: "Document", value: "document" },
                  { label: "Rich Text / Article", value: "rich_text" },
                  { label: "Quiz / Assessment", value: "quiz" },
                ]}
              />
            </Form.Item>
            <Form.Item name="durationMinutes" label="Duration (Minutes)">
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          {lessonContentType === "rich_text" && (
            <Form.Item name="richTextContent" label="Lesson Content">
              <Input.TextArea rows={5} placeholder="Write lesson content..." />
            </Form.Item>
          )}
          <Form.Item name="isRequired" label="Required for Completion" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Quiz Questions Modal */}
      <Modal
        title={`Quiz Questions — ${quizLesson?.title || ""}`}
        open={Boolean(quizLesson)}
        onCancel={() => setQuizLesson(null)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={quizForm} layout="vertical" onFinish={handleAddQuizQuestion}>
          <Form.Item
            name="questionText"
            label="Question"
            rules={[{ required: true, message: "Enter question text" }]}
          >
            <Input.TextArea rows={2} placeholder="Enter quiz question" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-2">
            <Form.Item name="optionA" label="Option A" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="optionB" label="Option B" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="optionC" label="Option C (Optional)">
              <Input />
            </Form.Item>
            <Form.Item name="optionD" label="Option D (Optional)">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Form.Item name="correct" label="Correct Answer" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: "Option A", value: "a" },
                  { label: "Option B", value: "b" },
                  { label: "Option C", value: "c" },
                  { label: "Option D", value: "d" },
                ]}
              />
            </Form.Item>
            <Form.Item name="points" label="Points" initialValue={1}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
            Add Question
          </Button>
        </Form>

        <Divider />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {(
            modules
              .flatMap((m) => m.lessons || [])
              .find((l) => l.id === quizLesson?.id)?.quizQuestions || []
          ).map((q, idx) => (
            <div key={q.id} className="p-2 border rounded flex justify-between items-start gap-2">
              <div className="text-xs">
                <div className="font-semibold">
                  {idx + 1}. {q.questionText} ({q.points} pt)
                </div>
                <div className="text-slate-500">
                  {(q.options || []).map((o) => `${o.text}${o.isCorrect ? " ✓" : ""}`).join(" | ")}
                </div>
              </div>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={async () => {
                  await deleteQuizQuestion(q.id);
                  refreshCurriculum();
                }}
              />
            </div>
          ))}
        </div>
      </Modal>
    </Modal>
  );
};

export default CourseBuilderModal;
