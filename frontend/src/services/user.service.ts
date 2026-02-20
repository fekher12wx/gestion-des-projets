import apiClient from './api';
import type { User, PaginatedResponse, UserFilters } from '../types';

class UserService {
    async getUsers(filters: UserFilters = {}): Promise<{ users: User[], pagination: any }> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.roleId) params.append('roleId', filters.roleId);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const response = await apiClient.get<{ users: User[], pagination: any }>(`/users?${params.toString()}`);
        return response.data;
    }

    async getUser(id: string): Promise<User> {
        const response = await apiClient.get<{ user: User }>(`/users/${id}`);
        return response.data.user;
    }

    async createUser(data: Partial<User> & { password?: string }): Promise<User> {
        const response = await apiClient.post<{ user: User }>('/users', data);
        return response.data.user;
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const response = await apiClient.put<{ user: User }>(`/users/${id}`, data);
        return response.data.user;
    }

    async deleteUser(id: string): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    }

    async assignRole(id: string, roleId: string): Promise<User> {
        const response = await apiClient.put<{ user: User }>(`/users/${id}/role`, { roleId });
        return response.data.user;
    }
}

export default new UserService();
