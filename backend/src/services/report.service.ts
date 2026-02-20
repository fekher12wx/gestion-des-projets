import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReportService {
    /**
     * Get file status distribution report
     */
    async getFileStatusReport(filters: {
        startDate?: Date;
        endDate?: Date;
        projectId?: string;
        regionId?: string;
    }) {
        const where: any = {};

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        if (filters.projectId) where.projectId = filters.projectId;
        if (filters.regionId) where.regionId = filters.regionId;

        // Get count grouped by status
        const statusCounts = await prisma.poiFile.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true,
            },
        });

        // Transform to object format
        const report: any = {
            PENDING: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            ON_HOLD: 0,
            CANCELLED: 0,
            total: 0,
        };

        statusCounts.forEach(item => {
            report[item.status] = item._count.id;
            report.total += item._count.id;
        });

        return report;
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(filters: {
        startDate?: Date;
        endDate?: Date;
        projectId?: string;
        regionId?: string;
    }) {
        const where: any = {};

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        if (filters.projectId) where.projectId = filters.projectId;
        if (filters.regionId) where.regionId = filters.regionId;

        // Total files
        const totalFiles = await prisma.poiFile.count({ where });

        // Completed files
        const completedFiles = await prisma.poiFile.count({
            where: { ...where, status: 'COMPLETED' },
        });

        // Overdue files (expected completion date passed and not completed)
        const now = new Date();
        const overdueFiles = await prisma.poiFile.count({
            where: {
                ...where,
                status: { not: 'COMPLETED' },
                expectedCompletionDate: { lt: now },
            },
        });

        // Calculate average completion time for completed files
        const completedWithDates = await prisma.poiFile.findMany({
            where: { ...where, status: 'COMPLETED', closingDate: { not: null }, receptionDate: { not: null } },
            select: { receptionDate: true, closingDate: true },
        });

        let avgCompletionDays = 0;
        if (completedWithDates.length > 0) {
            const totalDays = completedWithDates.reduce((sum, file) => {
                const start = new Date(file.receptionDate!);
                const end = new Date(file.closingDate!);
                const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgCompletionDays = Math.round((totalDays / completedWithDates.length) * 10) / 10;
        }

        const completionRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 1000) / 1000 : 0;

        return {
            totalFiles,
            completedFiles,
            overdueFiles,
            avgCompletionDays,
            completionRate,
        };
    }

    /**
     * Get stage analysis
     */
    async getStageAnalysis(filters: {
        startDate?: Date;
        endDate?: Date;
        projectId?: string;
        regionId?: string;
    }) {
        const where: any = {};

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        if (filters.projectId) where.projectId = filters.projectId;
        if (filters.regionId) where.regionId = filters.regionId;

        // Get file count by current stage
        const stageCounts = await prisma.poiFile.groupBy({
            by: ['currentStage'],
            where,
            _count: {
                id: true,
            },
        });

        // Get all stages to include stage names
        const stages = await prisma.stage.findMany({
            orderBy: { stageNumber: 'asc' },
        });

        // Build stage analysis with names
        const stageAnalysis = stages.map(stage => {
            const stageCount = stageCounts.find(sc => sc.currentStage === stage.stageNumber);
            return {
                stageNumber: stage.stageNumber,
                stageName: stage.name,
                fileCount: stageCount?._count.id || 0,
            };
        });

        return stageAnalysis;
    }

    /**
     * Get user productivity report
     */
    async getUserProductivity(filters: {
        startDate?: Date;
        endDate?: Date;
        projectId?: string;
        regionId?: string;
        userId?: string;
    }) {
        const where: any = {};

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        if (filters.projectId) where.projectId = filters.projectId;
        if (filters.regionId) where.regionId = filters.regionId;

        // Build user filter (technician, study manager, or business manager)
        const userFilter: any = {};
        if (filters.userId) {
            userFilter.OR = [
                { technicianId: filters.userId },
                { studyManagerId: filters.userId },
                { businessManagerId: filters.userId },
            ];
        }

        const combinedWhere = { ...where, ...userFilter };

        // Get files assigned to users
        const files = await prisma.poiFile.findMany({
            where: combinedWhere,
            select: {
                id: true,
                status: true,
                technicianId: true,
                studyManagerId: true,
                businessManagerId: true,
                receptionDate: true,
                closingDate: true,
                technician: { select: { id: true, firstName: true, lastName: true } },
                studyManager: { select: { id: true, firstName: true, lastName: true } },
                businessManager: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // Aggregate by user
        const userMap = new Map<string, any>();

        files.forEach(file => {
            const users = [
                file.technician && { ...file.technician, role: 'Technician' },
                file.studyManager && { ...file.studyManager, role: 'Study Manager' },
                file.businessManager && { ...file.businessManager, role: 'Business Manager' },
            ].filter(Boolean);

            users.forEach((user: any) => {
                if (!userMap.has(user.id)) {
                    userMap.set(user.id, {
                        userId: user.id,
                        userName: `${user.firstName} ${user.lastName}`,
                        role: user.role,
                        assignedFiles: 0,
                        completedFiles: 0,
                        totalCompletionDays: 0,
                        completedWithDates: 0,
                    });
                }

                const userData = userMap.get(user.id);
                userData.assignedFiles++;

                if (file.status === 'COMPLETED') {
                    userData.completedFiles++;

                    if (file.receptionDate && file.closingDate) {
                        const days = Math.floor(
                            (new Date(file.closingDate).getTime() - new Date(file.receptionDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        userData.totalCompletionDays += days;
                        userData.completedWithDates++;
                    }
                }
            });
        });

        // Transform to array with calculated metrics
        const productivity = Array.from(userMap.values()).map(user => ({
            userId: user.userId,
            userName: user.userName,
            role: user.role,
            assignedFiles: user.assignedFiles,
            completedFiles: user.completedFiles,
            completionRate: user.assignedFiles > 0
                ? Math.round((user.completedFiles / user.assignedFiles) * 1000) / 1000
                : 0,
            avgCompletionDays: user.completedWithDates > 0
                ? Math.round((user.totalCompletionDays / user.completedWithDates) * 10) / 10
                : 0,
        }));

        // Sort by completed files descending
        return productivity.sort((a, b) => b.completedFiles - a.completedFiles);
    }
}

export default new ReportService();
