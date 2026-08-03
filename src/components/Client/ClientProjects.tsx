import React from 'react';
import { Table, Spin, Tag, Progress } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchProjectsByCustomer } from '@/service/clientReport.service';

interface ClientProjectsProps {
  clientId: string;
}

const ClientProjects: React.FC<ClientProjectsProps> = ({ clientId }) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: () => fetchProjectsByCustomer(clientId),
    enabled: !!clientId,
  });

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong style={{ color: '#1e293b' }}>{name}</strong>
    },
    {
      title: 'Nature of Work',
      dataIndex: 'natureOfWork',
      key: 'natureOfWork',
      render: (val: any) => typeof val === 'object' ? val?.name || '-' : val || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'default'}>
          {status?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Payment Status',
      key: 'payment',
      render: (_: any, record: any) => {
        if (record.isPaymentDone) return <Tag color="green">Done</Tag>;
        if (record.isPaymentTemporarilyEnabled) return <Tag color="orange">Temporarily Enabled</Tag>;
        return <Tag color="red">Pending</Tag>;
      }
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: any, record: any) => {
        const total = record.totalTasks || 0;
        const completed = record.completedTasks || 0;
        const percent = record.progress ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
        return <Progress percent={percent} size="small" style={{ maxWidth: 140 }} />;
      }
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={projects || []} 
      rowKey="id" 
      pagination={{ pageSize: 10 }}
    />
  );
};

export default ClientProjects;
