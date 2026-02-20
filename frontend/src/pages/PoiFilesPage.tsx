import React, { useState, useEffect } from 'react';
import poiFileService from '../services/poi-file.service';
import projectService from '../services/project.service';
import clientService from '../services/client.service';
import regionService from '../services/region.service';
import userService from '../services/user.service';
import type { PoiFile, PoiFileFilters, Project, Client, Region, User } from '../types';
import { usePermission } from '../hooks/usePermission';
import CommentsSection from '../components/CommentsSection';
import AttachmentsSection from '../components/AttachmentsSection';
import ActivityTimeline from '../components/ActivityTimeline';
import './PoiFilesPage.css';

const PoiFilesPage: React.FC = () => {
    const { canCreate, canUpdate, canDelete } = usePermission();
    const [poiFiles, setPoiFiles] = useState<PoiFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [stageFilter, setStageFilter] = useState<number | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<PoiFile | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Details modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<PoiFile | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'history'>('details');

    // Dropdown data
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Form data
    interface PoiFileFormData {
        clientId: string;
        projectId: string;
        regionId: string;
        technicianId: string;
        studyManagerId: string;
        businessManagerId: string;
        receptionDate: string;
        expectedCompletionDate: string;
        description: string;
        isPriority: boolean;
    }

    const [formData, setFormData] = useState<PoiFileFormData>({
        clientId: '',
        projectId: '',
        regionId: '',
        technicianId: '',
        studyManagerId: '',
        businessManagerId: '',
        receptionDate: new Date().toISOString().split('T')[0],
        expectedCompletionDate: '',
        description: '',
        isPriority: false,
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Quick create states
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showRegionForm, setShowRegionForm] = useState(false);
    const [newProjectData, setNewProjectData] = useState({ name: '', code: '' });
    const [newRegionData, setNewRegionData] = useState({ name: '', code: '' });

    // Fetch POI files
    const fetchPoiFiles = async () => {
        try {
            setLoading(true);
            const filters: PoiFileFilters = {
                page,
                limit,
                search: searchTerm || undefined,
                status: statusFilter || undefined,
                currentStage: stageFilter !== '' ? stageFilter : undefined,
                isPriority: priorityFilter === 'true' ? true : priorityFilter === 'false' ? false : undefined,
            };

            const data = await poiFileService.getPoiFiles(filters);
            setPoiFiles(data.poiFiles);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch POI files:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoiFiles();
    }, [page, limit, searchTerm, statusFilter, stageFilter, priorityFilter]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    // Load dropdown data when modal opens
    useEffect(() => {
        if (isModalOpen) {
            const loadModalData = async () => {
                try {
                    const [projectsData, clientsData, regionsData, usersData] = await Promise.all([
                        projectService.getProjects(),
                        clientService.getAll(),
                        regionService.getRegions(),
                        userService.getUsers({ limit: 100 }),
                    ]);
                    setProjects(projectsData);
                    setClients(clientsData);
                    setRegions(regionsData);
                    setUsers(usersData.users);

                    // If editing, populate form
                    if (editingFile) {
                        setFormData({
                            clientId: editingFile.project?.clientId || '',
                            projectId: editingFile.projectId,
                            regionId: editingFile.regionId,
                            technicianId: editingFile.technicianId || '',
                            studyManagerId: editingFile.studyManagerId || '',
                            businessManagerId: editingFile.businessManagerId || '',
                            receptionDate: editingFile.receptionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                            expectedCompletionDate: editingFile.expectedCompletionDate?.split('T')[0] || '',
                            description: editingFile.notes || '',
                            isPriority: editingFile.isPriority,
                        });
                    } else {
                        // Reset form for new file
                        setFormData({
                            clientId: '',
                            projectId: '',
                            regionId: '',
                            technicianId: '',
                            studyManagerId: '',
                            businessManagerId: '',
                            receptionDate: new Date().toISOString().split('T')[0],
                            expectedCompletionDate: '',
                            description: '',
                            isPriority: false,
                        });
                    }
                } catch (error) {
                    console.error('Failed to load modal data:', error);
                }
            };
            loadModalData();
        }
    }, [isModalOpen, editingFile]);

    const handleCreate = () => {
        if (!canCreate('poi_files')) {
            alert('You do not have permission to create POI files');
            return;
        }
        setEditingFile(null);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (file: PoiFile) => {
        if (!canUpdate('poi_files')) {
            alert('You do not have permission to edit POI files');
            return;
        }
        setEditingFile(file);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFile(null);
        setFormErrors({});
    };

    const handleFormChange = (field: keyof PoiFileFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.projectId) errors.projectId = 'Project is required';
        if (!formData.regionId) errors.regionId = 'Region is required';
        if (!formData.receptionDate) errors.receptionDate = 'Reception date is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSubmitting(true);

            const submitData: any = {
                projectId: formData.projectId,
                regionId: formData.regionId,
                receptionDate: formData.receptionDate,
                expectedCompletionDate: formData.expectedCompletionDate || undefined,
                notes: formData.description || undefined,
                isPriority: formData.isPriority,
            };

            // Only include user assignments if they're selected
            if (formData.technicianId) submitData.technicianId = formData.technicianId;
            if (formData.studyManagerId) submitData.studyManagerId = formData.studyManagerId;
            if (formData.businessManagerId) submitData.businessManagerId = formData.businessManagerId;

            if (editingFile) {
                await poiFileService.updatePoiFile(editingFile.id, submitData);
            } else {
                await poiFileService.createPoiFile(submitData);
            }

            handleCloseModal();
            fetchPoiFiles();
        } catch (error: any) {
            console.error('Failed to save POI file:', error);
            alert(error.response?.data?.error || 'Failed to save POI file');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this POI file?')) return;

        try {
            await poiFileService.deletePoiFile(id);
            fetchPoiFiles();
        } catch (error) {
            console.error('Failed to delete POI file:', error);
            alert('Failed to delete POI file');
        }
    };

    const handleAdvanceStage = async (id: string) => {
        try {
            await poiFileService.advanceStage(id);
            fetchPoiFiles();
        } catch (error) {
            console.error('Failed to advance stage:', error);
            alert('Failed to advance stage');
        }
    };

    const handleViewDetails = (file: PoiFile) => {
        setViewingFile(file);
        setIsDetailsModalOpen(true);
        setActiveTab('details');
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setViewingFile(null);
        setActiveTab('details');
    };

    // Quick create handlers
    const handleQuickCreateProject = async () => {
        if (!newProjectData.name || !newProjectData.code) {
            alert('Please enter project name and code');
            return;
        }

        try {
            const project = await projectService.create(newProjectData);
            setProjects([...projects, project]);
            setFormData({ ...formData, projectId: project.id });
            setNewProjectData({ name: '', code: '' });
            setShowProjectForm(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create project');
        }
    };

    const handleQuickCreateRegion = async () => {
        if (!newRegionData.name || !newRegionData.code) {
            alert('Please enter region name and code');
            return;
        }

        try {
            const region = await regionService.create(newRegionData);
            setRegions([...regions, region]);
            setFormData({ ...formData, regionId: region.id });
            setNewRegionData({ name: '', code: '' });
            setShowRegionForm(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create region');
        }
    };

    const getStageLabel = (stageNumber: number) => {
        const stages = ['Reception', 'Study Launch', 'Field Work', 'Study Validation', 'Business Validation', 'Sending & Closing'];
        return stages[stageNumber - 1] || `Stage ${stageNumber}`;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return 'status-badge status-pending';
            case 'IN_PROGRESS':
                return 'status-badge status-in-progress';
            case 'COMPLETED':
                return 'status-badge status-completed';
            case 'BLOCKED':
                return 'status-badge status-blocked';
            default:
                return 'status-badge';
        }
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>POI File Management</h1>
                    <p className="page-subtitle">Manage and track all POI FTTH study files</p>
                </div>
                {canCreate('poi_files') && (
                    <button className="btn-primary" onClick={handleCreate}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create POI File
                    </button>
                )}
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by file number..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                </select>

                <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value === '' ? '' : parseInt(e.target.value)); setPage(1); }}>
                    <option value="">All Stages</option>
                    <option value="1">Stage 1: Reception</option>
                    <option value="2">Stage 2: Study Launch</option>
                    <option value="3">Stage 3: Field Work</option>
                    <option value="4">Stage 4: Study Validation</option>
                    <option value="5">Stage 5: Business Validation</option>
                    <option value="6">Stage 6: Sending & Closing</option>
                </select>

                <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
                    <option value="">All Priorities</option>
                    <option value="true">Priority Files</option>
                    <option value="false">Normal Files</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-state">Loading POI files...</div>
            ) : (
                <>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>File Number</th>
                                    <th>Project</th>
                                    <th>Region</th>
                                    <th>Current Stage</th>
                                    <th>Status</th>
                                    <th>Technician</th>
                                    <th>Priority</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poiFiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="empty-state">
                                            <p>No POI files found</p>
                                            <button className="btn-secondary" onClick={handleCreate}>Create your first POI file</button>
                                        </td>
                                    </tr>
                                ) : (
                                    poiFiles.map((file) => (
                                        <tr key={file.id}>
                                            <td className="font-mono">{file.fileNumber}</td>
                                            <td>{file.project?.name || '-'}</td>
                                            <td>{file.region?.name || '-'}</td>
                                            <td>
                                                <div className="stage-badge">
                                                    Stage {file.currentStage}: {getStageLabel(file.currentStage)}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={getStatusBadgeClass(file.status)}>
                                                    {file.status}
                                                </span>
                                            </td>
                                            <td>
                                                {file.technician ? `${file.technician.firstName} ${file.technician.lastName}` : '-'}
                                            </td>
                                            <td>
                                                {file.isPriority && (
                                                    <span className="priority-badge">
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon" title="View Details" onClick={() => handleViewDetails(file)}>
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    <button className="btn-icon" title="Edit" onClick={() => handleEdit(file)}>
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    {file.currentStage < 6 && canUpdate('poi_files') && (
                                                        <button className="btn-icon" title="Advance Stage" onClick={() => handleAdvanceStage(file.id)}>
                                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDelete('poi_files') && (
                                                        <button className="btn-icon btn-danger" title="Delete" onClick={() => handleDelete(file.id)}>
                                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {page} of {totalPages} ({total} total files)
                            </span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* POI File Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingFile ? 'Edit POI File' : 'Create New POI File'}</h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="clientId">
                                        Client <span className="required">*</span>
                                    </label>
                                    <select
                                        id="clientId"
                                        value={formData.clientId}
                                        onChange={(e) => handleFormChange('clientId', e.target.value)}
                                        className={formErrors.clientId ? 'error' : ''}
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} ({client.code})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.clientId && <span className="error-message">{formErrors.clientId}</span>}
                                </div>

                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label htmlFor="projectId">
                                            Project <span className="required">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowProjectForm(!showProjectForm)}
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {showProjectForm ? 'Cancel' : '+ New'}
                                        </button>
                                    </div>
                                    {showProjectForm ? (
                                        <div style={{ border: '1px solid #d0d0d0', padding: '0.75rem', borderRadius: '6px', background: '#f9f9f9' }}>
                                            <input
                                                type="text"
                                                placeholder="Project Name"
                                                value={newProjectData.name}
                                                onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                                                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Project Code"
                                                value={newProjectData.code}
                                                onChange={(e) => setNewProjectData({ ...newProjectData, code: e.target.value })}
                                                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickCreateProject}
                                                style={{ width: '100%', padding: '0.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Create Project
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                id="projectId"
                                                value={formData.projectId}
                                                onChange={(e) => handleFormChange('projectId', e.target.value)}
                                                className={formErrors.projectId ? 'error' : ''}
                                            >
                                                <option value="">Select Project</option>
                                                {projects.map(project => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name} ({project.code})
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.projectId && <span className="error-message">{formErrors.projectId}</span>}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label htmlFor="regionId">
                                            Region <span className="required">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowRegionForm(!showRegionForm)}
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {showRegionForm ? 'Cancel' : '+ New'}
                                        </button>
                                    </div>
                                    {showRegionForm ? (
                                        <div style={{ border: '1px solid #d0d0d0', padding: '0.75rem', borderRadius: '6px', background: '#f9f9f9' }}>
                                            <input
                                                type="text"
                                                placeholder="Region Name"
                                                value={newRegionData.name}
                                                onChange={(e) => setNewRegionData({ ...newRegionData, name: e.target.value })}
                                                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Region Code"
                                                value={newRegionData.code}
                                                onChange={(e) => setNewRegionData({ ...newRegionData, code: e.target.value })}
                                                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #d0d0d0', borderRadius: '4px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickCreateRegion}
                                                style={{ width: '100%', padding: '0.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Create Region
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                id="regionId"
                                                value={formData.regionId}
                                                onChange={(e) => handleFormChange('regionId', e.target.value)}
                                                className={formErrors.regionId ? 'error' : ''}
                                            >
                                                <option value="">Select Region</option>
                                                {regions.map(region => (
                                                    <option key={region.id} value={region.id}>
                                                        {region.name} ({region.code})
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.regionId && <span className="error-message">{formErrors.regionId}</span>}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="technicianId">Technician</label>
                                    <select
                                        id="technicianId"
                                        value={formData.technicianId}
                                        onChange={(e) => handleFormChange('technicianId', e.target.value)}
                                    >
                                        <option value="">-- Not Assigned --</option>
                                        {users.filter(u => u.role.name === 'Technician' || u.role.name === 'Admin').map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="studyManagerId">Study Manager</label>
                                    <select
                                        id="studyManagerId"
                                        value={formData.studyManagerId}
                                        onChange={(e) => handleFormChange('studyManagerId', e.target.value)}
                                    >
                                        <option value="">-- Not Assigned --</option>
                                        {users.filter(u => u.role.name === 'Study Manager' || u.role.name === 'Admin').map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="businessManagerId">Business Manager</label>
                                    <select
                                        id="businessManagerId"
                                        value={formData.businessManagerId}
                                        onChange={(e) => handleFormChange('businessManagerId', e.target.value)}
                                    >
                                        <option value="">-- Not Assigned --</option>
                                        {users.filter(u => u.role.name === 'Manager' || u.role.name === 'Admin').map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="isPriority" className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            id="isPriority"
                                            checked={formData.isPriority}
                                            onChange={(e) => handleFormChange('isPriority', e.target.checked)}
                                        />
                                        <span>Mark as Priority</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="receptionDate">
                                        Reception Date <span className="required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="receptionDate"
                                        value={formData.receptionDate}
                                        onChange={(e) => handleFormChange('receptionDate', e.target.value)}
                                        className={formErrors.receptionDate ? 'error' : ''}
                                    />
                                    {formErrors.receptionDate && <span className="error-message">{formErrors.receptionDate}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="expectedCompletionDate">Expected Completion Date</label>
                                    <input
                                        type="date"
                                        id="expectedCompletionDate"
                                        value={formData.expectedCompletionDate}
                                        onChange={(e) => handleFormChange('expectedCompletionDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    rows={4}
                                    placeholder="Add project description..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : editingFile ? 'Update POI File' : 'Create POI File'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* POI File Details Modal */}
            {isDetailsModalOpen && viewingFile && (
                <div className="modal-overlay" onClick={handleCloseDetailsModal}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>POI File #{viewingFile.fileNumber}</h2>
                                <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                    {viewingFile.project?.name} - {viewingFile.region?.name}
                                </p>
                            </div>
                            <button className="modal-close" onClick={handleCloseDetailsModal}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="modal-tabs">
                            <button
                                className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                Details
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comments')}
                            >
                                Comments
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'attachments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attachments')}
                            >
                                Attachments
                            </button>
                            <button
                                className={`modal-tab ${activeTab === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                History
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="modal-tab-content">
                            {activeTab === 'details' && (
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <label>File Number</label>
                                        <span>{viewingFile.fileNumber}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Status</label>
                                        <span className={`status-badge status-${viewingFile.status?.toLowerCase()}`}>
                                            {viewingFile.status}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Stage</label>
                                        <span>{viewingFile.currentStage}/6</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Priority</label>
                                        <span>{viewingFile.isPriority ? '⭐ High Priority' : 'Normal'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Project</label>
                                        <span>{viewingFile.project?.name} ({viewingFile.project?.code})</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Region</label>
                                        <span>{viewingFile.region?.name} ({viewingFile.region?.code})</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Technician</label>
                                        <span>
                                            {viewingFile.technician
                                                ? `${viewingFile.technician.firstName} ${viewingFile.technician.lastName}`
                                                : 'Not assigned'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Study Manager</label>
                                        <span>
                                            {viewingFile.studyManager
                                                ? `${viewingFile.studyManager.firstName} ${viewingFile.studyManager.lastName}`
                                                : 'Not assigned'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Business Manager</label>
                                        <span>
                                            {viewingFile.businessManager
                                                ? `${viewingFile.businessManager.firstName} ${viewingFile.businessManager.lastName}`
                                                : 'Not assigned'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Reception Date</label>
                                        <span>{viewingFile.receptionDate ? new Date(viewingFile.receptionDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Expected Completion</label>
                                        <span>
                                            {viewingFile.expectedCompletionDate
                                                ? new Date(viewingFile.expectedCompletionDate).toLocaleDateString()
                                                : 'Not set'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Created</label>
                                        <span>{viewingFile.createdAt ? new Date(viewingFile.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    {viewingFile.notes && (
                                        <div className="detail-item full-width">
                                            <label>Notes</label>
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewingFile.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <CommentsSection poiFileId={viewingFile.id} />
                            )}

                            {activeTab === 'attachments' && (
                                <AttachmentsSection poiFileId={viewingFile.id} />
                            )}

                            {activeTab === 'history' && (
                                <ActivityTimeline history={[]} loading={false} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PoiFilesPage;
