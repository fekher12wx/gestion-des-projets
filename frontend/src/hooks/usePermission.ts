import { useAuth } from '../contexts/AuthContext';

interface Permission {
    resource: string;
    action: string;
}

/**
 * Hook to check if current user has a specific permission
 */
export const usePermission = () => {
    const { user } = useAuth();

    const hasPermission = (resource: string, action: string): boolean => {
        if (!user || !user.role) return false;

        // Admin users have all permissions
        if (user.role.name === 'Admin') return true;

        // Note: We'll need to update the User type to include permissions
        // For now, we'll implement basic role-based logic
        const roleName = user.role.name;

        // Define role-based permissions
        const rolePermissions: Record<string, Permission[]> = {
            "Chargé d'affaire": [
                { resource: 'poi_files', action: 'create' },
                { resource: 'poi_files', action: 'read' },
                { resource: 'poi_files', action: 'update' },
                { resource: 'poi_files', action: 'assign' },
                { resource: 'clients', action: 'create' },
                { resource: 'clients', action: 'read' },
                { resource: 'clients', action: 'update' },
                { resource: 'projects', action: 'create' },
                { resource: 'projects', action: 'read' },
                { resource: 'projects', action: 'update' },
                { resource: 'regions', action: 'read' },
                { resource: 'reports', action: 'read' },
                { resource: 'reports', action: 'export' },
            ],
            "Chargé d'étude": [
                { resource: 'poi_files', action: 'read' },
                { resource: 'poi_files', action: 'update' },
                { resource: 'projects', action: 'read' },
                { resource: 'regions', action: 'read' },
                { resource: 'reports', action: 'read' },
                { resource: 'reports', action: 'export' },
            ],
            'Technicien': [
                { resource: 'poi_files', action: 'read' },
                { resource: 'poi_files', action: 'update' },
                { resource: 'projects', action: 'read' },
                { resource: 'regions', action: 'read' },
            ],
        };

        const permissions = rolePermissions[roleName] || [];
        return permissions.some(p => p.resource === resource && p.action === action);
    };

    const canCreate = (resource: string) => hasPermission(resource, 'create');
    const canRead = (resource: string) => hasPermission(resource, 'read');
    const canUpdate = (resource: string) => hasPermission(resource, 'update');
    const canDelete = (resource: string) => hasPermission(resource, 'delete');

    return {
        hasPermission,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
    };
};
