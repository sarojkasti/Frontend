import AttendenceTable from "@/components/Attendence/AttendenceTable";
import { useSession } from "@/context/SessionContext";
import { useUser } from "@/hooks/user/useUser";
import { useDateWiseAllUsersAttendence } from "@/hooks/attendence/useDateWiseAllUsersAttendence";
import "./Attendence.css";
import { 
    Card, 
    Select, 
    Space, 
    Typography, 
    Badge,
    Button,
    Alert,
    DatePicker,
    Input
} from "antd";
import { 
    ClockCircleOutlined,
    SearchOutlined,
    CloseOutlined
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import moment from "moment";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Option } = Select;
const { Title } = Typography;

const Attendence = () => {
    const { profile } = useSession();
    const { isMobile } = useIsMobile();
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [personalViewUserId, setPersonalViewUserId] = useState<string>(""); // For the personal section
    const [selectedDate, setSelectedDate] = useState<string>(""); // For date-wise view
    const [hasInitializedDefaultView, setHasInitializedDefaultView] = useState(false);
    
    // Fetch users for the dropdown (only if super user)
    const { data: usersData } = useUser({
        status: "active",
        limit: 100,
        page: 1,
        keywords: ""
    });

    // Sort users alphabetically by name for dropdown
    const sortedUsers = usersData?.results
        ? [...usersData.results].sort((a, b) => a.name.localeCompare(b.name))
        : [];

    // Fetch date-wise attendance data
    const { data: dateWiseAttendance, isPending: dateWisePending } = useDateWiseAllUsersAttendence(
        selectedDate,
        !!selectedDate && personalViewUserId === "date-wise"
    );

    // Get permissions and role info
    const permissions = profile?.role?.permission || [];
    const roleName = (profile?.role as any)?.name || '';
    
    // For now, let's use role name as primary check since user is "superuser"
    const isRoleSuperUser = roleName === 'superuser' || 
                           roleName === 'admin' || 
                           roleName === 'projectmanager' ||
                           roleName?.toLowerCase().includes('admin') ||
                           roleName?.toLowerCase().includes('super') ||
                           roleName?.toLowerCase().includes('projectmanager');
    
    // Try to extract permission names from objects
    const permStrings = permissions.map((p: any) => {
        if (typeof p === 'string') return p;
        // Try different possible property names
        return p?.name || p?.permission || p?.description || p?.resource || '';
    });
    
    const hasAttendancePermissions = permStrings.some((permString: string) => 
        permString === 'View All Users Attendance' ||
        permString === 'View Today All Users Attendance' ||
        (permString && permString.toLowerCase && permString.toLowerCase().includes('attendance') && permString.toLowerCase().includes('all'))
    );
    
    const isSuperUser = isRoleSuperUser || hasAttendancePermissions;

    // Security check: Reset personalViewUserId if user is not a superuser
    useEffect(() => {
        if (!isSuperUser && personalViewUserId) {
            setPersonalViewUserId("");
        }
    }, [isSuperUser, personalViewUserId]);

    // Set default view to 'all-today' for superusers upon first load
    useEffect(() => {
        if (profile && isSuperUser && !hasInitializedDefaultView) {
            setPersonalViewUserId("all-today");
            setHasInitializedDefaultView(true);
        }
    }, [profile, isSuperUser, hasInitializedDefaultView]);

    const handleClearPersonalSelection = () => {
        setPersonalViewUserId("");
    };

    // Get the selected user name for display
    const getSelectedUserName = (userId: string) => {
        if (!userId) return null;
        if (userId === "all-today") return "All Users Today";
        if (userId === "date-wise") return `All Users - ${selectedDate || "Select Date"}`;
        const user = usersData?.results?.find((u: any) => u.id === userId);
        return user ? user.name : "Unknown User";
    };

    const handleDateChange = (date: any, dateString: string | string[]) => {
        const dateStr = Array.isArray(dateString) ? dateString[0] : dateString;
        setSelectedDate(dateStr || "");
    };

    return (
        <>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Personal Attendance Section - Always Visible */}
                <Card 
                    title={
                        <Space>
                            <ClockCircleOutlined style={{ color: '#1890ff' }} />
                            <Title level={4} style={{ margin: 0 }}>
                                {personalViewUserId ? `${getSelectedUserName(personalViewUserId)}'s Attendance` : "My Attendance"}
                            </Title>
                        </Space>
                    }
                    extra={
                        <Space wrap className="flex-wrap">
                            {/* Only show dropdown for superusers/admins */}
                            {isSuperUser && (
                                <Select
                                    placeholder="Switch user view"
                                    className="min-w-[150px] w-full sm:w-[250px]"
                                    value={personalViewUserId}
                                    onChange={setPersonalViewUserId}
                                    allowClear
                                    size="small"
                                    showSearch={false}
                                >
                                    {/* Special option for all users today */}
                                    <Option key="all-today" value="all-today">
                                        📅 All Users Today
                                    </Option>
                                    <Option key="date-wise" value="date-wise">
                                        📅 All Users - Choose Date
                                    </Option>
                                    <Option key="divider" disabled style={{ borderBottom: '1px solid #d9d9d9' }}>
                                        ──── Individual Users ────
                                    </Option>
                                    {sortedUsers.map((user: any) => (
                                        <Option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </Option>
                                    ))}
                                </Select>
                            )}
                            {isSuperUser && (
                                <Badge 
                                    count="Super User" 
                                    style={{ backgroundColor: '#f50' }} 
                                />
                            )}
                            <Badge 
                                count={personalViewUserId ? "Viewing Other" : "Personal"} 
                                style={{ backgroundColor: personalViewUserId ? '#fa8c16' : '#52c41a' }} 
                            />
                        </Space>
                    }
                >
                    {/* Mobile search bar toggle */}
                    {isMobile && showMobileSearch && (
                        <div className="mb-4">
                            <Input.Search
                                placeholder="Search attendance by user, date, time, location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                allowClear
                                autoFocus
                                className="w-full shadow-sm"
                            />
                        </div>
                    )}

                    {personalViewUserId === "all-today" && isSuperUser ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Viewing today's attendance for all users"
                                type="info"
                                showIcon
                                action={
                                    <Button size="small" type="link" onClick={handleClearPersonalSelection}>
                                        Back to My Attendance
                                    </Button>
                                }
                                style={{ marginBottom: 16 }}
                            />
                            <AttendenceTable viewType="today-all" searchQuery={searchQuery} />
                        </Space>
                    ) : personalViewUserId === "date-wise" && isSuperUser ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Choose a date to view all users attendance"
                                type="info"
                                showIcon
                                action={
                                    <Button size="small" type="link" onClick={handleClearPersonalSelection}>
                                        Back to My Attendance
                                    </Button>
                                }
                                style={{ marginBottom: 16 }}
                            />
                            <Space wrap style={{ marginBottom: 16 }} className="w-full">
                                <DatePicker 
                                    onChange={handleDateChange}
                                    placeholder="Select date"
                                    format="YYYY-MM-DD"
                                    allowClear
                                    className="w-full sm:w-auto"
                                />
                            </Space>
                            {selectedDate && (
                                <AttendenceTable 
                                    viewType="date-wise" 
                                    selectedDate={selectedDate}
                                    dateWiseData={dateWiseAttendance}
                                    isPending={dateWisePending}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </Space>
                    ) : isSuperUser && personalViewUserId ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message={`Viewing attendance for: ${getSelectedUserName(personalViewUserId)}`}
                                type="info"
                                showIcon
                                action={
                                    <Button size="small" type="link" onClick={handleClearPersonalSelection}>
                                        Back to My Attendance
                                    </Button>
                                }
                                style={{ marginBottom: 16 }}
                            />
                            <AttendenceTable viewType="by-user" selectedUserId={personalViewUserId} searchQuery={searchQuery} />
                        </Space>
                    ) : (
                        <AttendenceTable viewType="my" searchQuery={searchQuery} />
                    )}
                </Card>
            </Space>

            {/* Floating Search Action Button on Mobile */}
            {isMobile && (
                <div className="fixed bottom-6 right-5 z-40">
                    <button
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-xl active:scale-95 transition-all hover:bg-blue-700"
                        aria-label="Search Attendance"
                    >
                        {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
                    </button>
                </div>
            )}
        </>
    );
};

export default Attendence;