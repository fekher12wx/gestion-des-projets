import apiClient from './api';
import type { PoiFile, PoiFileFilters } from '../types';

interface PoiFilesResponse {
    poiFiles: PoiFile[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

class PoiFileService {
    /**
     * Get POI files with pagination and filters
     */
    async getPoiFiles(filters: PoiFileFilters = {}): Promise<PoiFilesResponse> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.projectId) params.append('projectId', filters.projectId);
        if (filters.regionId) params.append('regionId', filters.regionId);
        if (filters.currentStage) params.append('currentStage', filters.currentStage.toString());
        if (filters.technicianId) params.append('technicianId', filters.technicianId);
        if (filters.isPriority !== undefined) params.append('isPriority', filters.isPriority.toString());

        const response = await apiClient.get<PoiFilesResponse>(`/poi-files?${params.toString()}`);
        return response.data;
    }

    /**
     * Get a single POI file by ID
     */
    async getPoiFile(id: string): Promise<PoiFile> {
        const response = await apiClient.get<{ poiFile: PoiFile }>(`/poi-files/${id}`);
        return response.data.poiFile;
    }

    /**
     * Create a new POI file
     */
    async createPoiFile(data: Partial<PoiFile>): Promise<PoiFile> {
        const response = await apiClient.post<{ poiFile: PoiFile }>('/poi-files', data);
        return response.data.poiFile;
    }

    /**
     * Update a POI file
     */
    async updatePoiFile(id: string, data: Partial<PoiFile>): Promise<PoiFile> {
        const response = await apiClient.put<{ poiFile: PoiFile }>(`/poi-files/${id}`, data);
        return response.data.poiFile;
    }

    /**
     * Delete a POI file
     */
    async deletePoiFile(id: string): Promise<void> {
        await apiClient.delete(`/poi-files/${id}`);
    }

    /**
     * Advance POI file to the next stage
     */
    async advanceStage(id: string): Promise<{ currentStage: number }> {
        const response = await apiClient.put<{ currentStage: number }>(`/poi-files/${id}/advance-stage`);
        return response.data;
    }
}

export default new PoiFileService();
