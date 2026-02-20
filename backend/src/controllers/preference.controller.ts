import { Request, Response } from 'express';
import preferenceService from '../services/preference.service';

export class PreferenceController {
    async getPreferences(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const preferences = await preferenceService.getPreferences(userId);
            res.json({ preferences });
        } catch (error: any) {
            console.error('Get preferences error:', error);
            res.status(500).json({ message: 'Failed to fetch preferences', error: error.message });
        }
    }

    async updatePreferences(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { theme, language, dateFormat, timezone, notifications } = req.body;

            const preferences = await preferenceService.updatePreferences(userId, {
                theme,
                language,
                dateFormat,
                timezone,
                notifications,
            });

            res.json({ message: 'Preferences updated successfully', preferences });
        } catch (error: any) {
            console.error('Update preferences error:', error);
            res.status(500).json({ message: 'Failed to update preferences', error: error.message });
        }
    }
}

export default new PreferenceController();
