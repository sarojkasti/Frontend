import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tag,
  Space,
  Button,
  Typography,
  Row,
  Col,
  Spin,
  Select,
  DatePicker,
  Tooltip,
  Modal,
  message,
  Dropdown,
  Avatar,
  Input,
  Badge,
  Empty,
  Statistic,
} from 'antd';
import {
  UserOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ProjectOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import PageTitle from '@/components/PageTitle';
import { DualDateConverter } from '@/utils/dateConverter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const backendURI = import.meta.env.VITE_BACKEND_URI;

// Enterprise color palette for projects
const PROJECT_PALETTE = [
  '#2563eb', // Royal Blue
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#7c3aed', // Violet
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0891b2', // Cyan
  '#475569', // Slate
  '#b45309', // Warm Bronze
  '#9333ea', // Purple
];

export interface ProjectInfo {
  projectId: string;
  projectName: string;
  assignedDate: string;
  plannedReleaseDate: string | null;
  isActive: boolean;
}

export interface UserAvailability {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isAvailable: boolean;
  busyUntil: string | null;
  currentProjects: ProjectInfo[];
}

export interface UserAvailabilityDashboardProps {
  onBack?: () => void;
  backText?: string;
}

export const UserAvailabilityDashboard: React.FC<UserAvailabilityDashboardProps> = ({
  onBack,
  backText = 'Back to Reports',
}) => {
  const [loading, setLoading] = useState(false);
  const [userAvailability, setUserAvailability] = useState<UserAvailability[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().add(6, 'month').endOf('month'),
  ]);
  const [zoomLevel, setZoomLevel] = useState<number>(7); // Days per column

  // Extension modal state
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<{
    userId: string;
    userName: string;
    projectId: string;
    projectName: string;
    currentDate: string | null;
  } | null>(null);
  const [newPlannedDate, setNewPlannedDate] = useState<Dayjs | null>(null);
  const [extending, setExtending] = useState(false);

  // Helper function to format date with Nepali
  const formatDateWithNepali = (date: Dayjs, format: string = 'MMM DD, YYYY'): string => {
    try {
      const nepaliDate = DualDateConverter.gregorianToNepali(date);
      return `${date.format(format)} (${nepaliDate.format('YYYY-MM-DD', 'np')})`;
    } catch {
      return date.format(format);
    }
  };

  // Helper function to get short Nepali date
  const getShortNepaliDate = (date: Dayjs): string => {
    try {
      const nepaliDate = DualDateConverter.gregorianToNepali(date);
      return nepaliDate.format('YYYY-MM-DD', 'np');
    } catch {
      return '';
    }
  };

  const fetchUserAvailability = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendURI}/projects/availability/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUserAvailability(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch user availability:', error);
      message.error('Failed to load user availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAvailability();
  }, []);

  // Distinct roles for filter
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    userAvailability.forEach((u) => {
      if (u.role && u.role.toLowerCase() !== 'superuser') {
        roles.add(u.role);
      }
    });
    return Array.from(roles).sort();
  }, [userAvailability]);

  // Filter users based on query, status, and role
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return userAvailability.filter((user) => {
      // Exclude superuser
      if (user.role?.toLowerCase() === 'superuser') return false;

      // Status filter
      if (statusFilter === 'available' && !user.isAvailable) return false;
      if (statusFilter === 'busy' && user.isAvailable) return false;

      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      // Search keyword filter (name, email, or assigned projects)
      if (query) {
        const matchesName = user.userName?.toLowerCase().includes(query);
        const matchesEmail = user.userEmail?.toLowerCase().includes(query);
        const matchesProject = user.currentProjects?.some((p) =>
          p.projectName?.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesEmail && !matchesProject) return false;
      }

      return true;
    });
  }, [userAvailability, statusFilter, roleFilter, searchQuery]);

  // Generate date columns based on zoom level
  const dateColumns = useMemo(() => {
    const columns: Dayjs[] = [];
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    const daysCount = endDate.diff(startDate, 'day');
    for (let i = 0; i <= daysCount; i += zoomLevel) {
      columns.push(startDate.add(i, 'day'));
    }
    return columns;
  }, [dateRange, zoomLevel]);

  // Deterministic project colors
  const projectColors = useMemo(() => {
    const colorMap: { [key: string]: string } = {};
    let colorIndex = 0;
    userAvailability.forEach((user) => {
      user.currentProjects?.forEach((project) => {
        if (!colorMap[project.projectId]) {
          colorMap[project.projectId] =
            PROJECT_PALETTE[colorIndex % PROJECT_PALETTE.length];
          colorIndex++;
        }
      });
    });
    return colorMap;
  }, [userAvailability]);

  // Get all active and inactive projects that span across a date range cell
  const getProjectsInRange = (
    user: UserAvailability,
    startDate: Dayjs,
    endDate: Dayjs
  ): { active: ProjectInfo[]; inactive: ProjectInfo[] } => {
    const active: ProjectInfo[] = [];
    const inactive: ProjectInfo[] = [];

    user.currentProjects?.forEach((project) => {
      const assignedDate = dayjs(project.assignedDate);
      const releaseDate = project.plannedReleaseDate
        ? dayjs(project.plannedReleaseDate)
        : dayjs().add(2, 'year');

      // Check if project overlaps with this date range
      if (
        assignedDate.isSameOrBefore(endDate, 'day') &&
        releaseDate.isSameOrAfter(startDate, 'day')
      ) {
        if (project.isActive) {
          active.push(project);
        } else {
          inactive.push(project);
        }
      }
    });

    return { active, inactive };
  };

  // KPIs
  const nonSuperUsers = useMemo(
    () => userAvailability.filter((u) => u.role?.toLowerCase() !== 'superuser'),
    [userAvailability]
  );
  const totalTeamCount = nonSuperUsers.length;
  const availableCount = nonSuperUsers.filter((u) => u.isAvailable).length;
  const busyCount = nonSuperUsers.filter((u) => !u.isAvailable).length;
  const availablePercent =
    totalTeamCount > 0 ? Math.round((availableCount / totalTeamCount) * 100) : 0;
  const busyPercent =
    totalTeamCount > 0 ? Math.round((busyCount / totalTeamCount) * 100) : 0;

  // Distinct active projects
  const distinctActiveProjects = useMemo(() => {
    const set = new Set<string>();
    nonSuperUsers.forEach((u) => {
      u.currentProjects?.forEach((p) => {
        if (p.isActive) set.add(p.projectName);
      });
    });
    return set.size;
  }, [nonSuperUsers]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.max(1, prev <= 3 ? 1 : prev <= 7 ? 3 : prev <= 14 ? 7 : 14));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.min(30, prev >= 14 ? 30 : prev >= 7 ? 14 : prev >= 3 ? 7 : 3));
  };

  const handlePresetDate = (months: number) => {
    setDateRange([dayjs().startOf('month'), dayjs().add(months, 'month').endOf('month')]);
  };

  const handleExtendClick = (user: UserAvailability, project: ProjectInfo) => {
    setSelectedExtension({
      userId: user.userId,
      userName: user.userName,
      projectId: project.projectId,
      projectName: project.projectName,
      currentDate: project.plannedReleaseDate,
    });
    setNewPlannedDate(
      project.plannedReleaseDate
        ? dayjs(project.plannedReleaseDate).add(1, 'month')
        : dayjs().add(1, 'month')
    );
    setExtendModalVisible(true);
  };

  const handleExtendSubmit = async () => {
    if (!selectedExtension || !newPlannedDate) {
      message.error('Please select a new date');
      return;
    }
    setExtending(true);
    try {
      await axios.patch(
        `${backendURI}/projects/${selectedExtension.projectId}/users/${selectedExtension.userId}`,
        {
          plannedReleaseDate: newPlannedDate.format('YYYY-MM-DD'),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      message.success(
        `Extended ${selectedExtension.userName}'s assignment on ${selectedExtension.projectName} to ${newPlannedDate.format('MMM DD, YYYY')}`
      );
      setExtendModalVisible(false);
      setSelectedExtension(null);
      setNewPlannedDate(null);
      fetchUserAvailability();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to extend assignment');
    } finally {
      setExtending(false);
    }
  };

  const handleExtendCancel = () => {
    setExtendModalVisible(false);
    setSelectedExtension(null);
    setNewPlannedDate(null);
  };

  const cellWidth = 115;
  const userRowHeight = 64;

  return (
    <div className="pb-12 px-1 sm:px-0">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              className="flex items-center justify-center font-medium"
            >
              {backText}
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
              Team Availability & Allocation Timeline
            </h1>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Live schedule of member assignments, active deadlines, and capacity forecasting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchUserAvailability}
            loading={loading}
            className="flex items-center"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Modern KPI Summary Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card
            styles={{ body: { padding: '16px' } }}
            className="border border-slate-200/80 shadow-xs rounded-xl bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider m-0">
                  Total Team
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-800">
                    {totalTeamCount}
                  </span>
                  <span className="text-xs text-slate-400">members</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TeamOutlined className="text-lg" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-2">
              Active staff in roster
            </p>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            styles={{ body: { padding: '16px' } }}
            className="border border-emerald-100 shadow-xs rounded-xl bg-white hover:border-emerald-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider m-0">
                  Available Now
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-600">
                    {availableCount}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {availablePercent}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircleOutlined className="text-lg" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-2">
              Ready for immediate allocation
            </p>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            styles={{ body: { padding: '16px' } }}
            className="border border-slate-200/80 shadow-xs rounded-xl bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider m-0">
                  Allocated / Busy
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-indigo-600">
                    {busyCount}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {busyPercent}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ClockCircleOutlined className="text-lg" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-2">
              Assigned to active projects
            </p>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            styles={{ body: { padding: '16px' } }}
            className="border border-slate-200/80 shadow-xs rounded-xl bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider m-0">
                  Active Projects
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-800">
                    {distinctActiveProjects}
                  </span>
                  <span className="text-xs text-slate-400">concurrent</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <ProjectOutlined className="text-lg" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-2">
              Under execution with staff
            </p>
          </Card>
        </Col>
      </Row>

      {/* Main Timeline Card */}
      <Card
        styles={{ body: { padding: '16px 20px' } }}
        className="border border-slate-200/80 shadow-xs rounded-xl bg-white"
      >
        <Spin spinning={loading}>
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <Input
                placeholder="Search member, email, project..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="w-full sm:w-64"
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Available Only', value: 'available' },
                  { label: 'Allocated Only', value: 'busy' },
                ]}
              />

              {availableRoles.length > 0 && (
                <Select
                  value={roleFilter}
                  onChange={setRoleFilter}
                  style={{ width: 140 }}
                  options={[
                    { label: 'All Roles', value: 'all' },
                    ...availableRoles.map((r) => ({ label: r, value: r })),
                  ]}
                />
              )}
            </div>

            {/* Date Range & Zoom Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handlePresetDate(1)}
                  className="px-2 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                >
                  1M
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate(3)}
                  className="px-2 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                >
                  3M
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate(6)}
                  className="px-2 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                >
                  6M
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate(12)}
                  className="px-2 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                >
                  1Y
                </button>
              </div>

              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                format="YYYY-MM-DD"
                className="w-56"
              />

              {/* Granularity & Zoom */}
              <div className="flex items-center gap-1.5 ml-1">
                <Select
                  value={zoomLevel}
                  onChange={setZoomLevel}
                  style={{ width: 105 }}
                  options={[
                    { label: 'Daily (1d)', value: 1 },
                    { label: '3 Days', value: 3 },
                    { label: 'Weekly (7d)', value: 7 },
                    { label: 'Bi-weekly (14d)', value: 14 },
                    { label: 'Monthly (30d)', value: 30 },
                  ]}
                />
                <Tooltip title="Zoom In (More detail)">
                  <Button
                    icon={<ZoomInOutlined />}
                    onClick={handleZoomIn}
                    disabled={zoomLevel <= 1}
                    size="middle"
                  />
                </Tooltip>
                <Tooltip title="Zoom Out (Broader view)">
                  <Button
                    icon={<ZoomOutOutlined />}
                    onClick={handleZoomOut}
                    disabled={zoomLevel >= 30}
                    size="middle"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Timeline Table Container */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Timeline Gantt View
                </span>
                <span className="text-xs text-slate-400">
                  ({filteredUsers.length} members matching criteria)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 italic">
                Scroll horizontally to browse timeline • Click bar to extend assignment
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-4">
                <Empty
                  description={
                    <span className="text-slate-500 text-sm">
                      No team members match the selected filters.
                    </span>
                  }
                >
                  <Button
                    type="primary"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setRoleFilter('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs max-h-[640px]">
                <div className="inline-block min-w-full align-middle">
                  {/* Header Row */}
                  <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    {/* User column header (Sticky Left) */}
                    <div
                      style={{ width: '240px', minWidth: '240px' }}
                      className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 bg-slate-50 sticky left-0 z-30 flex items-center justify-between"
                    >
                      <span>Team Member</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Role & Status
                      </span>
                    </div>

                    {/* Date Column Headers */}
                    {dateColumns.map((date, index) => {
                      const endDate =
                        index < dateColumns.length - 1
                          ? dateColumns[index + 1].subtract(1, 'day')
                          : dateRange[1];
                      const isToday = dayjs().isBetween(date, endDate, 'day', '[]');
                      const nepaliDateStr = getShortNepaliDate(date);

                      return (
                        <div
                          key={index}
                          style={{
                            minWidth: `${cellWidth}px`,
                            width: `${cellWidth}px`,
                          }}
                          className={`p-2 text-center border-r border-slate-200 flex flex-col justify-center transition-colors ${
                            isToday
                              ? 'bg-blue-50/80 border-b-2 border-b-blue-500'
                              : 'bg-slate-50/90'
                          }`}
                        >
                          <div className="text-xs font-semibold text-slate-800">
                            {date.format('MMM DD')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {nepaliDateStr || date.format('YYYY')}
                          </div>
                          {isToday && (
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold text-blue-700 bg-blue-100 rounded-full">
                                TODAY
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Body: User Rows */}
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      style={{ minHeight: `${userRowHeight}px` }}
                      className="flex border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* User Info Column (Sticky Left) */}
                      <div
                        style={{ width: '240px', minWidth: '240px' }}
                        className="p-3 border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 flex items-center gap-2.5 transition-colors"
                      >
                        <Avatar
                          size={34}
                          className="flex-shrink-0 font-semibold"
                          style={{
                            backgroundColor: user.isAvailable ? '#10b981' : '#6366f1',
                            color: '#ffffff',
                          }}
                        >
                          {user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="text-xs font-semibold text-slate-800 truncate"
                              title={user.userName}
                            >
                              {user.userName}
                            </span>
                          </div>

                          <div
                            className="text-[11px] text-slate-400 truncate"
                            title={user.userEmail}
                          >
                            {user.userEmail}
                          </div>

                          <div className="flex items-center gap-1 mt-1">
                            {user.isAvailable ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                Allocated
                              </span>
                            )}

                            {user.role && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 border border-slate-200/60 truncate max-w-[90px]">
                                {user.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Cells for this User */}
                      {dateColumns.map((date, index) => {
                        const endDate =
                          index < dateColumns.length - 1
                            ? dateColumns[index + 1].subtract(1, 'day')
                            : dateRange[1];
                        const { active: activeProjects, inactive: inactiveProjects } =
                          getProjectsInRange(user, date, endDate);
                        const isToday = dayjs().isBetween(date, endDate, 'day', '[]');

                        // Build modern menu items for inactive/released projects
                        const inactiveMenuItems = inactiveProjects.map((p) => {
                          const pStart = dayjs(p.assignedDate);
                          const pEnd = p.plannedReleaseDate
                            ? dayjs(p.plannedReleaseDate)
                            : null;
                          return {
                            key: `inactive-${p.projectId}-${date.format('YYYYMMDD')}`,
                            label: (
                              <div className="py-1">
                                <div className="font-semibold text-slate-800 text-xs">
                                  {p.projectName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Released / Inactive Assignment
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {formatDateWithNepali(pStart, 'MMM DD, YYYY')} -{' '}
                                  {pEnd ? formatDateWithNepali(pEnd, 'MMM DD, YYYY') : 'Project close'}
                                </div>
                              </div>
                            ),
                          };
                        });

                        return (
                          <div
                            key={index}
                            style={{
                              minWidth: `${cellWidth}px`,
                              width: `${cellWidth}px`,
                            }}
                            className={`p-1 border-r border-slate-100 flex flex-col gap-1 justify-center transition-colors ${
                              isToday ? 'bg-blue-50/30' : 'bg-transparent'
                            }`}
                          >
                            {/* Active Projects Bars */}
                            {activeProjects.map((project) => {
                              const projectStart = dayjs(project.assignedDate);
                              const projectEnd = project.plannedReleaseDate
                                ? dayjs(project.plannedReleaseDate)
                                : dayjs().add(2, 'year');

                              const isStart =
                                date.isSame(projectStart, 'day') ||
                                (date.isSameOrBefore(projectStart) &&
                                  endDate.isSameOrAfter(projectStart));
                              const isEnd =
                                endDate.isSame(projectEnd, 'day') ||
                                (date.isSameOrBefore(projectEnd) &&
                                  endDate.isSameOrAfter(projectEnd));

                              const barColor =
                                projectColors[project.projectId] || '#2563eb';

                              return (
                                <Tooltip
                                  key={`active-${project.projectId}`}
                                  title={
                                    <div className="p-1 space-y-1.5 max-w-[260px]">
                                      <div className="font-bold text-white text-sm">
                                        {project.projectName}
                                      </div>
                                      <div className="text-emerald-300 text-xs flex items-center gap-1">
                                        <CheckCircleOutlined /> Active Assignment
                                      </div>
                                      <div className="text-slate-200 text-xs">
                                        From: {formatDateWithNepali(projectStart)}
                                      </div>
                                      <div className="text-slate-200 text-xs">
                                        Until:{' '}
                                        {project.plannedReleaseDate
                                          ? formatDateWithNepali(projectEnd)
                                          : 'Until project deadline'}
                                      </div>
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<ClockCircleOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExtendClick(user, project);
                                        }}
                                        className="w-full mt-2 text-xs h-7"
                                      >
                                        Extend Assignment
                                      </Button>
                                    </div>
                                  }
                                >
                                  <div
                                    onClick={() => handleExtendClick(user, project)}
                                    style={{
                                      backgroundColor: barColor,
                                      borderRadius:
                                        isStart && isEnd
                                          ? '6px'
                                          : isStart
                                          ? '6px 0 0 6px'
                                          : isEnd
                                          ? '0 6px 6px 0'
                                          : '0',
                                    }}
                                    className="w-full h-6 px-1.5 flex items-center cursor-pointer shadow-xs hover:brightness-110 transition-all select-none"
                                  >
                                    {isStart && (
                                      <span className="text-[11px] font-semibold text-white truncate drop-shadow-xs">
                                        {project.projectName}
                                      </span>
                                    )}
                                  </div>
                                </Tooltip>
                              );
                            })}

                            {/* Inactive Projects Dropdown */}
                            {inactiveProjects.length > 0 && (
                              <Dropdown
                                menu={{ items: inactiveMenuItems }}
                                trigger={['click']}
                                placement="bottomLeft"
                              >
                                <button
                                  type="button"
                                  className="w-full h-5 px-1 text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                  <span>+{inactiveProjects.length} released</span>
                                  <DownOutlined className="text-[8px] text-slate-400" />
                                </button>
                              </Dropdown>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Legend */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <ProjectOutlined className="text-slate-400 text-sm" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Projects Legend
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(projectColors).map(([projectId, color]) => {
                let projectName = projectId;
                let hasActive = false;
                userAvailability.forEach((u) => {
                  const p = u.currentProjects?.find(
                    (cp) => cp.projectId === projectId && cp.isActive
                  );
                  if (p) {
                    projectName = p.projectName;
                    hasActive = true;
                  }
                });

                if (!hasActive) return null;

                return (
                  <div
                    key={projectId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{projectName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Spin>
      </Card>

      {/* Extend Assignment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <ClockCircleOutlined className="text-blue-600" />
            <span>Extend Assignment Schedule</span>
          </div>
        }
        open={extendModalVisible}
        onOk={handleExtendSubmit}
        onCancel={handleExtendCancel}
        confirmLoading={extending}
        okText="Save Extension"
        cancelText="Cancel"
        styles={{ body: { padding: '20px 0' } }}
        width={480}
      >
        {selectedExtension && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Team Member:</span>
                <span className="font-semibold text-slate-800">
                  {selectedExtension.userName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Project:</span>
                <span className="font-semibold text-slate-800">
                  {selectedExtension.projectName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Current Planned Release:</span>
                <span className="font-semibold text-slate-800">
                  {selectedExtension.currentDate
                    ? formatDateWithNepali(dayjs(selectedExtension.currentDate))
                    : 'Not specified'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Planned Release Date (AD)
              </label>
              <DatePicker
                value={newPlannedDate}
                onChange={(date) => setNewPlannedDate(date)}
                format="YYYY-MM-DD"
                className="w-full"
                disabledDate={(current) => {
                  if (selectedExtension.currentDate) {
                    return current && current.isBefore(dayjs(selectedExtension.currentDate), 'day');
                  }
                  return current && current.isBefore(dayjs(), 'day');
                }}
              />

              {newPlannedDate && (
                <div className="mt-2 p-2.5 rounded bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div>
                    <span className="font-medium">Nepali Date (BS):</span>{' '}
                    {getShortNepaliDate(newPlannedDate)}
                  </div>
                  {selectedExtension.currentDate && (
                    <div>
                      <span className="font-medium">Extension Duration:</span>{' '}
                      {dayjs(newPlannedDate).diff(dayjs(selectedExtension.currentDate), 'day')}{' '}
                      additional days
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserAvailabilityDashboard;
