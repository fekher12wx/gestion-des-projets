import React, { useState, useEffect } from 'react';
import regionService from '../services/region.service';
import { useAuth } from '../contexts/AuthContext';
import type { Region } from '../types';
import './admin/UserManagementPage.css';

interface RegionFormData {
    name: string;
    code: string;
}

const RegionManagementPage: React.FC = () => {
    const { canCreate, canUpdate, canDelete } = useAuth();
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
    const [formData, setFormData] = useState<RegionFormData>({
        name: '',
        code: ''
    });
    const [formErrors, setFormErrors] = useState<Partial<RegionFormData>>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const data = await regionService.getRegions();
            setRegions(data);
        } catch (err: any) {
            console.error('Failed to load regions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegions();
    }, []);

    const handleCreate = () => {
        setCurrentRegion(null);
        setFormData({ name: '', code: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (region: Region) => {
        setCurrentRegion(region);
        setFormData({
            name: region.name,
            code: region.code
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this region?')) return;
        try {
            await regionService.delete(id);
            fetchRegions();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete region');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (currentRegion) {
                await regionService.update(currentRegion.id, formData);
            } else {
                await regionService.create(formData);
            }
            setShowModal(false);
            fetchRegions();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to save region';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRegions = regions.filter(region =>
        region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Region Management</h1>
                    <p className="admin-subtitle">Manage regions and geographical areas.</p>
                </div>
                {canCreate('regions') && (
                    <button className="create-user-btn" onClick={handleCreate}>
                        + Create Region
                    </button>
                )}
            </div>

            <div className="filters-bar">
                <form className="search-form">
                    <input
                        type="text"
                        placeholder="Search regions..."
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRegions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No regions found
                                    </td>
                                </tr>
                            ) : (
                                filteredRegions.map((region) => (
                                    <tr key={region.id}>
                                        <td>{region.name}</td>
                                        <td>{region.code}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {canUpdate('regions') && (
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEdit(region)}
                                                        title="Edit"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete('regions') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(region.id)}
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

            {/* Region Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{currentRegion ? 'Edit Region' : 'Create New Region'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
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

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={submitting}>
                                    {submitting ? 'Saving...' : (currentRegion ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegionManagementPage;
