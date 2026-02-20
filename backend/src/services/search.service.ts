import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchResults {
    poiFiles: Array<{ id: string; fileNumber: string; status: string; currentStage: number; project?: string; region?: string }>;
    projects: Array<{ id: string; name: string; code: string; status: string; client?: string }>;
    clients: Array<{ id: string; name: string; code: string; isActive: boolean }>;
    regions: Array<{ id: string; name: string; code: string; department?: string | null }>;
    users: Array<{ id: string; firstName: string; lastName: string; email: string; role?: string }>;
}

export class SearchService {
    async globalSearch(query: string, limit: number = 5): Promise<SearchResults> {
        if (!query || query.trim().length < 2) {
            return { poiFiles: [], projects: [], clients: [], regions: [], users: [] };
        }

        const searchTerm = query.trim();

        const [poiFiles, projects, clients, regions, users] = await Promise.all([
            // Search POI Files
            prisma.poiFile.findMany({
                where: {
                    OR: [
                        { fileNumber: { contains: searchTerm, mode: 'insensitive' } },
                        { notes: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                include: {
                    project: { select: { name: true } },
                    region: { select: { name: true } },
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),

            // Search Projects
            prisma.project.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { code: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                include: {
                    client: { select: { name: true } },
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),

            // Search Clients
            prisma.client.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { code: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),

            // Search Regions
            prisma.region.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { code: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: limit,
            }),

            // Search Users
            prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: searchTerm, mode: 'insensitive' } },
                        { lastName: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                include: {
                    role: { select: { name: true } },
                },
                take: limit,
            }),
        ]);

        return {
            poiFiles: poiFiles.map((f) => ({
                id: f.id,
                fileNumber: f.fileNumber,
                status: f.status,
                currentStage: f.currentStage,
                project: f.project?.name,
                region: f.region?.name,
            })),
            projects: projects.map((p) => ({
                id: p.id,
                name: p.name,
                code: p.code,
                status: p.status,
                client: p.client?.name,
            })),
            clients: clients.map((c) => ({
                id: c.id,
                name: c.name,
                code: c.code,
                isActive: c.isActive,
            })),
            regions: regions.map((r) => ({
                id: r.id,
                name: r.name,
                code: r.code,
                department: r.department,
            })),
            users: users.map((u) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role?.name,
            })),
        };
    }
}

export default new SearchService();
