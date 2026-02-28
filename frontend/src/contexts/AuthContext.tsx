import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import type { User, ReactNode } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string, roleId?: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    canEdit: boolean;
    allowedSecteurs: string[];
    hasPermission: (resource: string, action: string) => boolean;
    canCreate: (resource: string) => boolean;
    canUpdate: (resource: string) => boolean;
    canDelete: (resource: string) => boolean;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = authService.getStoredUser();
        if (storedUser && authService.isAuthenticated()) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        setUser(response.user);
    };

    const register = async (email: string, password: string, firstName: string, lastName: string, roleId?: string) => {
        const response = await authService.register({ email, password, firstName, lastName, roleId });
        setUser(response.user);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = () => {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
    };

    const isAdmin = !!(user?.role?.name && ['Admin', 'admin', 'ADMIN'].includes(user.role.name));

    const hasPermission = (resource: string, action: string): boolean => {
        if (!user || !user.role) return false;
        if (isAdmin) return true;
        if (!user.permissions || !Array.isArray(user.permissions)) return false;
        return user.permissions.some(
            (p) => p.resource === resource && p.action === action
        );
    };

    const canCreate = (resource: string): boolean => {
        return hasPermission(resource, 'create');
    };

    const canUpdate = (resource: string): boolean => {
        return hasPermission(resource, 'update');
    };

    const canDelete = (resource: string): boolean => {
        return hasPermission(resource, 'delete');
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        canEdit: isAdmin || (user?.canEdit ?? false),
        allowedSecteurs: isAdmin ? [] : (user?.allowedSecteurs ?? []),
        hasPermission,
        canCreate,
        canUpdate,
        canDelete,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

