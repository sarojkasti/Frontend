import React from "react";
import { Typography, Card, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import DepartmentManager from "../../components/settings/DepartmentManager";

const { Title } = Typography;

const DepartmentSetting: React.FC = () => {
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
        <Title level={3}>Department Management</Title>
        <p className="mb-4 text-gray-500">
          Create and manage departments for your organization. Departments can be assigned to users
          to better organize your team structure.
        </p>
        <DepartmentManager />
      </Card>
    </div>
  );
};

export default DepartmentSetting;
