"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔐 Creating Admin User...\n');
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });
    if (existingAdmin) {
        console.log('✅ Admin user already exists:');
        console.log(`   Username: ${existingAdmin.username}`);
        console.log(`   Role: ${existingAdmin.role}`);
        console.log(`   Created: ${existingAdmin.createdAt}`);
        console.log('\n💡 If you forgot password, delete this user from database first.\n');
        return;
    }
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'Admin123456';
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            role: 'ADMIN',
        },
        select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
        },
    });
    console.log('✅ Admin user created successfully!\n');
    console.log('📝 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 You can now login at:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
}
main()
    .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-admin.js.map