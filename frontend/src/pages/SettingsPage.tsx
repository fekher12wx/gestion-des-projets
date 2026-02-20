import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import preferenceService from '../services/preference.service';
import settingsService from '../services/settings.service';
import GlobalSearch from '../components/GlobalSearch';
import type { UserPreferences, NotificationPreferences, SystemSetting } from '../types';
import './SettingsPage.css';

type TabKey = 'profile' | 'preferences' | 'notifications' | 'system';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile state
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');

    // Preferences state
    const [_preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('en');
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
    const [timezone, setTimezone] = useState('Europe/Paris');

    // Notification state
    const [notifications, setNotifications] = useState<NotificationPreferences>({
        email: true,
        inApp: true,
        fileAssigned: true,
        statusChanged: true,
        deadlineApproaching: true,
        comments: true,
    });

    // System settings state
    const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

    const isAdmin = user?.role?.name?.toLowerCase() === 'admin';

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const loadPreferences = useCallback(async () => {
        try {
            const prefs = await preferenceService.getPreferences();
            setPreferences(prefs);
            setTheme(prefs.theme);
            setLanguage(prefs.language);
            setDateFormat(prefs.dateFormat);
            setTimezone(prefs.timezone);
            if (prefs.notifications && typeof prefs.notifications === 'object') {
                setNotifications(prefs.notifications);
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }, []);

    const loadSystemSettings = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const settings = await settingsService.getAllSettings();
            setSystemSettings(settings);
        } catch (error) {
            console.error('Failed to load system settings:', error);
        }
    }, [isAdmin]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadPreferences(), loadSystemSettings()]);
            setLoading(false);
        };
        load();
    }, [loadPreferences, loadSystemSettings]);

    const handleSavePreferences = async () => {
        setSaving(true);
        try {
            await preferenceService.updatePreferences({ theme, language, dateFormat, timezone });
            showMessage('success', 'Preferences saved successfully');
        } catch (error) {
            showMessage('error', 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            await preferenceService.updatePreferences({ notifications });
            showMessage('success', 'Notification preferences saved');
        } catch (error) {
            showMessage('error', 'Failed to save notification preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSystemSetting = async (key: string, value: string) => {
        try {
            await settingsService.updateSetting(key, value);
            setSystemSettings((prev) =>
                prev.map((s) => (s.key === key ? { ...s, value } : s))
            );
            showMessage('success', 'Setting updated');
        } catch (error) {
            showMessage('error', 'Failed to update setting');
        }
    };

    const toggleNotification = (key: keyof NotificationPreferences) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
        {
            key: 'profile',
            label: 'Profile',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            key: 'preferences',
            label: 'Preferences',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
            ),
        },
        {
            key: 'notifications',
            label: 'Notifications',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
            ),
        },
        {
            key: 'system',
            label: 'System',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                </svg>
            ),
            adminOnly: true,
        },
    ];

    const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

    const groupedSettings = systemSettings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
        if (!acc[s.group]) acc[s.group] = [];
        acc[s.group].push(s);
        return acc;
    }, {});

    return (
        <div className="settings-layout">
            {/* Sidebar Nav */}
            <nav className="settings-nav">
                <div className="settings-nav-header">
                    <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2>Settings</h2>
                </div>

                <GlobalSearch />

                <div className="settings-tabs">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-nav-footer">
                    <div className="settings-user-info">
                        <div className="settings-user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div>
                            <div className="settings-user-name">{user?.firstName} {user?.lastName}</div>
                            <div className="settings-user-role">{user?.role?.name || 'User'}</div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="settings-main">
                {message && (
                    <div className={`settings-message ${message.type}`}>
                        {message.type === 'success' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                        )}
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div className="settings-loading">
                        <div className="settings-spinner" />
                        <span>Loading settings...</span>
                    </div>
                ) : (
                    <>
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <h3>Profile Information</h3>
                                    <p>Manage your personal information and account details</p>
                                </div>
                                <div className="settings-card">
                                    <div className="settings-form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Email</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Role</label>
                                        <input type="text" value={user?.role?.name || 'User'} disabled />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <h3>Preferences</h3>
                                    <p>Customize your experience</p>
                                </div>
                                <div className="settings-card">
                                    <div className="settings-form-group">
                                        <label>Theme</label>
                                        <div className="settings-toggle-group">
                                            <button
                                                className={`toggle-option ${theme === 'light' ? 'active' : ''}`}
                                                onClick={() => setTheme('light')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="5" />
                                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                                </svg>
                                                Light
                                            </button>
                                            <button
                                                className={`toggle-option ${theme === 'dark' ? 'active' : ''}`}
                                                onClick={() => setTheme('dark')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                                </svg>
                                                Dark
                                            </button>
                                        </div>
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Language</label>
                                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                            <option value="en">English</option>
                                            <option value="fr">Français</option>
                                            <option value="ar">العربية</option>
                                        </select>
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Date Format</label>
                                        <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Timezone</label>
                                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                                            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                                            <option value="Europe/London">Europe/London (GMT+0)</option>
                                            <option value="Africa/Algiers">Africa/Algiers (GMT+1)</option>
                                            <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                                            <option value="America/New_York">America/New York (GMT-5)</option>
                                        </select>
                                    </div>
                                    <div className="settings-card-actions">
                                        <button className="settings-btn primary" onClick={handleSavePreferences} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Preferences'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <h3>Notification Preferences</h3>
                                    <p>Choose what notifications you receive</p>
                                </div>
                                <div className="settings-card">
                                    <div className="notification-group">
                                        <h4>Delivery Channels</h4>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">Email Notifications</span>
                                                <span className="notification-desc">Receive notifications via email</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.email}
                                                    onChange={() => toggleNotification('email')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">In-App Notifications</span>
                                                <span className="notification-desc">Show notifications in the application</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.inApp}
                                                    onChange={() => toggleNotification('inApp')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="notification-group">
                                        <h4>Event Types</h4>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">File Assigned</span>
                                                <span className="notification-desc">When a POI file is assigned to you</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.fileAssigned}
                                                    onChange={() => toggleNotification('fileAssigned')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">Status Changed</span>
                                                <span className="notification-desc">When a file's status is updated</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.statusChanged}
                                                    onChange={() => toggleNotification('statusChanged')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">Deadline Approaching</span>
                                                <span className="notification-desc">When a deadline is within warning threshold</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.deadlineApproaching}
                                                    onChange={() => toggleNotification('deadlineApproaching')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                        <div className="notification-toggle-row">
                                            <div>
                                                <span className="notification-label">Comments</span>
                                                <span className="notification-desc">When someone comments on your files</span>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.comments}
                                                    onChange={() => toggleNotification('comments')}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="settings-card-actions">
                                        <button className="settings-btn primary" onClick={handleSaveNotifications} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Notifications'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Settings Tab */}
                        {activeTab === 'system' && isAdmin && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <h3>System Settings</h3>
                                    <p>Configure application-wide settings (Admin only)</p>
                                </div>
                                {Object.entries(groupedSettings).map(([group, settings]) => (
                                    <div key={group} className="settings-card">
                                        <h4 className="settings-group-title">
                                            {group.charAt(0).toUpperCase() + group.slice(1)}
                                        </h4>
                                        {settings.map((setting) => (
                                            <div key={setting.key} className="system-setting-row">
                                                <div className="system-setting-info">
                                                    <span className="system-setting-label">{setting.label}</span>
                                                    <span className="system-setting-key">{setting.key}</span>
                                                </div>
                                                <div className="system-setting-control">
                                                    {setting.type === 'boolean' ? (
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={setting.value === 'true'}
                                                                onChange={() =>
                                                                    handleUpdateSystemSetting(
                                                                        setting.key,
                                                                        setting.value === 'true' ? 'false' : 'true'
                                                                    )
                                                                }
                                                            />
                                                            <span className="slider" />
                                                        </label>
                                                    ) : (
                                                        <input
                                                            type={setting.type === 'number' ? 'number' : 'text'}
                                                            value={setting.value}
                                                            onChange={(e) =>
                                                                setSystemSettings((prev) =>
                                                                    prev.map((s) =>
                                                                        s.key === setting.key
                                                                            ? { ...s, value: e.target.value }
                                                                            : s
                                                                    )
                                                                )
                                                            }
                                                            onBlur={(e) =>
                                                                handleUpdateSystemSetting(setting.key, e.target.value)
                                                            }
                                                            className="system-setting-input"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default SettingsPage;
