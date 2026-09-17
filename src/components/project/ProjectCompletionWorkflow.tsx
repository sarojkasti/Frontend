import React, { useState } from 'react';
import { Card, Button, Modal, Steps, Alert, List, Typography, Space, Tag, message } from 'antd';
import { 
  CheckCircleOutlined, 
  FormOutlined, 
  FileProtectOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvaluationsByProject } from '@/service/project-evaluation.service';
import { getSignoffByProject } from '@/service/project-signoff.service';
import { completeProject } from '@/service/project.service';
import EvaluationForm from '../project-evaluation/EvaluationForm';
import EvaluationList from '../project-evaluation/EvaluationList';
import SignoffForm from '../project-signoff/SignoffForm';
import SignoffDetails from '../project-signoff/SignoffDetails';
import useIsMobile from '@/hooks/useIsMobile';

const { Text } = Typography;

interface ProjectCompletionWorkflowProps {
  project: any;
  currentUser: any;
}

const ProjectCompletionWorkflow: React.FC<ProjectCompletionWorkflowProps> = ({
  project,
  currentUser
}) => {
  const { isMobile } = useIsMobile();
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // Project users must be declared before getEvaluableUsers
  const projectUsers = project?.users || [];

  // Check user roles
  const isProjectLead = project?.projectLead?.id === currentUser?.id;
  const isProjectManager = project?.projectManager?.id === currentUser?.id;
  const userRole = currentUser?.role?.name?.toLowerCase();
  const isSuperUser = userRole === 'superuser';
  // Manager includes: projectmanager, manager, administrator, and superuser
  const isManager = ['projectmanager', 'manager', 'administrator', 'admin', 'superuser'].includes(userRole);
  const canCompleteProject = isProjectLead || isProjectManager || isSuperUser;

  // Project lead can evaluate, but manager/admin can evaluate all
  const canEvaluate = isProjectLead || isManager;

  // Filter users that can be evaluated based on role
  const getEvaluableUsers = () => {
    if (!projectUsers || projectUsers.length === 0) return [];

    // Protected roles that cannot be evaluated
    // Project managers, administrators and superusers are excluded from evaluation
    const protectedRoles = ['projectmanager', 'administrator', 'admin', 'superuser'];

    return projectUsers.filter((user: any) => {
      const userRoleName = user?.role?.name?.toLowerCase();

      // Don't show the current user to themselves (project lead shouldn't evaluate themselves)
      if (user?.id === currentUser?.id) {
        return false;
      }

      // Don't evaluate protected roles (projectmanager, administrator and superuser)
      if (protectedRoles.includes(userRoleName)) {
        return false;
      }

      // Manager/Admin/Superuser can evaluate all (except protected roles and themselves)
      if (isManager) {
        return true;
      }

      // Project lead (who is not a manager) can only evaluate audit senior and audit junior
      if (isProjectLead && !isManager) {
        return ['auditsenior', 'auditjunior'].includes(userRoleName);
      }

      return false;
    });
  };

  const evaluableUsers = getEvaluableUsers();

  // Query evaluations
  const { data: evaluations = [] } = useQuery({
    queryKey: ['project-evaluations', project?.id],
    queryFn: () => getEvaluationsByProject(project?.id),
    enabled: !!project?.id && project?.status === 'completed'
  });

  // Query signoff
  const { data: signoff } = useQuery({
    queryKey: ['project-signoff', project?.id],
    queryFn: () => getSignoffByProject(project?.id),
    enabled: !!project?.id && (project?.status === 'completed' || project?.status === 'signed_off'),
    retry: false
  });

  // Complete project mutation
  const completeMutation = useMutation({
    mutationFn: () => completeProject(project?.id),
    onSuccess: () => {
      message.success('Project marked as completed successfully');
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to complete project');
    }
  });

  // Calculate completion status
  const evaluatedCount = evaluations.length;
  // Count only evaluable users (not managers/admins/superusers)
  const evaluableUsersCount = evaluableUsers.length;
  const allEvaluated = evaluatedCount >= evaluableUsersCount;
  
  // Get unevaluated users from evaluable users only
  const evaluatedUserIds = new Set(evaluations.map((e: any) => e.evaluatedUserId));
  const unevaluatedUsers = evaluableUsers.filter((u: any) => !evaluatedUserIds.has(u.id));

  // Determine current step
  let currentStep = 0;
  if (project?.status === 'completed') {
    currentStep = 1;
    if (allEvaluated) currentStep = 2;
    if (signoff) currentStep = 3;
  } else if (project?.status === 'signed_off') {
    currentStep = 3;
  }

  const handleCompleteProject = () => {
    Modal.confirm({
      title: 'Complete Project',
      content: 'Are you sure you want to mark this project as completed? All tasks must be finished.',
      onOk: () => completeMutation.mutate()
    });
  };

  const handleEvaluateUser = (user: any) => {
    setSelectedUser(user);
    setIsEvaluationModalOpen(true);
  };

  const steps = [
    {
      title: 'Mark Complete',
      icon: <CheckCircleOutlined />,
      description: 'Project lead/manager/superuser marks project as completed'
    },
    {
      title: 'Evaluate Team',
      icon: <FormOutlined />,
      description: 'Manager evaluates all team members'
    },
    {
      title: 'Sign Off',
      icon: <FileProtectOutlined />,
      description: 'Manager or superuser signs off the project'
    }
  ];

  return (
    <div>
      <Card 
        title="Project Completion Workflow" 
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
      >
        <Steps 
          current={currentStep} 
          items={steps} 
          direction={isMobile ? "vertical" : "horizontal"}
          size={isMobile ? "small" : "default"}
        />
        
        <div style={{ marginTop: 24 }}>
          {/* Step 1: Mark as Complete */}
          {project?.status === 'active' && canCompleteProject && (
            <Alert
              message="Ready to Complete?"
              description="All tasks must be finished before you can mark this project as completed. Only project lead, manager, or superuser can complete the project."
              type="info"
              showIcon
              action={
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleCompleteProject}
                  loading={completeMutation.isPending}
                >
                  Mark as Completed
                </Button>
              }
            />
          )}

          {/* Step 2: Evaluate Team */}
          {project?.status === 'completed' && !signoff && (
            <>
              <Alert
                message={`Team Evaluations (${evaluatedCount}/${evaluableUsersCount})`}
                description={
                  allEvaluated 
                    ? 'All evaluable team members have been evaluated. Manager can now sign off the project.' 
                    : canEvaluate
                      ? 'Complete team member evaluations before sign-off. Only audit seniors, audit juniors, and team leads need evaluation. Project managers, administrators, and superusers are excluded from evaluation.'
                      : 'Only project lead or manager can evaluate team members.'
                }
                type={allEvaluated ? 'success' : 'warning'}
                showIcon
                style={{ marginBottom: 16 }}
              />

              {canEvaluate && unevaluatedUsers.length > 0 && (
                <Card title="Pending Evaluations" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={unevaluatedUsers}
                    renderItem={(user: any) => (
                      <List.Item
                        actions={[
                          <Button
                            type="primary"
                            icon={<FormOutlined />}
                            onClick={() => handleEvaluateUser(user)}
                          >
                            Evaluate
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<UserOutlined />}
                          title={user.name}
                          description={
                            <Space>
                              <Text type="secondary">{user.email}</Text>
                              {user.role?.name && (
                                <Tag color="blue">{user.role.name}</Tag>
                              )}
                              {project?.projectLead?.id === user.id && (
                                <Tag color="green">Team Lead</Tag>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              <EvaluationList projectId={project?.id} />
            </>
          )}

          {/* Step 3: Sign Off */}
          {project?.status === 'completed' && allEvaluated && !signoff && isManager && (
            <Card style={{ marginTop: 16 }}>
              <Alert
                message="Ready for Sign-off"
                description="All evaluations are complete. You can now sign off this project."
                type="success"
                showIcon
                action={
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<FileProtectOutlined />}
                    onClick={() => setIsSignoffModalOpen(true)}
                  >
                    Sign Off Project
                  </Button>
                }
              />
            </Card>
          )}

          {/* Show completed signoff */}
          {(project?.status === 'signed_off' || signoff) && (
            <>
              <Alert
                message="Project Signed Off"
                description="This project has been successfully signed off."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <EvaluationList projectId={project?.id} />
              <div style={{ marginTop: 16 }}>
                <SignoffDetails projectId={project?.id} />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Evaluation Modal */}
      <Modal
        title="Performance Evaluation"
        open={isEvaluationModalOpen}
        onCancel={() => {
          setIsEvaluationModalOpen(false);
          setSelectedUser(null);
        }}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <EvaluationForm
            projectId={project?.id}
            userId={selectedUser.id}
            userName={selectedUser.name}
            isTeamLead={project?.projectLead?.id === selectedUser.id}
            onSuccess={() => {
              setIsEvaluationModalOpen(false);
              setSelectedUser(null);
            }}
            onCancel={() => {
              setIsEvaluationModalOpen(false);
              setSelectedUser(null);
            }}
          />
        )}
      </Modal>

      {/* Signoff Modal */}
      <Modal
        title="Project Sign-off"
        open={isSignoffModalOpen}
        onCancel={() => setIsSignoffModalOpen(false)}
        footer={null}
        width={900}
      >
        <SignoffForm
          projectId={project?.id}
          projectName={project?.name}
          onSuccess={() => setIsSignoffModalOpen(false)}
          onCancel={() => setIsSignoffModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProjectCompletionWorkflow;
