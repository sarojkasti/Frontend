export interface UserRoleType {
    id?: number;
    name?: string;
    description?: string;
}

export interface UserType {
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    username?: string;
    email?: string;
    name?: string;
    avatar?: string | null;
    status?: string;
    isTwoFAEnabled?: boolean;
    role?: UserRoleType;
    hourlyRate?: number;
    joinedDate?: string;
}