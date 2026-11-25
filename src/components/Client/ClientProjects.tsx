import React, { useState, useMemo } from 'react';
import {
  Table,
  Spin,
  Tag,
  Progress,
  Button,
  Input,
  Empty,
  Typography,
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  message
} from 'antd';
import {
  ProjectOutlined,
  PlusOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProjectsByCustomer } from '@/service/clientReport.service';
import {
  fetchClientRecurringProjects,
  createRecurringProject,
  updateRecurringProject,
  deleteRecurringProject,
  triggerRecurringProject,
} from '@/service/client.service';
import { fetchNatureOfWorks } from '@/service/natureOfWork.service';
import { listActiveUsers } from '@/service/user.service';
import { useWorkingYears } from '@/hooks/workingYear/useWorkingYear';
import { useWorkingYearContext } from '@/context/WorkingYearContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ClientProjectsProps {
  clientId: string;
  clientName?: string;
}

const FREQUENCY_LABELS: Record<string, { label: string; color: string }> = {
  monthly: { label: 'Monthly', color: 'blue' },
  quarterly: { label: 'Quarterly', color: 'purple' },
  semi_annual: { label: 'Semi-Annual', color: 'cyan' },
  yearly: { label: 'Yearly', color: 'green' },
};

const ClientProjects: React.FC<ClientProjectsProps> = ({ clientId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { selectedWorkingYearId } = useWorkingYearContext();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: () => fetchProjectsByCustomer(clientId),
    enabled: !!clientId,
  });

  const { data: recurringList = [], isLoading: loadingRecurring } = useQuery({
    queryKey: ['client-recurring-projects', clientId],
    queryFn: () => fetchClientRecurringProjects(clientId),
    enabled: !!clientId,
  });

  const { data: natureOfWorks = [] } = useQuery({
    queryKey: ['nature-of-works-dropdown'],
    queryFn: fetchNatureOfWorks,
    staleTime: 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['active-users-dropdown'],
    queryFn: listActiveUsers,
    staleTime: 60 * 1000,
  });

  const { data: workingYears = [] } = useWorkingYears();

  const userOptions = useMemo(() => {
    const rawList = Array.isArray(usersData)
      ? usersData
      : Array.isArray((usersData as any)?.results)
      ? (usersData as any).results
      : Array.isArray((usersData as any)?.users)
      ? (usersData as any).users
      : [];
    return rawList.map((u: any) => ({
      label: u.name || u.username || u.email,
      value: u.id,
    }));
  }, [usersData]);

  const natureOptions = useMemo(() => {
    if (!Array.isArray(natureOfWorks)) return [];
    return natureOfWorks.map((n: any) => ({
      label: `${n.name}${n.shortName ? ` (${n.shortName})` : ''}`,
      value: n.id,
    }));
  }, [natureOfWorks]);

  const createRecurringMutation = useMutation({
    mutationFn: (payload: any) => createRecurringProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-recurring-projects', clientId] });
      message.success('Recurring project schedule created');
      setRecurringModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error('Failed to create recurring schedule'),
  });

  const toggleRecurringMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateRecurringProject(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-recurring-projects', clientId] });
      message.success('Schedule updated');
    },
    onError: () => message.error('Failed to update schedule'),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-recurring-projects', clientId] });
      message.success('Recurring schedule deleted');
    },
    onError: () => message.error('Failed to delete schedule'),
  });

  const triggerMutation = useMutation({
    mutationFn: (id: string) => triggerRecurringProject(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['client-recurring-projects', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-projects', clientId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success(`Project "${res?.project?.name || 'New Project'}" added to project pool`);
    },
    onError: () => message.error('Failed to generate project'),
  });

  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter((p: any) => {
      const name = p.name?.toLowerCase() || '';
      const nature =
        typeof p.natureOfWork === 'object'
          ? p.natureOfWork?.name?.toLowerCase() || ''
          : String(p.natureOfWork || '').toLowerCase();
      const lead = p.projectLead?.name?.toLowerCase() || '';
      return name.includes(term) || nature.includes(term) || lead.includes(term);
    });
  }, [projects, searchTerm]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'active':
        return 'processing';
      case 'completed':
        return 'success';
      case 'paused':
      case 'on_hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Project Name & Fiscal Year',
      key: 'name',
      render: (_: any, record: any) => {
        const fy = record.workingYear?.name || record.workingYear?.year || record.fiscalYear;
        return (
          <div className="py-1">
            <Link
              to={`/project/detail/${record.id}`}
              className="font-semibold text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1.5"
            >
              <ProjectOutlined className="text-slate-400" />
              <span>{record.name}</span>
            </Link>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              {fy && (
                <Tag color="cyan" className="m-0 text-[11px] px-1.5 py-0 leading-tight">
                  <CalendarOutlined className="mr-1" />
                  FY {fy}
                </Tag>
              )}
              {record.projectLead?.name && (
                <span className="flex items-center gap-1 text-slate-500">
                  <UserOutlined className="text-[10px]" /> {record.projectLead.name}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Nature of Work',
      key: 'natureOfWork',
      render: (_: any, record: any) => {
        const name =
          typeof record.natureOfWork === 'object'
            ? record.natureOfWork?.name
            : record.natureOfWork;
        return name ? <Tag color="purple">{name}</Tag> : '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="capitalize font-medium">
          {status || 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Task Progress',
      key: 'progress',
      width: 200,
      render: (_: any, record: any) => {
        const total = record.totalTasks || record.tasks?.length || 0;
        const completed =
          record.completedTasks ||
          (record.tasks ? record.tasks.filter((t: any) => t.status === 'done').length : 0);
        const percent =
          total > 0 ? Math.round((completed / total) * 100) : record.status === 'completed' ? 100 : 0;

        return (
          <div className="w-full max-w-[160px]">
            <Progress
              percent={percent}
              size="small"
              status={percent === 100 ? 'success' : 'active'}
            />
            {total > 0 && (
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <CheckCircleOutlined className="text-green-500" />
                {completed} of {total} tasks done
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/project/detail/${record.id}`)}
          className="font-medium text-blue-600"
        >
          View Project
        </Button>
      ),
    },
  ];

  const recurringColumns = [
    {
      title: 'Schedule Pattern',
      key: 'namePattern',
      render: (_: any, rec: any) => (
        <div>
          <div className="font-semibold text-gray-800 text-xs sm:text-sm">{rec.namePattern}</div>
          {rec.natureOfWork?.name && (
            <div className="text-xs text-gray-500">{rec.natureOfWork.name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (f: string) => {
        const meta = FREQUENCY_LABELS[f] || { label: f, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRunDate',
      key: 'nextRunDate',
      render: (d: string) => (d ? dayjs(d).format('MMM DD, YYYY') : '-'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean, rec: any) => (
        <Switch
          size="small"
          checked={active}
          onChange={(checked) =>
            toggleRecurringMutation.mutate({ id: rec.id, isActive: checked })
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, rec: any) => (
        <Space size="small">
          <Tooltip title="Generate project into active pool now">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<PlayCircleOutlined />}
              loading={triggerMutation.isPending}
              onClick={() => triggerMutation.mutate(rec.id)}
            >
              Run Now
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete recurring schedule?"
            onConfirm={() => deleteRecurringMutation.mutate(rec.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search projects by name, lead, or nature..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 320 }}
            size="middle"
          />
          <Text type="secondary" className="text-xs">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </Text>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1 py-2">
              <div className="text-slate-600 font-medium">No projects found for this client</div>
              <div className="text-slate-400 text-xs">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Start by creating the first engagement or project for this client.'}
              </div>
            </div>
          }
        >
          {!searchTerm && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/projects/new?client=${clientId}`)}
            >
              Create Project
            </Button>
          )}
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          pagination={{ pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
          size="middle"
          className="border border-slate-200/80 rounded-lg overflow-hidden"
        />
      )}

      {/* Recurring Project Schedules */}
      <Card
        size="small"
        className="border-slate-200"
        title={
          <div className="flex items-center justify-between">
            <Space className="text-xs sm:text-sm font-semibold text-gray-800">
              <SyncOutlined className="text-blue-600" />
              <span>Recurring Project Schedules ({Array.isArray(recurringList) ? recurringList.length : 0})</span>
            </Space>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({
                  frequency: 'monthly',
                  nextRunDate: dayjs(),
                  durationDays: 30,
                  workingYearId: selectedWorkingYearId || undefined,
                });
                setRecurringModalOpen(true);
              }}
            >
              Setup Recurring Project
            </Button>
          </div>
        }
      >
        {!Array.isArray(recurringList) || recurringList.length === 0 ? (
          <div className="text-xs text-gray-400 py-3 text-center">
            No recurring project schedules configured. Set up Monthly, Quarterly, or Yearly schedules to automatically add engagements to the active project pool.
          </div>
        ) : (
          <Table
            loading={loadingRecurring}
            columns={recurringColumns}
            dataSource={recurringList}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>

      {/* Setup Recurring Project Modal */}
      <Modal
        open={recurringModalOpen}
        title="Setup Recurring Project"
        onCancel={() => setRecurringModalOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            createRecurringMutation.mutate({
              ...values,
              customerId: clientId,
              nextRunDate: values.nextRunDate.format('YYYY-MM-DD'),
              isActive: true,
            });
          });
        }}
        confirmLoading={createRecurringMutation.isPending}
        okText="Save Schedule"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="pt-2">
          <Form.Item
            name="namePattern"
            label="Project Name Pattern"
            extra="Supports {SHORT_NAME}, {PERIOD}, {MONTH}, {YEAR} placeholders"
            rules={[{ required: true, message: 'Please enter a name pattern' }]}
          >
            <Input placeholder="e.g. {SHORT_NAME}-VAT-{PERIOD}" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="natureOfWorkId"
              label="Nature of Work"
              rules={[{ required: true, message: 'Please select nature of work' }]}
            >
              <Select
                placeholder="Select nature of work"
                options={natureOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              name="frequency"
              label="Recurrence Frequency"
              rules={[{ required: true, message: 'Select frequency' }]}
            >
              <Select
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'semi_annual', label: 'Semi-Annual' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="nextRunDate"
              label="Next Run Date"
              rules={[{ required: true, message: 'Select next run date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="durationDays" label="Project Duration (Days)">
              <InputNumber min={1} max={366} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="projectLeadId" label="Project Lead">
              <Select
                placeholder="Select lead"
                options={userOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item name="projectManagerId" label="Project Manager">
              <Select
                placeholder="Select manager"
                options={userOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>

          <Form.Item name="userIds" label="Assigned Team Members">
            <Select
              mode="multiple"
              placeholder="Select team members"
              options={userOptions}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="workingYearId" label="Working Year">
            <Select
              placeholder="Select working year"
              allowClear
              options={(Array.isArray(workingYears) ? workingYears : []).map((wy: any) => ({
                label: wy.name || wy.year,
                value: wy.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Scope or recurring engagement notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientProjects;
