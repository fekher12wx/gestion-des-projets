import { PrismaClient, UserPreference } from '@prisma/client';

const prisma = new PrismaClient();

export class PreferenceService {
    async getPreferences(userId: string): Promise<UserPreference> {
        let prefs = await prisma.userPreference.findUnique({
            where: { userId },
        });

        // Auto-create defaults if none exist
        if (!prefs) {
            prefs = await prisma.userPreference.create({
                data: { userId },
            });
        }

        return prefs;
    }

    async updatePreferences(
        userId: string,
        data: {
            theme?: string;
            language?: string;
            dateFormat?: string;
            timezone?: string;
            notifications?: any;
        }
    ): Promise<UserPreference> {
        // Upsert to handle case where prefs don't exist yet
        return prisma.userPreference.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                ...data,
            },
        });
    }
}

export default new PreferenceService();
