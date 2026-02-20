import api from './api';
import type { SavedFilter } from '../types';

class SavedFilterService {
    private readonly baseUrl = '/saved-filters';

    async getFilters(entity?: string): Promise<SavedFilter[]> {
        const response = await api.get<{ filters: SavedFilter[] }>(this.baseUrl, {
            params: entity ? { entity } : undefined,
        });
        return response.data.filters;
    }

    async createFilter(data: {
        name: string;
        entity: string;
        filters: any;
        isDefault?: boolean;
    }): Promise<SavedFilter> {
        const response = await api.post<{ filter: SavedFilter }>(this.baseUrl, data);
        return response.data.filter;
    }

    async updateFilter(
        id: string,
        data: { name?: string; filters?: any; isDefault?: boolean }
    ): Promise<SavedFilter> {
        const response = await api.put<{ filter: SavedFilter }>(`${this.baseUrl}/${id}`, data);
        return response.data.filter;
    }

    async deleteFilter(id: string): Promise<void> {
        await api.delete(`${this.baseUrl}/${id}`);
    }
}

export default new SavedFilterService();
