import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import alertService from '../services/alert.service';
import type { Alert, AlertType } from '../types';
import './AlertsPage.css';

const AlertsPage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
    const [page, setPage] = useState(1);
    const limit = 20;
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit,
                offset: (page - 1) * limit,
            };

            if (filter === 'unread') params.isRead = false;
            if (typeFilter !== 'all') params.type = typeFilter;

            const response = await alertService.getAlerts(params);
            setAlerts(response.alerts);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [filter, typeFilter, page]);

    const handleMarkAsRead = async (alertId: string) => {
        try {
            await alertService.markAsRead(alertId);
            setAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: true, readAt: new Date().toISOString() } : a));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleDelete = async (alertId: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            await alertService.deleteAlert(alertId);
            setAlerts(alerts.filter(a => a.id !== alertId));
            setTotal(prev => prev - 1);
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    const handleAlertClick = (alert: Alert) => {
        if (!alert.isRead) {
            handleMarkAsRead(alert.id);
        }
        if (alert.poiFileId) {
            navigate('/poi-files');
        }
    };

    const getAlertIcon = (type: string): string => {
        switch (type) {
            case 'FILE_ASSIGNED': return '📋';
            case 'FILE_STATUS_CHANGED': return '🔄';
            case 'FILE_STAGE_COMPLETED': return '✅';
            case 'DEADLINE_APPROACHING': return '⏰';
            case 'DEADLINE_OVERDUE': return '⚠️';
            case 'COMMENT_ADDED': return '💬';
            case 'ATTACHMENT_ADDED': return '📎';
            case 'PRIORITY_SET': return '⭐';
            default: return '🔔';
        }
    };

    const getTypeLabel = (type: AlertType): string => {
        return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="page-subtitle">Manage your alerts and notifications</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Show:</label>
                    <select value={filter} onChange={(e) => { setFilter(e.target.value as 'all' | 'unread'); setPage(1); }}>
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Type:</label>
                    <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as AlertType | 'all'); setPage(1); }}>
                        <option value="all">All Types</option>
                        <option value="FILE_ASSIGNED">File Assigned</option>
                        <option value="FILE_STATUS_CHANGED">Status Changed</option>
                        <option value="FILE_STAGE_COMPLETED">Stage Completed</option>
                        <option value="DEADLINE_APPROACHING">Deadline Approaching</option>
                        <option value="DEADLINE_OVERDUE">Deadline Overdue</option>
                        <option value="COMMENT_ADDED">Comment Added</option>
                        <option value="ATTACHMENT_ADDED">Attachment Added</option>
                        <option value="PRIORITY_SET">Priority Set</option>
                    </select>
                </div>
            </div>

            {/* Alerts List */}
            {loading && <div className="loading">Loading notifications...</div>}

            {!loading && alerts.length === 0 && (
                <div className="empty-state">
                    <p>No notifications found</p>
                </div>
            )}

            {!loading && alerts.length > 0 && (
                <div className="alerts-list">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`alert-card ${!alert.isRead ? 'unread' : ''}`}>
                            <div className="alert-card-icon">{getAlertIcon(alert.type)}</div>

                            <div className="alert-card-content" onClick={() => handleAlertClick(alert)}>
                                <div className="alert-card-header">
                                    <span className="alert-card-title">{alert.title}</span>
                                    <span className="alert-card-type">{getTypeLabel(alert.type)}</span>
                                </div>
                                <div className="alert-card-message">{alert.message}</div>
                                <div className="alert-card-footer">
                                    <span className="alert-card-time">
                                        {new Date(alert.createdAt).toLocaleString()}
                                    </span>
                                    {alert.poiFile && (
                                        <span className="alert-card-file">
                                            File: {alert.poiFile.fileNumber}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="alert-card-actions">
                                {!alert.isRead && (
                                    <button
                                        className="btn-icon"
                                        title="Mark as read"
                                        onClick={() => handleMarkAsRead(alert.id)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    className="btn-icon btn-delete"
                                    title="Delete"
                                    onClick={() => handleDelete(alert.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {page} of {totalPages} ({total} total)
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AlertsPage;
