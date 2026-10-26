import { useMyNotifications } from "@/hooks/notification/useMyNotifications";
import useNotificationRead from "@/hooks/notification/useNotificationRead";
import useMarkAllAsReadByType from "@/hooks/notification/useMarkAllAsReadByType";
import { calculateDays } from "@/utils/calculateDays";
import { NotificationType } from "@/types/notification";
import { List, Badge, Tabs, Space, Tag, Card, Divider, Button, Modal, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";
import { useWebPushNotifications } from "@/hooks/useWebPushNotifications";
import { notification as antdNotification } from "antd";
import { 
    ClockCircleOutlined, 
    NotificationOutlined, 
    CheckCircleOutlined, 
    ProjectOutlined,
    ArrowLeftOutlined,
    AppstoreOutlined,
    CheckOutlined,
    BellOutlined,
    SettingOutlined,
    CopyOutlined
} from "@ant-design/icons";

// Replace with your actual user ID retrieval logic
const getCurrentUserId = () => localStorage.getItem("userId") || "";

// Icon mapping for notification types
const typeIcons: Record<NotificationType, React.ReactNode> = {
    [NotificationType.WORKLOG]: <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
    [NotificationType.TASK]: <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
    [NotificationType.NOTICEBOARD]: <NotificationOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
    [NotificationType.PROJECT]: <ProjectOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
    [NotificationType.GENERAL]: <NotificationOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />,
    [NotificationType.SYSTEM]: <NotificationOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
    [NotificationType.CLIENT]: <NotificationOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
    [NotificationType.DSA]: <NotificationOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
    [NotificationType.LEAVE]: <NotificationOutlined style={{ fontSize: '24px', color: '#2f54eb' }} />,
    [NotificationType.TRAINING]: <NotificationOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
    [NotificationType.MEETING]: <NotificationOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
};

// Color mapping for notification types
const typeColors: Record<NotificationType, string> = {
    [NotificationType.WORKLOG]: '#1890ff',
    [NotificationType.TASK]: '#52c41a',
    [NotificationType.NOTICEBOARD]: '#fa8c16',
    [NotificationType.PROJECT]: '#722ed1',
    [NotificationType.GENERAL]: '#8c8c8c',
    [NotificationType.SYSTEM]: '#13c2c2',
    [NotificationType.CLIENT]: '#eb2f96',
    [NotificationType.DSA]: '#faad14',
    [NotificationType.LEAVE]: '#2f54eb',
    [NotificationType.TRAINING]: '#13c2c2',
    [NotificationType.MEETING]: '#722ed1',
};

// Background colors for group cards
const typeBgColors: Record<NotificationType, string> = {
    [NotificationType.WORKLOG]: '#e6f7ff',
    [NotificationType.TASK]: '#f6ffed',
    [NotificationType.NOTICEBOARD]: '#fff7e6',
    [NotificationType.PROJECT]: '#f9f0ff',
    [NotificationType.GENERAL]: '#fafafa',
    [NotificationType.SYSTEM]: '#e6fffb',
    [NotificationType.CLIENT]: '#fff0f6',
    [NotificationType.DSA]: '#fffbe6',
    [NotificationType.LEAVE]: '#f0f5ff',
    [NotificationType.TRAINING]: '#e6fffb',
    [NotificationType.MEETING]: '#f9f0ff',
};

// Type labels
const typeLabels: Record<NotificationType, string> = {
    [NotificationType.WORKLOG]: 'Worklog',
    [NotificationType.TASK]: 'Tasks',
    [NotificationType.NOTICEBOARD]: 'Notice Board',
    [NotificationType.PROJECT]: 'Projects',
    [NotificationType.GENERAL]: 'General',
    [NotificationType.SYSTEM]: 'System',
    [NotificationType.CLIENT]: 'Client',
    [NotificationType.DSA]: 'DSA',
    [NotificationType.LEAVE]: 'Leave',
    [NotificationType.TRAINING]: 'Training',
    [NotificationType.MEETING]: 'Meeting',
};

interface NotificationProps {
    onItemClick?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ onItemClick }) => {
    const navigate = useNavigate();
    const userId = getCurrentUserId();
    const [selectedType, setSelectedType] = useState<NotificationType | undefined>(undefined);
    const { data: allNotifications, refetch } = useMyNotifications(userId, undefined);
    const { data: filteredNotifications } = useMyNotifications(userId, selectedType);
    const { mutateAsync: updateNotifications } = useNotificationRead();
    const { mutateAsync: markAllAsRead } = useMarkAllAsReadByType();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState("unread");
    const { pushSupported, isPushSubscribed, pushLoading, handleTogglePush, isBrave, showBraveModal, setShowBraveModal } = useWebPushNotifications();

    // Deduplicate notification toasts by notification ID
    const shownToastIds = new Set<string>();
    const queryClient = useQueryClient();
    // Add worklog table refresh logic
    useEffect(() => {
        if (!socket) return;
        const handleNotification = (data: any) => {
            const toastId = data?.id || data?._id;
            if (toastId && shownToastIds.has(toastId)) return;
            if (toastId) shownToastIds.add(toastId);
            const msg = data?.message?.toLowerCase() || "";
            // Custom toast for todo task events
            if (msg.includes("acknowledged by") && msg.includes("task")) {
                antdNotification.success({
                    message: "Task Acknowledged",
                    description: data?.message,
                    placement: "top",
                });
            } else if (msg.includes("marked as pending by") && msg.includes("task")) {
                antdNotification.warning({
                    message: "Task Set Pending",
                    description: data?.message,
                    placement: "top",
                });
            } else if (msg.includes("completed by") && msg.includes("task")) {
                antdNotification.success({
                    message: "Task Completed",
                    description: data?.message,
                    placement: "top",
                });
            } else if (msg.includes("dropped by") && msg.includes("task")) {
                antdNotification.error({
                    message: "Task Dropped",
                    description: data?.message,
                    placement: "top",
                });
            } else {
                antdNotification.info({
                    message: "New Notification",
                    description: data?.message || "You have a new notification.",
                    placement: "top",
                });
            }
            // Trigger native OS desktop notification if window is minimized or user is on another tab
            if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                window.Notification.permission === 'granted' &&
                document.visibilityState !== 'visible'
            ) {
                try {
                    const osNotif = new window.Notification('Artha', {
                        body: data?.message || 'You have a new update in Artha.',
                        icon: '/logo.svg',
                        tag: toastId,
                    });
                    osNotif.onclick = () => {
                        window.focus();
                        handleNotificationClick(data);
                    };
                } catch (e) {
                    // Ignore desktop notification error
                }
            }

            refetch();
            // If notification is for worklog request, approval, or rejection, trigger worklog table refresh
            if (
                msg.includes("worklog has been requested") ||
                msg.includes("worklog has been approved") ||
                msg.includes("worklog has been rejected")
            ) {
                queryClient.invalidateQueries({ queryKey: ["worklog-all"] });
                queryClient.invalidateQueries({ queryKey: ["worklog-user"] });
                queryClient.invalidateQueries({ queryKey: ["worklog-admin-all"] });
                window.dispatchEvent(new Event("refreshWorklogTable"));
            }
        };
        const handleNotificationRead = () => {
            antdNotification.success({
                message: "Notification Read",
                placement: "top",
            });
            refetch();
        };
        const handleNotificationDeleted = (id: string) => {
            antdNotification.warning({
                message: "Notification Deleted",
                description: `Notification ${id} deleted`,
                placement: "top",
            });
            refetch();
        };
        socket.on("notification", handleNotification);
        socket.on("notification_read", handleNotificationRead);
        socket.on("notification_deleted", handleNotificationDeleted);
        return () => {
            socket.off("notification", handleNotification);
            socket.off("notification_read", handleNotificationRead);
            socket.off("notification_deleted", handleNotificationDeleted);
        };
    }, [refetch]);

    // Use the right data source based on view mode
    const notifications = selectedType ? filteredNotifications : allNotifications;

    // Separate unread and read notifications
    const unread = (notifications || []).filter((n: any) => !n.isRead);
    const read = (notifications || []).filter((n: any) => n.isRead);

    // Group notifications by type and count them
    const getGroupedCounts = (notificationList: any[]) => {
        const counts: Record<NotificationType, number> = {
            [NotificationType.WORKLOG]: 0,
            [NotificationType.TASK]: 0,
            [NotificationType.NOTICEBOARD]: 0,
            [NotificationType.PROJECT]: 0,
            [NotificationType.GENERAL]: 0,
        };
        
        notificationList.forEach((n: any) => {
            const type: NotificationType = n.notification?.type || NotificationType.GENERAL;
            counts[type] = (counts[type] || 0) + 1;
        });
        
        return counts;
    };

    const unreadCounts = getGroupedCounts(unread);
    const readCounts = getGroupedCounts(read);


    const resolveNotificationTarget = (item: any): string => {
        let rawLink = (item?.notification?.link || '').trim();
        const type = item?.notification?.type;
        const metadata = item?.notification?.metadata || {};
        const message = (item?.notification?.message || '').toLowerCase();

        // 1. If explicit link exists, extract relative route if same host and sanitize
        if (rawLink && rawLink !== '/notifications' && rawLink !== '/') {
            // Strip any accidental leading "undefined", "/undefined", or "http(s)://undefined"
            rawLink = rawLink.replace(/^(https?:\/\/)?undefined\/?/i, '/');
            rawLink = rawLink.replace(/^\/undefined\/?/i, '/');

            if (rawLink.includes('://')) {
                try {
                    const url = new URL(rawLink);
                    return (url.pathname || '/') + url.search + url.hash;
                } catch (e) {
                    return rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
                }
            }
            return rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
        }

        // 2. Intelligent inference based on type and metadata
        if (type === NotificationType.WORKLOG || metadata.module === 'worklog') {
            const worklogId = metadata.worklogId || '';
            let tab = 'requested';
            if (metadata.isIncoming || message.includes('requested by')) {
                tab = 'incoming-requested';
            } else if (metadata.status === 'approved' || message.includes('approved')) {
                tab = 'approved';
            } else if (metadata.status === 'rejected' || message.includes('rejected')) {
                tab = 'rejected';
            }
            return `/worklogs-all?tab=${tab}${worklogId ? `&worklogId=${worklogId}` : ''}`;
        }

        if (type === NotificationType.PROJECT || metadata.module === 'project') {
            const projectId = metadata.projectId || '';
            return projectId ? `/projects/${projectId}` : '/projects';
        }

        if (type === NotificationType.TASK || metadata.module === 'todotask' || metadata.module === 'task') {
            const taskId = metadata.taskId || '';
            const tab = metadata.tab || (message.includes('informed') ? 'informed' : 'my-tasks');
            return `/todotask?tab=${tab}${taskId ? `&taskId=${taskId}` : ''}`;
        }

        if (type === NotificationType.NOTICEBOARD || metadata.module === 'noticeboard') {
            const noticeId = metadata.noticeId || '';
            return noticeId ? `/notice-board?noticeId=${noticeId}` : '/notice-board';
        }

        if (type === NotificationType.LEAVE || metadata.module === 'leave') {
            const leaveId = metadata.leaveId || '';
            return `/time-off${leaveId ? `?leaveId=${leaveId}` : ''}`;
        }

        if (type === NotificationType.DSA || metadata.module === 'dsa') {
            const projectId = metadata.projectId;
            const dsaId = metadata.dsaId || '';
            return projectId ? `/projects/${projectId}/dsa${dsaId ? `?dsaId=${dsaId}` : ''}` : '/projects';
        }

        return '';
    };

    const handleNotificationClick = async (item: any) => {
        // 1. Mark as read immediately if not yet read
        if (!item.isRead) {
            try {
                await updateNotifications({ id: item.id, userId });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                refetch();
            } catch (e) {
                console.error('Failed to mark notification as read:', e);
            }
        }

        // 2. Close drawer
        onItemClick?.();

        // 3. Resolve destination path
        const targetUrl = resolveNotificationTarget(item);
        if (!targetUrl) return;

        // 4. Dispatch event for open pages to react immediately
        window.dispatchEvent(
            new CustomEvent('navigateToEntity', {
                detail: {
                    targetUrl,
                    type: item.notification?.type,
                    metadata: item.notification?.metadata,
                },
            })
        );

        // 5. Navigate cleanly without hard page refresh
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            try {
                const urlObj = new URL(targetUrl);
                if (urlObj.origin === window.location.origin) {
                    navigate(urlObj.pathname + urlObj.search + urlObj.hash);
                    return;
                }
            } catch (e) {
                // fallback
            }
            window.location.href = targetUrl;
        } else {
            navigate(targetUrl);
        }
    };

    // Render grouped view with cards
    const renderGroupedView = (notificationList: any[], counts: Record<NotificationType, number>, showMarkAsRead: boolean) => {
        // If a type is selected, show list view
        if (selectedType) {
            return (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Button 
                                icon={<ArrowLeftOutlined />}
                                onClick={() => setSelectedType(undefined)}
                                type="link"
                                style={{ padding: 0 }}
                            >
                                Back to Groups
                            </Button>
                            {showMarkAsRead && notificationList.length > 0 && (
                                <Button 
                                    icon={<CheckOutlined />}
                                    onClick={async () => {
                                        await markAllAsRead({ userId, type: selectedType }, {
                                            onSuccess: () => {
                                                antdNotification.success({
                                                    message: 'Success',
                                                    description: `All ${typeLabels[selectedType]} notifications marked as read`,
                                                    placement: 'top',
                                                });
                                                refetch();
                                            }
                                        });
                                    }}
                                    type="primary"
                                    size="small"
                                    style={{ fontSize: '12px' }}
                                >
                                    Mark All as Read
                                </Button>
                            )}
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                    </div>
                    <List
                        itemLayout="horizontal"
                        dataSource={notificationList}
                        locale={{ emptyText: 'No notifications in this group' }}
                        renderItem={(item: any) => renderNotificationItem(item, showMarkAsRead)}
                    />
                </>
            );
        }

        // Show grouped cards - single column for sidebar
        return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {Object.entries(counts).map(([type, count]) => {
                    if (count === 0) return null;
                    const notifType = type as NotificationType;
                    return (
                        <Card
                            key={type}
                            hoverable
                            onClick={() => setSelectedType(notifType)}
                            style={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderLeft: `4px solid ${typeColors[notifType]}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                            styles={{ body: { padding: '12px 16px' } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    fontSize: '24px', 
                                    flexShrink: 0,
                                    width: '42px',
                                    height: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: typeBgColors[notifType],
                                    borderRadius: '50%'
                                }}>
                                    {typeIcons[notifType]}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '2px' }}>
                                        {typeLabels[notifType]}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: typeColors[notifType] }}>
                                            {count}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                            new {count === 1 ? 'notification' : 'notifications'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </Space>
        );
    };

    // Render notification item with type badge
    const renderNotificationItem = (item: any, showMarkAsRead: boolean = false) => {
        const notifType: NotificationType = item.notification?.type || NotificationType.GENERAL;
        const typeIcon = typeIcons[notifType];
        const typeColor = typeColors[notifType];

        return (
            <List.Item
                onClick={() => {
                    if (item.notification.link) {
                        handleNotificationClick(item);
                    }
                }}
                style={{ 
                    cursor: 'pointer',
                    padding: '10px 12px',
                    marginBottom: '4px',
                    borderRadius: '8px',
                    background: showMarkAsRead ? '#f0f7ff' : 'transparent',
                    border: showMarkAsRead ? '1px solid #e6f4ff' : '1px solid transparent',
                    transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = showMarkAsRead ? '#e6f4ff' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = showMarkAsRead ? '#f0f7ff' : 'transparent';
                }}
            >
                <List.Item.Meta
                    avatar={
                        <Badge dot={showMarkAsRead} offset={[-2, 4]} color="#1890ff">
                            <div style={{ marginTop: '4px' }}>{typeIcon}</div>
                        </Badge>
                    }
                    title={
                        <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: showMarkAsRead ? 600 : 500, lineHeight: '1.4' }}>
                            {item.notification.message}
                        </div>
                    }
                    description={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                    fontSize: '10px', 
                                    color: typeColor, 
                                    background: `${typeColor}15`, 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontWeight: 600,
                                }}>
                                    {typeLabels[notifType]}
                                </span>
                                <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                                    {calculateDays(item.createdAt)}
                                </span>
                            </div>
                            {showMarkAsRead && (
                                <span
                                    style={{
                                        color: '#1890ff',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                    }}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await updateNotifications({ id: item.id, userId }, {
                                            onSuccess: () => { refetch(); }
                                        });
                                    }}
                                >
                                    Mark as read
                                </span>
                            )}
                        </div>
                    }
                />
            </List.Item>
        );
    };

    const items = [
        {
            key: "unread",
            label: (
                <Space>
                    <AppstoreOutlined />
                    <span>Unread ({unread.length})</span>
                </Space>
            ),
            children: (
                <>
                    {!selectedType && unread.length > 0 && (
                        <div style={{ 
                            marginBottom: 12,
                            padding: '8px 12px',
                            background: '#e6f7ff',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#1890ff',
                            textAlign: 'center'
                        }}>
                        </div>
                    )}
                    {unread.length === 0 && !selectedType && (
                        <div style={{ 
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: '#999'
                        }}>
                            🎉 No unread notifications
                        </div>
                    )}
                    {renderGroupedView(unread, unreadCounts, true)}
                </>
            ),
        },
        {
            key: "read",
            label: (
                <Space>
                    <AppstoreOutlined />
                    <span>Past Notifications ({read.length})</span>
                </Space>
            ),
            children: (
                <>
                    {!selectedType && read.length > 0 && (
                        <div style={{ 
                            marginBottom: 12,
                            padding: '8px 12px',
                            background: '#e6f7ff',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#1890ff',
                            textAlign: 'center'
                        }}>
                       </div>
                    )}
                    {read.length === 0 && !selectedType && (
                        <div style={{ 
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: '#999'
                        }}>
                            No past notifications
                        </div>
                    )}
                    {renderGroupedView(read, readCounts, false)}
                </>
            ),
        },
    ];

    return (
        <div>
            {!isPushSubscribed && pushSupported && (
                <div style={{
                    padding: '10px 14px',
                    background: '#f0f5ff',
                    border: '1px solid #adc6ff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BellOutlined style={{ color: '#2f54eb', fontSize: '16px' }} />
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d39c4' }}>
                                Background Notifications
                            </div>
                            <div style={{ fontSize: '11px', color: '#595959' }}>
                                Receive alerts even when Artha is closed.
                            </div>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        size="small"
                        loading={pushLoading}
                        onClick={handleTogglePush}
                        style={{ fontSize: '11px', borderRadius: '4px' }}
                    >
                        Enable
                    </Button>
                </div>
            )}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key);
                    setSelectedType(undefined);
                }}
                items={items}
            />

            {/* Brave Setup Guide Modal - ONLY for Brave browser */}
            {isBrave && (
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SettingOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>Enable Background Notifications in Brave</span>
                        </div>
                    }
                    open={showBraveModal}
                    onCancel={() => setShowBraveModal(false)}
                    footer={[
                        <Button key="close" onClick={() => setShowBraveModal(false)}>
                            Close
                        </Button>,
                        <Button
                            key="retry"
                            type="primary"
                            loading={pushLoading}
                            onClick={async () => {
                                setShowBraveModal(false);
                                await handleTogglePush();
                            }}
                        >
                            Check & Enable Again
                        </Button>,
                    ]}
                    width={560}
                >
                    <div style={{ padding: '8px 0' }}>
                        <div style={{
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#0050b3',
                            marginBottom: '16px',
                            lineHeight: 1.5,
                        }}>
                            ℹ️ <b>Browser Security Notice:</b> For security, browsers prevent websites from directly opening internal <code>brave://</code> links automatically. We&apos;ve copied the settings address to your clipboard!
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#262626' }}>
                                Settings Address:
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Input
                                    value="brave://settings/privacy"
                                    readOnly
                                    style={{ background: '#f5f5f5', fontFamily: 'monospace' }}
                                />
                                <Button
                                    type="primary"
                                    icon={<CopyOutlined />}
                                    onClick={() => {
                                        navigator.clipboard.writeText('brave://settings/privacy');
                                        message.success('Settings link copied to clipboard!');
                                    }}
                                >
                                    Copy Link
                                </Button>
                                <Button
                                    onClick={() => {
                                        try {
                                            window.open('brave://settings/privacy', '_blank');
                                        } catch (e) {}
                                    }}
                                >
                                    Try Open
                                </Button>
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#262626' }}>
                            Quick 3-Step Setup:
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#1677ff',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}>1</span>
                                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                                    Open a new tab with <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>Ctrl</kbd> + <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>T</kbd> (or <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>Cmd</kbd> + <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>T</kbd> on Mac).
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#1677ff',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}>2</span>
                                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                                    Paste <b><code>brave://settings/privacy</code></b> into the address bar and press <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>Enter</kbd>.
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#1677ff',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}>3</span>
                                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                                    Scroll down to <b>&quot;Use Google services for push messaging&quot;</b> and toggle it <b>ON</b>. Then click the blue <b>&quot;Relaunch&quot;</b> button that appears.
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Notification;