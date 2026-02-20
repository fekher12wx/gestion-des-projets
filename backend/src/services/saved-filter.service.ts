import { PrismaClient, SavedFilter } from '@prisma/client';

const prisma = new PrismaClient();

export class SavedFilterService {
    async getFilters(userId: string, entity?: string): Promise<SavedFilter[]> {
        const where: any = { userId };
        if (entity) where.entity = entity;

        return prisma.savedFilter.findMany({
            where,
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
    }

    async createFilter(data: {
        userId: string;
        name: string;
        entity: string;
        filters: any;
        isDefault?: boolean;
    }): Promise<SavedFilter> {
        // If setting as default, unset other defaults for this entity
        if (data.isDefault) {
            await prisma.savedFilter.updateMany({
                where: { userId: data.userId, entity: data.entity, isDefault: true },
                data: { isDefault: false },
            });
        }

        return prisma.savedFilter.create({ data });
    }

    async updateFilter(
        filterId: string,
        userId: string,
        data: { name?: string; filters?: any; isDefault?: boolean }
    ): Promise<SavedFilter> {
        const filter = await prisma.savedFilter.findFirst({
            where: { id: filterId, userId },
        });

        if (!filter) {
            throw new Error('Saved filter not found or does not belong to user');
        }

        // If setting as default, unset other defaults for this entity
        if (data.isDefault) {
            await prisma.savedFilter.updateMany({
                where: { userId, entity: filter.entity, isDefault: true, id: { not: filterId } },
                data: { isDefault: false },
            });
        }

        return prisma.savedFilter.update({
            where: { id: filterId },
            data,
        });
    }

    async deleteFilter(filterId: string, userId: string): Promise<void> {
        const filter = await prisma.savedFilter.findFirst({
            where: { id: filterId, userId },
        });

        if (!filter) {
            throw new Error('Saved filter not found or does not belong to user');
        }

        await prisma.savedFilter.delete({ where: { id: filterId } });
    }
}

export default new SavedFilterService();
