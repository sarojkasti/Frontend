// Notification types matching backend enum
export enum NotificationType {
    WORKLOG = 'worklog',
    NOTICEBOARD = 'noticeboard',
    TASK = 'task',
    PROJECT = 'project',
    GENERAL = 'general',
    SYSTEM = 'system',
    CLIENT = 'client',
    DSA = 'dsa',
    LEAVE = 'leave',
    TRAINING = 'training',
    MEETING = 'meeting'
}

// Notification interface
export interface Notification {
    id: string;
    message: string;
    link?: string;
    type: NotificationType;
    metadata?: Record<string, any>;
    createdAt: string;
}

// User notification interface (what we get from backend)
export interface UserNotification {
    id: string;
    notification: Notification;
    isRead: boolean;
    readAt?: string;
    isArchived: boolean;
    createdAt: string;
    updatedAt?: string;
    user: {
        id: string;
        name?: string;
        email?: string;
    };
}
