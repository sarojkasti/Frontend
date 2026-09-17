import React from 'react';
import { useProjectTaskDetail } from '@/hooks/task/useProjectTaskDetail';
import { Card, Col, Divider, Row, Tabs, Typography, Button, Spin, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Worklog from '../Worklog';
import TaskDetail from '@/components/Task/TaskDetail';
import useIsMobile from '@/hooks/useIsMobile';

const { Title, Text } = Typography;

const TaskDetails: React.FC = () => {
  const { pid, tid } = useParams<{ pid?: string; tid?: string }>();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { data: task, isPending } = useProjectTaskDetail({ pid, tid });

  const handleBack = () => {
    if (pid) {
      navigate(`/projects/${pid}/tasks`);
    } else {
      navigate(-1);
    }
  };

  if (isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '0 2px 24px 2px' : '0 4px 24px 4px' }}>
      {/* Top Header Row with Back Button */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Button
          type="text"
          shape="circle"
          icon={<ArrowLeftOutlined style={{ fontSize: isMobile ? 18 : 20 }} />}
          onClick={handleBack}
          className="flex items-center justify-center -ml-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 shrink-0"
          title="Go Back to Tasks"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#0f172a' }}>
              {task?.name || 'Task Details'}
            </Title>
            {task?.tcode && <Tag color="blue">{task.tcode}</Tag>}
            {task?.status && <Tag color="geekblue">{task.status}</Tag>}
          </div>
          {task?.project?.name && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Project: <span className="font-semibold text-slate-700">{task.project.name}</span>
            </Text>
          )}
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: 'Task Details',
                  key: '1',
                  children: <TaskDetail data={task} />,
                },
                {
                  label: 'Sub Tasks',
                  key: '2',
                  children: <div className="p-4 text-gray-500">No sub-tasks available.</div>,
                },
                {
                  label: 'Worklogs',
                  key: '3',
                  children: <Worklog />,
                },
                {
                  label: 'History',
                  key: '4',
                  children: <div className="p-4 text-gray-500">No history records found.</div>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Task Information" className="shadow-sm border-slate-200 rounded-xl">
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Task ID</Text></Col>
              <Col flex="auto"><Text strong>{task?.tcode || '-'}</Text></Col>
            </Row>
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Status</Text></Col>
              <Col flex="auto">
                {task?.status ? <Tag color="blue">{task.status}</Tag> : '-'}
              </Col>
            </Row>
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Priority</Text></Col>
              <Col flex="auto">
                {task?.priority ? (
                  <Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'default'}>
                    {task.priority}
                  </Tag>
                ) : '-'}
              </Col>
            </Row>
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Task Group</Text></Col>
              <Col flex="auto"><Text>{task?.group?.name || '-'}</Text></Col>
            </Row>
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Task Type</Text></Col>
              <Col flex="auto"><Text>{task?.taskType || '-'}</Text></Col>
            </Row>
            <Row gutter={16} className="py-2 border-b border-gray-100 last:border-b-0">
              <Col flex="110px"><Text type="secondary">Due Date</Text></Col>
              <Col flex="auto"><Text>{(task as any)?.dueDate || '-'}</Text></Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16} className="py-2">
              <Col span={24}><Text type="secondary">Associated Project</Text></Col>
              <Col span={24} className="mt-1">
                <Text strong className="text-blue-600">{task?.project?.name || '-'}</Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaskDetails;