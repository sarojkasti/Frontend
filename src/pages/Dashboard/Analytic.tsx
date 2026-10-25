import { useProject } from "@/hooks/project/useProject";
import { useUser } from "@/hooks/user/useUser";
import { Card, Col, Row, Segmented, Typography } from "antd";
import React, { useMemo, useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
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
    LabelList,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#FF6666'];

const UserRoleChart: React.FC<{ data: any[] }> = ({ data }) => {
    const { isMobile } = useIsMobile();
    return (
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 340}>
            <PieChart>
                <Pie
                    data={data}
                    cx={isMobile ? "35%" : "40%"}
                    cy="50%"
                    innerRadius={isMobile ? 45 : 65}
                    outerRadius={isMobile ? 65 : 90}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip />
                <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right" 
                    wrapperStyle={{ 
                        fontSize: isMobile ? "11px" : "12px",
                        paddingLeft: isMobile ? "4px" : "20px" 
                    }} 
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

interface ProjectNatureItem {
    name: string;
    value: number;
}

const CustomColumnTick = (props: any) => {
    const { x, y, payload } = props;
    const fullText = payload?.value || '';
    // Smart truncation for column labels to prevent overlapping
    const maxChars = 14;
    const displayText = fullText.length > maxChars ? `${fullText.substring(0, 12)}…` : fullText;

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={14}
                textAnchor="end"
                fill="#64748b"
                fontSize={11}
                transform="rotate(-40)"
            >
                <title>{fullText}</title>
                {displayText}
            </text>
        </g>
    );
};

const CustomChartTooltip = ({ active, payload, total }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        return (
            <div 
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    maxWidth: 280,
                }}
            >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 4, wordBreak: 'break-word' }}>
                    {item.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Projects:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1677ff' }}>
                        {item.value} <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>({percent}%)</span>
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const ProjectNatureChart: React.FC<{ data: ProjectNatureItem[] }> = ({ data }) => {
    const { isMobile } = useIsMobile();
    const [viewType, setViewType] = useState<'column' | 'bar'>('column');
    const [showTopOnly, setShowTopOnly] = useState<boolean>(data.length > 8);

    const totalProjects = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    // Sort descending so the most frequent natures appear first
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.value - a.value);
    }, [data]);

    // Display data (Top 8 + Others or All)
    const displayData = useMemo(() => {
        if (!showTopOnly || sortedData.length <= 8) {
            return sortedData;
        }
        const top8 = sortedData.slice(0, 8);
        const othersCount = sortedData.slice(8).reduce((sum, i) => sum + i.value, 0);
        if (othersCount > 0) {
            return [...top8, { name: 'Others', value: othersCount }];
        }
        return top8;
    }, [sortedData, showTopOnly]);

    return (
        <div>
            {/* View controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {sortedData.length > 8 && (
                    <Segmented
                        size="small"
                        value={showTopOnly ? 'top' : 'all'}
                        onChange={(val) => setShowTopOnly(val === 'top')}
                        options={[
                            { label: 'Top 8', value: 'top' },
                            { label: `All (${sortedData.length})`, value: 'all' },
                        ]}
                    />
                )}
                <Segmented
                    size="small"
                    value={viewType}
                    onChange={(val) => setViewType(val as 'column' | 'bar')}
                    options={[
                        { label: 'Column', value: 'column' },
                        { label: 'Horizontal Bar', value: 'bar' },
                    ]}
                />
            </div>

            <ResponsiveContainer width="100%" height={isMobile ? 290 : 340}>
                {viewType === 'column' ? (
                    <BarChart
                        data={displayData}
                        margin={{
                            top: 20,
                            right: 15,
                            left: isMobile ? -15 : 0,
                            bottom: isMobile ? 65 : 75,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            interval={0}
                            tick={<CustomColumnTick />}
                            height={isMobile ? 65 : 75}
                            stroke="#cbd5e1"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            stroke="#cbd5e1"
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomChartTooltip total={totalProjects} />} />
                        <Bar
                            dataKey="value"
                            name="Projects"
                            fill="#1677ff"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                        >
                            <LabelList
                                dataKey="value"
                                position="top"
                                fill="#475569"
                                fontSize={11}
                                offset={6}
                            />
                        </Bar>
                    </BarChart>
                ) : (
                    <BarChart
                        layout="vertical"
                        data={displayData}
                        margin={{
                            top: 10,
                            right: 35,
                            left: isMobile ? 5 : 15,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            stroke="#cbd5e1"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={isMobile ? 95 : 130}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            stroke="#cbd5e1"
                            tickFormatter={(val) => (val && val.length > 16 ? `${val.substring(0, 14)}…` : val)}
                        />
                        <Tooltip content={<CustomChartTooltip total={totalProjects} />} />
                        <Bar
                            dataKey="value"
                            name="Projects"
                            fill="#1677ff"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={28}
                        >
                            <LabelList
                                dataKey="value"
                                position="right"
                                fill="#475569"
                                fontSize={11}
                                offset={6}
                            />
                        </Bar>
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};

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
    const { isMobile } = useIsMobile();
    const { data: users } = useUser({ status: "", limit: 1000, page: 1, keywords: "" });
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
            nature = groupName === typeName ? groupName : `${groupName} - ${typeName}`;
        } else if (typeName) {
            nature = typeName;
        } else if (groupName) {
            nature = groupName;
        }

        natureMap[nature] = (natureMap[nature] || 0) + 1;
    });
    const projectNatureData = Object.keys(natureMap).map(key => ({ name: key, value: natureMap[key] }));

    return (
        <>
            <Row gutter={[8, 8]} style={{ marginBottom: "12px" }}>
                <Col span={8}>
                    <Card 
                        bordered 
                        styles={{ body: { padding: isMobile ? "12px 6px" : "16px", textAlign: "center" } }} 
                        className="rounded-xl shadow-2xs h-full"
                    >
                        <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate" title="Total Users">
                          Total Users
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                          {totalUsers}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5">
                          100%
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card 
                        bordered 
                        styles={{ body: { padding: isMobile ? "12px 6px" : "16px", textAlign: "center" } }} 
                        className="rounded-xl shadow-2xs h-full"
                    >
                        <div className="text-[11px] sm:text-xs font-semibold text-emerald-600 truncate" title="Active Users">
                          Active Users
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                          {activeUsers}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium text-emerald-600/80 mt-0.5">
                          {activePercentage}%
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card 
                        bordered 
                        styles={{ body: { padding: isMobile ? "12px 6px" : "16px", textAlign: "center" } }} 
                        className="rounded-xl shadow-2xs h-full"
                    >
                        <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate" title="Inactive Users">
                          Inactive Users
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                          {inactiveUsers}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5">
                          {inactivePercentage}%
                        </div>
                    </Card>
                </Col>
            </Row>
            <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                    <Card 
                        title="User Role Distribution" 
                        bordered 
                        className="h-full"
                        styles={{ body: { padding: isMobile ? "12px 8px" : "20px 24px" } }}
                    >
                        {userRoleData.length > 0 ? (
                            <UserRoleChart data={userRoleData} />
                        ) : (
                            <Typography>No data available</Typography>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card 
                        title="Project Nature Distribution" 
                        bordered 
                        className="h-full"
                        styles={{ body: { padding: isMobile ? "12px 8px" : "20px 24px" } }}
                    >
                        {projectNatureData.length > 0 ? (
                            <ProjectNatureChart data={projectNatureData} />
                        ) : (
                            <Typography>No data available</Typography>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Analytic;
