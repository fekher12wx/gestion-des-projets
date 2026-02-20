import apiClient from './api';
import type { Client } from '../types';

class ClientService {
    async getAll(): Promise<Client[]> {
        const response = await apiClient.get<{ clients: Client[] }>('/clients');
        return response.data.clients;
    }

    async getById(id: string): Promise<Client> {
        const response = await apiClient.get<{ client: Client }>(`/clients/${id}`);
        return response.data.client;
    }

    async create(clientData: { name: string; code: string; contactEmail?: string; contactPhone?: string }): Promise<Client> {
        const response = await apiClient.post<{ client: Client }>('/clients', clientData);
        return response.data.client;
    }

    async update(id: string, clientData: { name: string; code: string; contactEmail?: string; contactPhone?: string }): Promise<Client> {
        const response = await apiClient.put<{ client: Client }>(`/clients/${id}`, clientData);
        return response.data.client;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/clients/${id}`);
    }
}

export default new ClientService();
