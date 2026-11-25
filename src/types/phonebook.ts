export interface PhonebookUserSummary {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: {
    id: string;
    name: string;
    displayName?: string;
  };
}

export interface PhonebookRoleSummary {
  id: string;
  name: string;
  displayName?: string;
}

export interface PhonebookCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface PhonebookEntry {
  id: string;
  name: string;
  phoneNumber: string;
  secondaryPhone?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  isShared: boolean;
  sharedWithUsers: PhonebookUserSummary[];
  sharedWithRoles: PhonebookRoleSummary[];
  createdBy?: string;
  updatedBy?: string;
  creator?: PhonebookUserSummary | null;
  updater?: PhonebookUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhonebookClientContact {
  id: string;
  name: string;
  shortName?: string | null;
  status: string;
  contactPerson?: string | null;
  contactPersonDesignation?: string | null;
  contactPersonPhone?: string | null;
  activeProjects: string[];
}

export interface PhonebookClientsResponse {
  canViewClients: boolean;
  currentFiscalYear: {
    id: string;
    name: string;
  } | null;
  items: PhonebookClientContact[];
}

export interface PhonebookFieldChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface PhonebookHistoryItem {
  id: string;
  entryId: string;
  action: "created" | "updated";
  editedAt: string;
  editedBy?: PhonebookUserSummary | null;
  changes: PhonebookFieldChange[];
}

export interface PhonebookShareOptions {
  users: PhonebookUserSummary[];
  roles: PhonebookRoleSummary[];
}

export interface CreatePhonebookPayload {
  name: string;
  phoneNumber: string;
  secondaryPhone?: string;
  categoryId?: string;
  notes?: string;
  isShared?: boolean;
  sharedWithUserIds?: string[];
  sharedWithRoleIds?: string[];
}

export interface UpdatePhonebookPayload extends Partial<CreatePhonebookPayload> {}

export interface CreatePhonebookCategoryPayload {
  name: string;
  description?: string;
}
