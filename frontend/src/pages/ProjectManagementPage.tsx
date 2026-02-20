import React, { useState, useEffect } from 'react';
import projectService from '../services/project.service';
import clientService from '../services/client.service';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Client } from '../types';
import './admin/UserManagementPage.css';

interface ProjectFormData {
    name: string;
    code: string;
    clientId: string;
    description: string;
}

const ProjectManagementPage: React.FC = () => {
    const { canCreate, canUpdate, canDelete } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        code: '',
        clientId: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState<Partial<ProjectFormData>>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (err: any) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data);
        } catch (err) {
            console.error('Failed to load clients', err);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchClients();
    }, []);

    const handleCreate = () => {
        setCurrentProject(null);
        setFormData({ name: '', code: '', clientId: '', description: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        setFormData({
            name: project.name,
            code: project.code,
            clientId: project.clientId,
            description: project.description || ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectService.delete(id);
            fetchProjects();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete project');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (currentProject) {
                await projectService.update(currentProject.id, formData);
            } else {
                await projectService.create(formData);
            }
            setShowModal(false);
            fetchProjects();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to save project';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Project Management</h1>
                    <p className="admin-subtitle">Manage projects and assignments.</p>
                </div>
                {canCreate('projects') && (
                    <button className="create-user-btn" onClick={handleCreate}>
                        + Create Project
                    </button>
                )}
            </div>

            <div className="filters-bar">
                <form className="search-form">
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </form>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Client</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No projects found
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td>{project.name}</td>
                                        <td>{project.code}</td>
                                        <td>{project.client?.name || '-'}</td>
                                        <td>{project.description || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {canUpdate('projects') && (
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEdit(project)}
                                                        title="Edit"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete('projects') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(project.id)}
                                                        title="Delete"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Delete
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
            )}

            {/* Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{currentProject ? 'Edit Project' : 'Create New Project'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="clientId">
                                    Client <span className="required">*</span>
                                </label>
                                <select
                                    id="clientId"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className={formErrors.clientId ? 'error' : ''}
                                    required
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
                                <label htmlFor="name">
                                    Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={formErrors.name ? 'error' : ''}
                                    required
                                />
                                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="code">
                                    Code <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className={formErrors.code ? 'error' : ''}
                                    required
                                />
                                {formErrors.code && <span className="error-message">{formErrors.code}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Add project description..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={submitting}>
                                    {submitting ? 'Saving...' : (currentProject ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManagementPage;
