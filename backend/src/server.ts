import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import poiFileRoutes from './routes/poi-file.routes';
import projectRoutes from './routes/project.routes';
import regionRoutes from './routes/region.routes';
import clientRoutes from './routes/client.routes';
import fileHistoryRoutes from './routes/file-history.routes';
import fileCommentRoutes from './routes/file-comment.routes';
import fileAttachmentRoutes from './routes/file-attachment.routes';
import alertRoutes from './routes/alert.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import savedFilterRoutes from './routes/saved-filter.routes';
import preferenceRoutes from './routes/preference.routes';
import settingsRoutes from './routes/settings.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'POI FTTH Management API'
    });
});

// API routes
app.get('/api/v1/', (_req, res) => {
    res.json({
        message: 'POI FTTH Management System API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            roles: '/api/v1/roles',
            poiFiles: '/api/v1/poi-files',
            clients: '/api/v1/clients',
            projects: '/api/v1/projects',
            regions: '/api/v1/regions',
            fileHistory: '/api/v1/file-history',
            comments: '/api/v1/comments',
            attachments: '/api/v1/attachments',
            alerts: '/api/v1/alerts',
            reports: '/api/v1/reports',
            dashboard: '/api/v1/dashboard',
            search: '/api/v1/search',
            savedFilters: '/api/v1/saved-filters',
            preferences: '/api/v1/preferences',
            settings: '/api/v1/settings'
        }
    });
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// User management routes
app.use('/api/v1/users', userRoutes);

// Role routes
app.use('/api/v1/roles', roleRoutes);

// POI file routes
app.use('/api/v1/poi-files', poiFileRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/regions', regionRoutes);
app.use('/api/v1/file-history', fileHistoryRoutes);
app.use('/api/v1/comments', fileCommentRoutes);
app.use('/api/v1/attachments', fileAttachmentRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/saved-filters', savedFilterRoutes);
app.use('/api/v1/preferences', preferenceRoutes);
app.use('/api/v1/settings', settingsRoutes);


// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
