export interface LeaveType {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: {
      name: string;
      displayName?: string;
    };
  };
  leaveType?: {
    id: string;
    name: string;
    maxDaysPerYear?: number;
    isEmergency?: boolean;
    allowCarryOver?: boolean;
    maxCarryOverDays?: number;
    isActive: boolean;
  };
  startDate: string;
  endDate: string;
  isCustomDates?: boolean;
  customDates?: string[];
  type: string;
  reason?: string;
  status:
    | 'pending'
    | 'clarification_requested'
    | 'approved_by_manager'
    | 'approved'
    | 'rejected';
  // Fractional Leave Support
  isFractional?: boolean;
  fractionalType?: 'first_half' | 'second_half' | 'custom_hours';
  startTime?: string;
  endTime?: string;
  fractionalDuration?: number;

  requestedManagerId?: string;
  managerApproverId?: string;
  adminApproverId?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  canOverride?: boolean; // For frontend display logic
  createdAt: string;
  updatedAt: string;

  // Extended fields for improved UI - with user relations
  requestedManager?: {
    id: string;
    name: string;
    email: string;
  };
  managerApprover?: {
    id: string;
    name: string;
    email: string;
  };
  adminApprover?: {
    id: string;
    name: string;
    email: string;
  };
  managerApprovalTime?: string;
  adminApprovalTime?: string;
  notifyAdmins?: string[]; // IDs of admins to notify

  // Clarification Support
  clarificationNotes?: string;
  clarificationResponse?: string;
  clarificationRequestedById?: string;
  clarificationRequestedBy?: {
    id: string;
    name: string;
    email: string;
  };
  clarificationRequestedAt?: string;
  clarificationRespondedAt?: string;
}

export interface CreateLeaveDto {
  startDate?: string;
  endDate?: string;
  isCustomDates?: boolean;
  customDates?: string[];
  type: string;
  reason?: string;
  requestedManagerId: string;
  // Fractional leave
  isFractional?: boolean;
  fractionalType?: 'first_half' | 'second_half' | 'custom_hours';
  startTime?: string;
  endTime?: string;
  fractionalDuration?: number;
}

export interface UpdateLeaveDto {
  startDate?: string;
  endDate?: string;
  type?: string;
  reason?: string;
}

// Leave Balance Types
export interface LeaveBalance {
  leaveType: {
    id: string;
    name: string;
    maxDaysPerYear?: number;
    isEmergency?: boolean;
    allowCarryOver?: boolean;
    maxCarryOverDays?: number;
    isActive: boolean;
  };
  allocatedDays: number;
  carriedOverDays: number;
  totalAvailableDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface AllocateLeaveDto {
  userId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  carriedOverDays?: number;
}

export interface CarryOverLeaveDto {
  fromYear: number;
  toYear: number;
  userIds?: string[];
  leaveTypeIds?: string[];
}

// Audit Ledger Transaction Item
export interface LeaveBalanceLedgerItem {
  id: string;
  userId: string;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
  };
  year: number;
  action:
    | 'ALLOCATION'
    | 'CARRY_OVER'
    | 'LEAVE_RESERVATION'
    | 'LEAVE_CONSUMPTION'
    | 'LEAVE_CANCELLATION'
    | 'LEAVE_REJECTION'
    | 'MANUAL_ADJUSTMENT';
  changeType: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
  days: number;
  resultingBalance: number;
  referenceId?: string;
  remarks?: string;
  createdById?: string;
  createdAt: string;
}
