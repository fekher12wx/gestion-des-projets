import { Request, Response } from 'express';
import prisma from '../config/database';

class RegionController {
    /**
     * Get all regions
     */
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const regions = await prisma.region.findMany({
                orderBy: {
                    name: 'asc',
                },
            });

            res.json({ regions });
        } catch (error) {
            console.error('Error fetching regions:', error);
            res.status(500).json({ error: 'Failed to fetch regions' });
        }
    }

    /**
     * Get region by ID
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const region = await prisma.region.findUnique({
                where: { id },
                include: {
                    poiFiles: true,
                },
            });

            if (!region) {
                res.status(404).json({ error: 'Region not found' });
                return;
            }

            res.json({ region });
        } catch (error) {
            console.error('Error fetching region:', error);
            res.status(500).json({ error: 'Failed to fetch region' });
        }
    }

    /**
     * Create new region
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, code } = req.body;

            // Validation
            if (!name || !code) {
                res.status(400).json({ error: 'Name and code are required' });
                return;
            }

            // Check if code already exists
            const existing = await prisma.region.findUnique({
                where: { code },
            });

            if (existing) {
                res.status(400).json({ error: 'Region code already exists' });
                return;
            }

            const region = await prisma.region.create({
                data: {
                    name,
                    code,
                },
            });

            res.status(201).json({ region, message: 'Region created successfully' });
        } catch (error) {
            console.error('Error creating region:', error);
            res.status(500).json({ error: 'Failed to create region' });
        }
    }

    /**
     * Update region
     */
    static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { name, code } = req.body;

            const region = await prisma.region.update({
                where: { id },
                data: {
                    name,
                    code,
                },
            });

            res.json({ region, message: 'Region updated successfully' });
        } catch (error) {
            console.error('Error updating region:', error);
            res.status(500).json({ error: 'Failed to update region' });
        }
    }

    /**
     * Delete region
     */
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Check if region has POI files
            const poiFilesCount = await prisma.poiFile.count({
                where: { regionId: id },
            });

            if (poiFilesCount > 0) {
                res.status(400).json({ error: `Cannot delete region with ${poiFilesCount} POI files` });
                return;
            }

            await prisma.region.delete({
                where: { id },
            });

            res.json({ message: 'Region deleted successfully' });
        } catch (error) {
            console.error('Error deleting region:', error);
            res.status(500).json({ error: 'Failed to delete region' });
        }
    }
}

export default RegionController;
