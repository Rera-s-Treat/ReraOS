import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ----------------------------
    // Roles
    // ----------------------------

    const roles = [
        {
            name: 'SUPER_ADMIN',
            description: 'System Super Administrator',
        },
        {
            name: 'ADMIN',
            description: 'Restaurant Administrator',
        },
        {
            name: 'STAFF',
            description: 'Restaurant Staff',
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    console.log('✅ Roles seeded');

    // ----------------------------
    // Default admin user (optional, env-driven)
    // ----------------------------

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingAdmin) {
            console.log(`ℹ️  Admin user ${adminEmail} already exists, skipping.`);
        } else {
            const superAdminRole = await prisma.role.findUniqueOrThrow({
                where: { name: 'SUPER_ADMIN' },
            });

            const passwordHash = await bcrypt.hash(adminPassword, 10);

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
                    lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'User',
                    roleId: superAdminRole.id,
                },
            });

            console.log(`✅ Admin user ${adminEmail} created`);
        }
    } else {
        console.log(
            'ℹ️  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set, skipping admin user seed.',
        );
    }
}

main()
    .then(async () => {
        console.log('🎉 Database seeded successfully');
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
