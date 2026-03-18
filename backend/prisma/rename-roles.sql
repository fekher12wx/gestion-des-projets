-- Migration: Rename roles to French names
-- Run this against your Neon PostgreSQL database

-- Rename existing roles
UPDATE roles SET name = 'Chargé d''affaire', description = 'Chargé d''affaire responsable des opérations' WHERE name = 'Manager';
UPDATE roles SET name = 'Chargé d''étude', description = 'Chargé d''étude responsable de la validation des études' WHERE name = 'Study Manager';
UPDATE roles SET name = 'Technicien', description = 'Technicien de terrain travaillant sur les dossiers' WHERE name = 'Technician';

-- Delete the Viewer role (reassign users first if needed)
-- First check if any users have the Viewer role
-- SELECT * FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Viewer');
-- If there are users, reassign them to Technicien:
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Technicien') WHERE role_id = (SELECT id FROM roles WHERE name = 'Viewer');

-- Delete Viewer role permissions
DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'Viewer');

-- Delete the Viewer role
DELETE FROM roles WHERE name = 'Viewer';
