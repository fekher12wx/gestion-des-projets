import { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export class PoiFileController {
    /**
     * Generate unique file number
     * Format: POI-{YEAR}-{SEQUENCE}
     */
    private static async generateFileNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `POI-${year}-`;

        // Get the last file number for this year
        const lastFile = await prisma.poiFile.findFirst({
            where: {
                fileNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let sequence = 1;
        if (lastFile) {
            const lastSequence = parseInt(lastFile.fileNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Get all POI files with pagination and filtering
     * GET /api/v1/poi-files
     */
    static listValidation = [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('search').optional().isString().trim(),
        query('status').optional().isString(),
        query('projectId').optional().isUUID(),
        query('regionId').optional().isUUID(),
        query('currentStage').optional().isInt({ min: 1, max: 6 }).toInt(),
        query('technicianId').optional().isUUID(),
        query('studyManagerId').optional().isUUID(),
        query('businessManagerId').optional().isUUID(),
        query('assignedToMe').optional().isBoolean().toBoolean(),
        query('isPriority').optional().isBoolean().toBoolean(),
    ];

    static async list(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const page = parseInt((req.query.page as string) || '1');
            const limit = parseInt((req.query.limit as string) || '10');
            const search = req.query.search as string | undefined;
            const status = req.query.status as string | undefined;
            const projectId = req.query.projectId as string | undefined;
            const regionId = req.query.regionId as string | undefined;
            const currentStage = req.query.currentStage ? parseInt(req.query.currentStage as string) : undefined;
            const technicianId = req.query.technicianId as string | undefined;
            const studyManagerId = req.query.studyManagerId as string | undefined;
            const businessManagerId = req.query.businessManagerId as string | undefined;
            const assignedToMe = req.query.assignedToMe !== undefined ? String(req.query.assignedToMe) === 'true' : undefined;
            const isPriority = req.query.isPriority !== undefined ? String(req.query.isPriority) === 'true' : undefined;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (search) {
                where.OR = [
                    { fileNumber: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) where.status = status;
            if (projectId) where.projectId = projectId;
            if (regionId) where.regionId = regionId;
            if (currentStage) where.currentStage = currentStage;
            if (technicianId) where.technicianId = technicianId;
            if (studyManagerId) where.studyManagerId = studyManagerId;
            if (businessManagerId) where.businessManagerId = businessManagerId;
            if (isPriority !== undefined) where.isPriority = isPriority;

            // Filter for files assigned to the current user
            if (assignedToMe && req.user) {
                where.OR = [
                    { technicianId: req.user.userId },
                    { studyManagerId: req.user.userId },
                    { businessManagerId: req.user.userId },
                ];
            }


            const [poiFiles, total] = await Promise.all([
                prisma.poiFile.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        region: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        technician: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        studyManager: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        businessManager: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.poiFile.count({ where }),
            ]);

            res.json({
                poiFiles,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('List POI files error:', error);
            res.status(500).json({ error: 'Failed to fetch POI files' });
        }
    }

    /**
     * Get POI file by ID
     * GET /api/v1/poi-files/:id
     */
    static getByIdValidation = [param('id').isUUID()];

    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const poiFile = await prisma.poiFile.findUnique({
                where: { id },
                include: {
                    project: {
                        include: {
                            client: true,
                        },
                    },
                    region: true,
                    technician: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                    studyManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                    businessManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                    fileStages: {
                        include: {
                            stage: true,
                        },
                        orderBy: {
                            stage: {
                                stageNumber: 'asc',
                            },
                        },
                    },
                },
            });

            if (!poiFile) {
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            res.json({ poiFile });
        } catch (error) {
            console.error('Get POI file error:', error);
            res.status(500).json({ error: 'Failed to fetch POI file' });
        }
    }

    /**
     * Create new POI file
     * POST /api/v1/poi-files
     */
    static createValidation = [
        body('projectId').isUUID().withMessage('Valid project ID is required'),
        body('regionId').isUUID().withMessage('Valid region ID is required'),
        body('technicianId').optional().isUUID(),
        body('studyManagerId').optional().isUUID(),
        body('businessManagerId').optional().isUUID(),
        body('receptionDate').optional().isISO8601(),
        body('expectedCompletionDate').optional().isISO8601(),
        body('notes').optional().isString(),
        body('isPriority').optional().isBoolean(),
    ];

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.error('Validation errors:', errors.array());
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const {
                projectId,
                regionId,
                technicianId,
                studyManagerId,
                businessManagerId,
                receptionDate,
                expectedCompletionDate,
                notes,
                isPriority,
            } = req.body;

            // Verify project and region exist
            const [project, region] = await Promise.all([
                prisma.project.findUnique({ where: { id: projectId } }),
                prisma.region.findUnique({ where: { id: regionId } }),
            ]);

            if (!project) {
                console.error('Project not found:', projectId);
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            if (!region) {
                console.error('Region not found:', regionId);
                res.status(404).json({ error: 'Region not found' });
                return;
            }

            // Generate unique file number
            const fileNumber = await PoiFileController.generateFileNumber();
            console.log('Generated file number:', fileNumber);

            // Create POI file
            const poiFile = await prisma.poiFile.create({
                data: {
                    fileNumber,
                    projectId,
                    regionId,
                    technicianId: technicianId || null,
                    studyManagerId: studyManagerId || null,
                    businessManagerId: businessManagerId || null,
                    receptionDate: receptionDate ? new Date(receptionDate) : new Date(),
                    expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
                    notes: notes || null,
                    isPriority: isPriority || false,
                    currentStage: 1,
                    status: 'PENDING',
                },
                include: {
                    project: true,
                    region: true,
                    technician: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    studyManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    businessManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            console.log('POI file created:', poiFile.id);

            // Create initial file stages
            try {
                const stages = await prisma.stage.findMany({
                    orderBy: { stageNumber: 'asc' },
                });

                console.log(`Found ${stages.length} stages`);

                for (const stage of stages) {
                    await prisma.fileStage.create({
                        data: {
                            poiFileId: poiFile.id,
                            stageId: stage.id,
                            status: stage.stageNumber === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
                            startedAt: stage.stageNumber === 1 ? new Date() : null,
                        },
                    });
                }
            } catch (stageError) {
                console.error('Error creating file stages:', stageError);
                // Don't fail the entire operation if stages fail
            }

            // Log audit entry
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: req.user?.userId || null,
                        action: 'POI_FILE_CREATED',
                        resourceType: 'poi_file',
                        resourceId: poiFile.id,
                        details: { fileNumber: poiFile.fileNumber, createdBy: req.user?.email },
                    },
                });
            } catch (auditError) {
                console.error('Error creating audit log:', auditError);
                // Don't fail the entire operation if audit log fails
            }

            res.status(201).json({
                message: 'POI file created successfully',
                poiFile,
            });
        } catch (error) {
            console.error('Create POI file error:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({ error: 'Failed to create POI file' });
        }
    }

    /**
     * Update POI file
     * PUT /api/v1/poi-files/:id
     */
    static updateValidation = [
        param('id').isUUID(),
        body('projectId').optional().isUUID(),
        body('regionId').optional().isUUID(),
        body('technicianId').optional().isUUID(),
        body('studyManagerId').optional().isUUID(),
        body('businessManagerId').optional().isUUID(),
        body('status').optional().isString(),
        body('receptionDate').optional().isISO8601(),
        body('expectedCompletionDate').optional().isISO8601(),
        body('notes').optional().isString(),
        body('isPriority').optional().isBoolean(),
    ];

    static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const existingFile = await prisma.poiFile.findUnique({ where: { id } });
            if (!existingFile) {
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            const updateData: any = {};
            const allowedFields = [
                'projectId',
                'regionId',
                'technicianId',
                'studyManagerId',
                'businessManagerId',
                'status',
                'notes',
                'isPriority',
            ];

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }

            if (req.body.receptionDate) {
                updateData.receptionDate = new Date(req.body.receptionDate);
            }

            if (req.body.expectedCompletionDate) {
                updateData.expectedCompletionDate = new Date(req.body.expectedCompletionDate);
            }

            const updatedFile = await prisma.poiFile.update({
                where: { id },
                data: updateData,
                include: {
                    project: true,
                    region: true,
                    technician: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    studyManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    businessManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'POI_FILE_UPDATED',
                    resourceType: 'poi_file',
                    resourceId: id,
                    details: { updatedBy: req.user?.email, changes: req.body },
                },
            });

            res.json({
                message: 'POI file updated successfully',
                poiFile: updatedFile,
            });
        } catch (error) {
            console.error('Update POI file error:', error);
            res.status(500).json({ error: 'Failed to update POI file' });
        }
    }

    /**
     * Delete POI file
     * DELETE /api/v1/poi-files/:id
     */
    static deleteValidation = [param('id').isUUID()];

    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const poiFile = await prisma.poiFile.findUnique({ where: { id } });
            if (!poiFile) {
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            // Hard delete (you can change to soft delete by updating a field)
            await prisma.poiFile.delete({ where: { id } });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'POI_FILE_DELETED',
                    resourceType: 'poi_file',
                    resourceId: id,
                    details: { deletedBy: req.user?.email, fileNumber: poiFile.fileNumber },
                },
            });

            res.json({ message: 'POI file deleted successfully' });
        } catch (error) {
            console.error('Delete POI file error:', error);
            res.status(500).json({ error: 'Failed to delete POI file' });
        }
    }

    /**
     * Advance POI file to next stage
     * PUT /api/v1/poi-files/:id/advance-stage
     */
    static async advanceStage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const poiFile = await prisma.poiFile.findUnique({
                where: { id },
                include: { fileStages: { include: { stage: true } } },
            });

            if (!poiFile) {
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            if (poiFile.currentStage >= 6) {
                res.status(400).json({ error: 'File is already at the final stage' });
                return;
            }

            const nextStage = poiFile.currentStage + 1;

            // Update current stage
            await prisma.poiFile.update({
                where: { id },
                data: {
                    currentStage: nextStage,
                    status: nextStage === 6 ? 'COMPLETED' : 'IN_PROGRESS',
                },
            });

            // Update file stages
            const currentFileStage = poiFile.fileStages.find((fs) => fs.stage.stageNumber === poiFile.currentStage);
            const nextFileStage = poiFile.fileStages.find((fs) => fs.stage.stageNumber === nextStage);

            if (currentFileStage) {
                await prisma.fileStage.update({
                    where: { id: currentFileStage.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        completedBy: req.user?.userId,
                    },
                });
            }

            if (nextFileStage) {
                await prisma.fileStage.update({
                    where: { id: nextFileStage.id },
                    data: {
                        status: 'IN_PROGRESS',
                        startedAt: new Date(),
                    },
                });
            }

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'STAGE_ADVANCED',
                    resourceType: 'poi_file',
                    resourceId: id,
                    details: {
                        advancedBy: req.user?.email,
                        fromStage: poiFile.currentStage,
                        toStage: nextStage,
                    },
                },
            });

            res.json({ message: 'Stage advanced successfully', currentStage: nextStage });
        } catch (error) {
            console.error('Advance stage error:', error);
            res.status(500).json({ error: 'Failed to advance stage' });
        }
    }
}
