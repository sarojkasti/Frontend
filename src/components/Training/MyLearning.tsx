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
  Alert,
} from "antd";
import {
  SafetyCertificateOutlined,
  CommentOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useMyTrainings, useMyPortfolio } from "@/hooks/training/useTraining";
import { TrainingEnrollment } from "@/types/training";
import FeedbackModal from "./FeedbackModal";
import CertificateModal from "./CertificateModal";

const MyLearning: React.FC = () => {
  const { data: myEnrollments, isLoading: isLoadingEnrollments } = useMyTrainings();
  const { data: portfolio, isLoading: isLoadingPortfolio } = useMyPortfolio();

  const [feedbackEnrollment, setFeedbackEnrollment] = useState<TrainingEnrollment | null>(null);
  const [certEnrollment, setCertEnrollment] = useState<TrainingEnrollment | null>(null);

  const totalCpd = portfolio?.totalCpdHours || 0;
  const targetCpd = portfolio?.targetAnnualCpdHours || 30;
  const cpdPercent = Math.min(100, Math.round((totalCpd / targetCpd) * 100));

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
          <div>📅 {record.batch?.startDateNepali || record.batch?.startDate}</div>
          <div className="text-gray-400 capitalize">{record.batch?.deliveryMode?.replace("_", " ")}</div>
        </div>
      ),
    },
    {
      title: "CPD Hours",
      key: "cpd",
      render: (_: any, record: TrainingEnrollment) => (
        <Tag color="cyan">
          {record.batch?.course?.cpdHours || 0} Hours
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "blue";
        if (status === "completed") color = "green";
        if (status === "waitlisted") color = "orange";
        if (status === "failed") color = "red";
        return (
          <Tag color={color} className="capitalize font-medium">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TrainingEnrollment) => (
        <Space size="small">
          {record.status === "completed" && (
            <>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<SafetyCertificateOutlined />}
                onClick={() => setCertEnrollment(record)}
              >
                Certificate
              </Button>
              <Button
                size="small"
                icon={<CommentOutlined />}
                onClick={() => setFeedbackEnrollment(record)}
              >
                {record.feedback ? "Edit Feedback" : "Feedback"}
              </Button>
            </>
          )}

          {record.status === "enrolled" && (
            <span className="text-xs text-gray-500">Upcoming session</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* CPD Achievement Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">
              <TrophyOutlined /> Continuing Professional Development (CPD)
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {totalCpd} / {targetCpd} Hours Completed
            </h2>
            <p className="text-blue-100 text-xs">
              Annual professional accreditation requirement for current fiscal year.
            </p>
          </div>

          <div className="w-full md:w-64 bg-white/10 p-3 rounded-lg border border-white/20">
            <div className="flex justify-between text-xs mb-1 text-white">
              <span>Annual Target Progress</span>
              <span className="font-bold">{cpdPercent}%</span>
            </div>
            <Progress
              percent={cpdPercent}
              showInfo={false}
              strokeColor={{ "0%": "#60a5fa", "100%": "#34d399" }}
              trailColor="rgba(255,255,255,0.2)"
            />
          </div>
        </div>
      </div>

      {/* My Enrolled Trainings */}
      <Card title="My Training Registrations & History" className="shadow-sm border-gray-100">
        {isLoadingEnrollments ? (
          <div className="text-center py-12">
            <Spin tip="Loading your learning history..." />
          </div>
        ) : !myEnrollments || myEnrollments.length === 0 ? (
          <Empty description="You have not enrolled in any training programs yet. Explore the Course Catalog to register!" />
        ) : (
          <Table
            dataSource={myEnrollments}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>

      {/* Feedback Modal */}
      <FeedbackModal
        enrollment={feedbackEnrollment}
        open={!!feedbackEnrollment}
        onCancel={() => setFeedbackEnrollment(null)}
      />

      {/* Certificate Modal */}
      <CertificateModal
        enrollment={certEnrollment}
        open={!!certEnrollment}
        onCancel={() => setCertEnrollment(null)}
      />
    </div>
  );
};

export default MyLearning;
