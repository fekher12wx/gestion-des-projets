import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import reportService from '../services/report.service';
import type { FileStatusReport, PerformanceMetrics, StageAnalysis, UserProductivity, ReportFilters } from '../types';
import './ReportsPage.css';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ReportsPage: React.FC = () => {
    const [fileStatusData, setFileStatusData] = useState<FileStatusReport | null>(null);
    const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
    const [stageData, setStageData] = useState<StageAnalysis[]>([]);
    const [productivityData, setProductivityData] = useState<UserProductivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ReportFilters>({});

    // Fetch all report data
    const fetchReportData = async () => {
        setLoading(true);
        try {
            const [status, performance, stages, productivity] = await Promise.all([
                reportService.getFileStatusReport(filters),
                reportService.getPerformanceMetrics(filters),
                reportService.getStageAnalysis(filters),
                reportService.getUserProductivity(filters),
            ]);

            setFileStatusData(status);
            setPerformanceData(performance);
            setStageData(stages);
            setProductivityData(productivity);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [filters]);

    // File Status Pie Chart Data
    const fileStatusChartData = fileStatusData ? {
        labels: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
        datasets: [{
            data: [
                fileStatusData.PENDING,
                fileStatusData.IN_PROGRESS,
                fileStatusData.COMPLETED,
                fileStatusData.ON_HOLD,
                fileStatusData.CANCELLED,
            ],
            backgroundColor: ['#6B7280', '#374151', '#111827', '#9CA3AF', '#D1D5DB'],
            borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff'],
            borderWidth: 2,
        }],
    } : null;

    // Stage Progress Bar Chart Data
    const stageChartData = stageData.length > 0 ? {
        labels: stageData.map(s => s.stageName),
        datasets: [{
            label: 'Files per Stage',
            data: stageData.map(s => s.fileCount),
            backgroundColor: '#111827',
            borderColor: '#000',
            borderWidth: 1,
        }],
    } : null;

    // User Productivity Bar Chart Data (Top 10 users)
    const productivityChartData = productivityData.length > 0 ? {
        labels: productivityData.slice(0, 10).map(u => u.userName),
        datasets: [{
            label: 'Completed Files',
            data: productivityData.slice(0, 10).map(u => u.completedFiles),
            backgroundColor: '#111827',
            borderColor: '#000',
            borderWidth: 1,
        }],
    } : null;

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value || undefined,
        }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h1>Reports & Analytics</h1>
                <p>Comprehensive insights into POI file management performance</p>
            </div>

            {/* Filters Panel */}
            <div className="filters-panel">
                <div className="filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate || ''}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate || ''}
                        onChange={handleFilterChange}
                    />
                </div>
                <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
            </div>

            {loading ? (
                <div className="loading-state">Loading report data...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    {performanceData && (
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon">📊</div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Total Files</p>
                                    <p className="kpi-value">{performanceData.totalFiles}</p>
                                </div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon">✅</div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Completed</p>
                                    <p className="kpi-value">{performanceData.completedFiles}</p>
                                </div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon">🔄</div>
                                <div className="kpi-content">
                                    <p className="kpi-label">In Progress</p>
                                    <p className="kpi-value">{fileStatusData?.IN_PROGRESS || 0}</p>
                                </div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon">⚠️</div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Overdue</p>
                                    <p className="kpi-value">{performanceData.overdueFiles}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* File Status Pie Chart */}
                        {fileStatusChartData && (
                            <div className="chart-card">
                                <h3>File Status Distribution</h3>
                                <div className="chart-container">
                                    <Pie
                                        data={fileStatusChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Stage Progress Bar Chart */}
                        {stageChartData && (
                            <div className="chart-card">
                                <h3>Files by Stage</h3>
                                <div className="chart-container">
                                    <Bar
                                        data={stageChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    display: false,
                                                },
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1,
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Performance Metrics Card */}
                        {performanceData && (
                            <div className="chart-card metrics-card">
                                <h3>Performance Metrics</h3>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <p className="metric-label">Completion Rate</p>
                                        <p className="metric-value">{(performanceData.completionRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="metric-item">
                                        <p className="metric-label">Avg Completion Time</p>
                                        <p className="metric-value">{performanceData.avgCompletionDays} days</p>
                                    </div>
                                    <div className="metric-item">
                                        <p className="metric-label">Total Files</p>
                                        <p className="metric-value">{performanceData.totalFiles}</p>
                                    </div>
                                    <div className="metric-item">
                                        <p className="metric-label">Overdue Files</p>
                                        <p className="metric-value">{performanceData.overdueFiles}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User Productivity Bar Chart */}
                        {productivityChartData && (
                            <div className="chart-card">
                                <h3>Top Contributors (Completed Files)</h3>
                                <div className="chart-container">
                                    <Bar
                                        data={productivityChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            indexAxis: 'y',
                                            plugins: {
                                                legend: {
                                                    display: false,
                                                },
                                            },
                                            scales: {
                                                x: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1,
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Productivity Table */}
                    {productivityData.length > 0 && (
                        <div className="productivity-table-section">
                            <h3>User Productivity Details</h3>
                            <div className="table-container">
                                <table className="productivity-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Assigned</th>
                                            <th>Completed</th>
                                            <th>Completion Rate</th>
                                            <th>Avg Days</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productivityData.map(user => (
                                            <tr key={user.userId}>
                                                <td>{user.userName}</td>
                                                <td>{user.role}</td>
                                                <td>{user.assignedFiles}</td>
                                                <td>{user.completedFiles}</td>
                                                <td>{(user.completionRate * 100).toFixed(1)}%</td>
                                                <td>{user.avgCompletionDays}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsPage;
