import { Request, Response } from 'express';
import savedFilterService from '../services/saved-filter.service';

export class SavedFilterController {
    async getFilters(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { entity } = req.query;

            const filters = await savedFilterService.getFilters(userId, entity as string);
            res.json({ filters });
        } catch (error: any) {
            console.error('Get saved filters error:', error);
            res.status(500).json({ message: 'Failed to fetch saved filters', error: error.message });
        }
    }

    async createFilter(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { name, entity, filters, isDefault } = req.body;

            if (!name || !entity || !filters) {
                res.status(400).json({ message: 'name, entity, and filters are required' });
                return;
            }

            const filter = await savedFilterService.createFilter({
                userId,
                name,
                entity,
                filters,
                isDefault,
            });

            res.status(201).json({ filter });
        } catch (error: any) {
            console.error('Create saved filter error:', error);
            res.status(500).json({ message: 'Failed to create saved filter', error: error.message });
        }
    }

    async updateFilter(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;
            const { name, filters, isDefault } = req.body;

            const filter = await savedFilterService.updateFilter(id as string, userId, { name, filters, isDefault });
            res.json({ filter });
        } catch (error: any) {
            console.error('Update saved filter error:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to update saved filter', error: error.message });
            }
        }
    }

    async deleteFilter(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            await savedFilterService.deleteFilter(id as string, userId);
            res.json({ message: 'Saved filter deleted successfully' });
        } catch (error: any) {
            console.error('Delete saved filter error:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to delete saved filter', error: error.message });
            }
        }
    }
}

export default new SavedFilterController();
