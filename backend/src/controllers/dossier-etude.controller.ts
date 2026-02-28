import { Request, Response } from 'express';
import prisma from '../config/database';

const DEFAULT_COLUMN_CONFIG = [
    { key: 'Code OEIE', label: 'Code OEIE', type: 'text', required: true },
    { key: 'DRE', label: 'DRE', type: 'date', required: false },
    { key: 'ETAT', label: 'ETAT', type: 'text', required: false },
    { key: 'POI', label: 'POI', type: 'text', required: false },
    { key: 'SJ', label: 'SJ', type: 'text', required: false },
    { key: 'CAFF', label: 'CAFF', type: 'text', required: false },
    { key: 'Mémo Chaf', label: 'Mémo Chaf', type: 'text', required: false },
    { key: 'VILLE', label: 'Ville', type: 'text', required: false },
    { key: 'ADRESSE', label: 'Adresse', type: 'text', required: false },
    { key: 'DATE VT', label: 'Date VT', type: 'date', required: false },
    { key: 'COMMENTAIRES', label: 'Commentaires', type: 'textarea', required: false },
    { key: 'CTC', label: 'CTC', type: 'text', required: false },
];

export class DossierEtudeController {
    /**
     * GET /api/v1/dossier-etudes?secteur=MEN-ROD
     */
    async list(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const secteur = req.query.secteur as string | undefined;
            const search = req.query.search as string | undefined;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (secteur) where.secteur = secteur;

            const [dossiers, total] = await Promise.all([
                prisma.dossierEtude.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.dossierEtude.count({ where }),
            ]);

            // Get column config for the sector
            let columnConfig = DEFAULT_COLUMN_CONFIG;
            if (secteur) {
                const sector = await prisma.suiviEtude.findUnique({ where: { secteur } });
                if (sector?.columnConfig) {
                    columnConfig = sector.columnConfig as any;
                }
            }

            // Filter by search across data JSON values
            let filteredDossiers = dossiers;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredDossiers = dossiers.filter((d: any) => {
                    const data = d.data as Record<string, any>;
                    return Object.values(data).some(
                        (v) => v && String(v).toLowerCase().includes(searchLower)
                    );
                });
            }

            res.json({
                dossiers: filteredDossiers,
                columnConfig,
                pagination: {
                    page,
                    limit,
                    total: search ? filteredDossiers.length : total,
                    totalPages: Math.ceil((search ? filteredDossiers.length : total) / limit),
                },
            });
        } catch (error: any) {
            console.error('List dossier etudes error:', error);
            res.status(500).json({ error: 'Failed to fetch dossiers' });
        }
    }

    /**
     * POST /api/v1/dossier-etudes
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const { secteur, data: rowData } = req.body;

            if (!secteur) {
                res.status(400).json({ error: 'Secteur is required' });
                return;
            }

            const dossier = await prisma.dossierEtude.create({
                data: {
                    secteur: secteur.trim(),
                    data: rowData || {},
                },
            });

            res.status(201).json({ message: 'Dossier created', dossier });
        } catch (error: any) {
            console.error('Create dossier error:', error);
            res.status(500).json({ error: 'Failed to create dossier' });
        }
    }

    /**
     * PUT /api/v1/dossier-etudes/:id
     */
    async update(req: Request, res: Response): Promise<void> {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { data: rowData } = req.body;

            const existing = await prisma.dossierEtude.findUnique({ where: { id } });
            if (!existing) {
                res.status(404).json({ error: 'Dossier not found' });
                return;
            }

            const dossier = await prisma.dossierEtude.update({
                where: { id },
                data: { data: rowData || {} },
            });

            res.json({ message: 'Dossier updated', dossier });
        } catch (error: any) {
            console.error('Update dossier error:', error);
            res.status(500).json({ error: 'Failed to update dossier' });
        }
    }

    /**
     * DELETE /api/v1/dossier-etudes/:id
     */
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const existing = await prisma.dossierEtude.findUnique({ where: { id } });
            if (!existing) {
                res.status(404).json({ error: 'Dossier not found' });
                return;
            }

            await prisma.dossierEtude.delete({ where: { id } });
            res.json({ message: 'Dossier deleted' });
        } catch (error: any) {
            console.error('Delete dossier error:', error);
            res.status(500).json({ error: 'Failed to delete dossier' });
        }
    }
}

export default new DossierEtudeController();
