import React from "react";
import { Card, Row, Col, Statistic, Progress, Table, Tag } from "antd";
import {
  ReadOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useTrainingAnalytics, useMyPortfolio } from "@/hooks/training/useTraining";

const CpdPortfolioView: React.FC = () => {
  const { data: analytics, isLoading } = useTrainingAnalytics();
  const { data: portfolio } = useMyPortfolio();

  const historyColumns = [
    {
      title: "Course Code & Title",
      key: "course",
      render: (_: any, record: any) => (
        <div>
          <span className="font-semibold text-gray-800">{record.courseTitle}</span>
          <span className="text-xs text-gray-400 block">{record.courseCode}</span>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "CPD Credits",
      dataIndex: "cpdHours",
      key: "cpdHours",
      render: (h: number) => <strong>{h} Hrs</strong>,
    },
    {
      title: "Certificate No.",
      dataIndex: "certificateNumber",
      key: "certificateNumber",
      render: (no: string) => (
        <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 border rounded">
          {no || "ISSUED"}
        </span>
      ),
    },
    {
      title: "Completion Date",
      dataIndex: "completedAt",
      key: "completedAt",
      render: (d: string) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-gray-100">
            <Statistic
              title="Active Courses"
              value={analytics?.totalCourses || 0}
              prefix={<ReadOutlined className="text-blue-500 mr-1" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-gray-100">
            <Statistic
              title="Conducted Batches"
              value={analytics?.totalBatches || 0}
              prefix={<CalendarOutlined className="text-green-500 mr-1" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-gray-100">
            <Statistic
              title="Total Enrollments"
              value={analytics?.totalEnrollments || 0}
              prefix={<UsergroupAddOutlined className="text-purple-500 mr-1" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-gray-100">
            <Statistic
              title="Certificates Issued"
              value={analytics?.completedTrainings || 0}
              prefix={<TrophyOutlined className="text-amber-500 mr-1" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Course Categories Distribution */}
      {analytics?.categoryDistribution && (
        <Card title="Training Distribution by Subject" className="shadow-sm border-gray-100">
          <div className="space-y-3">
            {Object.entries(analytics.categoryDistribution).map(([category, count]) => {
              const total = analytics.totalCourses || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span>{category}</span>
                    <span>{count} courses ({percent}%)</span>
                  </div>
                  <Progress percent={percent} size="small" status="active" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Official CPD Credit History */}
      <Card title="Official CPD Credit Record" className="shadow-sm border-gray-100">
        <Table
          dataSource={portfolio?.courseHistory || []}
          columns={historyColumns}
          rowKey="enrollmentId"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default CpdPortfolioView;
