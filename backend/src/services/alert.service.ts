import { PrismaClient, AlertType, Alert } from '@prisma/client';

const prisma = new PrismaClient();

export class AlertService {
    // ==========================================
    // CORE ALERT CRUD OPERATIONS
    // ==========================================

    async createAlert(data: {
        userId: string;
        type: AlertType;
        title: string;
        message: string;
        poiFileId?: string;
    }): Promise<Alert> {
        return await prisma.alert.create({
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                poiFile: {
                    select: {
                        id: true,
                        fileNumber: true,
                        status: true,
                        currentStage: true,
                    },
                },
            },
        });
    }

    async getUserAlerts(
        userId: string,
        filters?: {
            isRead?: boolean;
            type?: AlertType;
            limit?: number;
            offset?: number;
        }
    ) {
        const { isRead, type, limit = 20, offset = 0 } = filters || {};

        const where: any = { userId };
        if (isRead !== undefined) where.isRead = isRead;
        if (type) where.type = type;

        const [alerts, total] = await Promise.all([
            prisma.alert.findMany({
                where,
                include: {
                    poiFile: {
                        select: {
                            id: true,
                            fileNumber: true,
                            status: true,
                            currentStage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.alert.count({ where }),
        ]);

        return {
            alerts,
            total,
            limit,
            offset,
        };
    }

    async markAsRead(alertId: string, userId: string): Promise<Alert> {
        // Verify the alert belongs to the user
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId },
        });

        if (!alert) {
            throw new Error('Alert not found or does not belong to user');
        }

        return await prisma.alert.update({
            where: { id: alertId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string): Promise<number> {
        const result = await prisma.alert.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return result.count;
    }

    async deleteAlert(alertId: string, userId: string): Promise<Alert> {
        // Verify the alert belongs to the user
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId },
        });

        if (!alert) {
            throw new Error('Alert not found or does not belong to user');
        }

        return await prisma.alert.delete({
            where: { id: alertId },
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await prisma.alert.count({
            where: { userId, isRead: false },
        });
    }

    // ==========================================
    // ALERT GENERATION HELPERS
    // ==========================================

    async notifyFileAssigned(poiFileId: string, userId: string, assignedBy?: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            select: { fileNumber: true },
        });

        if (!poiFile) return;

        let message = `You have been assigned to POI file ${poiFile.fileNumber}`;
        if (assignedBy) {
            const assigner = await prisma.user.findUnique({
                where: { id: assignedBy },
                select: { firstName: true, lastName: true },
            });
            if (assigner) {
                message += ` by ${assigner.firstName} ${assigner.lastName}`;
            }
        }

        await this.createAlert({
            userId,
            type: AlertType.FILE_ASSIGNED,
            title: 'New Assignment',
            message,
            poiFileId,
        });
    }

    async notifyStatusChange(poiFileId: string, newStatus: string, oldStatus: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const message = `POI file ${poiFile.fileNumber} status changed from ${oldStatus} to ${newStatus}`;
        const title = 'Status Updated';

        // Notify all assigned users
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter(Boolean) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.FILE_STATUS_CHANGED,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyStageCompleted(poiFileId: string, stageNumber: number): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const message = `Stage ${stageNumber} has been completed for POI file ${poiFile.fileNumber}`;
        const title = 'Stage Completed';

        // Notify all assigned users
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter(Boolean) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.FILE_STAGE_COMPLETED,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyDeadlineApproaching(poiFileId: string, daysRemaining: number): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const message = `POI file ${poiFile.fileNumber} is due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
        const title = 'Deadline Approaching';

        // Notify all assigned users
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter(Boolean) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.DEADLINE_APPROACHING,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyDeadlineOverdue(poiFileId: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const message = `POI file ${poiFile.fileNumber} has passed its deadline`;
        const title = 'Deadline Overdue';

        // Notify all assigned users
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter(Boolean) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.DEADLINE_OVERDUE,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyCommentAdded(poiFileId: string, commentUserId: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const commenter = await prisma.user.findUnique({
            where: { id: commentUserId },
            select: { firstName: true, lastName: true },
        });

        const message = `${commenter?.firstName} ${commenter?.lastName} added a comment to POI file ${poiFile.fileNumber}`;
        const title = 'New Comment';

        // Notify all assigned users except the commenter
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter((id) => id && id !== commentUserId) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.COMMENT_ADDED,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyAttachmentAdded(poiFileId: string, uploaderUserId: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const uploader = await prisma.user.findUnique({
            where: { id: uploaderUserId },
            select: { firstName: true, lastName: true },
        });

        const message = `${uploader?.firstName} ${uploader?.lastName} uploaded a file to POI file ${poiFile.fileNumber}`;
        const title = 'New Attachment';

        // Notify all assigned users except the uploader
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter((id) => id && id !== uploaderUserId) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.ATTACHMENT_ADDED,
                title,
                message,
                poiFileId,
            });
        }
    }

    async notifyPrioritySet(poiFileId: string): Promise<void> {
        const poiFile = await prisma.poiFile.findUnique({
            where: { id: poiFileId },
            include: {
                technician: { select: { id: true } },
                studyManager: { select: { id: true } },
                businessManager: { select: { id: true } },
            },
        });

        if (!poiFile) return;

        const message = `POI file ${poiFile.fileNumber} has been marked as priority`;
        const title = 'Priority Set';

        // Notify all assigned users
        const userIds = [
            poiFile.technician?.id,
            poiFile.studyManager?.id,
            poiFile.businessManager?.id,
        ].filter(Boolean) as string[];

        for (const userId of userIds) {
            await this.createAlert({
                userId,
                type: AlertType.PRIORITY_SET,
                title,
                message,
                poiFileId,
            });
        }
    }
}

export default new AlertService();
