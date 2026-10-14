import type { PrismaClient } from '@prisma/client';

// Populates one hotel with the full "Aura Grand" demo dataset (room types, rooms,
// guests, reservations, restaurant, inventory, finance, housekeeping/maintenance).
// Used by both prisma/seed.ts (initial bootstrap) and POST /api/seed (the in-app
// "Reset Demo" button) — both always scope everything to a single hotelId and never
// touch the Hotel or User tables, so resetting one hotel's demo data can never affect
// another hotel or its admin login.
export async function seedHotelDemoData(prisma: PrismaClient, hotelId: string) {
  // Wipe this hotel's existing operational data (children first).
  await prisma.folioItem.deleteMany({ where: { reservation: { hotelId } } });
  await prisma.restaurantOrderItem.deleteMany({ where: { order: { hotelId } } });
  await prisma.restaurantOrder.deleteMany({ where: { hotelId } });
  await prisma.restaurantTable.deleteMany({ where: { hotelId } });
  await prisma.stockMovement.deleteMany({ where: { item: { hotelId } } });
  await prisma.purchaseOrder.deleteMany({ where: { hotelId } });
  await prisma.inventoryItem.deleteMany({ where: { hotelId } });
  await prisma.supplier.deleteMany({ where: { hotelId } });
  await prisma.expense.deleteMany({ where: { hotelId } });
  await prisma.cashRegister.deleteMany({ where: { hotelId } });
  await prisma.reservation.deleteMany({ where: { hotelId } });
  await prisma.housekeepingTask.deleteMany({ where: { hotelId } });
  await prisma.maintenanceTicket.deleteMany({ where: { hotelId } });
  await prisma.room.deleteMany({ where: { hotelId } });
  await prisma.roomType.deleteMany({ where: { hotelId } });
  await prisma.guest.deleteMany({ where: { hotelId } });
  await prisma.pOSProduct.deleteMany({ where: { hotelId } });
  await prisma.staff.deleteMany({ where: { hotelId } });

  // Staff
  await Promise.all([
    prisma.staff.create({ data: { hotelId, name: 'Alexander Sterling', email: 'alexander@auragrand.com', role: 'ADMIN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', shift: 'Executive Shift (All Day)' } }),
    prisma.staff.create({ data: { hotelId, name: 'Elena Rostova', email: 'elena.frontdesk@auragrand.com', role: 'FRONT_DESK', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', shift: 'Day Shift (07:00 - 15:30)' } }),
    prisma.staff.create({ data: { hotelId, name: 'Maria Santos', email: 'maria.housekeeping@auragrand.com', role: 'HOUSEKEEPING', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', shift: 'Morning Cleaning (06:30 - 15:00)' } }),
    prisma.staff.create({ data: { hotelId, name: 'David Kim', email: 'david.cashier@auragrand.com', role: 'POS_CASHIER', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', shift: 'F&B Outlets (12:00 - 22:00)' } }),
    prisma.staff.create({ data: { hotelId, name: 'Chef Jean-Pierre Laurent', email: 'jeanpierre@auragrand.com', role: 'CHEF', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80', shift: 'Kitchen Executive (10:00 - 22:00)' } }),
  ]);

  // Guests
  const guests = await Promise.all([
    prisma.guest.create({ data: { hotelId, firstName: 'Sophia', lastName: 'Montgomery', email: 'sophia.m@montgomerycorp.com', phone: '+1 (555) 234-8890', idNumber: 'US-P894210', idType: 'Passport', country: 'United States', vipTier: 'DIAMOND', loyaltyPoints: 14500, preferences: 'High floor, feather pillows, sparkling water, almond milk, late 2PM checkout', notes: 'Tech executive, VIP founder, champagne on arrival always.' } }),
    prisma.guest.create({ data: { hotelId, firstName: 'Henri', lastName: 'de Laurent', email: 'henri@delaurent-art.fr', phone: '+33 6 42 98 11 00', idNumber: 'FR-9482017', idType: 'Passport', country: 'France', vipTier: 'PLATINUM', loyaltyPoints: 8200, preferences: 'Ocean view corner, extra plush towels, silent room, espresso machine', notes: 'Art gallery director. Anniversary trip.' } }),
    prisma.guest.create({ data: { hotelId, firstName: 'Liam', lastName: "O'Connor", email: 'liam.oconnor@dublinholdings.ie', phone: '+353 87 234 5678', idNumber: 'IE-B839211', idType: 'Passport', country: 'Ireland', vipTier: 'GOLD', loyaltyPoints: 4600, preferences: 'King bed, non-smoking, gym access early morning, extra hangers', notes: 'Frequent business traveler.' } }),
    prisma.guest.create({ data: { hotelId, firstName: 'Aaliyah', lastName: 'Al-Mansoor', email: 'aaliyah.mansoor@emiratesluxury.ae', phone: '+971 50 123 4567', idNumber: 'AE-7729103', idType: 'National ID', country: 'United Arab Emirates', vipTier: 'DIAMOND', loyaltyPoints: 21000, preferences: 'Presidential suite private butler, halal catering, rose petal turndown', notes: 'Royal family member entourage. Maximum discretion.' } }),
    prisma.guest.create({ data: { hotelId, firstName: 'Lucas', lastName: 'Meyer', email: 'lucas.meyer@berlintech.de', phone: '+49 171 9876543', idNumber: 'DE-8839201', idType: 'Passport', country: 'Germany', vipTier: 'STANDARD', loyaltyPoints: 850, preferences: 'High-speed Wi-Fi, desk lamp, quiet zone', notes: 'First time stay via direct booking.' } }),
  ]);

  // Room Types
  const rtStandard = await prisma.roomType.create({ data: { hotelId, name: 'Standard Twin Room', hasAC: false, bedType: '2 Queen Beds', maxCapacity: 4, basePrice: 240, amenities: JSON.stringify(['Garden View', 'Double Vanity', 'Walk-in Shower', 'Smart TV', 'Ceiling Fan (Non-AC)']), description: 'Comfortable non-AC standard room with natural garden breeze and plush queen beds.' } });
  const rtDeluxe = await prisma.roomType.create({ data: { hotelId, name: 'Deluxe Garden Suite', hasAC: true, bedType: 'King Bed', maxCapacity: 2, basePrice: 350, amenities: JSON.stringify(['Air Conditioning (Climate Control)', 'Private Garden Terrace', 'Rain Shower', 'Espresso Machine', 'Smart TV 55"', 'High-Speed Wi-Fi']), description: 'Serene air-conditioned suite opening directly to resort botanical gardens.' } });
  const rtOcean = await prisma.roomType.create({ data: { hotelId, name: 'Executive Ocean Suite', hasAC: true, bedType: 'King Bed', maxCapacity: 2, basePrice: 490, amenities: JSON.stringify(['Air Conditioning (Climate Control)', 'Panoramic Ocean View', 'Spacious Balcony', 'Nespresso Atelier', 'Jacuzzi Tub']), description: 'Captivating ocean panorama with full climate control and jacuzzi.' } });
  const rtClub = await prisma.roomType.create({ data: { hotelId, name: 'Royal Club Suite', hasAC: true, bedType: 'Super King Bed', maxCapacity: 2, basePrice: 620, amenities: JSON.stringify(['Air Conditioning (Climate Control)', 'Club Lounge Access', 'Complimentary High Tea', 'Private Bar', 'Marble Bath']), description: 'Includes full VIP Executive Club access and champagne service.' } });
  const rtPresidential = await prisma.roomType.create({ data: { hotelId, name: 'The Grand Imperial Presidential Suite', hasAC: true, bedType: 'Royal Emperor Bed', maxCapacity: 6, basePrice: 1850, amenities: JSON.stringify(['Air Conditioning (Climate Control)', 'Full Floor Residence', 'Private Infinity Edge Pool', 'Dedicated 24/7 Butler & Chef', 'Bulletproof Glass Protection', 'Helipad Access']), description: 'The pinnacle of global ultra-luxury hospitality spanning 4,500 sq ft.' } });

  // Physical Rooms
  const roomsData = [
    { number: '101', hotelId, roomTypeId: rtDeluxe.id, floor: 1, type: rtDeluxe.name, hasAC: true, bedType: rtDeluxe.bedType, pricePerNight: 350, capacity: 2, setupStatus: 'OPERATIONAL', status: 'OCCUPIED', amenities: rtDeluxe.amenities, imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80', description: 'Serene ground-floor suite opening directly to resort botanical gardens.' },
    { number: '102', hotelId, roomTypeId: rtDeluxe.id, floor: 1, type: rtDeluxe.name, hasAC: true, bedType: rtDeluxe.bedType, pricePerNight: 350, capacity: 2, setupStatus: 'OPERATIONAL', status: 'AVAILABLE', amenities: rtDeluxe.amenities, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80', description: 'Serene retreat surrounded by lush tropical landscaping.' },
    { number: '103', hotelId, roomTypeId: rtStandard.id, floor: 1, type: rtStandard.name, hasAC: false, bedType: rtStandard.bedType, pricePerNight: 240, capacity: 4, setupStatus: 'OPERATIONAL', status: 'DIRTY', amenities: rtStandard.amenities, imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80', description: 'Spacious non-AC dual-queen layout ideal for families.' },
    { number: '104', hotelId, roomTypeId: rtStandard.id, floor: 1, type: rtStandard.name, hasAC: false, bedType: rtStandard.bedType, pricePerNight: 240, capacity: 4, setupStatus: 'OPERATIONAL', status: 'AVAILABLE', amenities: rtStandard.amenities, imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80', description: 'Comfortable non-AC garden-view room equipped with two plush queen beds.' },
    { number: '105', hotelId, roomTypeId: rtDeluxe.id, floor: 1, type: rtDeluxe.name, hasAC: true, bedType: rtDeluxe.bedType, pricePerNight: 350, capacity: 2, setupStatus: 'UNDER_CONSTRUCTION', status: 'MAINTENANCE', amenities: rtDeluxe.amenities, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80', description: 'New expansion Deluxe suite currently under interior construction.' },
    { number: '201', hotelId, roomTypeId: rtOcean.id, floor: 2, type: rtOcean.name, hasAC: true, bedType: rtOcean.bedType, pricePerNight: 490, capacity: 2, setupStatus: 'OPERATIONAL', status: 'OCCUPIED', amenities: rtOcean.amenities, imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80', description: 'Captivating ocean panorama from floor-to-ceiling glass doors.' },
    { number: '202', hotelId, roomTypeId: rtOcean.id, floor: 2, type: rtOcean.name, hasAC: true, bedType: rtOcean.bedType, pricePerNight: 490, capacity: 2, setupStatus: 'OPERATIONAL', status: 'RESERVED', amenities: rtOcean.amenities, imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80', description: 'Sophisticated coastal luxury featuring seamless indoor-outdoor living.' },
    { number: '203', hotelId, roomTypeId: rtOcean.id, floor: 2, type: rtOcean.name, hasAC: true, bedType: rtOcean.bedType, pricePerNight: 490, capacity: 2, setupStatus: 'OPERATIONAL', status: 'AVAILABLE', amenities: rtOcean.amenities, imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80', description: 'Unobstructed seascape views and handcrafted teak furniture.' },
    { number: '204', hotelId, roomTypeId: rtOcean.id, floor: 2, type: rtOcean.name, hasAC: true, bedType: rtOcean.bedType, pricePerNight: 490, capacity: 2, setupStatus: 'OPERATIONAL', status: 'INSPECTED', amenities: rtOcean.amenities, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80', description: 'Fully inspected and prepared for immediate VIP arrival.' },
    { number: '205', hotelId, roomTypeId: rtOcean.id, floor: 2, type: rtOcean.name, hasAC: true, bedType: rtOcean.bedType, pricePerNight: 490, capacity: 3, setupStatus: 'OPERATIONAL', status: 'MAINTENANCE', amenities: rtOcean.amenities, imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80', description: 'Undergoing scheduled smart climate control system calibration.' },
    { number: '301', hotelId, roomTypeId: rtClub.id, floor: 3, type: rtClub.name, hasAC: true, bedType: rtClub.bedType, pricePerNight: 620, capacity: 2, setupStatus: 'OPERATIONAL', status: 'OCCUPIED', amenities: rtClub.amenities, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80', description: 'Includes full VIP Executive Club access and champagne service.' },
    { number: '302', hotelId, roomTypeId: rtClub.id, floor: 3, type: rtClub.name, hasAC: true, bedType: rtClub.bedType, pricePerNight: 620, capacity: 2, setupStatus: 'OPERATIONAL', status: 'AVAILABLE', amenities: rtClub.amenities, imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80', description: 'Opulent suite featuring custom velvet lounge seating.' },
    { number: '303', hotelId, roomTypeId: rtClub.id, floor: 3, type: rtClub.name, hasAC: true, bedType: rtClub.bedType, pricePerNight: 620, capacity: 2, setupStatus: 'UNDER_CONSTRUCTION', status: 'MAINTENANCE', amenities: rtClub.amenities, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80', description: 'Floor 3 luxury club wing under development.' },
    { number: '401', hotelId, roomTypeId: rtPresidential.id, floor: 4, type: 'Horizon Penthouse Suite', hasAC: true, bedType: 'Emperor King Bed', pricePerNight: 950, capacity: 4, setupStatus: 'OPERATIONAL', status: 'OCCUPIED', amenities: rtPresidential.amenities, imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80', description: 'Sprawling high-elevation penthouse with 220-degree horizon views.' },
    { number: '501', hotelId, roomTypeId: rtPresidential.id, floor: 5, type: rtPresidential.name, hasAC: true, bedType: rtPresidential.bedType, pricePerNight: 1850, capacity: 6, setupStatus: 'OPERATIONAL', status: 'OCCUPIED', amenities: rtPresidential.amenities, imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80', description: 'The pinnacle of global ultra-luxury hospitality spanning 4,500 sq ft.' },
  ];
  const rooms = await Promise.all(roomsData.map((room) => prisma.room.create({ data: room })));

  // Restaurant Tables
  const tables = await Promise.all([
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'T-101', section: 'Indoor Fine Dining', capacity: 2, status: 'OCCUPIED' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'T-102', section: 'Indoor Fine Dining', capacity: 4, status: 'OCCUPIED' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'T-103', section: 'Indoor Fine Dining', capacity: 4, status: 'FREE' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'T-104', section: 'Indoor Fine Dining', capacity: 6, status: 'FREE' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'ROOF-1', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'OCCUPIED' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'ROOF-2', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'RESERVED' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'ROOF-3', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'FREE' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'POOL-1', section: 'Poolside Lounge & Bar', capacity: 4, status: 'OCCUPIED' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'POOL-2', section: 'Poolside Lounge & Bar', capacity: 2, status: 'FREE' } }),
    prisma.restaurantTable.create({ data: { hotelId, tableNumber: 'VIP-SALON', section: 'Private Executive Dining', capacity: 10, status: 'BILLED' } }),
  ]);

  // Menu Products
  const products = await Promise.all([
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'RESTAURANT', category: 'Starters', name: 'Royal Osetra Caviar & Blinis', description: '30g Royal Osetra caviar, buckwheat blinis, crème fraîche', price: 145, stock: 30 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'RESTAURANT', category: 'Starters', name: 'Winter Truffle & Burrata', description: 'Imported Pugliese burrata, shaved black truffle, heirloom tomato', price: 34, stock: 50 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'RESTAURANT', category: 'Mains', name: 'A5 Miyazaki Wagyu Tenderloin (8oz)', description: 'Binchotan charcoal grilled, morel jus, potato mousseline', price: 185, stock: 20 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'RESTAURANT', category: 'Mains', name: 'Pan-Seared Chilean Sea Bass', description: 'Saffron champagne reduction, glazed baby leeks', price: 78, stock: 35 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'RESTAURANT', category: 'Desserts', name: 'Valrhona Chocolate Sphere', description: 'Hot spiced caramel poured tableside, gold leaf', price: 26, stock: 45 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ROOFTOP_BAR', category: 'Signature Cocktails', name: 'Aura Golden Hour (24k Infused)', description: 'Clase Azul Reposado, Grand Marnier, saffron agave, yuzu, gold dust', price: 38, stock: 75 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ROOFTOP_BAR', category: 'Signature Cocktails', name: 'Smoked Truffle Old Fashioned', description: 'WhistlePig 10yr, black walnut bitters, applewood mist', price: 32, stock: 80 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ROOFTOP_BAR', category: 'Champagne & Wine', name: 'Dom Pérignon Vintage 2013', description: 'Prestige cuvée champagne bottle', price: 450, stock: 15 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ROOM_SERVICE', category: 'Breakfast', name: 'Grand Royal Breakfast In Bed', description: 'Lobster eggs benedict, artisanal pastries, fresh juice, champagne', price: 65, stock: 100 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ROOM_SERVICE', category: 'All-Day Dining', name: 'Midnight Wagyu Smash Burger', description: 'Double wagyu patty, gruyère, black truffle aioli, fries', price: 42, stock: 100 } }),
    prisma.pOSProduct.create({ data: { hotelId, outlet: 'ZENITH_SPA', category: 'Signature Massages', name: 'Aura Celestial 90-Min Massage', description: 'Deep tissue therapy using warm volcanic stones & argan oil', price: 260, stock: 100 } }),
  ]);

  // Active Restaurant Orders & KOTs
  const table1 = tables.find((t) => t.tableNumber === 'T-101')!;
  const table2 = tables.find((t) => t.tableNumber === 'T-102')!;

  await prisma.restaurantOrder.create({
    data: {
      hotelId, orderNumber: 'ORD-1048', kotNumber: 'KOT-3021', outlet: 'RESTAURANT', tableId: table1.id, status: 'PREPARING', orderType: 'DINE_IN', serverName: 'David Kim', subtotal: 219, tax: 21.9, serviceCharge: 10.95, total: 251.85, paymentMethod: 'ROOM_FOLIO', isPaid: false, notes: 'Table 101 - Guest prefers medium-rare steak',
      items: { create: [
        { productId: products[2].id, productName: products[2].name, unitPrice: 185, quantity: 1, total: 185, notes: 'Medium Rare' },
        { productId: products[1].id, productName: products[1].name, unitPrice: 34, quantity: 1, total: 34 },
      ] },
    },
  });

  await prisma.restaurantOrder.create({
    data: {
      hotelId, orderNumber: 'ORD-1049', kotNumber: 'KOT-3022', outlet: 'RESTAURANT', tableId: table2.id, status: 'READY', orderType: 'DINE_IN', serverName: 'David Kim', subtotal: 104, tax: 10.4, serviceCharge: 5.2, total: 119.6, paymentMethod: 'CARD', isPaid: false,
      items: { create: [
        { productId: products[3].id, productName: products[3].name, unitPrice: 78, quantity: 1, total: 78 },
        { productId: products[4].id, productName: products[4].name, unitPrice: 26, quantity: 1, total: 26 },
      ] },
    },
  });

  // Suppliers & Inventory
  const supplier1 = await prisma.supplier.create({ data: { hotelId, name: 'Gourmet World Provisions Ltd.', contactName: 'Marco Bellini', email: 'marco@gourmetworld.com', phone: '+1 (800) 555-0192', category: 'F&B Raw Materials', address: '450 Harbor Boulevard, Suite 12' } });
  const supplier2 = await prisma.supplier.create({ data: { hotelId, name: 'Maison de Luxe Paris Amenities', contactName: 'Camille Dupont', email: 'camille@maisonluxe.fr', phone: '+33 1 44 55 66 77', category: 'Luxury Amenities & Toiletries', address: '18 Rue de la Paix, Paris' } });

  await prisma.inventoryItem.create({ data: { hotelId, name: 'Egyptian Cotton King Sheet Sets (800 TC)', category: 'LINEN', sku: 'SKU-LIN-101', currentStock: 48, minThreshold: 20, unit: 'sets', costPerUnit: 85.0 } });
  await prisma.inventoryItem.create({ data: { hotelId, name: "Hermès Paris Eau d'Orange Verte Shampoo (80ml)", category: 'TOILETRIES', sku: 'SKU-TOI-204', currentStock: 18, minThreshold: 35, unit: 'bottles', costPerUnit: 6.2, supplierId: supplier2.id } });
  const inv3 = await prisma.inventoryItem.create({ data: { hotelId, name: 'A5 Miyazaki Wagyu Striploin Loins (Whole)', category: 'FOOD_RAW', sku: 'SKU-FNB-301', currentStock: 6, minThreshold: 10, unit: 'kg', costPerUnit: 140.0, supplierId: supplier1.id } });

  await prisma.stockMovement.create({ data: { itemId: inv3.id, quantity: -2, type: 'POS_CONSUMPTION', reason: 'Dinner service orders ORD-1048 & ORD-1045', performedBy: 'Chef Jean-Pierre' } });

  // Finance
  await prisma.cashRegister.create({ data: { hotelId, shift: 'Day Shift (07:00 - 15:30)', cashierName: 'Elena Rostova', openingFloat: 500.0, cashSales: 1420.0, cardSales: 4850.0, roomCharges: 6320.0, expensesPaid: 120.0, status: 'OPEN' } });
  await prisma.expense.create({ data: { hotelId, expenseCode: 'EXP-1042', category: 'Kitchen Supplies', description: 'Emergency organic micro-greens & fresh truffles market purchase', amount: 145.0, paymentMode: 'CASH_REGISTER', paidTo: 'Green Valley Farms', paidBy: 'Chef Jean-Pierre' } });
  await prisma.expense.create({ data: { hotelId, expenseCode: 'EXP-1043', category: 'Utilities & Power', description: 'Monthly resort green power & water treatment utility invoice', amount: 3200.0, paymentMode: 'BANK_TRANSFER', paidTo: 'Metropolitan Clean Energy Corp', paidBy: 'Alexander Sterling' } });

  // Reservations & Folio
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  const room501 = rooms.find((r) => r.number === '501')!;
  const guestSophia = guests.find((g) => g.email.includes('sophia'))!;

  const res1 = await prisma.reservation.create({
    data: { hotelId, bookingCode: 'RES-849201', guestId: guestSophia.id, roomId: room501.id, checkIn: twoDaysAgo, checkOut: inThreeDays, adults: 2, children: 0, status: 'CHECKED_IN', totalAmount: 9250, paidAmount: 5000, paymentStatus: 'PARTIAL', source: 'DIRECT', specialRequests: 'VIP Airport Limousine transfer, private chef dinner, champagne on arrival' },
  });

  await prisma.folioItem.createMany({
    data: [
      { reservationId: res1.id, outlet: 'ROOM_CHARGE', description: 'Grand Imperial Presidential Suite (Night 1)', unitPrice: 1850, quantity: 1, total: 1850, billedBy: 'System Auto-Post' },
      { reservationId: res1.id, outlet: 'ROOM_CHARGE', description: 'Grand Imperial Presidential Suite (Night 2)', unitPrice: 1850, quantity: 1, total: 1850, billedBy: 'System Auto-Post' },
      { reservationId: res1.id, outlet: 'RESTAURANT', description: 'Le Ciel Fine Dining: Wagyu & Caviar (ORD-1045)', unitPrice: 567, quantity: 1, total: 567, billedBy: 'David Kim (POS)' },
      { reservationId: res1.id, outlet: 'ZENITH_SPA', description: 'Zenith Spa: Couple Sunset Sanctuary Ritual', unitPrice: 650, quantity: 1, total: 650, billedBy: 'Spa Concierge' },
    ],
  });

  // Housekeeping & Maintenance
  const room103 = rooms.find((r) => r.number === '103')!;
  const room205 = rooms.find((r) => r.number === '205')!;

  await prisma.housekeepingTask.create({ data: { hotelId, roomId: room103.id, assignedTo: 'Maria Santos', taskType: 'FULL_CLEAN', priority: 'URGENT', status: 'PENDING', notes: 'Guest departed 11:00 AM. Deep linen replacement & sanitization required.' } });
  await prisma.maintenanceTicket.create({ data: { hotelId, ticketCode: 'MNT-1042', roomId: room205.id, title: 'HVAC Smart Thermostat Sensor Malfunction', description: 'AC unit cooling temperature intermittently spikes to 76°F. Sensor replacement underway.', category: 'HVAC', priority: 'URGENT', status: 'IN_PROGRESS', reportedBy: 'Elena Rostova', assignedTo: 'Chief Engineer Robert' } });
}
