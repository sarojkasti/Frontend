import React from 'react';
import { Spin, Alert } from 'antd';
import PageTitle from '../../components/PageTitle';
import WorkhourSettings from '../../components/Workhour/WorkhourSettings';
import { useRole } from '../../hooks/role/useRole';

const WorkhourSettingsPage: React.FC = () => {
  // Fetch roles - using high limit to get all roles
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useRole({
    page: 1,
    limit: 100 // High limit to get all roles
  });

  if (rolesLoading) {
    return (
      <div>
        <PageTitle title="Work Hour Settings" backUrl="/settings" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div>
        <PageTitle title="Work Hour Settings" backUrl="/settings" />
        <Alert
          message="Error Loading Data"
          description="Failed to load roles data. Please try again."
          type="error"
          style={{ margin: '20px 0' }}
        />
      </div>
    );
  }

  // Extract the actual data arrays
  const roles = rolesData?.results || [];

  return (
    <div>
      <PageTitle title="Work Hour Settings" backUrl="/settings" />
      <WorkhourSettings roles={roles} />
    </div>
  );
};

export default WorkhourSettingsPage;
