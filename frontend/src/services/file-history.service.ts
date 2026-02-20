import apiClient from './api';

export interface FileHistory {
    id: string;
    poiFileId: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    action: string;
    description?: string;
    oldValues?: any;
    newValues?: any;
    createdAt: string;
}

export interface FileHistoryFilters {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    poiFileId?: string;
    startDate?: string;
    endDate?: string;
}

interface FileHistoryResponse {
    history: FileHistory[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

class FileHistoryService {
    /**
     * Get history for a specific POI file
     */
    async getFileHistory(poiFileId: string, filters?: FileHistoryFilters): Promise<FileHistoryResponse> {
        const params = new URLSearchParams();

        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.action) params.append('action', filters.action);

        const response = await apiClient.get<FileHistoryResponse>(
            `/poi-files/${poiFileId}/history?${params.toString()}`
        );
        return response.data;
    }

    /**
     * Get all history (admin view)
     */
    async getAllHistory(filters?: FileHistoryFilters): Promise<FileHistoryResponse> {
        const params = new URLSearchParams();

        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.action) params.append('action', filters.action);
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.poiFileId) params.append('poiFileId', filters.poiFileId);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await apiClient.get<FileHistoryResponse>(
            `/file-history?${params.toString()}`
        );
        return response.data;
    }
}

export default new FileHistoryService();
