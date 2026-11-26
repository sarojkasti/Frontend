import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Progress,
  Space,
  Empty,
  Spin,
} from "antd";
import {
  SafetyCertificateOutlined,
  CommentOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useMyTrainings,
  useMyCourseEnrollments,
} from "@/hooks/training/useTraining";
import { TrainingEnrollment } from "@/types/training";
import FeedbackModal from "./FeedbackModal";
import CertificateModal from "./CertificateModal";

const MyLearning: React.FC = () => {
  const navigate = useNavigate();
  const { data: myEnrollments, isLoading: isLoadingEnrollments } = useMyTrainings();
  const { data: myCourseEnrollments = [], isLoading: isLoadingCourses } =
    useMyCourseEnrollments();

  const [feedbackEnrollment, setFeedbackEnrollment] = useState<TrainingEnrollment | null>(null);
  const [certEnrollment, setCertEnrollment] = useState<TrainingEnrollment | null>(null);

  const lmsCourses = myCourseEnrollments.filter((e: any) => e.course);

  const columns = [
    {
      title: "Course & Batch",
      key: "course",
      render: (_: any, record: TrainingEnrollment) => (
        <div>
          <div className="font-semibold text-gray-800">
            {record.batch?.course?.title || "Training"}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            {record.batch?.batchName} ({record.batch?.course?.code})
          </div>
        </div>
      ),
    },
    {
      title: "Schedule (BS)",
      key: "schedule",
      render: (_: any, record: TrainingEnrollment) => (
        <div className="text-xs text-gray-600">
          <div>{record.batch?.startDateNepali || record.batch?.startDate}</div>
          <div className="text-gray-400 capitalize">
            {record.batch?.deliveryMode?.replace("_", " ")}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: TrainingEnrollment) => (
        <Tag color={record.status === "completed" ? "green" : "blue"}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TrainingEnrollment) => (
        <Space size="small">
          {record.status === "completed" && record.certificateNumber && (
            <Button
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => setCertEnrollment(record)}
            >
              Certificate
            </Button>
          )}
          {record.status === "completed" && !record.feedback && (
            <Button
              size="small"
              icon={<CommentOutlined />}
              onClick={() => setFeedbackEnrollment(record)}
            >
              Feedback
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Enrolled LMS Courses" size="small" className="shadow-sm border-gray-100">
        {isLoadingCourses ? (
          <div className="text-center py-8">
            <Spin tip="Loading your courses..." />
          </div>
        ) : lmsCourses.length === 0 ? (
          <Empty description="No self-paced LMS courses assigned yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lmsCourses.map((enr: any) => (
              <div
                key={enr.id}
                className="p-3 border border-slate-200 rounded-lg flex flex-col justify-between gap-2 bg-slate-50/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {enr.course.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {enr.course.code}
                      {enr.course.category ? ` • ${enr.course.category}` : ""}
                      {enr.certificateNumber ? ` • Cert: ${enr.certificateNumber}` : ""}
                    </div>
                  </div>
                  <Tag color={enr.status === "completed" ? "green" : "blue"}>
                    {enr.status}
                  </Tag>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Progress
                    percent={Math.round(Number(enr.progressPercent || 0))}
                    size="small"
                    className="flex-1 m-0"
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate(`/training/learn/${enr.course.id}`)}
                  >
                    {enr.status === "completed" ? "Review" : "Continue"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!isLoadingEnrollments && myEnrollments && myEnrollments.length > 0 && (
        <Card
          title="Classroom / Batch Training History"
          size="small"
          className="shadow-sm border-gray-100"
        >
          <Table
            dataSource={myEnrollments}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 6 }}
            size="small"
          />
        </Card>
      )}

      {feedbackEnrollment && (
        <FeedbackModal
          open={Boolean(feedbackEnrollment)}
          enrollment={feedbackEnrollment}
          onCancel={() => setFeedbackEnrollment(null)}
        />
      )}
      {certEnrollment && (
        <CertificateModal
          open={Boolean(certEnrollment)}
          enrollment={certEnrollment}
          onCancel={() => setCertEnrollment(null)}
        />
      )}
    </div>
  );
};

export default MyLearning;
