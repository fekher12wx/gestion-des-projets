import { Request, Response } from 'express';
import prisma from '../config/database';

class ClientController {
    /**
     * Get all clients
     */
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const clients = await prisma.client.findMany({
                include: {
                    _count: {
                        select: { projects: true },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });

            res.json({ clients });
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    }

    /**
     * Get client by ID
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const client = await prisma.client.findUnique({
                where: { id },
                include: {
                    projects: true,
                },
            });

            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }

            res.json({ client });
        } catch (error) {
            console.error('Error fetching client:', error);
            res.status(500).json({ error: 'Failed to fetch client' });
        }
    }

    /**
     * Create new client
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, code, contactEmail, contactPhone } = req.body;

            // Validation
            if (!name || !code) {
                res.status(400).json({ error: 'Name and code are required' });
                return;
            }

            // Check if code already exists
            const existing = await prisma.client.findUnique({
                where: { code },
            });

            if (existing) {
                res.status(400).json({ error: 'Client code already exists' });
                return;
            }

            // Create client
            const client = await prisma.client.create({
                data: {
                    name,
                    code,
                    contactEmail: contactEmail || null,
                    contactPhone: contactPhone || null,
                },
                include: {
                    _count: {
                        select: { projects: true },
                    },
                },
            });

            res.status(201).json({ client, message: 'Client created successfully' });
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ error: 'Failed to create client' });
        }
    }

    /**
     * Update client
     */
    static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { name, code, contactEmail, contactPhone } = req.body;

            const client = await prisma.client.update({
                where: { id },
                data: {
                    name,
                    code,
                    contactEmail: contactEmail || null,
                    contactPhone: contactPhone || null,
                },
                include: {
                    _count: {
                        select: { projects: true },
                    },
                },
            });

            res.json({ client, message: 'Client updated successfully' });
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({ error: 'Failed to update client' });
        }
    }

    /**
     * Delete client
     */
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Check if client has projects
            const projectsCount = await prisma.project.count({
                where: { clientId: id },
            });

            if (projectsCount > 0) {
                res.status(400).json({ error: `Cannot delete client with ${projectsCount} projects` });
                return;
            }

            await prisma.client.delete({
                where: { id },
            });

            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            console.error('Error deleting client:', error);
            res.status(500).json({ error: 'Failed to delete client' });
        }
    }
}

export default ClientController;
