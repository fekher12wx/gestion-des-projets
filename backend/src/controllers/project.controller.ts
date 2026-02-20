import { Request, Response } from 'express';
import prisma from '../config/database';

class ProjectController {
    /**
     * Get all projects
     */
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const projects = await prisma.project.findMany({
                include: {
                    client: true,
                },
                orderBy: {
                    name: 'asc',
                },
            });

            res.json({ projects });
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    }

    /**
     * Get project by ID
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    client: true,
                    poiFiles: true,
                },
            });

            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            res.json({ project });
        } catch (error) {
            console.error('Error fetching project:', error);
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    }

    /**
     * Create new project
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, code, clientId, description } = req.body;

            // Validation
            if (!name || !code) {
                res.status(400).json({ error: 'Name and code are required' });
                return;
            }

            // Check if code already exists
            const existing = await prisma.project.findUnique({
                where: { code },
            });

            if (existing) {
                res.status(400).json({ error: 'Project code already exists' });
                return;
            }

            // Create the project with proper optional clientId
            const project = await prisma.project.create({
                data: {
                    name,
                    code,
                    description: description || null,
                    ...(clientId && { clientId }),
                },
            });

            // Fetch the complete project with client relation
            const completeProject = await prisma.project.findUnique({
                where: { id: project.id },
                include: {
                    client: true,
                },
            });

            res.status(201).json({ project: completeProject, message: 'Project created successfully' });
        } catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({ error: 'Failed to create project' });
        }
    }

    /**
     * Update project
     */
    static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { name, code, clientId, description } = req.body;

            // Build the data object with proper relation handling
            const data: any = {
                name,
                code,
                description: description || null,
            };

            // Handle client relation
            if (clientId) {
                data.client = {
                    connect: { id: clientId }
                };
            } else if (clientId === null) {
                data.client = {
                    disconnect: true
                };
            }

            const project = await prisma.project.update({
                where: { id },
                data,
                include: {
                    client: true,
                },
            });

            res.json({ project, message: 'Project updated successfully' });
        } catch (error) {
            console.error('Error updating project:', error);
            res.status(500).json({ error: 'Failed to update project' });
        }
    }

    /**
     * Delete project
     */
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Check if project has POI files
            const poiFilesCount = await prisma.poiFile.count({
                where: { projectId: id },
            });

            if (poiFilesCount > 0) {
                res.status(400).json({ error: `Cannot delete project with ${poiFilesCount} POI files` });
                return;
            }

            await prisma.project.delete({
                where: { id },
            });

            res.json({ message: 'Project deleted successfully' });
        } catch (error) {
            console.error('Error deleting project:', error);
            res.status(500).json({ error: 'Failed to delete project' });
        }
    }
}

export default ProjectController;
