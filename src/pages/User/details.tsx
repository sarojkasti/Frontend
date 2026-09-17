import React, { useState } from "react";
import { useUserDetails } from "@/hooks/user/useUserDetails";
import { 
  Card, 
  Row, 
  Col, 
  Avatar, 
  Tag, 
  Badge, 
  Descriptions, 
  Divider, 
  Space, 
  Button, 
  Tabs, 
  Progress, 
  Tooltip, 
  Empty,
  Typography,
  Breadcrumb
} from "antd";
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  HistoryOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import UserActivityStatus from "@/components/UserActivityStatus";
import useIsMobile from "@/hooks/useIsMobile";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { data: user, isLoading } = useUserDetails(id);
  const [activeTab, setActiveTab] = useState("1");

  const lastActiveTime = user?.lastActiveAt ? new Date(user.lastActiveAt).getTime() : null;

  // Calculate overall profile completeness
  const calculateProfileCompleteness = () => {
    if (!user) return 0;
    
    const sections = [
      !!user.profile,
      !!user.bank_detail?.length,
      !!user.education_detail?.length,
      !!user.trainning_detail?.length,
      !!user.contract_detail?.length,
      !!user.document?.length
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  };

  const completenessPercentage = calculateProfileCompleteness();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card style={{ borderRadius: "12px", textAlign: "center", padding: "40px 0" }}>
        <Text type="secondary">Loading user profile details...</Text>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card style={{ borderRadius: "12px", textAlign: "center", padding: "40px 0" }}>
        <Empty description="User profile not found" />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")} style={{ marginTop: 16 }}>
          Back to Users
        </Button>
      </Card>
    );
  }

  const completenessItems = [
    { label: "Personal Details", status: !!user.profile },
    { label: "Bank Details", status: !!user.bank_detail?.length },
    { label: "Education Details", status: !!user.education_detail?.length },
    { label: "Training Details", status: !!user.trainning_detail?.length },
    { label: "Contract Details", status: !!user.contract_detail?.length },
    { label: "Documents", status: !!user.document?.length },
  ];

  return (
    <div style={{ padding: "0 4px 24px 4px" }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/users">Users</Link> },
            { title: user.name || "User Details" },
          ]}
        />
        {!isMobile && (
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/users")}
            size="middle"
          >
            Back to Users
          </Button>
        )}
      </div>

      {/* Header Profile Hero Card */}
      <Card
        style={{
          borderRadius: "16px",
          marginBottom: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden",
          border: "1px solid #e2e8f0"
        }}
        styles={{ body: { padding: isMobile ? "16px" : "24px" } }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16} lg={18}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
              <Button
                type="text"
                shape="circle"
                icon={<ArrowLeftOutlined style={{ fontSize: isMobile ? 18 : 20 }} />}
                onClick={() => navigate("/users")}
                className="flex items-center justify-center -ml-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 shrink-0"
                title="Back to Users"
              />
              <Avatar
                size={isMobile ? 56 : 88}
                src={user.avatar}
                style={{
                  backgroundColor: user.avatar ? "transparent" : "#1677ff",
                  fontSize: isMobile ? "22px" : "32px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(22, 119, 255, 0.25)",
                  flexShrink: 0
                }}
              >
                {!user.avatar && getInitials(user.name)}
              </Avatar>

              <div style={{ flex: 1, minWidth: isMobile ? 180 : 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Title level={isMobile ? 4 : 2} style={{ margin: 0, color: "#1e293b" }}>
                    {user.name}
                  </Title>
                  <UserActivityStatus
                    userId={id || ""}
                    lastActiveTime={lastActiveTime}
                    size="small"
                    showAvatar={false}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <Tag color="blue" style={{ borderRadius: "6px", padding: "2px 10px", fontWeight: 500 }}>
                    <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                    {user.role?.name || "User"}
                  </Tag>
                  
                  {user.profile?.department?.name && (
                    <Tag color="purple" style={{ borderRadius: "6px", padding: "2px 10px" }}>
                      {user.profile.department.name}
                    </Tag>
                  )}

                  <Tag
                    color={user.status === "active" ? "success" : "error"}
                    style={{ borderRadius: "6px", padding: "2px 10px", textTransform: "capitalize" }}
                  >
                    ● {user.status}
                  </Tag>
                </div>

                <Space size="large" style={{ marginTop: 12, color: "#64748b" }} wrap>
                  <Text type="secondary">
                    <MailOutlined style={{ marginRight: 6, color: "#1677ff" }} />
                    {user.email}
                  </Text>
                  <Text type="secondary">
                    <PhoneOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                    {user.phoneNumber || "No phone registered"}
                  </Text>
                </Space>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8} lg={6} style={{ textAlign: "right" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Link to={`/user/${id}/edit`} style={{ width: "100%", display: "block" }}>
                <Button type="primary" icon={<EditOutlined />} block size="large" style={{ borderRadius: "8px" }}>
                  Edit Profile
                </Button>
              </Link>
              <Link to={`/user/${id}/history`} style={{ width: "100%", display: "block" }}>
                <Button 
                  icon={<HistoryOutlined style={{ color: "#0958d9" }} />} 
                  block 
                  size="large"
                  style={{ borderRadius: "8px", borderColor: "#91caff", color: "#0958d9", background: "#e6f4ff" }}
                >
                  View Profile History
                </Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Profile Completeness Card */}
      <Card
        size="small"
        style={{
          borderRadius: "14px",
          marginBottom: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}
        bodyStyle={{ padding: "20px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <Text strong style={{ fontSize: 16, color: "#1e293b" }}>Profile Completion</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Keep user information up to date for accuracy in payroll and assignments
            </Text>
          </div>
          <Text strong style={{ fontSize: 22, color: completenessPercentage === 100 ? "#52c41a" : "#1677ff" }}>
            {completenessPercentage}%
          </Text>
        </div>

        <Progress
          percent={completenessPercentage}
          showInfo={false}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          strokeWidth={10}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[12, 12]}>
          {completenessItems.map((item, idx) => (
            <Col xs={12} sm={8} md={4} key={idx}>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: item.status ? "#f6ffed" : "#f5f5f5",
                  border: `1px solid ${item.status ? "#b7eb8f" : "#e8e8e8"}`,
                  display: "flex",
                  alignItems: "center",
                  justify: "space-between",
                  fontSize: "12px",
                  fontWeight: 500
                }}
              >
                <span style={{ color: item.status ? "#274f10" : "#595959", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
                {item.status ? (
                  <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 6 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "#bfbfbf", marginLeft: 6 }} />
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Main Tabbed Details Section */}
      <Card
        style={{
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}
        bodyStyle={{ padding: "20px" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          size="large"
          items={[
            {
              key: "1",
              label: (
                <span>
                  <IdcardOutlined /> Account & Personal Info
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Divider orientation="left" style={{ borderColor: "#cbd5e1" }}>
                    Authentication & System Info
                  </Divider>
                  <Descriptions 
                    bordered 
                    column={{ xs: 1, sm: 2, md: 3 }}
                    size="small"
                    labelStyle={{ backgroundColor: "#f8fafc", fontWeight: 600, color: "#334155" }}
                  >
                    <Descriptions.Item label="Username">{user.username || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone Number">{user.phoneNumber || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Role">{user.role?.name || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={user.status === "active" ? "green" : "red"}>{user.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="2FA Enabled">
                      {user.isTwoFAEnabled ? (
                        <Space><CheckCircleOutlined style={{ color: "#52c41a" }} /> <Text type="success">Enabled</Text></Space>
                      ) : (
                        <Space><CloseCircleOutlined style={{ color: "#ff4d4f" }} /> <Text type="danger">Disabled</Text></Space>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Active">
                      {user.lastActiveAt ? dayjs(user.lastActiveAt).format("YYYY-MM-DD HH:mm:ss") : "Never"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Joined Date">
                      {user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD") : "N/A"}
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider orientation="left" style={{ borderColor: "#cbd5e1", marginTop: 32 }}>
                    Personal Details
                  </Divider>
                  <Descriptions 
                    bordered 
                    column={{ xs: 1, sm: 2, md: 3 }}
                    size="small"
                    labelStyle={{ backgroundColor: "#f8fafc", fontWeight: 600, color: "#334155" }}
                  >
                    <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="Department">{user.profile?.department?.name || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Date of Birth">
                      {user.profile?.dateOfBirth ? dayjs(user.profile.dateOfBirth).format("YYYY-MM-DD") : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Blood Group">{user.profile?.bloodGroup || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{user.profile?.gender || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Marital Status">{user.profile?.maritalStatus || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Contact No">{user.profile?.contactNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Personal Email">{user.profile?.personalEmail || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="PAN No">{user.profile?.panNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Location">{user.profile?.location || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Tax Calculation">{user.profile?.taxCalculation || "N/A"}</Descriptions.Item>
                  </Descriptions>

                  {(user.profile?.guardianName || user.profile?.guardianContact) && (
                    <>
                      <Divider orientation="left" style={{ borderColor: "#cbd5e1", marginTop: 32 }}>
                        Guardian Information
                      </Divider>
                      <Descriptions 
                        bordered 
                        column={{ xs: 1, sm: 2, md: 3 }}
                        size="small"
                        labelStyle={{ backgroundColor: "#f8fafc", fontWeight: 600, color: "#334155" }}
                      >
                        <Descriptions.Item label="Guardian Name">{user.profile?.guardianName || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Relation">{user.profile?.guardianRelation || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Contact">{user.profile?.guardianContact || "N/A"}</Descriptions.Item>
                      </Descriptions>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: "2",
              label: (
                <span>
                  <HomeOutlined /> Addresses
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                      <Card 
                        title={<Space><EnvironmentOutlined style={{ color: "#1677ff" }} /> Permanent Address</Space>}
                        size="small"
                        style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}
                      >
                        <Descriptions bordered column={1} size="small" labelStyle={{ width: "40%", fontWeight: 500 }}>
                          <Descriptions.Item label="Country">{user.profile?.permanentAddressCountry || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="State">{user.profile?.permanentAddressState || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="District">{user.profile?.permanentAddressDistrict || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Local Jurisdiction">{user.profile?.permanentAddressLocalJurisdiction || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Ward No">{user.profile?.permanentAddressWardNo || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Locality">{user.profile?.permanentAddressLocality || "N/A"}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card 
                        title={<Space><EnvironmentOutlined style={{ color: "#fa8c16" }} /> Temporary Address</Space>}
                        size="small"
                        style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}
                      >
                        <Descriptions bordered column={1} size="small" labelStyle={{ width: "40%", fontWeight: 500 }}>
                          <Descriptions.Item label="Country">{user.profile?.temporaryAddressCountry || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="State">{user.profile?.temporaryAddressState || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="District">{user.profile?.temporaryAddressDistrict || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Local Jurisdiction">{user.profile?.temporaryAddressLocalJurisdiction || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Ward No">{user.profile?.temporaryAddressWardNo || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Locality">{user.profile?.temporaryAddressLocality || "N/A"}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "3",
              label: (
                <span>
                  <BankOutlined /> Bank Details
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  {!user.bank_detail?.length ? (
                    <Empty description="No bank details added for this user" />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {user.bank_detail.map((detail: any, index: number) => (
                        <Col xs={24} md={12} lg={8} key={detail.id || index}>
                          <Card
                            size="small"
                            style={{
                              borderRadius: "10px",
                              border: "1px solid #d9d9d9",
                              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
                            }}
                            title={<Space><BankOutlined style={{ color: "#1677ff" }} /> {detail.bankName || "Bank Account"}</Space>}
                          >
                            <Descriptions bordered column={1} size="small" labelStyle={{ width: "45%", fontWeight: 500 }}>
                              <Descriptions.Item label="Account Name">{detail.accountName || "N/A"}</Descriptions.Item>
                              <Descriptions.Item label="Account No">{detail.accountNo || "N/A"}</Descriptions.Item>
                              <Descriptions.Item label="Bank Branch">{detail.bankBranch || "N/A"}</Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              ),
            },
            {
              key: "4",
              label: (
                <span>
                  <BookOutlined /> Education & Training
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Title level={5} style={{ marginBottom: 16 }}>Educational Background</Title>
                  {!user.education_detail?.length ? (
                    <Empty description="No educational details added" />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {user.education_detail.map((detail: any, index: number) => (
                        <Col xs={24} md={12} key={detail.id || index}>
                          <Card
                            size="small"
                            style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}
                            title={<Space><BookOutlined style={{ color: "#722ed1" }} /> {detail.faculty || "Education"}</Space>}
                          >
                            <Descriptions bordered column={1} size="small" labelStyle={{ width: "40%", fontWeight: 500 }}>
                              <Descriptions.Item label="Institution">{detail.universityCollege || "N/A"}</Descriptions.Item>
                              <Descriptions.Item label="Faculty">{detail.faculty || "N/A"}</Descriptions.Item>
                              <Descriptions.Item label="Passed Year">{detail.yearOfPassing || "N/A"}</Descriptions.Item>
                              <Descriptions.Item label="Issue Place">{detail.placeOfIssue || "N/A"}</Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}

                  {user.trainning_detail?.length > 0 && (
                    <>
                      <Divider style={{ margin: "24px 0" }} />
                      <Title level={5} style={{ marginBottom: 16 }}>Training Details</Title>
                      <Row gutter={[16, 16]}>
                        {user.trainning_detail.map((train: any, index: number) => (
                          <Col xs={24} md={12} key={train.id || index}>
                            <Card size="small" style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Topic">{train.topic || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Institution">{train.institution || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Duration">{train.duration || "N/A"}</Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: "5",
              label: (
                <span>
                  <FileTextOutlined /> Contracts & Documents
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                      <Card title="Contract Summary" size="small" style={{ borderRadius: "10px" }}>
                        {!user.contract_detail?.length ? (
                          <Empty description="No contract details available" />
                        ) : (
                          <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Contracts Count">{user.contract_detail.length}</Descriptions.Item>
                          </Descriptions>
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Uploaded Documents" size="small" style={{ borderRadius: "10px" }}>
                        {!user.document?.length ? (
                          <Empty description="No documents uploaded" />
                        ) : (
                          <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Documents Count">{user.document.length}</Descriptions.Item>
                          </Descriptions>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default UserDetails;