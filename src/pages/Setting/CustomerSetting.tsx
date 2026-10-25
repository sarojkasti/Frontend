import React from "react";
import { Card, Typography, Tabs, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import BusinessSizeManager from "../../components/customer/BusinessSizeManager";
import BusinessNatureManager from "../../components/customer/BusinessNatureManager";
import LegalStatusManager from "../../components/customer/LegalStatusManager";

const { Title } = Typography;

const CustomerSetting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/settings')}
        >
          Back to Settings
        </Button>
      </div>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>Customer Settings</Title>
        <Tabs
          defaultActiveKey="businessSize"
          items={[
            {
              key: "businessSize",
              label: "Business Size",
              children: <BusinessSizeManager />,
            },
            {
              key: "businessNature",
              label: "Business Nature",
              children: <BusinessNatureManager />,
            },
            {
              key: "legalStatus",
              label: "Legal Status",
              children: <LegalStatusManager />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CustomerSetting;
