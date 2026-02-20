import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
    /**
     * GET /api/v1/dashboard/stats
     * Get dashboard statistics
     */
    async getDashboardStats(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            // Get POI file statistics
            const [
                activeFiles,
                pendingFiles,
                completedFiles,
                totalProjects,
                recentFiles,
                userAssignments,
            ] = await Promise.all([
                // Active POI files (IN_PROGRESS + PENDING)
                prisma.poiFile.count({
                    where: {
                        status: {
                            in: ['IN_PROGRESS', 'PENDING'],
                        },
                    },
                }),
                // Pending files
                prisma.poiFile.count({
                    where: {
                        status: 'PENDING',
                    },
                }),
                // Completed files
                prisma.poiFile.count({
                    where: {
                        status: 'COMPLETED',
                    },
                }),
                // Total projects
                prisma.project.count(),
                // Recent files (last 10)
                prisma.poiFile.findMany({
                    take: 10,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        project: {
                            select: {
                                name: true,
                            },
                        },
                        region: {
                            select: {
                                name: true,
                            },
                        },
                        technician: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                }),
                // User's assignments (if logged in)
                userId
                    ? prisma.poiFile.count({
                        where: {
                            OR: [
                                { technicianId: userId },
                                { studyManagerId: userId },
                                { businessManagerId: userId },
                            ],
                        },
                    })
                    : 0,
            ]);

            // Get stage distribution
            const stageDistribution = await prisma.poiFile.groupBy({
                by: ['currentStage'],
                _count: {
                    id: true,
                },
            });

            // Get status distribution
            const statusDistribution = await prisma.poiFile.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
            });

            // Calculate completion rate
            const totalFiles = await prisma.poiFile.count();
            const completionRate =
                totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

            res.json({
                stats: {
                    activeFiles,
                    pendingFiles,
                    completedFiles,
                    totalProjects,
                    totalFiles,
                    userAssignments,
                    completionRate: completionRate.toFixed(1),
                },
                stageDistribution: stageDistribution.map((item) => ({
                    stage: item.currentStage,
                    count: item._count?.id || 0,
                })),
                statusDistribution: statusDistribution.map((item) => ({
                    status: item.status,
                    count: item._count?.id || 0,
                })),
                recentFiles: recentFiles.map((file) => ({
                    id: file.id,
                    fileNumber: file.fileNumber,
                    status: file.status,
                    currentStage: file.currentStage,
                    project: file.project?.name,
                    region: file.region?.name,
                    technician: file.technician
                        ? `${file.technician.firstName} ${file.technician.lastName}`
                        : null,
                    createdAt: file.createdAt,
                })),
            });
        } catch (error: any) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                message: 'Failed to fetch dashboard statistics',
                error: error.message,
            });
        }
    }
}

export default new DashboardController();
