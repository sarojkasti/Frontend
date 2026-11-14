import React from "react";
import { Typography, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import WorkingYearManager from "../../components/settings/WorkingYearManager";

const { Title, Paragraph } = Typography;

const WorkingYearSetting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/settings")}
        >
          Back to Settings
        </Button>
      </div>
      <div className="mb-6">
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          Fiscal Year (Working Year) Settings
        </Title>
        <Paragraph className="text-gray-500 !mb-0 mt-1">
          Configure the fiscal year calendar system, customize the default starting date (Bhadra 1 by default),
          manage historical/future working years, and set the active fiscal year for project tracking and reporting.
        </Paragraph>
      </div>
      <WorkingYearManager />
    </div>
  );
};

export default WorkingYearSetting;
