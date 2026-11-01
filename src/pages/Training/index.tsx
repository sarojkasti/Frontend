import React, { useState } from "react";
import { Tabs, Tag } from "antd";
import {
  ReadOutlined,
  CalendarOutlined,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import PageTitle from "@/components/PageTitle";
import CourseCatalog from "@/components/Training/CourseCatalog";
import BatchSchedule from "@/components/Training/BatchSchedule";
import MyLearning from "@/components/Training/MyLearning";
import CpdPortfolioView from "@/components/Training/CpdPortfolioView";
import { useTrainingBatches } from "@/hooks/training/useTraining";

const TrainingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("courses");
  const { data: batches } = useTrainingBatches();

  const activeBatchesCount = (batches || []).filter(
    (b) => b.status === "scheduled" || b.status === "in_progress"
  ).length;

  const tabItems = [
    {
      key: "courses",
      label: (
        <span className="flex items-center gap-1.5">
          <ReadOutlined /> Course Catalog
        </span>
      ),
      children: <CourseCatalog />,
    },
    {
      key: "batches",
      label: (
        <span className="flex items-center gap-1.5">
          <CalendarOutlined /> Batches & Schedule
          {activeBatchesCount > 0 && (
            <Tag color="blue" className="ml-1 text-[11px] px-1.5 py-0 leading-tight">
              {activeBatchesCount}
            </Tag>
          )}
        </span>
      ),
      children: <BatchSchedule />,
    },
    {
      key: "my-learning",
      label: (
        <span className="flex items-center gap-1.5">
          <UserOutlined /> My Learning & Certificates
        </span>
      ),
      children: <MyLearning />,
    },
    {
      key: "portfolio",
      label: (
        <span className="flex items-center gap-1.5">
          <TrophyOutlined /> CPD Portfolio & Analytics
        </span>
      ),
      children: <CpdPortfolioView />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <PageTitle
        title="Training & Professional Development"
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          items={tabItems}
          type="line"
          size="middle"
        />
      </div>
    </div>
  );
};

export default TrainingPage;
