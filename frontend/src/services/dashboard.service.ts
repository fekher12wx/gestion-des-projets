import api from './api';
import type { DashboardData } from '../types';

class DashboardService {
    private readonly baseUrl = '/dashboard';

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardData> {
        const response = await api.get<DashboardData>(`${this.baseUrl}/stats`);
        return response.data;
    }
}

export default new DashboardService();
