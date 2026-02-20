import api from './api';
import type {
    FileStatusReport,
    PerformanceMetrics,
    StageAnalysis,
    UserProductivity,
    ReportFilters
} from '../types';

class ReportService {
    private readonly baseUrl = '/reports';

    /**
     * Get file status distribution report
     */
    async getFileStatusReport(filters?: ReportFilters): Promise<FileStatusReport> {
        const response = await api.get<FileStatusReport>(`${this.baseUrl}/file-status`, {
            params: filters
        });
        return response.data;
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(filters?: ReportFilters): Promise<PerformanceMetrics> {
        const response = await api.get<PerformanceMetrics>(`${this.baseUrl}/performance`, {
            params: filters
        });
        return response.data;
    }

    /**
     * Get stage analysis
     */
    async getStageAnalysis(filters?: ReportFilters): Promise<StageAnalysis[]> {
        const response = await api.get<StageAnalysis[]>(`${this.baseUrl}/stage-analysis`, {
            params: filters
        });
        return response.data;
    }

    /**
     * Get user productivity report
     */
    async getUserProductivity(filters?: ReportFilters): Promise<UserProductivity[]> {
        const response = await api.get<UserProductivity[]>(`${this.baseUrl}/user-productivity`, {
            params: filters
        });
        return response.data;
    }

    /**
     * Export report to PDF
     */
    async exportPDF(reportType: string, filters?: ReportFilters): Promise<Blob> {
        const response = await api.post(`${this.baseUrl}/export/pdf`, {
            reportType,
            filters
        }, {
            responseType: 'blob'
        });
        return response.data;
    }

    /**
     * Export report to Excel
     */
    async exportExcel(reportType: string, filters?: ReportFilters): Promise<Blob> {
        const response = await api.post(`${this.baseUrl}/export/excel`, {
            reportType,
            filters
        }, {
            responseType: 'blob'
        });
        return response.data;
    }
}

export default new ReportService();
