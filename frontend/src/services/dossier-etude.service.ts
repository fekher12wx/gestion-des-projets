import apiClient from './api';

export interface ColumnConfig {
    key: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'number';
    required?: boolean;
}

export interface DossierEtude {
    id: string;
    secteur: string;
    data: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface DossierEtudeListResponse {
    dossiers: DossierEtude[];
    columnConfig: ColumnConfig[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

class DossierEtudeService {
    async getAll(params: {
        secteur?: string;
        page?: number;
        limit?: number;
        search?: string;
    } = {}): Promise<DossierEtudeListResponse> {
        const query = new URLSearchParams();
        if (params.secteur) query.append('secteur', params.secteur);
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);

        const response = await apiClient.get<DossierEtudeListResponse>(`/dossier-etudes?${query.toString()}`);
        return response.data;
    }

    async create(secteur: string, data: Record<string, any>): Promise<DossierEtude> {
        const response = await apiClient.post<{ dossier: DossierEtude }>('/dossier-etudes', { secteur, data });
        return response.data.dossier;
    }

    async update(id: string, data: Record<string, any>): Promise<DossierEtude> {
        const response = await apiClient.put<{ dossier: DossierEtude }>(`/dossier-etudes/${id}`, { data });
        return response.data.dossier;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/dossier-etudes/${id}`);
    }
}

export default new DossierEtudeService();
