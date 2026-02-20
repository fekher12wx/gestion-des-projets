import api from './api';
import type { Alert, AlertsResponse, AlertType } from '../types';

class AlertService {
    private readonly baseUrl = '/alerts';

    /**
     * Get user's alerts with optional filtering
     */
    async getAlerts(params?: {
        isRead?: boolean;
        type?: AlertType;
        limit?: number;
        offset?: number;
    }): Promise<AlertsResponse> {
        const response = await api.get<AlertsResponse>(this.baseUrl, { params });
        return response.data;
    }

    /**
     * Get count of unread alerts
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get<{ count: number }>(`${this.baseUrl}/unread-count`);
        return response.data.count;
    }

    /**
     * Mark a specific alert as read
     */
    async markAsRead(alertId: string): Promise<Alert> {
        const response = await api.put<{ alert: Alert }>(`${this.baseUrl}/${alertId}/read`);
        return response.data.alert;
    }

    /**
     * Mark all alerts as read
     */
    async markAllAsRead(): Promise<number> {
        const response = await api.put<{ count: number }>(`${this.baseUrl}/mark-all-read`);
        return response.data.count;
    }

    /**
     * Delete a specific alert
     */
    async deleteAlert(alertId: string): Promise<void> {
        await api.delete(`${this.baseUrl}/${alertId}`);
    }
}

export default new AlertService();
