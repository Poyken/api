/**
 * BOOTSTRAP - Tạo Super Admin nếu chưa tồn tại
 * An toàn để chạy mỗi lần deploy (idempotent)
 * Không xóa data hiện có
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ESSENTIAL_PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
  'product:read',
  'product:create',
  'product:update',
  'product:delete',
  'order:read',
  'order:create',
  'order:update',
  'order:delete',
  'analytics:read',
  'settings:read',
  'settings:update',
];

async function main() {
  console.log('🚀 BOOTSTRAP - Ensuring essential data exists...\n');

  // 1. Ensure Permissions exist
  console.log('🛡️ Checking Permissions...');
  for (const name of ESSENTIAL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();
  console.log(`   ✅ ${allPermissions.length} permissions ready.\n`);

  // 2. Ensure Vercel Tenant exists
  console.log('🏢 Checking Vercel Tenant...');
  const vercelTenant = await prisma.tenant.upsert({
    where: { domain: 'web-five-gilt-79.vercel.app' },
    create: {
      name: 'Vercel Production',
      domain: 'web-five-gilt-79.vercel.app',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
    update: {},
  });
  console.log(`   ✅ Tenant: ${vercelTenant.domain}\n`);

  // 3. Ensure Super Admin Role exists
  console.log('👔 Checking Super Admin Role...');
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'Super Admin', tenantId: null },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        tenantId: null,
        permissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });
    console.log('   ✅ Super Admin Role created.\n');
  } else {
    console.log('   ✅ Super Admin Role exists.\n');
  }

  // 4. Ensure Super Admin User exists
  console.log('👤 Checking Super Admin User...');
  const existingUser = await prisma.user.findFirst({
    where: { email: 'super@platform.com' },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('123456', 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: 'super@platform.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: passwordHash,
        tenantId: null, // Global user
        roles: { create: { roleId: superAdminRole.id } },
      },
    });
    console.log(`   ✅ Super Admin created: ${superAdmin.email}\n`);
  } else {
    console.log(`   ✅ Super Admin exists: ${existingUser.email}\n`);
  }

  console.log('🎉 BOOTSTRAP COMPLETED!\n');
  console.log('🔑 Super Admin: super@platform.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Bootstrap failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
