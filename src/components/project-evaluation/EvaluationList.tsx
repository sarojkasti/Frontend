import React from 'react';
import { Card, Table, Tag, Typography, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getEvaluationsByProject } from '@/service/project-evaluation.service';
import useIsMobile from '@/hooks/useIsMobile';
import { ResponsiveTable } from '@/components/ui/MobileCardList';

const { Text } = Typography;

interface EvaluationListProps {
  projectId: string;
}

const ratingColors: Record<string, string> = {
  very_good: '#52c41a',
  good: '#95de64',
  neutral: '#faad14',
  poor: '#ff7a45',
  bad: '#ff4d4f',
};

const ratingLabels: Record<string, string> = {
  very_good: 'Very Good',
  good: 'Good',
  neutral: 'Neutral',
  poor: 'Poor',
  bad: 'Bad',
};

const EvaluationList: React.FC<EvaluationListProps> = ({ projectId }) => {
  const { isMobile } = useIsMobile();
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['project-evaluations', projectId],
    queryFn: () => getEvaluationsByProject(projectId),
    enabled: !!projectId
  });

  const columns = [
    {
      title: 'Team Member',
      dataIndex: ['evaluatedUser', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name}</Text>
          {record.isTeamLead && (
            <Tag color="blue" style={{ marginLeft: 8 }}>Team Lead</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Worklog Time',
      dataIndex: 'worklogTime',
      key: 'worklogTime',
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Behaviour',
      dataIndex: 'behaviour',
      key: 'behaviour',
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Learning',
      dataIndex: 'learning',
      key: 'learning',
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Communication',
      dataIndex: 'communication',
      key: 'communication',
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Accountability',
      dataIndex: 'accountability',
      key: 'accountability',
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Harmony',
      dataIndex: 'harmony',
      key: 'harmony',
      render: (rating: string) => rating ? (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      ) : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Coordination',
      dataIndex: 'coordination',
      key: 'coordination',
      render: (rating: string) => rating ? (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      ) : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Evaluated By',
      dataIndex: ['evaluatedBy', 'name'],
      key: 'evaluatedBy'
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      render: (remarks: string) => remarks || <Text type="secondary">No remarks</Text>
    }
  ];

  return (
    <Card 
      title="Team Performance Evaluations"
      bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
    >
      {!evaluations || evaluations.length === 0 ? (
        <Empty description="No evaluations submitted yet" />
      ) : (
        <ResponsiveTable
          columns={columns}
          dataSource={evaluations}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={isMobile ? undefined : { x: 1500 }}
        />
      )}
    </Card>
  );
};

export default EvaluationList;
