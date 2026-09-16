import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Segmented,
  DatePicker,
  List,
  Badge,
  Space,
  Tag,
  Empty,
  Spin,
  Progress,
  Tabs
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  FireOutlined,
  TrophyOutlined,
  WarningOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useDashboardWorkingTime } from '../../hooks/dashboard/useDashboardWorkingTime';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import type { Dayjs } from 'dayjs';

// Extend dayjs with required plugins
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

const { Title, Text } = Typography;

// Helper function to format minutes to hours and minutes
const formatMinutesToHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Helper function to get color based on performance
const getPerformanceColor = (actual: number, expected: number): string => {
  const percentage = (actual / expected) * 100;
  if (percentage >= 100) return '#52c41a';
  if (percentage >= 80) return '#faad14';
  return '#ff4d4f';
};

const WorkingTimeDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [showDetails, setShowDetails] = useState<{
    visible: boolean;
    type: string;
    users: any[];
  }>({
    visible: false,
    type: '',
    users: []
  });

  const { data, isLoading, error, isError } = useDashboardWorkingTime(selectedDate, period);

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date.format('YYYY-MM-DD'));
    }
  };

  const handlePeriodChange = (value: string | number) => {
    setPeriod(value as 'day' | 'week' | 'month');
  };

  const toggleDetails = (type: string, users: any[]) => {
    setShowDetails(prev => ({
      visible: !prev.visible || prev.type !== type,
      type,
      users
    }));
  };

  // Error state
  if (isError) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Empty 
          description={
            <div>
              <Text type="danger">Failed to load working time data</Text>
              <br />
              <Text type="secondary">{error?.message || 'Unknown error'}</Text>
            </div>
          } 
        />
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading working time data...</Text>
          </div>
        </div>
      </Card>
    );
  }

  // No data state
  if (!data) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Empty description="No working time data available" />
      </Card>
    );
  }

  const { summary, usersWithoutWorklog, usersWithOvertime, usersWorklogExceedsAttendance, topPerformers, underPerformers } = data;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Add hover styles */}
      <style>{`
        .ant-list-item:hover .hover-visible {
          opacity: 1 !important;
          max-height: 100px !important;
        }
        .ant-list-item:hover {
          background-color: #fafafa;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ClockCircleOutlined /> Working Time Analytics
        </Title>
        <Space size="large">
          <Segmented
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' }
            ]}
            value={period}
            onChange={handlePeriodChange}
          />
          <Space>
            <CalendarOutlined style={{ fontSize: 16 }} />
            {period === 'day' && (
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                allowClear={false}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                style={{ width: 200 }}
              />
            )}
            {period === 'week' && (
              <DatePicker
                picker="week"
                value={dayjs(selectedDate)}
                onChange={handleDateChange}
                format="YYYY-[W]WW"
                allowClear={false}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                style={{ width: 200 }}
              />
            )}
            {period === 'month' && (
              <DatePicker
                picker="month"
                value={dayjs(selectedDate)}
                onChange={handleDateChange}
                format="YYYY-MM"
                allowClear={false}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                style={{ width: 200 }}
              />
            )}
          </Space>
        </Space>
      </div>

      {/* Period Info */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
        <Text type="secondary">
          <strong>Period:</strong> {summary.startDate} to {summary.endDate} ({summary.totalDays} {summary.totalDays === 1 ? 'day' : 'days'})
        </Text>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable onClick={() => toggleDetails('all', data.userStats)}>
            <Statistic
              title={<Text type="secondary">Total Users</Text>}
              value={summary.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Click to view all users</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card hoverable onClick={() => toggleDetails('worklog', usersWithoutWorklog)}>
            <Statistic
              title={<Text type="secondary">With Worklog</Text>}
              value={summary.usersWithWorklog}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
              suffix={<Text type="secondary" style={{ fontSize: 16 }}>/ {summary.totalUsers}</Text>}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.usersWithoutWorklog} without worklog
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card hoverable onClick={() => toggleDetails('overtime', usersWithOvertime)}>
            <Statistic
              title={<Text type="secondary">Overtime Users</Text>}
              value={summary.usersWithOvertime}
              prefix={<FireOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Users exceeding work hours
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card hoverable onClick={() => toggleDetails('exceeds', usersWorklogExceedsAttendance)}>
            <Statistic
              title={<Text type="secondary">Exceeds Attendance</Text>}
              value={summary.usersWorklogExceedsAttendance}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Worklog {'>'} Attendance time
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Details Section (Toggleable) */}
      {showDetails.visible && (
        <Card
          style={{
            marginBottom: 24,
            borderLeft: '4px solid #1890ff',
            backgroundColor: '#f0f5ff'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>
                {showDetails.type === 'all' && 'All Users'}
                {showDetails.type === 'worklog' && 'Users Without Worklog'}
                {showDetails.type === 'overtime' && 'Users with Overtime'}
                {showDetails.type === 'exceeds' && 'Worklog Exceeds Attendance'}
              </Text>
              <Badge count={showDetails.users.length} style={{ backgroundColor: '#1890ff' }} />
            </div>
          }
        >
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <List
              size="small"
              dataSource={showDetails.users.sort((a, b) => b.totalWorklogMinutes - a.totalWorklogMinutes)}
              renderItem={(user: any) => {
                const worklogHours = user.totalWorklogMinutes / 60;
                const attendanceHours = user.totalAttendanceMinutes / 60;
                const expectedHours = user.expectedDailyHours * summary.totalDays;
                const maxHours = Math.max(worklogHours, attendanceHours, expectedHours);
                const worklogPercent = maxHours > 0 ? (worklogHours / maxHours) * 100 : 0;
                const attendancePercent = maxHours > 0 ? (attendanceHours / maxHours) * 100 : 0;

                return (
                  <List.Item 
                    style={{ 
                      padding: '6px 0',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      {/* User Header - Always Visible */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: 4
                        }}
                        title={`${user.email} - ${user.roleName}`}
                      >
                        <Space size="small">
                          <UserOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                          <Text strong style={{ fontSize: 12 }}>{user.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          Expected: {user.expectedDailyHours * summary.totalDays}h
                        </Text>
                      </div>

                      {/* Stacked Progress Bars - Compact */}
                      <div style={{ marginBottom: 2 }}>
                        {/* Worklog Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                          <div style={{ width: 50, flexShrink: 0 }}>
                            <Text type="secondary" style={{ fontSize: 9 }}>
                              <ClockCircleOutlined style={{ fontSize: 9 }} /> Work
                            </Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Progress
                              percent={worklogPercent}
                              size="small"
                              strokeColor="#1890ff"
                              strokeWidth={4}
                              showInfo={false}
                            />
                          </div>
                          <Text strong style={{ fontSize: 9, color: '#1890ff', width: 35, textAlign: 'right' }}>
                            {formatMinutesToHours(user.totalWorklogMinutes)}
                          </Text>
                        </div>

                        {/* Attendance Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 50, flexShrink: 0 }}>
                            <Text type="secondary" style={{ fontSize: 9 }}>
                              <CheckCircleOutlined style={{ fontSize: 9 }} /> Attend
                            </Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Progress
                              percent={attendancePercent}
                              size="small"
                              strokeColor="#52c41a"
                              strokeWidth={4}
                              showInfo={false}
                            />
                          </div>
                          <Text strong style={{ fontSize: 9, color: '#52c41a', width: 35, textAlign: 'right' }}>
                            {formatMinutesToHours(user.totalAttendanceMinutes)}
                          </Text>
                        </div>
                      </div>

                      {/* Details - visible on hover */}
                      <div 
                        className="hover-visible" 
                        style={{ 
                          marginTop: 4,
                          opacity: 0,
                          maxHeight: 0,
                          overflow: 'hidden',
                          transition: 'opacity 0.3s, max-height 0.3s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px dashed #e0e0e0' }}>
                          <Space size={4} split={<Text type="secondary" style={{ fontSize: 9 }}>·</Text>}>
                            <Tag color="blue" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                              {user.roleName}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 9 }}>
                              {user.daysWithWorklog}/{summary.totalDays} days
                            </Text>
                            <Text 
                              style={{ 
                                fontSize: 9,
                                fontWeight: 500,
                                color: user.totalWorklogMinutes > user.totalAttendanceMinutes ? '#faad14' : '#722ed1' 
                              }}
                            >
                              Δ {((user.totalWorklogMinutes - user.totalAttendanceMinutes) / 60).toFixed(1)}h
                            </Text>
                          </Space>
                          <Space size={4}>
                            {user.overtimeDays > 0 && (
                              <Tag color="orange" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                                <FireOutlined style={{ fontSize: 9 }} /> {user.overtimeDays}
                              </Tag>
                            )}
                            {user.worklogExceedsAttendanceDays > 0 && (
                              <Tag color="red" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>
                                <WarningOutlined style={{ fontSize: 9 }} /> {user.worklogExceedsAttendanceDays}
                              </Tag>
                            )}
                          </Space>
                        </div>
                        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 2 }}>
                          {user.email}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>
      )}

      {/* Performance Tabs */}
      {/* Performance Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="top"
          items={[
            {
              key: "top",
              label: (
                <span>
                  <TrophyOutlined /> Top Performers
                </span>
              ),
              children: (
                <List
                  size="small"
                  dataSource={topPerformers}
                  renderItem={(user: any, index: number) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Badge
                            count={index + 1}
                            style={{
                              backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#d9d9d9' : index === 2 ? '#cd7f32' : '#1890ff'
                            }}
                          />
                          <Text strong>{user.name}</Text>
                          <Tag color="blue">{user.roleName}</Tag>
                        </Space>
                        <Space>
                          <RiseOutlined style={{ color: '#52c41a' }} />
                          <Text strong style={{ color: '#52c41a' }}>
                            {formatMinutesToHours(user.totalWorklogMinutes)}
                          </Text>
                          <Text type="secondary">
                            ({user.daysWithWorklog} days)
                          </Text>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No data available' }}
                />
              ),
            },
            {
              key: "under",
              label: (
                <span>
                  <FallOutlined /> Under Performers
                </span>
              ),
              children: (
                <List
                  size="small"
                  dataSource={underPerformers}
                  renderItem={(user: any) => {
                    const worklogHours = user.totalWorklogMinutes / 60;
                    const expectedHours = user.expectedDailyHours * summary.totalDays;
                    const percentage = expectedHours > 0 ? (worklogHours / expectedHours) * 100 : 0;

                    return (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Space>
                              <UserOutlined />
                              <Text strong>{user.name}</Text>
                              <Tag color="blue">{user.roleName}</Tag>
                            </Space>
                            <Space>
                              <Text type="danger">
                                {formatMinutesToHours(user.totalWorklogMinutes)} / {expectedHours}h
                              </Text>
                              <Tag color="red">{Math.round(percentage)}%</Tag>
                            </Space>
                          </Space>
                          <Progress
                            percent={Math.round(percentage)}
                            size="small"
                            status={percentage < 50 ? 'exception' : 'normal'}
                            strokeColor={getPerformanceColor(worklogHours, expectedHours)}
                          />
                        </div>
                      </List.Item>
                    );
                  }}
                  locale={{ emptyText: 'No under performers - great job!' }}
                />
              ),
            },
            {
              key: "overtime",
              label: (
                <span>
                  <FireOutlined /> Overtime Users
                </span>
              ),
              children: (
                <List
                  size="small"
                  dataSource={usersWithOvertime}
                  renderItem={(user: any) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <UserOutlined />
                          <Text strong>{user.name}</Text>
                          <Tag color="blue">{user.roleName}</Tag>
                        </Space>
                        <Space>
                          <FireOutlined style={{ color: '#faad14' }} />
                          <Text strong style={{ color: '#faad14' }}>
                            {user.overtimeDays} {user.overtimeDays === 1 ? 'day' : 'days'}
                          </Text>
                          <Text type="secondary">
                            ({formatMinutesToHours(user.totalWorklogMinutes)} total)
                          </Text>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No overtime recorded' }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default WorkingTimeDashboard;
