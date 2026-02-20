import apiClient from './api';

export interface Role {
    id: string;
    name: string;
    description: string;
}

class RoleService {
    async getRoles(): Promise<Role[]> {
        const response = await apiClient.get<{ roles: Role[] }>('/roles');
        return response.data.roles;
    }

    async getRole(id: string): Promise<Role> {
        const response = await apiClient.get<{ role: Role }>(`/roles/${id}`);
        return response.data.role;
    }
}

export default new RoleService();
