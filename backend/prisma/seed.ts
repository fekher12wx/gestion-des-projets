import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Create Permissions
    console.log('Creating permissions...');
    const permissions = [
        // User Management
        { resource: 'users', action: 'create', description: 'Create new users' },
        { resource: 'users', action: 'read', description: 'View users' },
        { resource: 'users', action: 'update', description: 'Update user information' },
        { resource: 'users', action: 'delete', description: 'Delete users' },

        // Role Management
        { resource: 'roles', action: 'create', description: 'Create new roles' },
        { resource: 'roles', action: 'read', description: 'View roles' },
        { resource: 'roles', action: 'update', description: 'Update roles' },
        { resource: 'roles', action: 'delete', description: 'Delete roles' },

        // POI File Management
        { resource: 'poi_files', action: 'create', description: 'Create POI files' },
        { resource: 'poi_files', action: 'read', description: 'View POI files' },
        { resource: 'poi_files', action: 'update', description: 'Update POI files' },
        { resource: 'poi_files', action: 'delete', description: 'Delete POI files' },
        { resource: 'poi_files', action: 'assign', description: 'Assign POI files to users' },

        // Client Management
        { resource: 'clients', action: 'create', description: 'Create clients' },
        { resource: 'clients', action: 'read', description: 'View clients' },
        { resource: 'clients', action: 'update', description: 'Update clients' },
        { resource: 'clients', action: 'delete', description: 'Delete clients' },

        // Project Management
        { resource: 'projects', action: 'create', description: 'Create projects' },
        { resource: 'projects', action: 'read', description: 'View projects' },
        { resource: 'projects', action: 'update', description: 'Update projects' },
        { resource: 'projects', action: 'delete', description: 'Delete projects' },

        // Region Management
        { resource: 'regions', action: 'create', description: 'Create regions' },
        { resource: 'regions', action: 'read', description: 'View regions' },
        { resource: 'regions', action: 'update', description: 'Update regions' },
        { resource: 'regions', action: 'delete', description: 'Delete regions' },

        // Reports
        { resource: 'reports', action: 'read', description: 'View reports' },
        { resource: 'reports', action: 'export', description: 'Export reports' },

        // Settings
        { resource: 'settings', action: 'read', description: 'View system settings' },
        { resource: 'settings', action: 'update', description: 'Update system settings' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { resource_action: { resource: perm.resource, action: perm.action } },
            update: {},
            create: perm,
        });
    }
    console.log(`✅ Created ${permissions.length} permissions`);

    // 2. Create Roles
    console.log('Creating roles...');

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'System administrator with full access',
        },
    });

    const chargeAffaireRole = await prisma.role.upsert({
        where: { name: "Chargé d'affaire" },
        update: {},
        create: {
            name: "Chargé d'affaire",
            description: "Chargé d'affaire responsable des opérations",
        },
    });

    const chargeEtudeRole = await prisma.role.upsert({
        where: { name: "Chargé d'étude" },
        update: {},
        create: {
            name: "Chargé d'étude",
            description: "Chargé d'étude responsable de la validation des études",
        },
    });

    const technicienRole = await prisma.role.upsert({
        where: { name: 'Technicien' },
        update: {},
        create: {
            name: 'Technicien',
            description: 'Technicien de terrain travaillant sur les dossiers',
        },
    });

    console.log('✅ Created 4 roles');

    // 3. Assign Permissions to Roles
    console.log('Assigning permissions to roles...');

    const allPermissions = await prisma.permission.findMany();

    // Admin gets all permissions
    for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
    }

    // Chargé d'affaire permissions
    const chargeAffairePermissions = allPermissions.filter((p: { resource: string; action: string }) => ['poi_files', 'clients', 'projects', 'reports'].includes(p.resource) &&
        ['create', 'read', 'update', 'assign', 'export'].includes(p.action)
    );
    for (const permission of chargeAffairePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: chargeAffaireRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: chargeAffaireRole.id,
                permissionId: permission.id,
            },
        });
    }

    // Chargé d'étude permissions
    const chargeEtudePermissions = allPermissions.filter((p: { resource: string; action: string }) =>
        ['poi_files', 'reports'].includes(p.resource) &&
        ['read', 'update', 'export'].includes(p.action)
    );
    for (const permission of chargeEtudePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: chargeEtudeRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: chargeEtudeRole.id,
                permissionId: permission.id,
            },
        });
    }

    // Technicien permissions
    const technicienPermissions = allPermissions.filter((p: { resource: string; action: string }) =>
        p.resource === 'poi_files' && ['read', 'update'].includes(p.action)
    );
    for (const permission of technicienPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: technicienRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: technicienRole.id,
                permissionId: permission.id,
            },
        });
    }

    console.log('✅ Assigned permissions to roles');

    // 4. Create Stages
    console.log('Creating POI processing stages...');
    const stages = [
        {
            stageNumber: 1,
            name: 'Reception',
            description: 'Initial reception and registration of POI file',
            expectedDurationDays: 1,
        },
        {
            stageNumber: 2,
            name: 'Study Launch',
            description: 'Study assignment and initiation by technician',
            expectedDurationDays: 2,
        },
        {
            stageNumber: 3,
            name: 'Field Work',
            description: 'On-site technical work and data collection',
            expectedDurationDays: 5,
        },
        {
            stageNumber: 4,
            name: 'Study Validation',
            description: 'Review and validation by study manager',
            expectedDurationDays: 3,
        },
        {
            stageNumber: 5,
            name: 'Business Validation',
            description: 'Final validation by business manager',
            expectedDurationDays: 2,
        },
        {
            stageNumber: 6,
            name: 'Sending & Closing',
            description: 'File transmission to client and closure',
            expectedDurationDays: 1,
        },
    ];

    for (const stage of stages) {
        await prisma.stage.upsert({
            where: { stageNumber: stage.stageNumber },
            update: {},
            create: stage,
        });
    }
    console.log(`✅ Created ${stages.length} POI processing stages`);

    // 5. Create Admin User
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@poi-ftth.com' },
        update: {},
        create: {
            email: 'admin@poi-ftth.com',
            passwordHash: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            roleId: adminRole.id,
            isActive: true,
        },
    });
    console.log(`✅ Created admin user (id: ${adminUser.id}, email: admin@poi-ftth.com, password: admin123)`);

    // 6. Create Sample Region
    console.log('Creating sample regions...');
    await prisma.region.upsert({
        where: { code: 'IDF' },
        update: {},
        create: {
            name: 'Île-de-France',
            code: 'IDF',
            department: '75, 77, 78, 91, 92, 93, 94, 95',
        },
    });
    await prisma.region.upsert({
        where: { code: 'PACA' },
        update: {},
        create: {
            name: 'Provence-Alpes-Côte d\'Azur',
            code: 'PACA',
            department: '04, 05, 06, 13, 83, 84',
        },
    });
    console.log('✅ Created 2 sample regions');

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${permissions.length} permissions`);
    console.log('   - 4 roles with assigned permissions');
    console.log(`   - ${stages.length} POI processing stages`);
    console.log('   - 1 admin user');
    console.log('   - 2 sample regions');
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@poi-ftth.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Remember to change the admin password in production!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
