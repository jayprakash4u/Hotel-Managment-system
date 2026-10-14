import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generatePassword } from '../src/lib/clientPassword';
import { slugify } from '../src/lib/utils';
import { seedHotelDemoData } from '../src/lib/demoSeed';

const prisma = new PrismaClient();

// One-time bootstrap for a fresh database: creates the software company's platform
// admin account, plus one demo hotel ("Aura Grand") with its own hotel admin account
// and a full set of realistic sample data (via seedHotelDemoData, shared with the
// in-app "Reset Demo" button at POST /api/seed). Safe to re-run against an empty
// database: `prisma db push --force-reset && npm run db:seed`.
async function main() {
  console.log('🌟 Bootstrapping Hospitality Management System Database...');

  // Clean everything in FK-safe order.
  await prisma.folioItem.deleteMany({});
  await prisma.restaurantOrderItem.deleteMany({});
  await prisma.restaurantOrder.deleteMany({});
  await prisma.restaurantTable.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.cashRegister.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.housekeepingTask.deleteMany({});
  await prisma.maintenanceTicket.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.guest.deleteMany({});
  await prisma.pOSProduct.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.hotel.deleteMany({});

  // 1. Platform Admin (Software Company)
  console.log('🏢 Seeding Platform Admin Account...');
  const platformPassword = process.env.SEED_PLATFORM_PASSWORD || generatePassword();
  const platformUser = await prisma.user.create({
    data: {
      username: 'platform-admin',
      passwordHash: await bcrypt.hash(platformPassword, 10),
      role: 'PLATFORM_ADMIN',
      name: 'Platform Administrator',
    },
  });

  // 2. Demo Hotel + its Hotel Admin account
  console.log('🏨 Seeding Demo Hotel & Admin Account...');
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Aura Grand Resort & Private Suites',
      slug: slugify('Aura Grand Resort & Private Suites'),
      address: 'Kathmandu, Nepal',
      totalFloors: 5,
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      status: 'ACTIVE',
    },
  });

  const hotelAdminPassword = process.env.SEED_HOTEL_ADMIN_PASSWORD || generatePassword();
  const hotelAdminUser = await prisma.user.create({
    data: {
      username: 'auragrand.admin',
      passwordHash: await bcrypt.hash(hotelAdminPassword, 10),
      role: 'HOTEL_ADMIN',
      name: 'Alexander Sterling',
      hotelId: hotel.id,
    },
  });

  // 3. Full demo operational dataset (rooms, guests, reservations, restaurant, inventory, finance...)
  console.log('🌱 Seeding demo operational data for Aura Grand...');
  await seedHotelDemoData(prisma, hotel.id);

  console.log('✅ Database Seeded Successfully!');
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('  LOGIN CREDENTIALS (save these — shown only once)');
  console.log('════════════════════════════════════════════════════════');
  console.log('  Platform Console  →  /platform/login');
  console.log(`    Username: ${platformUser.username}`);
  console.log(`    Password: ${platformPassword}`);
  console.log('');
  console.log('  Hotel Admin (Aura Grand)  →  /login');
  console.log(`    Username: ${hotelAdminUser.username}`);
  console.log(`    Password: ${hotelAdminPassword}`);
  console.log('════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
