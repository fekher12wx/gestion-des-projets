import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlertDropdown from '../components/AlertDropdown';
import GlobalSearch from '../components/GlobalSearch';
import dashboardService from '../services/dashboard.service';
import type { DashboardStats } from '../types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        activeFiles: 0,
        pendingFiles: 0,
        completedFiles: 0,
        totalProjects: 0,
        totalFiles: 0,
        userAssignments: 0,
        completionRate: '0',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const data = await dashboardService.getStats();
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h1>POI FTTH Management</h1>
                </div>
                <div className="nav-user">
                    <GlobalSearch />
                    <AlertDropdown />
                    <div className="user-info">
                        <span className="user-name">{user?.firstName} {user?.lastName}</span>
                        <span className="user-role">{user?.role.name}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        Logout
                    </button>
                </div>
            </nav>

            <main className="dashboard-main">
                <div className="welcome-section">
                    <h2 className="welcome-title">Welcome back, {user?.firstName}!</h2>
                    <p className="welcome-subtitle">Here's what's happening with your POI files today.</p>
                </div>

                {loading ? (
                    <div className="loading-state">Loading dashboard statistics...</div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon stat-icon-blue">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Active POI Files</p>
                                    <p className="stat-value">{stats.activeFiles}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-purple">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Pending Tasks</p>
                                    <p className="stat-value">{stats.pendingFiles}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-green">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                        <path d="M22 4L12 14.01l-3-3" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Completed</p>
                                    <p className="stat-value">{stats.completedFiles}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-orange">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <p className="stat-label">Total Projects</p>
                                    <p className="stat-value">{stats.totalProjects}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="actions-grid">
                        {[
                            {
                                label: 'POI Files',
                                path: '/poi-files',
                                resource: 'poi_files',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
                            },
                            {
                                label: 'My Assignments',
                                path: '/my-assignments',
                                resource: 'poi_files',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
                            },
                            {
                                label: 'Manage Users',
                                path: '/admin/users',
                                resource: 'users',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
                            },
                            {
                                label: 'Manage Clients',
                                path: '/clients',
                                resource: 'clients',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
                            },
                            {
                                label: 'Manage Projects',
                                path: '/projects',
                                resource: 'projects',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>,
                            },
                            {
                                label: 'Manage Regions',
                                path: '/regions',
                                resource: 'regions',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                            },
                            {
                                label: 'Notifications',
                                path: '/alerts',
                                resource: 'poi_files',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>,
                            },
                            {
                                label: 'Reports & Analytics',
                                path: '/reports',
                                resource: 'reports',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
                            },
                            {
                                label: 'Settings',
                                path: '/settings',
                                resource: 'settings',
                                action: 'read',
                                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
                            },
                        ]
                            .filter((card) => hasPermission(card.resource, card.action))
                            .map((card) => (
                                <button key={card.path} onClick={() => navigate(card.path)} className="action-card">
                                    {card.icon}
                                    <span>{card.label}</span>
                                </button>
                            ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
