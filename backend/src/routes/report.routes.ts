import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/file-status
 * @desc    Get file status distribution report
 * @access  Private
 * @query   startDate (optional) - Filter from date
 * @query   endDate (optional) - Filter to date
 * @query   projectId (optional) - Filter by project
 * @query   regionId (optional) - Filter by region
 */
router.get('/file-status', reportController.getFileStatusReport.bind(reportController));

/**
 * @route   GET /api/v1/reports/performance
 * @desc    Get performance metrics report
 * @access  Private
 * @query   startDate, endDate, projectId, regionId (all optional)
 */
router.get('/performance', reportController.getPerformanceMetrics.bind(reportController));

/**
 * @route   GET /api/v1/reports/stage-analysis
 * @desc    Get stage analysis report
 * @access  Private
 * @query   startDate, endDate, projectId, regionId (all optional)
 */
router.get('/stage-analysis', reportController.getStageAnalysis.bind(reportController));

/**
 * @route   GET /api/v1/reports/user-productivity
 * @desc    Get user productivity report
 * @access  Private
 * @query   startDate, endDate, projectId, regionId, userId (all optional)
 */
router.get('/user-productivity', reportController.getUserProductivity.bind(reportController));

/**
 * @route   POST /api/v1/reports/export/pdf
 * @desc    Export report to PDF
 * @access  Private
 * @body    reportType - Type of report to export
 * @body    filters - Filter parameters
 */
router.post('/export/pdf', reportController.exportPDF.bind(reportController));

/**
 * @route   POST /api/v1/reports/export/excel
 * @desc    Export report to Excel
 * @access  Private
 * @body    reportType - Type of report to export
 * @body    filters - Filter parameters
 */
router.post('/export/excel', reportController.exportExcel.bind(reportController));

export default router;
