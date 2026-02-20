import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import alertService from '../services/alert.service';
import type { Alert } from '../types';
import './AlertDropdown.css';

const AlertDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch recent alerts and unread count
    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const [alertsData, count] = await Promise.all([
                alertService.getAlerts({ limit: 5 }),
                alertService.getUnreadCount(),
            ]);
            setAlerts(alertsData.alerts);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when dropdown opens
    useEffect(() => {
        fetchAlerts();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchAlerts(); // Refresh when opening
        }
    };

    const handleAlertClick = async (alert: Alert) => {
        try {
            // Mark as read if unread
            if (!alert.isRead) {
                await alertService.markAsRead(alert.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Navigate to POI file if linked
            if (alert.poiFileId) {
                navigate('/poi-files');
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await alertService.markAllAsRead();
            setUnreadCount(0);
            setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getAlertIcon = (type: string): string => {
        switch (type) {
            case 'FILE_ASSIGNED':
                return '📋';
            case 'FILE_STATUS_CHANGED':
                return '🔄';
            case 'FILE_STAGE_COMPLETED':
                return '✅';
            case 'DEADLINE_APPROACHING':
                return '⏰';
            case 'DEADLINE_OVERDUE':
                return '⚠️';
            case 'COMMENT_ADDED':
                return '💬';
            case 'ATTACHMENT_ADDED':
                return '📎';
            case 'PRIORITY_SET':
                return '⭐';
            default:
                return '🔔';
        }
    };

    const getTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="alert-dropdown" ref={dropdownRef}>
            <button className="alert-bell" onClick={toggleDropdown} title="Notifications">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
                {unreadCount > 0 && (
                    <span className="alert-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="alert-dropdown-menu">
                    <div className="alert-dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="alert-dropdown-body">
                        {loading && <div className="alert-loading">Loading...</div>}

                        {!loading && alerts.length === 0 && (
                            <div className="alert-empty">
                                <p>No notifications yet</p>
                            </div>
                        )}

                        {!loading && alerts.length > 0 && (
                            <div className="alert-list">
                                {alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className={`alert-item ${!alert.isRead ? 'unread' : ''}`}
                                        onClick={() => handleAlertClick(alert)}
                                    >
                                        <div className="alert-icon">{getAlertIcon(alert.type)}</div>
                                        <div className="alert-content">
                                            <div className="alert-title">{alert.title}</div>
                                            <div className="alert-message">{alert.message}</div>
                                            <div className="alert-time">{getTimeAgo(alert.createdAt)}</div>
                                        </div>
                                        {!alert.isRead && <div className="unread-dot"></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="alert-dropdown-footer">
                        <button
                            className="view-all-btn"
                            onClick={() => {
                                navigate('/alerts');
                                setIsOpen(false);
                            }}
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertDropdown;
