import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Use the subdomain from the tunnel URL (first part)
  const subdomain = 'e0f5fe8261df943f-113-190-232-181';
  const name = 'Tunnel Test Shop';

  console.log(`Checking for existing tenant with subdomain: ${subdomain}...`);

  const existing = await prisma.tenant.findFirst({
    where: {
      OR: [{ subdomain }, { domain: subdomain }],
    },
  });

  if (existing) {
    console.log('Tenant already exists:', existing);
    return;
  }

  console.log('Creating new test tenant...');

  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: name,
        subdomain: subdomain,
        domain: subdomain, // Required unique field
        isActive: true,
      },
    });
    console.log('Created tenant successfully:', tenant);
  } catch (e) {
    console.error('Error creating tenant:', e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
