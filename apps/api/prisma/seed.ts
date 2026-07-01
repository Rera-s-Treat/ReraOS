import { PrismaClient } from '@prisma/client';

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