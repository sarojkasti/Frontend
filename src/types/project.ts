import { TaskType } from "./task";
import { UserType } from "./user";

export interface NatureOfWorkType {
    id: string;
    name: string;
    shortName: string;
    groupId?: string | null;
    group?: NatureOfWorkGroupType | null;
    isActive?: boolean;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface NatureOfWorkGroupType {
    id: string;
    name: string;
    description?: string;
    rank?: number;
    createdAt?: string;
    updatedAt?: string;
}

export enum ProjectStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    ARCHIVED = "archived",
    COMPLETED = "completed",
    SIGNED_OFF = "signed_off",
}

export interface ProjectType {
    id: number;
    name: string;
    description: string;
    status: "active" | "suspended" | "archived" | "completed" | "signed_off";
    natureOfWork: NatureOfWorkType | string;
    natureOfWorkGroup?: NatureOfWorkGroupType | null;
    natureOfWorkGroupId?: string | null;
    fiscalYear: number;
    startingDate: string;
    endingDate: string;
    startingDateNepali?: string; // YYYY-MM-DD in BS
    endingDateNepali?: string; // YYYY-MM-DD in BS
    startingDateFormatted?: string; // Human-readable nepali date
    endingDateFormatted?: string; // Human-readable nepali date
    allowSubtaskWorklog?: boolean;
    countsForAvailability?: boolean;
    isPaymentDone?: boolean;
    isPaymentTemporarilyEnabled?: boolean;
    projectLead?: UserType;
    projectManager?: UserType;
    users?: UserType[];
    tasks?: TaskType[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ClientPortalProject {
    id: string;
    name: string;
    description: string;
    status: "active" | "suspended" | "archived" | "completed" | "signed_off";
    natureOfWork: string | null;
    fiscalYear: number;
    startingDate: string;
    endingDate: string;
    isPaymentDone: boolean;
    isPaymentTemporarilyEnabled: boolean;
    customerName: string | null;
    customerId: string | null;
    totalTasks: number;
    completedTasks: number;
    progress: number;
    reports?: {
        total: number;
        accessible: number;
        pending: number;
    };
}

export interface ClientCompanyDetails {
    id: string;
    name: string;
    shortName?: string;
    panNo: string;
    registeredDate: string;
    status: string;
    address: {
        country: string;
        state: string;
        district: string;
        localJurisdiction: string;
        wardNo?: string;
        locality: string;
    };
    legalStatus: string | null;
    businessSize: string | null;
    industryNature: string | null;
    contact: {
        telephoneNo?: string;
        mobileNo?: string;
        email?: string;
        website?: string;
    };
    projectSummary: {
        total: number;
        [key: string]: number;
    };
}