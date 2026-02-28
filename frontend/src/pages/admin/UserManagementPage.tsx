import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user.service';
import type { RoleOption } from '../../services/user.service';
import suiviEtudeService from '../../services/suivi-etude.service';
import type { User } from '../../types';
import './UserManagementPage.css';

const UserManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [secteurs, setSecteurs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Create user modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleId: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/admin/dashboard');
            return;
        }
        fetchData();
    }, [isAdmin, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, secteursData, rolesData] = await Promise.all([
                userService.getAll(),
                suiviEtudeService.getAll(),
                userService.getRoles(),
            ]);
            setUsers(usersData);
            setSecteurs(secteursData.rows.map((r) => r.secteur));
            setRoles(rolesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCanEdit = async (user: User) => {
        setSaving(user.id);
        try {
            const updated = await userService.updatePermissions(user.id, {
                canEdit: !user.canEdit,
            });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        } catch (error) {
            alert('Échec de la mise à jour');
        } finally {
            setSaving(null);
        }
    };

    const handleSecteurChange = async (user: User, secteur: string, checked: boolean) => {
        const currentSecteurs = user.allowedSecteurs || [];
        const newSecteurs = checked
            ? [...currentSecteurs, secteur]
            : currentSecteurs.filter((s) => s !== secteur);

        setSaving(user.id);
        try {
            const updated = await userService.updatePermissions(user.id, {
                allowedSecteurs: newSecteurs,
            });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        } catch (error) {
            alert('Échec de la mise à jour');
        } finally {
            setSaving(null);
        }
    };

    const handleSelectAllSecteurs = async (user: User) => {
        setSaving(user.id);
        try {
            const updated = await userService.updatePermissions(user.id, {
                allowedSecteurs: [],
            });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        } catch (error) {
            alert('Échec de la mise à jour');
        } finally {
            setSaving(null);
        }
    };

    // Create user
    const handleOpenCreate = () => {
        setCreateForm({ email: '', password: '', firstName: '', lastName: '', roleId: roles.length > 0 ? roles[0].id : '' });
        setShowCreateModal(true);
    };

    const handleCreateFormChange = (field: string, value: string) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName || !createForm.roleId) {
            alert('Tous les champs sont obligatoires');
            return;
        }
        setCreating(true);
        try {
            await userService.createUser(createForm);
            setShowCreateModal(false);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Échec de la création');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="loading-dashboard">Chargement des utilisateurs...</div>;
    }

    return (
        <div className="user-management-page">
            <div className="user-mgmt-header">
                <div>
                    <span className="back-link" onClick={() => navigate('/admin/dashboard')}>
                        ← Retour au Tableau de Bord
                    </span>
                    <h1>👥 Gestion des Utilisateurs</h1>
                    <p>Gérez les permissions d'accès et de modification pour chaque utilisateur</p>
                </div>
                <div className="header-actions">
                    <button className="btn-create-user" onClick={handleOpenCreate}>
                        + Créer un compte
                    </button>
                </div>
            </div>

            <div className="user-mgmt-stats">
                <div className="user-stat-card">
                    <span className="stat-label">Total Utilisateurs</span>
                    <span className="stat-value">{users.length}</span>
                </div>
                <div className="user-stat-card">
                    <span className="stat-label">Éditeurs</span>
                    <span className="stat-value">{users.filter((u) => u.canEdit).length}</span>
                </div>
                <div className="user-stat-card">
                    <span className="stat-label">Lecture seule</span>
                    <span className="stat-value">{users.filter((u) => !u.canEdit).length}</span>
                </div>
            </div>

            <div className="user-list">
                {users.map((user) => {
                    const isAdminUser = ['Admin', 'admin', 'ADMIN'].includes(user.role?.name || '');
                    return (
                        <div key={user.id} className={`user-card ${saving === user.id ? 'saving' : ''}`}>
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div className="user-details">
                                    <h3>{user.firstName} {user.lastName}</h3>
                                    <p className="user-email">{user.email}</p>
                                    <span className={`user-role-badge ${isAdminUser ? 'admin' : 'viewer'}`}>
                                        {user.role?.name || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {isAdminUser ? (
                                <div className="user-perms">
                                    <p className="admin-notice">⚡ Accès complet (Admin)</p>
                                </div>
                            ) : (
                                <div className="user-perms">
                                    <div className="perm-section">
                                        <h4>Droit de modification</h4>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={user.canEdit}
                                                onChange={() => handleToggleCanEdit(user)}
                                                disabled={saving === user.id}
                                            />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-label">
                                                {user.canEdit ? '✅ Peut modifier' : '🔒 Lecture seule'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="perm-section">
                                        <h4>Secteurs autorisés</h4>
                                        <div className="secteur-controls">
                                            <button
                                                className={`btn-all-secteurs ${(!user.allowedSecteurs || user.allowedSecteurs.length === 0) ? 'active' : ''}`}
                                                onClick={() => handleSelectAllSecteurs(user)}
                                                disabled={saving === user.id}
                                            >
                                                🌐 Tous les secteurs
                                            </button>
                                        </div>
                                        <div className="secteur-checkboxes">
                                            {secteurs.map((s) => (
                                                <label key={s} className="secteur-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={(user.allowedSecteurs || []).includes(s)}
                                                        onChange={(e) => handleSecteurChange(user, s, e.target.checked)}
                                                        disabled={saving === user.id}
                                                    />
                                                    <span>{s}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {user.allowedSecteurs && user.allowedSecteurs.length > 0 && (
                                            <p className="secteur-hint">
                                                ⚠ Accès limité à {user.allowedSecteurs.length} secteur(s)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="dos-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="dos-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>➕ Créer un Compte Utilisateur</h3>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="create-form-grid">
                                <div className="create-form-group">
                                    <label htmlFor="create-firstName">Prénom *</label>
                                    <input
                                        type="text"
                                        id="create-firstName"
                                        value={createForm.firstName}
                                        onChange={(e) => handleCreateFormChange('firstName', e.target.value)}
                                        placeholder="Prénom"
                                        required
                                    />
                                </div>
                                <div className="create-form-group">
                                    <label htmlFor="create-lastName">Nom *</label>
                                    <input
                                        type="text"
                                        id="create-lastName"
                                        value={createForm.lastName}
                                        onChange={(e) => handleCreateFormChange('lastName', e.target.value)}
                                        placeholder="Nom"
                                        required
                                    />
                                </div>
                                <div className="create-form-group full-width">
                                    <label htmlFor="create-email">Email *</label>
                                    <input
                                        type="email"
                                        id="create-email"
                                        value={createForm.email}
                                        onChange={(e) => handleCreateFormChange('email', e.target.value)}
                                        placeholder="utilisateur@email.com"
                                        required
                                    />
                                </div>
                                <div className="create-form-group">
                                    <label htmlFor="create-password">Mot de passe *</label>
                                    <input
                                        type="password"
                                        id="create-password"
                                        value={createForm.password}
                                        onChange={(e) => handleCreateFormChange('password', e.target.value)}
                                        placeholder="Mot de passe"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="create-form-group">
                                    <label htmlFor="create-role">Rôle *</label>
                                    <select
                                        id="create-role"
                                        value={createForm.roleId}
                                        onChange={(e) => handleCreateFormChange('roleId', e.target.value)}
                                        required
                                    >
                                        <option value="">— Sélectionner un rôle —</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="dos-modal-actions">
                                <button type="button" className="dos-btn-cancel" onClick={() => setShowCreateModal(false)} disabled={creating}>
                                    Annuler
                                </button>
                                <button type="submit" className="dos-btn-save" disabled={creating}>
                                    {creating ? 'Création...' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
