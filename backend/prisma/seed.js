import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      slug: 'default',
    },
  });
  console.log(`Created tenant: ${tenant.name} (id: ${tenant.id})`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@picknpack.io' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@picknpack.io',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create default warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Warehouse',
      address: 'Default Location',
      isDefault: true,
      zones: {
        create: [
          {
            name: 'Receiving Dock',
            type: 'RECEIVING',
            description: 'Inbound shipment area',
            bins: {
              create: [
                { label: 'REC-01', row: 'R', shelf: '1', position: '01' },
                { label: 'REC-02', row: 'R', shelf: '1', position: '02' },
              ],
            },
          },
          {
            name: 'Storage A',
            type: 'STORAGE',
            description: 'Main storage area',
            bins: {
              create: [
                { label: 'A-01-01', row: 'A', shelf: '01', position: '01' },
                { label: 'A-01-02', row: 'A', shelf: '01', position: '02' },
                { label: 'A-02-01', row: 'A', shelf: '02', position: '01' },
                { label: 'A-02-02', row: 'A', shelf: '02', position: '02' },
                { label: 'B-01-01', row: 'B', shelf: '01', position: '01' },
                { label: 'B-01-02', row: 'B', shelf: '01', position: '02' },
              ],
            },
          },
          {
            name: 'Packing Station',
            type: 'PACKING',
            description: 'Order packing area',
            bins: {
              create: [
                { label: 'PACK-01', row: 'P', shelf: '1', position: '01' },
                { label: 'PACK-02', row: 'P', shelf: '1', position: '02' },
              ],
            },
          },
          {
            name: 'Shipping Dock',
            type: 'SHIPPING',
            description: 'Outbound shipment area',
            bins: {
              create: [
                { label: 'SHIP-01', row: 'S', shelf: '1', position: '01' },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`Created warehouse: ${warehouse.name}`);

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
