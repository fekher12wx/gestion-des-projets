import apiClient from './api';
import type { Region } from '../types';

class RegionService {
    async getRegions(): Promise<Region[]> {
        const response = await apiClient.get<{ regions: Region[] }>('/regions');
        return response.data.regions;
    }

    async getAll(): Promise<Region[]> {
        return this.getRegions();
    }

    async getRegion(id: string): Promise<Region> {
        const response = await apiClient.get<{ region: Region }>(`/regions/${id}`);
        return response.data.region;
    }

    async create(regionData: { name: string; code: string }): Promise<Region> {
        const response = await apiClient.post<{ region: Region }>('/regions', regionData);
        return response.data.region;
    }

    async update(id: string, regionData: { name: string; code: string }): Promise<Region> {
        const response = await apiClient.put<{ region: Region }>(`/regions/${id}`, regionData);
        return response.data.region;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/regions/${id}`);
    }
}

export default new RegionService();
