import api from './api';
import type { UserPreferences } from '../types';

class PreferenceService {
    private readonly baseUrl = '/preferences';

    async getPreferences(): Promise<UserPreferences> {
        const response = await api.get<{ preferences: UserPreferences }>(this.baseUrl);
        return response.data.preferences;
    }

    async updatePreferences(data: {
        theme?: string;
        language?: string;
        dateFormat?: string;
        timezone?: string;
        notifications?: any;
    }): Promise<UserPreferences> {
        const response = await api.put<{ preferences: UserPreferences }>(this.baseUrl, data);
        return response.data.preferences;
    }
}

export default new PreferenceService();
