import { Request, Response } from 'express';
import reportService from '../services/report.service';

export class ReportController {
    /**
     * GET /api/v1/reports/file-status
     * Get file status distribution report
     */
    async getFileStatusReport(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, projectId, regionId } = req.query;

            const filters: any = {};
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (projectId) filters.projectId = projectId as string;
            if (regionId) filters.regionId = regionId as string;

            const report = await reportService.getFileStatusReport(filters);

            res.json(report);
        } catch (error: any) {
            console.error('Get file status report error:', error);
            res.status(500).json({
                message: 'Failed to generate file status report',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/v1/reports/performance
     * Get performance metrics report
     */
    async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, projectId, regionId } = req.query;

            const filters: any = {};
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (projectId) filters.projectId = projectId as string;
            if (regionId) filters.regionId = regionId as string;

            const metrics = await reportService.getPerformanceMetrics(filters);

            res.json(metrics);
        } catch (error: any) {
            console.error('Get performance metrics error:', error);
            res.status(500).json({
                message: 'Failed to generate performance metrics',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/v1/reports/stage-analysis
     * Get stage analysis report
     */
    async getStageAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, projectId, regionId } = req.query;

            const filters: any = {};
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (projectId) filters.projectId = projectId as string;
            if (regionId) filters.regionId = regionId as string;

            const analysis = await reportService.getStageAnalysis(filters);

            res.json(analysis);
        } catch (error: any) {
            console.error('Get stage analysis error:', error);
            res.status(500).json({
                message: 'Failed to generate stage analysis',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/v1/reports/user-productivity
     * Get user productivity report
     */
    async getUserProductivity(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, projectId, regionId, userId } = req.query;

            const filters: any = {};
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (projectId) filters.projectId = projectId as string;
            if (regionId) filters.regionId = regionId as string;
            if (userId) filters.userId = userId as string;

            const productivity = await reportService.getUserProductivity(filters);

            res.json(productivity);
        } catch (error: any) {
            console.error('Get user productivity error:', error);
            res.status(500).json({
                message: 'Failed to generate user productivity report',
                error: error.message,
            });
        }
    }

    /**
     * POST /api/v1/reports/export/pdf
     * Export report to PDF
     */
    async exportPDF(_req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement PDF export using pdfkit or puppeteer
            // For now, return a placeholder response
            res.status(501).json({
                message: 'PDF export not yet implemented',
                note: 'This feature requires pdfkit or puppeteer library',
            });
        } catch (error: any) {
            console.error('Export PDF error:', error);
            res.status(500).json({
                message: 'Failed to export PDF',
                error: error.message,
            });
        }
    }

    /**
     * POST /api/v1/reports/export/excel
     * Export report to Excel
     */
    async exportExcel(_req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement Excel export using exceljs
            // For now, return a placeholder response
            res.status(501).json({
                message: 'Excel export not yet implemented',
                note: 'This feature requires exceljs library',
            });
        } catch (error: any) {
            console.error('Export Excel error:', error);
            res.status(500).json({
                message: 'Failed to export Excel',
                error: error.message,
            });
        }
    }
}

export default new ReportController();
