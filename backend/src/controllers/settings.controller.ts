import { Request, Response } from 'express';
import settingsService from '../services/settings.service';

export class SettingsController {
    async getAllSettings(_req: Request, res: Response): Promise<void> {
        try {
            const settings = await settingsService.getAllSettings();
            res.json({ settings });
        } catch (error: any) {
            console.error('Get settings error:', error);
            res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
        }
    }

    async getSettingsByGroup(req: Request, res: Response): Promise<void> {
        try {
            const { group } = req.params;
            const settings = await settingsService.getSettingsByGroup(group as string);
            res.json({ settings });
        } catch (error: any) {
            console.error('Get settings by group error:', error);
            res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
        }
    }

    async updateSetting(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            const { value } = req.body;

            if (value === undefined) {
                res.status(400).json({ message: 'value is required' });
                return;
            }

            const setting = await settingsService.updateSetting(key as string, String(value));
            res.json({ message: 'Setting updated successfully', setting });
        } catch (error: any) {
            console.error('Update setting error:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to update setting', error: error.message });
            }
        }
    }
}

export default new SettingsController();
