import type { ReactNode } from 'react';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    canEdit: boolean;
    allowedSecteurs: string[];
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
    role: {
        id: string;
        name: string;
        description: string;
    };
    permissions?: Array<{ resource: string; action: string }>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface UserFilters {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
}

export type { ReactNode };

// POI File Management Types
export interface Project {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
    clientId: string;
    client?: Client;
    createdAt?: string;
}

export interface Client {
    id: string;
    name: string;
    code: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
}

export interface Region {
    id: string;
    name: string;
    code: string;
    department?: string;
}

export interface Stage {
    id: string;
    stageNumber: number;
    name: string;
    description?: string;
    expectedDurationDays?: number;
}

export interface FileStage {
    id: string;
    poiFileId: string;
    stageId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startedAt?: string;
    completedAt?: string;
    completedBy?: string;
    stage: Stage;
}

export interface PoiFile {
    id: string;
    fileNumber: string;
    projectId: string;
    regionId: string;
    technicianId?: string;
    studyManagerId?: string;
    businessManagerId?: string;
    currentStage: number;
    status: string;
    receptionDate?: string;
    launchDate?: string;
    validationDate?: string;
    sendingDate?: string;
    closingDate?: string;
    expectedCompletionDate?: string;
    notes?: string;
    isPriority: boolean;
    hasBlockers: boolean;
    isNonCompliant: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Relations
    project?: Project;
    region?: Region;
    technician?: User;
    studyManager?: User;
    businessManager?: User;
    fileStages?: FileStage[];
}

export interface PoiFileFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
    regionId?: string;
    currentStage?: number;
    technicianId?: string;
    studyManagerId?: string;
    businessManagerId?: string;
    assignedToMe?: boolean;
    isPriority?: boolean;
}

// Alert Notification Types
export type AlertType =
    | 'FILE_ASSIGNED'
    | 'FILE_STATUS_CHANGED'
    | 'FILE_STAGE_COMPLETED'
    | 'DEADLINE_APPROACHING'
    | 'DEADLINE_OVERDUE'
    | 'COMMENT_ADDED'
    | 'ATTACHMENT_ADDED'
    | 'PRIORITY_SET'
    | 'GENERAL';

export interface Alert {
    id: string;
    userId: string;
    type: AlertType;
    title: string;
    message: string;
    poiFileId?: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    poiFile?: {
        id: string;
        fileNumber: string;
        status: string;
        currentStage: number;
    };
}

export interface AlertsResponse {
    alerts: Alert[];
    total: number;
    limit: number;
    offset: number;
}

// Report Types
export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    regionId?: string;
    userId?: string;
}

export interface FileStatusReport {
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    ON_HOLD: number;
    CANCELLED: number;
    total: number;
}

export interface PerformanceMetrics {
    totalFiles: number;
    completedFiles: number;
    overdueFiles: number;
    avgCompletionDays: number;
    completionRate: number;
}

export interface StageAnalysis {
    stageNumber: number;
    stageName: string;
    fileCount: number;
}

export interface UserProductivity {
    userId: string;
    userName: string;
    role: string;
    assignedFiles: number;
    completedFiles: number;
    completionRate: number;
    avgCompletionDays: number;
}

// Dashboard Types
export interface DashboardStats {
    activeFiles: number;
    pendingFiles: number;
    completedFiles: number;
    totalProjects: number;
    totalFiles: number;
    userAssignments: number;
    completionRate: string;
}

export interface DashboardData {
    stats: DashboardStats;
    stageDistribution: Array<{ stage: number; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    recentFiles: Array<{
        id: string;
        fileNumber: string;
        status: string;
        currentStage: number;
        project: string | null;
        region: string | null;
        technician: string | null;
        createdAt: Date;
    }>;
}

// Search Types
export interface SearchResultItem {
    id: string;
    [key: string]: any;
}

export interface SearchResults {
    poiFiles: Array<{ id: string; fileNumber: string; status: string; currentStage: number; project?: string; region?: string }>;
    projects: Array<{ id: string; name: string; code: string; status: string; client?: string }>;
    clients: Array<{ id: string; name: string; code: string; isActive: boolean }>;
    regions: Array<{ id: string; name: string; code: string; department?: string | null }>;
    users: Array<{ id: string; firstName: string; lastName: string; email: string; role?: string }>;
}

// Saved Filter Types
export interface SavedFilter {
    id: string;
    userId: string;
    name: string;
    entity: string;
    filters: any;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

// User Preference Types
export interface NotificationPreferences {
    email: boolean;
    inApp: boolean;
    fileAssigned: boolean;
    statusChanged: boolean;
    deadlineApproaching: boolean;
    comments: boolean;
}

export interface UserPreferences {
    id: string;
    userId: string;
    theme: string;
    language: string;
    dateFormat: string;
    timezone: string;
    notifications: NotificationPreferences;
    createdAt: string;
    updatedAt: string;
}

// System Setting Types
export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    type: string;
    label: string;
    group: string;
    createdAt: string;
    updatedAt: string;
}

