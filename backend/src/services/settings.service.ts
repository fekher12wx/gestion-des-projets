import { PrismaClient, SystemSetting } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = [
    { key: 'app_name', value: 'POI FTTH Management', type: 'string', label: 'Application Name', group: 'general' },
    { key: 'max_file_upload_size', value: '10', type: 'number', label: 'Max File Upload Size (MB)', group: 'general' },
    { key: 'session_timeout', value: '480', type: 'number', label: 'Session Timeout (minutes)', group: 'security' },
    { key: 'enable_email_notifications', value: 'true', type: 'boolean', label: 'Enable Email Notifications', group: 'notifications' },
    { key: 'deadline_warning_days', value: '3', type: 'number', label: 'Deadline Warning Days', group: 'notifications' },
    { key: 'default_language', value: 'en', type: 'string', label: 'Default Language', group: 'general' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', label: 'Maintenance Mode', group: 'general' },
    { key: 'password_min_length', value: '8', type: 'number', label: 'Minimum Password Length', group: 'security' },
];

export class SettingsService {
    async seedDefaults(): Promise<void> {
        const count = await prisma.systemSetting.count();
        if (count === 0) {
            await prisma.systemSetting.createMany({
                data: DEFAULT_SETTINGS,
            });
        }
    }

    async getAllSettings(): Promise<SystemSetting[]> {
        await this.seedDefaults();
        return prisma.systemSetting.findMany({
            orderBy: [{ group: 'asc' }, { key: 'asc' }],
        });
    }

    async getSettingsByGroup(group: string): Promise<SystemSetting[]> {
        await this.seedDefaults();
        return prisma.systemSetting.findMany({
            where: { group },
            orderBy: { key: 'asc' },
        });
    }

    async getSetting(key: string): Promise<SystemSetting | null> {
        return prisma.systemSetting.findUnique({ where: { key } });
    }

    async updateSetting(key: string, value: string): Promise<SystemSetting> {
        const setting = await prisma.systemSetting.findUnique({ where: { key } });
        if (!setting) {
            throw new Error(`Setting "${key}" not found`);
        }

        return prisma.systemSetting.update({
            where: { key },
            data: { value },
        });
    }
}

export default new SettingsService();
