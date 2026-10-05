import React from 'react';
import { Card, Table, Tag, Typography, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getEvaluationsByProject } from '@/service/project-evaluation.service';
import useIsMobile from '@/hooks/useIsMobile';
import { ResponsiveTable } from '@/components/ui/MobileCardList';
import { PowerTable, PowerTableColumn, useColumnVisibility } from '@/components/Table';

const { Text } = Typography;

const EVALUATION_COLUMNS = [
  { key: 'name', label: 'Team Member', required: true },
  { key: 'worklogTime', label: 'Worklog Time' },
  { key: 'behaviour', label: 'Behaviour' },
  { key: 'learning', label: 'Learning' },
  { key: 'communication', label: 'Communication' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'harmony', label: 'Harmony' },
  { key: 'coordination', label: 'Coordination' },
  { key: 'evaluatedBy', label: 'Evaluated By' },
  { key: 'remarks', label: 'Remarks' },
];

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
  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "project_evaluations_table",
    columns: EVALUATION_COLUMNS,
    size: "small",
  });
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['project-evaluations', projectId],
    queryFn: () => getEvaluationsByProject(projectId),
    enabled: !!projectId
  });

  const columns: PowerTableColumn<any>[] = [
    {
      title: 'Team Member',
      dataIndex: ['evaluatedUser', 'name'],
      key: 'name',
      defaultWidth: 180,
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
      defaultWidth: 140,
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Behaviour',
      dataIndex: 'behaviour',
      key: 'behaviour',
      defaultWidth: 140,
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Learning',
      dataIndex: 'learning',
      key: 'learning',
      defaultWidth: 140,
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Communication',
      dataIndex: 'communication',
      key: 'communication',
      defaultWidth: 140,
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Accountability',
      dataIndex: 'accountability',
      key: 'accountability',
      defaultWidth: 140,
      render: (rating: string) => (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      )
    },
    {
      title: 'Harmony',
      dataIndex: 'harmony',
      key: 'harmony',
      defaultWidth: 140,
      render: (rating: string) => rating ? (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      ) : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Coordination',
      dataIndex: 'coordination',
      key: 'coordination',
      defaultWidth: 140,
      render: (rating: string) => rating ? (
        <Tag color={ratingColors[rating]}>{ratingLabels[rating]}</Tag>
      ) : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Evaluated By',
      dataIndex: ['evaluatedBy', 'name'],
      key: 'evaluatedBy',
      defaultWidth: 160
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      defaultWidth: 200,
      render: (remarks: string) => remarks || <Text type="secondary">No remarks</Text>
    }
  ];

  return (
    <Card 
      title="Team Performance Evaluations"
      extra={columnCustomizer}
      bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
    >
      {!evaluations || evaluations.length === 0 ? (
        <Empty description="No evaluations submitted yet" />
      ) : (
        <PowerTable
          columns={columns}
          dataSource={evaluations}
          rowKey="id"
          loading={isLoading}
          enableResize
          enableColumnSearch
          showToolbar={false}
          visibleColumnKeys={visibleColumnKeys}
          persistenceKey="project_evaluations_table"
          pagination={false}
        />
      )}
    </Card>
  );
};

export default EvaluationList;
