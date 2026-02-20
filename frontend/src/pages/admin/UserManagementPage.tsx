import React, { useState, useEffect } from 'react';
import userService from '../../services/user.service';
import roleService from '../../services/role.service';
import type { Role } from '../../services/role.service';
import type { User, UserFilters } from '../../types';
import './UserManagementPage.css';

interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
    isActive: boolean;
}

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10, search: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: '',
        isActive: true
    });
    const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getUsers(filters);
            setUsers(data.users);
            setTotalPages(data.pagination.totalPages);
        } catch (err: any) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const rolesData = await roleService.getRoles();
            setRoles(rolesData);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
            // Fallback to hardcoded roles if API fails
            setRoles([
                { id: 'admin-role-id', name: 'Admin', description: 'Administrator' },
                { id: 'manager-role-id', name: 'Manager', description: 'Manager' },
                { id: 'technician-role-id', name: 'Technician', description: 'Technician' },
                { id: 'viewer-role-id', name: 'Viewer', description: 'Viewer' }
            ]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleCreate = () => {
        setCurrentUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            roleId: roles.length > 0 ? roles[0].id : '',
            isActive: true
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '', // Don't populate password on edit
            roleId: user.roleId,
            isActive: user.isActive
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userService.deleteUser(id);
                fetchUsers();
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<UserFormData> = {};

        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        // Password is required only for new users
        if (!currentUser && !formData.password) {
            errors.password = 'Password is required';
        } else if (!currentUser && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!formData.roleId) {
            errors.roleId = 'Role is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            if (currentUser) {
                // Update existing user
                const updateData: Partial<User> = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    roleId: formData.roleId,
                    isActive: formData.isActive
                };
                await userService.updateUser(currentUser.id, updateData);
            } else {
                // Create new user
                await userService.createUser({
                    ...formData,
                    password: formData.password
                });
            }
            setShowModal(false);
            fetchUsers();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save user';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // User Modal Component
    const UserModal = () => {
        if (!showModal) return null;

        return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>{currentUser ? 'Edit User' : 'Create New User'}</h3>
                    <form onSubmit={handleSave}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className={formErrors.firstName ? 'error' : ''}
                                    placeholder="Enter first name"
                                />
                                {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className={formErrors.lastName ? 'error' : ''}
                                    placeholder="Enter last name"
                                />
                                {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={formErrors.email ? 'error' : ''}
                                placeholder="Enter email address"
                            />
                            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                        </div>

                        {!currentUser && (
                            <div className="form-group">
                                <label htmlFor="password">Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className={formErrors.password ? 'error' : ''}
                                    placeholder="Enter password (min 6 characters)"
                                />
                                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="roleId">Role *</label>
                                <select
                                    id="roleId"
                                    value={formData.roleId}
                                    onChange={(e) => handleInputChange('roleId', e.target.value)}
                                    className={formErrors.roleId ? 'error' : ''}
                                >
                                    <option value="">Select a role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.roleId && <span className="error-text">{formErrors.roleId}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="isActive">Status</label>
                                <select
                                    id="isActive"
                                    value={formData.isActive.toString()}
                                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="cancel-btn"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="save-btn"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">User Management</h1>
                    <p className="admin-subtitle">Manage system users, roles, and access.</p>
                </div>
                <button onClick={handleCreate} className="create-user-btn">
                    + Create User
                </button>
            </div>

            <div className="filters-bar">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="loading-cell">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="empty-cell">No users found.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell-info">
                                            <span className="user-cell-name">{user.firstName} {user.lastName}</span>
                                            <span className="user-cell-email">{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge">{user.role?.name || 'No Role'}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt || '').toLocaleDateString()}</td>
                                    <td className="actions-cell">
                                        <button onClick={() => handleEdit(user)} className="action-btn edit" title="Edit">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="action-btn delete" title="Delete">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
                <button
                    disabled={filters.page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                    Previous
                </button>
                <span>Page {filters.page} of {totalPages}</span>
                <button
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                    Next
                </button>
            </div>

            <UserModal />
        </div>
    );
};

export default UserManagementPage;
