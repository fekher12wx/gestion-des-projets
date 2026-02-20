import { Request, Response } from 'express';
import searchService from '../services/search.service';

export class SearchController {
    /**
     * GET /api/v1/search?q=...&limit=5
     * Global search across all entities
     */
    async search(req: Request, res: Response): Promise<void> {
        try {
            const { q, limit } = req.query;

            if (!q || typeof q !== 'string') {
                res.status(400).json({ message: 'Search query "q" is required' });
                return;
            }

            const parsedLimit = limit ? parseInt(limit as string, 10) : 5;
            const results = await searchService.globalSearch(q, parsedLimit);

            res.json(results);
        } catch (error: any) {
            console.error('Search error:', error);
            res.status(500).json({
                message: 'Search failed',
                error: error.message,
            });
        }
    }
}

export default new SearchController();
