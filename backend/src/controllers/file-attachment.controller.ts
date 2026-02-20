import { Response } from 'express';
import { param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import fs from 'fs';

export class FileAttachmentController {
    /**
     * Get attachments for a specific POI file
     * GET /api/v1/poi-files/:id/attachments
     */
    static getAttachmentsValidation = [
        param('id').isUUID().withMessage('Invalid POI file ID'),
    ];

    static async getAttachments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const attachments = await prisma.fileAttachment.findMany({
                where: { poiFileId: id },
                include: {
                    uploadedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.json({ attachments });
        } catch (error) {
            console.error('Get attachments error:', error);
            res.status(500).json({ error: 'Failed to retrieve attachments' });
        }
    }

    /**
     * Upload attachment to POI file
     * POST /api/v1/poi-files/:id/attachments
     */
    static uploadAttachmentValidation = [
        param('id').isUUID().withMessage('Invalid POI file ID'),
    ];

    static async uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { category } = req.body;

            // Check if file was uploaded
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            // Verify POI file exists
            const poiFile = await prisma.poiFile.findUnique({ where: { id } });
            if (!poiFile) {
                // Delete uploaded file if POI file doesn't exist
                fs.unlinkSync(req.file.path);
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            // Create attachment record
            const attachment = await prisma.fileAttachment.create({
                data: {
                    poiFileId: id,
                    uploadedBy: req.user!.userId,
                    filename: req.file.originalname,
                    filePath: req.file.path,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size,
                    category: category || null,
                },
                include: {
                    uploadedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            res.status(201).json(attachment);
        } catch (error) {
            console.error('Upload attachment error:', error);
            // Delete file if database operation failed
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file:', unlinkError);
                }
            }
            res.status(500).json({ error: 'Failed to upload attachment' });
        }
    }

    /**
     * Download attachment
     * GET /api/v1/attachments/:id/download
     */
    static downloadAttachmentValidation = [
        param('id').isUUID().withMessage('Invalid attachment ID'),
    ];

    static async downloadAttachment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            // Get attachment record
            const attachment = await prisma.fileAttachment.findUnique({
                where: { id },
            });

            if (!attachment) {
                res.status(404).json({ error: 'Attachment not found' });
                return;
            }

            // Check if file exists
            if (!fs.existsSync(attachment.filePath)) {
                res.status(404).json({ error: 'File not found on server' });
                return;
            }

            // Send file
            res.download(attachment.filePath, attachment.filename);
        } catch (error) {
            console.error('Download attachment error:', error);
            res.status(500).json({ error: 'Failed to download attachment' });
        }
    }

    /**
     * Delete attachment
     * DELETE /api/v1/attachments/:id
     */
    static deleteAttachmentValidation = [
        param('id').isUUID().withMessage('Invalid attachment ID'),
    ];

    static async deleteAttachment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            // Get attachment record
            const attachment = await prisma.fileAttachment.findUnique({
                where: { id },
            });

            if (!attachment) {
                res.status(404).json({ error: 'Attachment not found' });
                return;
            }

            // Only uploader can delete (add admin check if needed)
            if (attachment.uploadedBy !== req.user!.userId) {
                res.status(403).json({ error: 'Not authorized to delete this attachment' });
                return;
            }

            // Delete file from filesystem
            if (fs.existsSync(attachment.filePath)) {
                fs.unlinkSync(attachment.filePath);
            }

            // Delete database record
            await prisma.fileAttachment.delete({ where: { id } });

            res.json({ message: 'Attachment deleted successfully' });
        } catch (error) {
            console.error('Delete attachment error:', error);
            res.status(500).json({ error: 'Failed to delete attachment' });
        }
    }
}
