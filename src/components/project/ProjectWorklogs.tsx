import WorklogTable from "@/components/Worklog/WorklogTable";
import { useSession } from "@/context/SessionContext";
import { useProjectWorklogs } from "@/hooks/worklog/useProjectWorklogs";
import { useProjectById } from "@/hooks/project/useProjectById";
import { Card, Empty, Spin, Typography, Row, Col, Statistic, Button } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { parseTimeMoment } from "@/utils/formatUtils";
import { useState, useEffect } from "react";

const { Title, Paragraph } = Typography;

interface ProjectWorklogsProps {
  projectId?: string;
  showHeader?: boolean;
  wrapInCard?: boolean;
}

const ProjectWorklogs = ({ projectId, showHeader = false, wrapInCard = true }: ProjectWorklogsProps) => {
  const { id: routeProjectId } = useParams();
  const { profile } = useSession();
  const navigate = useNavigate();
  const resolvedProjectId = projectId || routeProjectId;
  const profilePermissions = (profile as any)?.role?.permission;
  const canViewProjectWorklogs = Array.isArray(profilePermissions) && profilePermissions.some(
    (perm: any) => perm.path === '/projects/:id/worklogs' && perm.method?.toLowerCase?.() === 'get'
  );

  const { data: worklogs, isPending } = useProjectWorklogs(resolvedProjectId);
  const { data: project } = useProjectById(resolvedProjectId || "");
  const [stats, setStats] = useState<any>({
    totalHours: 0,
    monthlyHours: 0,
    dailyHours: 0,
    userStats: {}
  });

  // Calculate statistics
  const calculateStats = () => {
    if (!Array.isArray(worklogs) || worklogs.length === 0) {
      return {
        totalHours: 0,
        monthlyHours: 0,
        dailyStats: {},
        userStats: {}
      };
    }

    const now = moment();
    const currentMonth = now.format('YYYY-MM');
    const currentDate = now.format('YYYY-MM-DD');

    let totalHours = 0;
    let monthlyHours = 0;
    const dailyStats: { [key: string]: number } = {};
    const userStats: { [key: string]: { name: string; hours: number } } = {};

    worklogs.forEach((log: any) => {
      const baseDate = log.date || (log.createdAt ? moment(log.createdAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'));
      const startTime = parseTimeMoment(log.startTime, baseDate) || (log.date ? moment(log.date) : moment(log.createdAt || undefined));
      const endTime = parseTimeMoment(log.endTime, baseDate) || startTime;
      const hours = (startTime.isValid() && endTime.isValid()) ? Math.max(0, endTime.diff(startTime, 'hours', true)) : (log.durationMinutes ? log.durationMinutes / 60 : 0);

      // Total hours
      totalHours += hours;

      // Monthly hours
      if (startTime.format('YYYY-MM') === currentMonth) {
        monthlyHours += hours;
      }

      // Daily stats
      const dateKey = startTime.format('YYYY-MM-DD');
      dailyStats[dateKey] = (dailyStats[dateKey] || 0) + hours;

      // User stats
      const userId = log.userId?.toString?.() || 'unknown';
      const userName = log.user?.name || 'Unknown';
      if (!userStats[userId]) {
        userStats[userId] = { name: userName, hours: 0 };
      }
      userStats[userId].hours += hours;
    });

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      monthlyHours: Math.round(monthlyHours * 100) / 100,
      dailyHours: dailyStats[currentDate] ? Math.round(dailyStats[currentDate] * 100) / 100 : 0,
      userStats
    };
  };

  // Recalculate stats whenever worklogs change
  useEffect(() => {
    setStats(calculateStats());
  }, [worklogs]);

  if (!canViewProjectWorklogs) {
    const deniedContent = (
      <div className="text-center py-8">
        <Title level={4}>Permission Denied</Title>
        <Paragraph>You do not have permission to view project worklogs.</Paragraph>
      </div>
    );

    return wrapInCard ? (
      <Card>
        {deniedContent}
      </Card>
    ) : (
      deniedContent
    );
  }

  if (!resolvedProjectId) {
    const missingProjectContent = <Empty description="Project not found" />;

    return wrapInCard ? (
      <Card>
        {missingProjectContent}
      </Card>
    ) : (
      missingProjectContent
    );
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        {showHeader && <Title level={4} style={{ margin: 0 }}>Project Worklogs</Title>}
        {project?.status === 'active' && (
          <Button 
            type="primary" 
            onClick={() => navigate(`/projects/${resolvedProjectId}/worklogs/new`)}
          >
            Create Worklog
          </Button>
        )}
      </div>
      
      {!isPending && Array.isArray(worklogs) && worklogs.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Hours"
                value={stats.totalHours}
                suffix="hrs"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Monthly Hours"
                value={stats.monthlyHours}
                suffix="hrs"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Today's Hours"
                value={stats.dailyHours}
                suffix="hrs"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Team Members"
                value={Object.keys(stats.userStats).length}
              />
            </Col>
          </Row>
          
          {Object.keys(stats.userStats).length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Title level={5}>Hours by Team Member</Title>
              <Row gutter={16}>
                {Object.entries(stats.userStats).map(([userId, userData]: any) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={userId}>
                    <Card size="small">
                      <Statistic
                        title={userData.name}
                        value={userData.hours}
                        suffix="hrs"
                        precision={2}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>
      )}
      
      {isPending ? <Spin /> : <WorklogTable data={worklogs || []} />}
    </>
  );

  return wrapInCard ? (
    <Card>
      {content}
    </Card>
  ) : (
    content
  );
};

export default ProjectWorklogs;