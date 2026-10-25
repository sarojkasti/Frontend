import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import NatureOfWorkManager from "../../components/project/NatureOfWorkManager";

const ProjectSetting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      <div className="mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/settings')}
        >
          Back to Settings
        </Button>
      </div>
      <NatureOfWorkManager />
    </div>
  );
};

export default ProjectSetting;
