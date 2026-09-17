import { WorklogType } from '@/types/worklog';
import { TaskType } from '@/types/task';
import { UserType } from '@/types/user';
import { Card, Statistic, Row, Col, Button, Modal, Space, Typography, Progress, Spin, InputNumber, Table } from 'antd';
import { useEffect, useState } from 'react';
import { DollarOutlined, FieldTimeOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import useIsMobile from '@/hooks/useIsMobile';
import { ResponsiveTable } from '@/components/ui/MobileCardList';

const { Text } = Typography;
const backendURI = import.meta.env.VITE_BACKEND_URI;

interface ProjectBudgetProps {
  project: any;
  loading?: boolean;
}

// Helper functions for calculations
const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;
  return durationMs / (1000 * 60 * 60); // Convert to hours
};

const sumBudgetedHours = (tasks: TaskType[]): number => {
  return tasks
    .filter((task) => task.taskType === 'story') // Only consider main tasks, not subtasks
    .reduce((sum, task) => sum + (task.budgetedHours || 0), 0);
};

const sumActualHours = (worklogs: WorklogType[]): number => {
  return worklogs.reduce((sum, worklog) => {
    return sum + calculateDuration(worklog.startTime, worklog.endTime);
  }, 0);
};

// Format currency in NPR
const formatNPR = (amount: number): string => {
  return new Intl.NumberFormat('ne-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Calculate per-user contributions
const calculateUserContributions = (worklogs: WorklogType[]): { user: UserType; hours: number }[] => {
  const userContributions = new Map<string, { user: UserType; hours: number }>();
  worklogs.forEach((worklog) => {
    if (!worklog.user) return;
    const userId = worklog.user.id?.toString() || '';
    if (!userId) return;
    const hours = calculateDuration(worklog.startTime, worklog.endTime);
    if (userContributions.has(userId)) {
      const current = userContributions.get(userId)!;
      userContributions.set(userId, {
        ...current,
        hours: current.hours + hours
      });
    } else {
      userContributions.set(userId, {
        user: worklog.user,
        hours
      });
    }
  });
  return Array.from(userContributions.values()).sort((a, b) => b.hours - a.hours);
};

// Calculate per-task contributions with user breakdown
const calculateTaskContributions = (
  worklogs: WorklogType[]
): { task: TaskType; hours: number; userBreakdown: { user: UserType; hours: number }[] }[] => {
  const taskContributions = new Map<
    string,
    { task: TaskType; hours: number; userBreakdown: { user: UserType; hours: number }[] }
  >();
  worklogs.forEach((worklog) => {
    if (!worklog.task || !worklog.user) return;
    const taskId = worklog.task.id?.toString() || '';
    if (!taskId) return;
    const hours = calculateDuration(worklog.startTime, worklog.endTime);
    if (taskContributions.has(taskId)) {
      const current = taskContributions.get(taskId)!;
      current.hours += hours;
      const userEntry = current.userBreakdown.find((u) => u.user.id === worklog.user.id);
      if (userEntry) {
        userEntry.hours += hours;
      } else {
        current.userBreakdown.push({ user: worklog.user, hours });
      }
    } else {
      taskContributions.set(taskId, {
        task: worklog.task,
        hours,
        userBreakdown: [{ user: worklog.user, hours }]
      });
    }
  });
  return Array.from(taskContributions.values()).sort((a, b) => b.hours - a.hours);
};

const ProjectBudget: React.FC<ProjectBudgetProps> = ({ project }) => {
  const { isMobile } = useIsMobile();
  const [worklogs, setWorklogs] = useState<WorklogType[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectUsers, setProjectUsers] = useState<UserType[]>([]);
  const [userRates, setUserRates] = useState<{ [userId: string]: number }>({});
  const [isRateModalVisible, setIsRateModalVisible] = useState(false);

  useEffect(() => {
    if (project) {
      setTasks(project.tasks || []);
      setProjectUsers(project.users || []);

      const initialRates: { [userId: string]: number } = {};
      if (project.users && project.users.length > 0) {
        project.users.forEach((user: UserType) => {
          if (user.id) {
            initialRates[user.id] = user.hourlyRate || 500;
          }
        });
      }
      setUserRates(initialRates);

      const fetchWorklogs = async () => {
        setIsLoading(true);
        try {
          const allWorklogs: WorklogType[] = [];
          if (project.tasks && project.tasks.length > 0) {
            const taskIds = project.tasks.map((task: TaskType) => task.id);
            for (const taskId of taskIds) {
              try {
                const response = await axios.get(`${backendURI}/worklogs/task/${taskId}`);
                if (response.data && Array.isArray(response.data)) {
                  allWorklogs.push(...response.data);
                }
              } catch (error) {
                // Task worklogs fetch error ignored
              }
            }
          }
          setWorklogs(allWorklogs);
        } catch (error) {
          // General fetch error
        } finally {
          setIsLoading(false);
        }
      };
      fetchWorklogs();
    }
  }, [project]);

  const budgetedHours = sumBudgetedHours(tasks);
  const actualHours = sumActualHours(worklogs);
  const hourProgress = budgetedHours > 0 ? (actualHours / budgetedHours) * 100 : 0;

  const userContributions = calculateUserContributions(worklogs);
  const taskContributions = calculateTaskContributions(worklogs);

  const calculateUserCost = (userId: string | number | undefined, hours: number): number => {
    if (!userId) return 0;
    const rate = userRates[userId.toString()] || 500;
    return hours * rate;
  };

  const calculateTotalEstimatedCost = (): number => {
    let totalCost = 0;
    if (!tasks || tasks.length === 0 || !projectUsers || projectUsers.length === 0) {
      return 0;
    }
    const userCount = projectUsers.length;
    if (userCount === 0) return 0;
    const hoursPerUser = budgetedHours / userCount;
    projectUsers.forEach((user) => {
      if (user.id) {
        const rate = userRates[user.id.toString()] || 500;
        totalCost += hoursPerUser * rate;
      }
    });
    return totalCost;
  };

  const calculateTotalActualCost = (): number => {
    return userContributions.reduce((sum, { user, hours }) => {
      return sum + calculateUserCost(user.id, hours);
    }, 0);
  };

  const estimatedCost = calculateTotalEstimatedCost();
  const actualCost = calculateTotalActualCost();

  const handleRateChange = (userId: string, rate: number) => {
    setUserRates((prev) => ({
      ...prev,
      [userId]: rate
    }));
  };

  const showRateModal = () => {
    setIsRateModalVisible(true);
  };

  const resetRates = () => {
    const initialRates: { [userId: string]: number } = {};
    if (projectUsers && projectUsers.length > 0) {
      projectUsers.forEach((user) => {
        if (user.id) {
          initialRates[user.id.toString()] = user.hourlyRate || 500;
        }
      });
    }
    setUserRates(initialRates);
  };

  const userColumns = [
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'userName',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Hours',
      dataIndex: 'hours',
      key: 'hours',
      render: (hours: number) => hours.toFixed(2),
      sorter: (a: { hours: number }, b: { hours: number }) => a.hours - b.hours,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Rate',
      key: 'rate',
      render: (_: any, record: { user: UserType }) => {
        const userId = record.user?.id?.toString() || '';
        const rate = userRates[userId] || 500;
        return formatNPR(rate);
      },
    },
    {
      title: 'Cost',
      key: 'cost',
      render: (_: any, record: { user: UserType; hours: number }) => {
        const cost = calculateUserCost(record.user?.id, record.hours);
        return formatNPR(cost);
      },
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_: any, record: { hours: number }) => {
        const percentage = actualHours > 0 ? (record.hours / actualHours) * 100 : 0;
        return (
          <div>
            <Progress percent={parseFloat(percentage.toFixed(1))} size="small" />
          </div>
        );
      },
    },
  ];

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: ['task', 'name'],
      key: 'taskName',
      render: (text: string, record: { task: TaskType; hours: number }) => (
        <div>
          <div className="font-medium text-gray-800">{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.task?.tcode}</div>
        </div>
      ),
    },
    {
      title: 'Budgeted',
      key: 'budgeted',
      render: (_: any, record: { task: TaskType }) => {
        return record.task?.budgetedHours ? record.task.budgetedHours.toFixed(2) : '0.00';
      },
    },
    {
      title: 'Actual',
      dataIndex: 'hours',
      key: 'hours',
      render: (hours: number) => hours.toFixed(2),
      sorter: (a: { hours: number }, b: { hours: number }) => a.hours - b.hours,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Variance',
      key: 'variance',
      render: (_: any, record: { task: TaskType; hours: number }) => {
        const budgeted = record.task?.budgetedHours || 0;
        const variance = budgeted - record.hours;
        const color = variance >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color, fontWeight: 500 }}>{variance.toFixed(2)}</span>;
      },
    },
    {
      title: 'Completion',
      key: 'completion',
      render: (_: any, record: { task: TaskType; hours: number }) => {
        const budgeted = record.task?.budgetedHours || 0;
        if (budgeted === 0) return <Progress percent={0} size="small" />;
        const percentage = Math.min(100, (record.hours / budgeted) * 100);
        const status = percentage > 100 ? 'exception' : 'normal';
        return (
          <Progress
            percent={parseFloat(percentage.toFixed(1))}
            size="small"
            status={status as any}
          />
        );
      },
    },
  ];

  return (
    <div>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px' }}>Loading budget data...</div>
        </div>
      ) : (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Card size={isMobile ? "small" : "default"}>
                <Statistic
                  title="Budgeted Hours"
                  value={budgetedHours}
                  precision={2}
                  suffix="hrs"
                  prefix={<FieldTimeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size={isMobile ? "small" : "default"}>
                <Statistic
                  title="Actual Hours"
                  value={actualHours}
                  precision={2}
                  suffix="hrs"
                  prefix={<FieldTimeOutlined />}
                  valueStyle={{ color: actualHours > budgetedHours ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size={isMobile ? "small" : "default"}>
                <Statistic
                  title="Estimated Cost"
                  value={estimatedCost}
                  formatter={(value) => formatNPR(value as number)}
                  prefix={<DollarOutlined />}
                />
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={showRateModal}
                  style={{ padding: 0, marginTop: 4 }}
                >
                  Adjust Rates
                </Button>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size={isMobile ? "small" : "default"}>
                <Statistic
                  title="Actual Cost"
                  value={actualCost}
                  formatter={(value) => formatNPR(value as number)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: actualCost > estimatedCost ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card 
                title="Budget Progress"
                bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
              >
                <Progress
                  percent={parseFloat(hourProgress.toFixed(1))}
                  status={hourProgress > 100 ? 'exception' : 'normal'}
                  strokeWidth={isMobile ? 12 : 20}
                />
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: isMobile ? '12px' : '14px' }}>
                  {actualHours.toFixed(2)} of {budgetedHours.toFixed(2)} hours used ({hourProgress.toFixed(1)}%)
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card 
                title="User Contributions"
                bodyStyle={{ padding: isMobile ? '8px' : '24px' }}
              >
                <ResponsiveTable
                  dataSource={userContributions as any[]}
                  columns={userColumns}
                  rowKey={(r: any) => `user-${r.user?.id || Math.random()}`}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="Task Details"
                bodyStyle={{ padding: isMobile ? '8px' : '24px' }}
              >
                <ResponsiveTable
                  dataSource={taskContributions as any[]}
                  columns={taskColumns}
                  rowKey={(r: any) => `task-${r.task?.id || Math.random()}`}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Modal for rate adjustment */}
          <Modal
            title="Adjust Hourly Rates"
            open={isRateModalVisible}
            onCancel={() => setIsRateModalVisible(false)}
            footer={[
              <Button key="reset" onClick={resetRates}>
                Reset to Default
              </Button>,
              <Button key="cancel" onClick={() => setIsRateModalVisible(false)}>
                Close
              </Button>
            ]}
          >
            <p className="text-xs text-gray-500 mb-3">
              Adjust hourly rates to see how they affect the project budget. These changes are temporary and will not be saved.
            </p>
            <Table
              dataSource={projectUsers.map((user) => ({
                ...user,
                key: user.id
              }))}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'User',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Role',
                  dataIndex: ['role', 'name'],
                  key: 'role',
                },
                {
                  title: 'Hourly Rate (NPR)',
                  key: 'rate',
                  render: (_, record) => {
                    const userId = record.id?.toString() || '';
                    return (
                      <InputNumber
                        min={0}
                        defaultValue={userRates[userId] || 500}
                        onChange={(value) => handleRateChange(userId, value || 0)}
                        addonAfter="NPR/hr"
                        style={{ width: '100%' }}
                      />
                    );
                  },
                },
              ]}
            />
          </Modal>
        </>
      )}
    </div>
  );
};

export default ProjectBudget;