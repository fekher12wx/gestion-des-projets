import api from './api';
import type { SystemSetting } from '../types';

class SettingsService {
    private readonly baseUrl = '/settings';

    async getAllSettings(): Promise<SystemSetting[]> {
        const response = await api.get<{ settings: SystemSetting[] }>(this.baseUrl);
        return response.data.settings;
    }

    async getSettingsByGroup(group: string): Promise<SystemSetting[]> {
        const response = await api.get<{ settings: SystemSetting[] }>(`${this.baseUrl}/group/${group}`);
        return response.data.settings;
    }

    async updateSetting(key: string, value: string): Promise<SystemSetting> {
        const response = await api.put<{ setting: SystemSetting }>(`${this.baseUrl}/${key}`, { value });
        return response.data.setting;
    }
}

export default new SettingsService();
