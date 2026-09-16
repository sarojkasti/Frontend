import { Card, Col, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
const { Title, Paragraph } = Typography;



const Setting = () => {
  
  const navigate = useNavigate();
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/role")} hoverable>
          <Title level={4} className="text-blue-600">
            Roles & Permissions
          </Title>
          <Paragraph>
            Manage roles and assign permissions to control access.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/permission")} hoverable>
          <Title level={4}>Permissions</Title>
          <Paragraph>
            Create and edit permissions for resources.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/workhour-settings")} hoverable>
          <Title level={4}>Work Hour Settings</Title>
          <Paragraph>
            Configure work hours for roles and individual users. Set daily work hours and schedules.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/holiday")} hoverable>
          <Title level={4}>Holiday Management</Title>
          <Paragraph>
            Manage company holidays and leave policies. Import holidays from CSV files.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/leave-types")} hoverable>
          <Title level={4}>Leave Types</Title>
          <Paragraph>
            Configure leave types, set maximum days per year, and manage leave policies.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/project-setting")} hoverable>
          <Title level={4}>Project Setting</Title>
          <Paragraph>
            Manage Nature of Work (add, edit, remove) and short names for project automation.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/customer-setting")} hoverable>
          <Title level={4}>Customer Setting</Title>
          <Paragraph>
            Manage Business Size and Business Nature categories for customers.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/department-setting")} hoverable>
          <Title level={4}>Department Management</Title>
          <Paragraph>
            Create and manage departments for organizing users and team structure.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/todotask/task-types")} hoverable>
          <Title level={4}>Task Type Settings</Title>
          <Paragraph>
            Manage task types for the Todo Task module. Create, edit, and configure task types.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/mail-settings")} hoverable>
          <Title level={4}>Mail Settings</Title>
          <Paragraph>
            Configure automated attendance reminder emails, grace periods, and excluded roles.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full" onClick={() => navigate("/client-report-document-types")} hoverable>
          <Title level={4}>Client Report Document Types</Title>
          <Paragraph>
            Manage document types for client reports. Create global or customer-specific types.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full">
          <svg className="admin-icon-prop">
            <use></use>
          </svg>
          <Title level={4}>General Settings</Title>
          <Paragraph>
            Advanced Portal SettingsRequester PortalTheme SettingsCloud
            AttachmentsApproval Settings
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card className="h-full">
          <svg className="admin-icon-prop">
            <use></use>
          </svg>
          <Title level={4}>Instance Configuration</Title>
          <Paragraph>
            Instance SettingsRegionsSitesOperational HoursHoliday GroupsLeave
            TypesDepartmentsCurrencyOrganization Roles
          </Paragraph>
        </Card>
      </Col>
    </Row>
  );
};

export default Setting;
