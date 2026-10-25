import React from "react";
import { useNavigate } from "react-router-dom";
import NatureOfWorkManager from "../../components/project/NatureOfWorkManager";

const ProjectSetting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      <NatureOfWorkManager onBackSettings={() => navigate('/settings')} />
    </div>
  );
};

export default ProjectSetting;
