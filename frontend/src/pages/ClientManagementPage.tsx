import React, { useState, useEffect } from 'react';
import clientService from '../services/client.service';
import { useAuth } from '../contexts/AuthContext';
import type { Client } from '../types';
import './admin/UserManagementPage.css';

interface ClientFormData {
    name: string;
    code: string;
    contactEmail: string;
    contactPhone: string;
}

const ClientManagementPage: React.FC = () => {
    const { canCreate, canUpdate, canDelete } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentClient, setCurrentClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        code: '',
        contactEmail: '',
        contactPhone: ''
    });
    const [formErrors, setFormErrors] = useState<Partial<ClientFormData>>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await clientService.getAll();
            setClients(data);
        } catch (err: any) {
            console.error('Failed to load clients', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreate = () => {
        setCurrentClient(null);
        setFormData({ name: '', code: '', contactEmail: '', contactPhone: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (client: Client) => {
        setCurrentClient(client);
        setFormData({
            name: client.name,
            code: client.code,
            contactEmail: client.contactEmail || '',
            contactPhone: client.contactPhone || ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await clientService.delete(id);
            fetchClients();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete client');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (currentClient) {
                await clientService.update(currentClient.id, formData);
            } else {
                await clientService.create(formData);
            }
            setShowModal(false);
            fetchClients();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to save client';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Client Management</h1>
                    <p className="admin-subtitle">Manage system clients and their information.</p>
                </div>
                {canCreate('clients') && (
                    <button className="create-user-btn" onClick={handleCreate}>
                        + Create Client
                    </button>
                )}
            </div>

            <div className="filters-bar">
                <form className="search-form">
                    <input
                        type="text"
                        placeholder="Search clients..."
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
                                <th>Contact Email</th>
                                <th>Contact Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No clients found
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>{client.name}</td>
                                        <td>{client.code}</td>
                                        <td>{client.contactEmail || '-'}</td>
                                        <td>{client.contactPhone || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {canUpdate('clients') && (
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEdit(client)}
                                                        title="Edit"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete('clients') && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(client.id)}
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

            {/* Client Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{currentClient ? 'Edit Client' : 'Create New Client'}</h2>
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

                            <div className="form-group">
                                <label htmlFor="contactEmail">Contact Email</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactPhone">Contact Phone</label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={submitting}>
                                    {submitting ? 'Saving...' : (currentClient ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagementPage;
