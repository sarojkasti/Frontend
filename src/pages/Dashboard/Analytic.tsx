import { useProject } from "@/hooks/project/useProject";
import { useUser } from "@/hooks/user/useUser";
import { Card, Col, Row } from "antd";
import Title from "antd/es/typography/Title";
import Typography from "antd/es/typography/Typography";
import React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#FF6666'];

const UserRoleChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <PieChart>
            <Pie
                data={data}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
            >
                {data.map((entry, index) => (
                    <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                    />
                ))}
            </Pie>
            <Tooltip />
            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px' }} />
        </PieChart>
    </ResponsiveContainer>
);

const ProjectNatureChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
    </ResponsiveContainer>
);


const formatRole = (role: string) => {
    const roles: Record<string, string> = {
        'projectmanager': 'Project Manager',
        'superuser': 'Super User',
        'auditjunior': 'Audit Junior',
        'auditsenior': 'Audit Senior',
        'administrator': 'Administrator',
        'admin': 'Admin',
        'user': 'User'
    };
    if (!role) return 'Unknown';
    const lowerRole = role.toLowerCase().replace(/\s+/g, '');
    return roles[lowerRole] || role.charAt(0).toUpperCase() + role.slice(1);
};

const Analytic = () => {

    const { data: users } = useUser({ status: "", limit: 1000, page: 1, keywords: "" });
    // Use "active" status for projects to ensure the backend returns data
    const { data: projectsData } = useProject({ status: "active" });
    
    // Process Users Data
    const allUsers = users?.results || [];
    const totalUsers = users?.totalItems || 0;
    const activeUsers = allUsers.filter((u: any) => u.status === 'active').length;
    const inactiveUsers = allUsers.filter((u: any) => u.status === 'inactive').length;

    const activePercentage = totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
    const inactivePercentage = totalUsers ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : 0;

    const roleMap: Record<string, number> = {};
    allUsers.forEach((u: any) => {
        const role = u.role?.name || u.role || 'Unknown';
        const formattedRole = formatRole(role);
        roleMap[formattedRole] = (roleMap[formattedRole] || 0) + 1;
    });
    const userRoleData = Object.keys(roleMap).map(key => ({ name: key, value: roleMap[key] }));

    // Process Projects Data
    const allProjects = Array.isArray(projectsData) ? projectsData : (projectsData?.results || []);
    
    const natureMap: Record<string, number> = {};
    allProjects.forEach((p: any) => {
        const groupName = typeof p.natureOfWorkGroup === 'object' ? p.natureOfWorkGroup?.name : p.natureOfWorkGroup;
        const typeName = typeof p.natureOfWork === 'object' ? p.natureOfWork?.name : p.natureOfWork;
        
        let nature = 'Others';
        if (groupName && typeName) {
            nature = `${groupName} - ${typeName}`;
        } else if (typeName) {
            nature = typeName;
        } else if (groupName) {
            nature = groupName;
        }

        natureMap[nature] = (natureMap[nature] || 0) + 1;
    });
    const projectNatureData = Object.keys(natureMap).map(key => ({ name: key, value: natureMap[key] }));

    return (<>
        <Row gutter={8} style={{ marginBottom: "8px" }}>
            <Col span={8}>
                <Card title="Total Users" bordered>
                    <Title level={4}>{totalUsers}</Title>
                    <Typography>100%</Typography>
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Active Users" bordered>
                    <Title level={4}>{activeUsers}</Title>
                    <Typography>{activePercentage}%</Typography>
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Inactive Users" bordered>
                    <Title level={4}>{inactiveUsers}</Title>
                    <Typography>{inactivePercentage}%</Typography>
                </Card>
            </Col>
        </Row>
        <Row gutter={[12, 12]}>
            <Col xs={24} lg={12}>
                <Card title="User Role Distribution" bordered>
                    {userRoleData.length > 0 ? (
                        <UserRoleChart data={userRoleData} />
                    ) : (
                        <Typography>No data available</Typography>
                    )}
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card title="Project Nature Distribution" bordered>
                    {projectNatureData.length > 0 ? (
                        <ProjectNatureChart data={projectNatureData} />
                    ) : (
                        <Typography>No data available</Typography>
                    )}
                </Card>
            </Col>
        </Row>
    </>)
}

export default Analytic