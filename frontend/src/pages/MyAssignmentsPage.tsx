import React, { useState, useEffect } from 'react';
import poiFileService from '../services/poi-file.service';
import { useAuth } from '../contexts/AuthContext';
import type { PoiFile } from '../types';
import './PoiFilesPage.css';

const MyAssignmentsPage: React.FC = () => {
    const { user } = useAuth();
    const [poiFiles, setPoiFiles] = useState<PoiFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'technician' | 'studyManager' | 'businessManager'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [total, setTotal] = useState(0);

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            // Build filters based on active tab
            const filters: any = {
                limit: 100,
                search: searchTerm || undefined,
            };

            if (activeTab === 'all') {
                filters.assignedToMe = true;
            } else if (activeTab === 'technician') {
                filters.technicianId = user?.id;
            } else if (activeTab === 'studyManager') {
                filters.studyManagerId = user?.id;
            } else if (activeTab === 'businessManager') {
                filters.businessManagerId = user?.id;
            }

            const data = await poiFileService.getPoiFiles(filters);
            setPoiFiles(data.poiFiles);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [activeTab, searchTerm]);

    const getStageLabel = (stage: number): string => {
        const stages = [
            'Feasibility Assessment',
            'Design & Planning',
            'Approval & Permits',
            'Installation',
            'Testing & Quality',
            'Completion & Handover'
        ];
        return stages[stage - 1] || `Stage ${stage}`;
    };

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'OPEN': return 'status-badge-open';
            case 'IN_PROGRESS': return 'status-badge-in-progress';
            case 'COMPLETED': return 'status-badge-completed';
            case 'ARCHIVED': return 'status-badge-archived';
            default: return 'status-badge-default';
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">My Assignments</h1>
                    <p className="admin-subtitle">POI files assigned to you ({total} total)</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container" style={{ marginTop: '1rem', borderBottom: '2px solid #e5e5e5' }}>
                <div className="tabs" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: activeTab === 'all' ? '#000' : 'transparent',
                            color: activeTab === 'all' ? '#fff' : '#666',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        All Assignments
                    </button>
                    <button
                        className={`tab ${activeTab === 'technician' ? 'active' : ''}`}
                        onClick={() => setActiveTab('technician')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: activeTab === 'technician' ? '#000' : 'transparent',
                            color: activeTab === 'technician' ? '#fff' : '#666',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        As Technician
                    </button>
                    <button
                        className={`tab ${activeTab === 'studyManager' ? 'active' : ''}`}
                        onClick={() => setActiveTab('studyManager')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: activeTab === 'studyManager' ? '#000' : 'transparent',
                            color: activeTab === 'studyManager' ? '#fff' : '#666',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        As Study Manager
                    </button>
                    <button
                        className={`tab ${activeTab === 'businessManager' ? 'active' : ''}`}
                        onClick={() => setActiveTab('businessManager')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: activeTab === 'businessManager' ? '#000' : 'transparent',
                            color: activeTab === 'businessManager' ? '#fff' : '#666',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        As Business Manager
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="filters-bar">
                <form className="search-form">
                    <input
                        type="text"
                        placeholder="Search assignments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </form>
            </div>

            {/* Files Table */}
            {loading ? (
                <div className="loading">Loading assignments...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>File Number</th>
                                <th>Project</th>
                                <th>Region</th>
                                <th>Status</th>
                                <th>Stage</th>
                                <th>Reception Date</th>
                                <th>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poiFiles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No assignments found
                                    </td>
                                </tr>
                            ) : (
                                poiFiles.map((file) => (
                                    <tr key={file.id}>
                                        <td>
                                            <strong>{file.fileNumber}</strong>
                                        </td>
                                        <td>{file.project?.name || '-'}</td>
                                        <td>{file.region?.name || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(file.status)}`}>
                                                {file.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="stage-badge">
                                                {getStageLabel(file.currentStage)}
                                            </span>
                                        </td>
                                        <td>{file.receptionDate ? new Date(file.receptionDate).toLocaleDateString() : '-'}</td>

                                        <td>
                                            {file.isPriority && (
                                                <span className="priority-badge">⚠️ Priority</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyAssignmentsPage;
