using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/seed")]
public class SeedController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public SeedController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> SeedDatabase()
    {
        // 1. Ensure Aura Grand Hotel exists
        var hotel = await _db.Hotels.Include(h => h.AdminUser).FirstOrDefaultAsync(h => h.Slug == "aura-grand");
        if (hotel == null)
        {
            hotel = await _db.Hotels.Include(h => h.AdminUser).FirstOrDefaultAsync();
        }

        if (hotel == null)
        {
            hotel = new Hotel
            {
                Name = "Aura Grand Resort & Private Suites",
                Slug = "aura-grand",
                Address = "Pokhara Lakeside Boulevard 4, Kaski, Nepal",
                TotalFloors = 5,
                Currency = "NPR",
                Timezone = "Asia/Kathmandu",
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Hotels.Add(hotel);
            await _db.SaveChangesAsync();
        }

        var hotelId = hotel.Id;

        // 2. Ensure Admin User exists
        var adminUser = await _db.Users.FirstOrDefaultAsync(u => u.HotelId == hotelId || u.Username == "admin");
        if (adminUser == null)
        {
            adminUser = new User
            {
                Username = "admin",
                Name = "Alexander Sterling",
                Role = "HOTEL_ADMIN",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                HotelId = hotelId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Users.Add(adminUser);
            await _db.SaveChangesAsync();
        }

        // 3. Clear existing operational child data for this hotel
        var existingFolio = await _db.FolioItems.Where(f => f.Reservation!.HotelId == hotelId).ToListAsync();
        _db.FolioItems.RemoveRange(existingFolio);

        var existingOrderItems = await _db.RestaurantOrderItems.Where(i => i.Order!.HotelId == hotelId).ToListAsync();
        _db.RestaurantOrderItems.RemoveRange(existingOrderItems);

        var existingOrders = await _db.RestaurantOrders.Where(o => o.HotelId == hotelId).ToListAsync();
        _db.RestaurantOrders.RemoveRange(existingOrders);

        var existingTables = await _db.RestaurantTables.Where(t => t.HotelId == hotelId).ToListAsync();
        _db.RestaurantTables.RemoveRange(existingTables);

        var existingTableReservations = await _db.TableReservations.Where(r => r.HotelId == hotelId).ToListAsync();
        _db.TableReservations.RemoveRange(existingTableReservations);

        var existingBills = await _db.Bills.Where(b => b.HotelId == hotelId).ToListAsync();
        _db.Bills.RemoveRange(existingBills);

        var existingMovements = await _db.StockMovements.Where(m => m.Item!.HotelId == hotelId).ToListAsync();
        _db.StockMovements.RemoveRange(existingMovements);

        var existingPOs = await _db.PurchaseOrders.Where(p => p.HotelId == hotelId).ToListAsync();
        _db.PurchaseOrders.RemoveRange(existingPOs);

        var existingInventory = await _db.InventoryItems.Where(i => i.HotelId == hotelId).ToListAsync();
        _db.InventoryItems.RemoveRange(existingInventory);

        var existingSuppliers = await _db.Suppliers.Where(s => s.HotelId == hotelId).ToListAsync();
        _db.Suppliers.RemoveRange(existingSuppliers);

        var existingExpenses = await _db.Expenses.Where(e => e.HotelId == hotelId).ToListAsync();
        _db.Expenses.RemoveRange(existingExpenses);

        var existingRegisters = await _db.CashRegisters.Where(c => c.HotelId == hotelId).ToListAsync();
        _db.CashRegisters.RemoveRange(existingRegisters);

        var existingReservations = await _db.Reservations.Where(r => r.HotelId == hotelId).ToListAsync();
        _db.Reservations.RemoveRange(existingReservations);

        var existingHousekeeping = await _db.HousekeepingTasks.Where(h => h.HotelId == hotelId).ToListAsync();
        _db.HousekeepingTasks.RemoveRange(existingHousekeeping);

        var existingMaintenance = await _db.MaintenanceTickets.Where(m => m.HotelId == hotelId).ToListAsync();
        _db.MaintenanceTickets.RemoveRange(existingMaintenance);

        var existingRooms = await _db.Rooms.Where(r => r.HotelId == hotelId).ToListAsync();
        _db.Rooms.RemoveRange(existingRooms);

        var existingRoomTypes = await _db.RoomTypes.Where(rt => rt.HotelId == hotelId).ToListAsync();
        _db.RoomTypes.RemoveRange(existingRoomTypes);

        var existingGuests = await _db.Guests.Where(g => g.HotelId == hotelId).ToListAsync();
        _db.Guests.RemoveRange(existingGuests);

        var existingProducts = await _db.POSProducts.Where(p => p.HotelId == hotelId).ToListAsync();
        _db.POSProducts.RemoveRange(existingProducts);

        var existingStaff = await _db.Staff.Where(s => s.HotelId == hotelId).ToListAsync();
        _db.Staff.RemoveRange(existingStaff);

        await _db.SaveChangesAsync();

        // 4. Seed Staff
        var staffList = new List<Staff>
        {
            new Staff { HotelId = hotelId, Name = "Alexander Sterling", Email = "alexander@auragrand.com", Role = "ADMIN", Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", Shift = "Executive Shift (All Day)" },
            new Staff { HotelId = hotelId, Name = "Elena Rostova", Email = "elena.frontdesk@auragrand.com", Role = "FRONT_DESK", Avatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", Shift = "Day Shift (07:00 - 15:30)" },
            new Staff { HotelId = hotelId, Name = "Maria Santos", Email = "maria.housekeeping@auragrand.com", Role = "HOUSEKEEPING", Avatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", Shift = "Morning Cleaning (06:30 - 15:00)" },
            new Staff { HotelId = hotelId, Name = "David Kim", Email = "david.cashier@auragrand.com", Role = "POS_CASHIER", Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", Shift = "F&B Outlets (12:00 - 22:00)" },
            new Staff { HotelId = hotelId, Name = "Chef Jean-Pierre Laurent", Email = "jeanpierre@auragrand.com", Role = "CHEF", Avatar = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80", Shift = "Kitchen Executive (10:00 - 22:00)" }
        };
        _db.Staff.AddRange(staffList);

        // 5. Seed Guests
        var guestSophia = new Guest { HotelId = hotelId, FirstName = "Sophia", LastName = "Montgomery", Email = "sophia.m@montgomerycorp.com", Phone = "+1 (555) 234-8890", IdNumber = "US-P894210", IdType = "Passport", Country = "United States", VipTier = "DIAMOND", LoyaltyPoints = 14500, Preferences = "High floor, feather pillows, sparkling water, almond milk, late 2PM checkout", Notes = "Tech executive, VIP founder, champagne on arrival always." };
        var guestHenri = new Guest { HotelId = hotelId, FirstName = "Henri", LastName = "de Laurent", Email = "henri@delaurent-art.fr", Phone = "+33 6 42 98 11 00", IdNumber = "FR-9482017", IdType = "Passport", Country = "France", VipTier = "PLATINUM", LoyaltyPoints = 8200, Preferences = "Ocean view corner, extra plush towels, silent room, espresso machine", Notes = "Art gallery director. Anniversary trip." };
        var guestLiam = new Guest { HotelId = hotelId, FirstName = "Liam", LastName = "O'Connor", Email = "liam.oconnor@dublinholdings.ie", Phone = "+353 87 234 5678", IdNumber = "IE-B839211", IdType = "Passport", Country = "Ireland", VipTier = "GOLD", LoyaltyPoints = 4600, Preferences = "King bed, non-smoking, gym access early morning, extra hangers", Notes = "Frequent business traveler." };
        var guestAaliyah = new Guest { HotelId = hotelId, FirstName = "Aaliyah", LastName = "Al-Mansoor", Email = "aaliyah.mansoor@emiratesluxury.ae", Phone = "+971 50 123 4567", IdNumber = "AE-7729103", IdType = "National ID", Country = "United Arab Emirates", VipTier = "DIAMOND", LoyaltyPoints = 21000, Preferences = "Presidential suite private butler, halal catering, rose petal turndown", Notes = "Royal family member entourage. Maximum discretion." };
        var guestLucas = new Guest { HotelId = hotelId, FirstName = "Lucas", LastName = "Meyer", Email = "lucas.meyer@berlintech.de", Phone = "+49 171 9876543", IdNumber = "DE-8839201", IdType = "Passport", Country = "Germany", VipTier = "STANDARD", LoyaltyPoints = 850, Preferences = "High-speed Wi-Fi, desk lamp, quiet zone", Notes = "First time stay via direct booking." };

        _db.Guests.AddRange(guestSophia, guestHenri, guestLiam, guestAaliyah, guestLucas);

        // 6. Seed Room Types
        var rtStandard = new RoomType { HotelId = hotelId, Name = "Standard Twin Room", HasAC = false, BedType = "2 Queen Beds", MaxCapacity = 4, BasePrice = 240, Amenities = JsonSerializer.Serialize(new[] { "Garden View", "Double Vanity", "Walk-in Shower", "Smart TV", "Ceiling Fan (Non-AC)" }), Description = "Comfortable non-AC standard room with natural garden breeze and plush queen beds." };
        var rtDeluxe = new RoomType { HotelId = hotelId, Name = "Deluxe Garden Suite", HasAC = true, BedType = "King Bed", MaxCapacity = 2, BasePrice = 350, Amenities = JsonSerializer.Serialize(new[] { "Air Conditioning (Climate Control)", "Private Garden Terrace", "Rain Shower", "Espresso Machine", "Smart TV 55\"", "High-Speed Wi-Fi" }), Description = "Serene air-conditioned suite opening directly to resort botanical gardens." };
        var rtOcean = new RoomType { HotelId = hotelId, Name = "Executive Ocean Suite", HasAC = true, BedType = "King Bed", MaxCapacity = 2, BasePrice = 490, Amenities = JsonSerializer.Serialize(new[] { "Air Conditioning (Climate Control)", "Panoramic Ocean View", "Spacious Balcony", "Nespresso Atelier", "Jacuzzi Tub" }), Description = "Captivating ocean panorama with full climate control and jacuzzi." };
        var rtClub = new RoomType { HotelId = hotelId, Name = "Royal Club Suite", HasAC = true, BedType = "Super King Bed", MaxCapacity = 2, BasePrice = 620, Amenities = JsonSerializer.Serialize(new[] { "Air Conditioning (Climate Control)", "Club Lounge Access", "Complimentary High Tea", "Private Bar", "Marble Bath" }), Description = "Includes full VIP Executive Club access and champagne service." };
        var rtPresidential = new RoomType { HotelId = hotelId, Name = "The Grand Imperial Presidential Suite", HasAC = true, BedType = "Royal Emperor Bed", MaxCapacity = 6, BasePrice = 1850, Amenities = JsonSerializer.Serialize(new[] { "Air Conditioning (Climate Control)", "Full Floor Residence", "Private Infinity Edge Pool", "Dedicated 24/7 Butler & Chef", "Bulletproof Glass Protection", "Helipad Access" }), Description = "The pinnacle of global ultra-luxury hospitality spanning 4,500 sq ft." };

        _db.RoomTypes.AddRange(rtStandard, rtDeluxe, rtOcean, rtClub, rtPresidential);
        await _db.SaveChangesAsync();

        // 7. Seed Rooms
        var r101 = new Room { HotelId = hotelId, RoomTypeId = rtDeluxe.Id, Number = "101", Floor = 1, Type = rtDeluxe.Name, HasAC = true, BedType = rtDeluxe.BedType, PricePerNight = 350, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "OCCUPIED", Amenities = rtDeluxe.Amenities, ImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80", Description = "Serene ground-floor suite opening directly to resort botanical gardens." };
        var r102 = new Room { HotelId = hotelId, RoomTypeId = rtDeluxe.Id, Number = "102", Floor = 1, Type = rtDeluxe.Name, HasAC = true, BedType = rtDeluxe.BedType, PricePerNight = 350, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "AVAILABLE", Amenities = rtDeluxe.Amenities, ImageUrl = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80", Description = "Serene retreat surrounded by lush tropical landscaping." };
        var r103 = new Room { HotelId = hotelId, RoomTypeId = rtStandard.Id, Number = "103", Floor = 1, Type = rtStandard.Name, HasAC = false, BedType = rtStandard.BedType, PricePerNight = 240, Capacity = 4, SetupStatus = "OPERATIONAL", Status = "DIRTY", Amenities = rtStandard.Amenities, ImageUrl = "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80", Description = "Spacious non-AC dual-queen layout ideal for families." };
        var r104 = new Room { HotelId = hotelId, RoomTypeId = rtStandard.Id, Number = "104", Floor = 1, Type = rtStandard.Name, HasAC = false, BedType = rtStandard.BedType, PricePerNight = 240, Capacity = 4, SetupStatus = "OPERATIONAL", Status = "AVAILABLE", Amenities = rtStandard.Amenities, ImageUrl = "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80", Description = "Comfortable non-AC garden-view room equipped with two plush queen beds." };
        var r105 = new Room { HotelId = hotelId, RoomTypeId = rtDeluxe.Id, Number = "105", Floor = 1, Type = rtDeluxe.Name, HasAC = true, BedType = rtDeluxe.BedType, PricePerNight = 350, Capacity = 2, SetupStatus = "UNDER_CONSTRUCTION", Status = "MAINTENANCE", Amenities = rtDeluxe.Amenities, ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80", Description = "New expansion Deluxe suite currently under interior construction." };

        var r201 = new Room { HotelId = hotelId, RoomTypeId = rtOcean.Id, Number = "201", Floor = 2, Type = rtOcean.Name, HasAC = true, BedType = rtOcean.BedType, PricePerNight = 490, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "OCCUPIED", Amenities = rtOcean.Amenities, ImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80", Description = "Captivating ocean panorama from floor-to-ceiling glass doors." };
        var r202 = new Room { HotelId = hotelId, RoomTypeId = rtOcean.Id, Number = "202", Floor = 2, Type = rtOcean.Name, HasAC = true, BedType = rtOcean.BedType, PricePerNight = 490, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "RESERVED", Amenities = rtOcean.Amenities, ImageUrl = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80", Description = "Sophisticated coastal luxury featuring seamless indoor-outdoor living." };
        var r203 = new Room { HotelId = hotelId, RoomTypeId = rtOcean.Id, Number = "203", Floor = 2, Type = rtOcean.Name, HasAC = true, BedType = rtOcean.BedType, PricePerNight = 490, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "AVAILABLE", Amenities = rtOcean.Amenities, ImageUrl = "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80", Description = "Unobstructed seascape views and handcrafted teak furniture." };
        var r204 = new Room { HotelId = hotelId, RoomTypeId = rtOcean.Id, Number = "204", Floor = 2, Type = rtOcean.Name, HasAC = true, BedType = rtOcean.BedType, PricePerNight = 490, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "INSPECTED", Amenities = rtOcean.Amenities, ImageUrl = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80", Description = "Fully inspected and prepared for immediate VIP arrival." };
        var r205 = new Room { HotelId = hotelId, RoomTypeId = rtOcean.Id, Number = "205", Floor = 2, Type = rtOcean.Name, HasAC = true, BedType = rtOcean.BedType, PricePerNight = 490, Capacity = 3, SetupStatus = "OPERATIONAL", Status = "MAINTENANCE", Amenities = rtOcean.Amenities, ImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80", Description = "Undergoing scheduled smart climate control system calibration." };

        var r301 = new Room { HotelId = hotelId, RoomTypeId = rtClub.Id, Number = "301", Floor = 3, Type = rtClub.Name, HasAC = true, BedType = rtClub.BedType, PricePerNight = 620, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "OCCUPIED", Amenities = rtClub.Amenities, ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80", Description = "Includes full VIP Executive Club access and champagne service." };
        var r302 = new Room { HotelId = hotelId, RoomTypeId = rtClub.Id, Number = "302", Floor = 3, Type = rtClub.Name, HasAC = true, BedType = rtClub.BedType, PricePerNight = 620, Capacity = 2, SetupStatus = "OPERATIONAL", Status = "AVAILABLE", Amenities = rtClub.Amenities, ImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80", Description = "Opulent suite featuring custom velvet lounge seating." };
        var r303 = new Room { HotelId = hotelId, RoomTypeId = rtClub.Id, Number = "303", Floor = 3, Type = rtClub.Name, HasAC = true, BedType = rtClub.BedType, PricePerNight = 620, Capacity = 2, SetupStatus = "UNDER_CONSTRUCTION", Status = "MAINTENANCE", Amenities = rtClub.Amenities, ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80", Description = "Floor 3 luxury club wing under development." };

        var r401 = new Room { HotelId = hotelId, RoomTypeId = rtPresidential.Id, Number = "401", Floor = 4, Type = "Horizon Penthouse Suite", HasAC = true, BedType = "Emperor King Bed", PricePerNight = 950, Capacity = 4, SetupStatus = "OPERATIONAL", Status = "OCCUPIED", Amenities = rtPresidential.Amenities, ImageUrl = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80", Description = "Sprawling high-elevation penthouse with 220-degree horizon views." };
        var r501 = new Room { HotelId = hotelId, RoomTypeId = rtPresidential.Id, Number = "501", Floor = 5, Type = rtPresidential.Name, HasAC = true, BedType = rtPresidential.BedType, PricePerNight = 1850, Capacity = 6, SetupStatus = "OPERATIONAL", Status = "OCCUPIED", Amenities = rtPresidential.Amenities, ImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80", Description = "The pinnacle of global ultra-luxury hospitality spanning 4,500 sq ft." };

        _db.Rooms.AddRange(r101, r102, r103, r104, r105, r201, r202, r203, r204, r205, r301, r302, r303, r401, r501);
        await _db.SaveChangesAsync();

        // 8 & 9. Seed Complete Restaurant Tables, Products, Active Table Orders, Quick Bills, and Reservations
        await SeedRestaurantDataAsync(hotelId);

        // Additional non-restaurant outlet items (Spa, Rooftop Bar, Room Service)
        var pCocktail = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Signature Cocktails", Name = "Aura Golden Hour (24k Infused)", Description = "Clase Azul Reposado, Grand Marnier, saffron agave, yuzu, gold dust", Price = 38, Stock = 75 };
        var pOldFashioned = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Signature Cocktails", Name = "Smoked Truffle Old Fashioned", Description = "WhistlePig 10yr, black walnut bitters, applewood mist", Price = 32, Stock = 80 };
        var pDom = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Champagne & Wine", Name = "Dom Pérignon Vintage 2013", Description = "Prestige cuvée champagne bottle", Price = 450, Stock = 15 };
        var pBreakfast = new POSProduct { HotelId = hotelId, Outlet = "ROOM_SERVICE", Category = "Breakfast", Name = "Grand Royal Breakfast In Bed", Description = "Lobster eggs benedict, artisanal pastries, fresh juice, champagne", Price = 65, Stock = 100 };
        var pBurger = new POSProduct { HotelId = hotelId, Outlet = "ROOM_SERVICE", Category = "All-Day Dining", Name = "Midnight Wagyu Smash Burger", Description = "Double wagyu patty, gruyère, black truffle aioli, fries", Price = 42, Stock = 100 };
        var pSpa = new POSProduct { HotelId = hotelId, Outlet = "ZENITH_SPA", Category = "Signature Massages", Name = "Aura Celestial 90-Min Massage", Description = "Deep tissue therapy using warm volcanic stones & argan oil", Price = 260, Stock = 100 };

        _db.POSProducts.AddRange(pCocktail, pOldFashioned, pDom, pBreakfast, pBurger, pSpa);
        await _db.SaveChangesAsync();

        // 10. Seed Suppliers & Inventory
        var supplier1 = new Supplier { HotelId = hotelId, Name = "Gourmet World Provisions Ltd.", ContactName = "Marco Bellini", Email = "marco@gourmetworld.com", Phone = "+1 (800) 555-0192", Category = "F&B Raw Materials", Address = "450 Harbor Boulevard, Suite 12" };
        var supplier2 = new Supplier { HotelId = hotelId, Name = "Maison de Luxe Paris Amenities", ContactName = "Camille Dupont", Email = "camille@maisonluxe.fr", Phone = "+33 1 44 55 66 77", Category = "Luxury Amenities & Toiletries", Address = "18 Rue de la Paix, Paris" };
        _db.Suppliers.AddRange(supplier1, supplier2);
        await _db.SaveChangesAsync();

        // Seed Resale vs Purchase-Only Inventory Items
        // Resale items (TrackStock = true): stock is tracked, increased on purchase, deducted on sale
        var invHotelWater = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Bottled Spring Water (Minibar 500ml)", Category = "GUEST_AMENITIES", Sku = "HOT-AMN-401", TrackStock = true, CurrentStock = 85, MinThreshold = 40, Unit = "bottles", CostPerUnit = 0.8, SupplierId = supplier1.Id };
        var invWater = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "San Pellegrino Sparkling Water (750ml)", Category = "BEVERAGES", Sku = "RES-BEV-201", TrackStock = true, CurrentStock = 110, MinThreshold = 30, Unit = "bottles", CostPerUnit = 2.4, SupplierId = supplier1.Id };
        var invBeer = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Heineken Premium Lager Beer (330ml Can)", Category = "BEVERAGES", Sku = "RES-BEV-202", TrackStock = true, CurrentStock = 144, MinThreshold = 48, Unit = "cans", CostPerUnit = 1.9, SupplierId = supplier1.Id };

        // Purchase-Only items (TrackStock = false): ingredients, equipment, supplies (purchase history only, no stock balance)
        var inv1 = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Egyptian Cotton King Sheet Sets (800 TC)", Category = "LINEN", Sku = "HOT-LIN-101", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "sets", CostPerUnit = 85.0 };
        var inv2 = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Hermès Paris Eau d'Orange Verte Shampoo (80ml)", Category = "TOILETRIES", Sku = "HOT-TOI-204", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "bottles", CostPerUnit = 6.2, SupplierId = supplier2.Id };
        var invTowel = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Plush Turkish Cotton Bath Towels", Category = "LINEN", Sku = "HOT-LIN-102", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "pieces", CostPerUnit = 24.5 };
        var invSoap = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Organic Guest Amenities Bath Soap Bars", Category = "TOILETRIES", Sku = "HOT-TOI-205", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "pieces", CostPerUnit = 2.8, SupplierId = supplier2.Id };
        var invCleaning = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Multi-Surface Disinfectant Concentrate (5L)", Category = "CLEANING_SUPPLIES", Sku = "HOT-CLN-301", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "bottles", CostPerUnit = 28.0 };

        var inv3 = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "A5 Miyazaki Wagyu Striploin Loins (Whole)", Category = "FOOD_RAW", Sku = "RES-FNB-301", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "kg", CostPerUnit = 140.0, SupplierId = supplier1.Id };
        var invSugar = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Refined White Cane Sugar (25kg Bag)", Category = "PANTRY", Sku = "RES-PAN-101", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "kg", CostPerUnit = 1.6, SupplierId = supplier1.Id };
        var invFlour = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Unbleached Premium Wheat Baking Flour", Category = "PANTRY", Sku = "RES-PAN-102", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "kg", CostPerUnit = 1.4, SupplierId = supplier1.Id };
        var invOil = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Pure Sunflower Cooking Oil (5L Tin)", Category = "FOOD_RAW", Sku = "RES-FNB-302", TrackStock = false, CurrentStock = 0, MinThreshold = 0, Unit = "tins", CostPerUnit = 14.5, SupplierId = supplier1.Id };

        _db.InventoryItems.AddRange(invHotelWater, invWater, invBeer, inv1, inv2, invTowel, invSoap, invCleaning, inv3, invSugar, invFlour, invOil);
        await _db.SaveChangesAsync();

        // Resale product linkages
        var pBeer = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Beverages", Name = "Heineken Premium Lager Beer (330ml Can)", Description = "Chilled premium lager beer can", Price = 8.5, Stock = 144, TrackStock = true, InventoryItemId = invBeer.Id };
        var pWater = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Beverages", Name = "San Pellegrino Sparkling Water (750ml)", Description = "Italian sparkling mineral water bottle", Price = 6.0, Stock = 110, TrackStock = true, InventoryItemId = invWater.Id };
        _db.POSProducts.AddRange(pBeer, pWater);
        await _db.SaveChangesAsync();

        _db.StockMovements.Add(new StockMovement { ItemId = invBeer.Id, Department = "RESTAURANT", Quantity = 144, PreviousBalance = 0, ResultingBalance = 144, Type = "PURCHASE", Reason = "Initial stock purchase", PerformedBy = "Purchasing Officer" });
        _db.StockMovements.Add(new StockMovement { ItemId = invHotelWater.Id, Department = "HOTEL", Quantity = -12, Type = "HOUSEKEEPING_USAGE", Reason = "Daily room minibar restock Floor 3", PerformedBy = "Housekeeping Staff" });

        // 11. Seed Finance
        _db.CashRegisters.Add(new CashRegister { HotelId = hotelId, Shift = "Day Shift (07:00 - 15:30)", CashierName = "Elena Rostova", OpeningFloat = 500.0, CashSales = 1420.0, CardSales = 4850.0, RoomCharges = 6320.0, ExpensesPaid = 120.0, Status = "OPEN", OpenedAt = DateTime.UtcNow });
        _db.Expenses.Add(new Expense { HotelId = hotelId, ExpenseCode = "EXP-1042", Category = "Kitchen Supplies", Description = "Emergency organic micro-greens & fresh truffles market purchase", Amount = 145.0, PaymentMode = "CASH_REGISTER", PaidTo = "Green Valley Farms", PaidBy = "Chef Jean-Pierre", Date = DateTime.UtcNow });
        _db.Expenses.Add(new Expense { HotelId = hotelId, ExpenseCode = "EXP-1043", Category = "Utilities & Power", Description = "Monthly resort green power & water treatment utility invoice", Amount = 3200.0, PaymentMode = "BANK_TRANSFER", PaidTo = "Metropolitan Clean Energy Corp", PaidBy = "Alexander Sterling", Date = DateTime.UtcNow });

        // 12. Seed Reservations & Folio
        var res1 = new Reservation
        {
            HotelId = hotelId,
            BookingCode = "RES-849201",
            GuestId = guestSophia.Id,
            RoomId = r501.Id,
            CheckIn = DateTime.UtcNow.AddDays(-2),
            CheckOut = DateTime.UtcNow.AddDays(3),
            Adults = 2,
            Children = 0,
            Status = "CHECKED_IN",
            TotalAmount = 9250,
            PaidAmount = 5000,
            PaymentStatus = "PARTIAL",
            Source = "DIRECT",
            SpecialRequests = "VIP Airport Limousine transfer, private chef dinner, champagne on arrival",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow
        };
        _db.Reservations.Add(res1);
        await _db.SaveChangesAsync();

        _db.FolioItems.AddRange(
            new FolioItem { ReservationId = res1.Id, Outlet = "ROOM_CHARGE", Description = "Grand Imperial Presidential Suite (Night 1)", UnitPrice = 1850, Quantity = 1, Total = 1850, BilledBy = "System Auto-Post", Timestamp = DateTime.UtcNow.AddDays(-2) },
            new FolioItem { ReservationId = res1.Id, Outlet = "ROOM_CHARGE", Description = "Grand Imperial Presidential Suite (Night 2)", UnitPrice = 1850, Quantity = 1, Total = 1850, BilledBy = "System Auto-Post", Timestamp = DateTime.UtcNow.AddDays(-1) },
            new FolioItem { ReservationId = res1.Id, Outlet = "RESTAURANT", Description = "Le Ciel Fine Dining: Wagyu & Caviar (ORD-1045)", UnitPrice = 567, Quantity = 1, Total = 567, BilledBy = "David Kim (POS)", Timestamp = DateTime.UtcNow.AddDays(-1) },
            new FolioItem { ReservationId = res1.Id, Outlet = "ZENITH_SPA", Description = "Zenith Spa: Couple Sunset Sanctuary Ritual", UnitPrice = 650, Quantity = 1, Total = 650, BilledBy = "Spa Concierge", Timestamp = DateTime.UtcNow }
        );

        // 13. Seed Tasks
        _db.HousekeepingTasks.Add(new HousekeepingTask { HotelId = hotelId, RoomId = r103.Id, AssignedTo = "Maria Santos", TaskType = "FULL_CLEAN", Priority = "URGENT", Status = "PENDING", Notes = "Guest departed 11:00 AM. Deep linen replacement & sanitization required." });
        _db.MaintenanceTickets.Add(new MaintenanceTicket { HotelId = hotelId, TicketCode = "MNT-1042", RoomId = r205.Id, Title = "HVAC Smart Thermostat Sensor Malfunction", Description = "AC unit cooling temperature intermittently spikes to 76°F. Sensor replacement underway.", Category = "HVAC", Priority = "URGENT", Status = "IN_PROGRESS", ReportedBy = "Elena Rostova", AssignedTo = "Chief Engineer Robert", ReportedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            hotel = hotel.Name,
            roomsCount = 15,
            guestsCount = 5,
            message = "Aura Grand Resort demo data successfully reseeded!"
        }));
    }

    [HttpPost("restaurant")]
    public async Task<IActionResult> SeedRestaurantOnly()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        if (hotel == null)
        {
            return BadRequest(ApiResponse.Fail("Hotel not found. Please run main database seed first."));
        }

        await SeedRestaurantDataAsync(hotel.Id);

        return Ok(ApiResponse.Ok(new
        {
            hotel = hotel.Name,
            message = "Restaurant dynamic demo data (tables, menu items, active orders, today's quick bills, and reservations) successfully reseeded!"
        }));
    }

    private async Task SeedRestaurantDataAsync(string hotelId)
    {
        // 1. Clear existing restaurant child operational data
        var existingOrderItems = await _db.RestaurantOrderItems.Where(i => i.Order!.HotelId == hotelId).ToListAsync();
        _db.RestaurantOrderItems.RemoveRange(existingOrderItems);

        var existingOrders = await _db.RestaurantOrders.Where(o => o.HotelId == hotelId).ToListAsync();
        _db.RestaurantOrders.RemoveRange(existingOrders);

        var existingTableReservations = await _db.TableReservations.Where(r => r.HotelId == hotelId).ToListAsync();
        _db.TableReservations.RemoveRange(existingTableReservations);

        var existingTables = await _db.RestaurantTables.Where(t => t.HotelId == hotelId).ToListAsync();
        _db.RestaurantTables.RemoveRange(existingTables);

        var existingBills = await _db.Bills.Where(b => b.HotelId == hotelId && (b.BillingType == "QUICK_BILL" || b.BillingType == "TABLE_ORDER")).ToListAsync();
        _db.Bills.RemoveRange(existingBills);

        // Remove existing restaurant products so we can re-insert clean catalog
        var existingRestaurantProducts = await _db.POSProducts.Where(p => p.HotelId == hotelId && p.Outlet == "RESTAURANT").ToListAsync();
        _db.POSProducts.RemoveRange(existingRestaurantProducts);

        await _db.SaveChangesAsync();

        // 2. Seed Restaurant Tables (10 standard tables)
        var t101 = new RestaurantTable { HotelId = hotelId, TableNumber = "T-101", Section = "Indoor Fine Dining", Capacity = 2, Status = "OCCUPIED" };
        var t102 = new RestaurantTable { HotelId = hotelId, TableNumber = "T-102", Section = "Indoor Fine Dining", Capacity = 4, Status = "OCCUPIED" };
        var t103 = new RestaurantTable { HotelId = hotelId, TableNumber = "T-103", Section = "Indoor Fine Dining", Capacity = 4, Status = "FREE" };
        var t104 = new RestaurantTable { HotelId = hotelId, TableNumber = "T-104", Section = "Indoor Fine Dining", Capacity = 6, Status = "FREE" };
        var roof1 = new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-1", Section = "Skyline Rooftop Terrace", Capacity = 2, Status = "OCCUPIED" };
        var roof2 = new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-2", Section = "Skyline Rooftop Terrace", Capacity = 4, Status = "RESERVED" };
        var roof3 = new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-3", Section = "Skyline Rooftop Terrace", Capacity = 4, Status = "FREE" };
        var pool1 = new RestaurantTable { HotelId = hotelId, TableNumber = "POOL-1", Section = "Poolside Lounge & Bar", Capacity = 4, Status = "OCCUPIED" };
        var pool2 = new RestaurantTable { HotelId = hotelId, TableNumber = "POOL-2", Section = "Poolside Lounge & Bar", Capacity = 2, Status = "FREE" };
        var vipSalon = new RestaurantTable { HotelId = hotelId, TableNumber = "VIP-SALON", Section = "Private Executive Dining", Capacity = 10, Status = "BILLED" };

        _db.RestaurantTables.AddRange(t101, t102, t103, t104, roof1, roof2, roof3, pool1, pool2, vipSalon);
        await _db.SaveChangesAsync();

        // 3. Seed Full Restaurant Menu (POSProducts under RESTAURANT outlet)
        // Momos & Quick Bites
        var momoCFull = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Chicken Steam Momo (Full)", Description = "Freshly steamed chicken momos with spicy sesame chutney (10 pcs)", Price = 180, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var momoCHalf = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Chicken Steam Momo (Half)", Description = "Freshly steamed chicken momos with spicy sesame chutney (5 pcs)", Price = 100, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var momoVFull = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Veg Steam Momo (Full)", Description = "Traditional spiced vegetable momos (10 pcs)", Price = 150, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var momoVHalf = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Veg Steam Momo (Half)", Description = "Traditional spiced vegetable momos (5 pcs)", Price = 80, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var momoBFull = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Buff Steam Momo (Full)", Description = "Authentic seasoned buff momos (10 pcs)", Price = 160, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var momoChilly = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Chicken Chilly Momo (C-Momo)", Description = "Wok-tossed chicken momos in spicy bell pepper garlic sauce", Price = 230, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };
        var fries = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Fast Food & Momos", Name = "Crispy French Fries (Peri Peri / Salted)", Description = "Golden crisp potato fries with seasoning dip", Price = 150, Stock = 100, TrackStock = false, IsAvailable = true, IsActive = true };

        // Main Course & Curries
        var paneerMasala = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Paneer Butter Masala", Description = "Cottage cheese cubes simmered in rich creamy tomato cashew gravy", Price = 420, Stock = 50, TrackStock = false, IsAvailable = true, IsActive = true };
        var chickenTikka = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Chicken Tikka Masala", Description = "Charred tandoori chicken chunks in velvety spiced gravy", Price = 490, Stock = 50, TrackStock = false, IsAvailable = true, IsActive = true };
        var dalMakhani = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Dal Makhani Handi", Description = "Slow-cooked black lentils with cream and churned butter", Price = 320, Stock = 50, TrackStock = false, IsAvailable = true, IsActive = true };
        var chickenKadai = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Chicken Kadai Peshawari", Description = "Chicken tossed in cast iron kadai with roasted ground spices", Price = 510, Stock = 50, TrackStock = false, IsAvailable = true, IsActive = true };
        var biryani = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Hyderabadi Dum Chicken Biryani", Description = "Aromatic basmati rice cooked on dum with marinated chicken and saffron", Price = 480, Stock = 60, TrackStock = false, IsAvailable = true, IsActive = true };
        var saffronPulao = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Main Course & Curries", Name = "Kashmiri Saffron Veg Pulao", Description = "Fragrant long-grain pulao with dry fruits and garden veggies", Price = 260, Stock = 60, TrackStock = false, IsAvailable = true, IsActive = true };

        // Tea & Coffee
        var masalaTea = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tea & Coffee", Name = "Special Masala Milk Tea", Description = "Brewed milk tea with crushed green cardamom, cinnamon & ginger", Price = 70, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };
        var freshCoffee = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tea & Coffee", Name = "Fresh Brewed Coffee", Description = "Artisan roast single-origin black or milk coffee", Price = 120, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };
        var cappuccino = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tea & Coffee", Name = "Café Latte / Cappuccino", Description = "Espresso shot topped with steamed micro-foam", Price = 150, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };
        var lemonHoneyGinger = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tea & Coffee", Name = "Hot Lemon Honey Ginger", Description = "Warm immunity infusion with fresh Himalayan lemon and organic honey", Price = 90, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };

        // Cold Drinks & Mocktails
        var mintMojito = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Cold Drinks & Mocktails", Name = "Virgin Mint Mojito", Description = "Crushed fresh garden mint, lime wedges, cane sugar and sparkling soda", Price = 180, Stock = 150, TrackStock = false, IsAvailable = true, IsActive = true };
        var freshLimeSoda = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Cold Drinks & Mocktails", Name = "Fresh Lime Soda (Sweet / Salt)", Description = "Fresh squeezed lime juice with chilled club soda", Price = 90, Stock = 150, TrackStock = false, IsAvailable = true, IsActive = true };
        var mangoLassi = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Cold Drinks & Mocktails", Name = "Sweet Mango Lassi", Description = "Thick churned fresh yogurt with alphonso mango puree", Price = 140, Stock = 150, TrackStock = false, IsAvailable = true, IsActive = true };
        var blueLagoon = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Cold Drinks & Mocktails", Name = "Blue Lagoon Citrus Cooler", Description = "Blue curacao syrup, crushed ice, citrus and lemon-lime spritz", Price = 190, Stock = 150, TrackStock = false, IsAvailable = true, IsActive = true };

        // Tandoori Breads
        var butterNaan = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tandoori Breads", Name = "Butter Naan", Description = "Fluffy tandoor-baked leavened bread brushed with melted butter", Price = 70, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };
        var garlicNaan = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tandoori Breads", Name = "Garlic Butter Naan", Description = "Tandoori naan topped with roasted minced garlic and fresh coriander", Price = 90, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };
        var tandooriRoti = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Tandoori Breads", Name = "Butter Tandoori Roti", Description = "Whole wheat clay-oven baked bread with pure ghee", Price = 40, Stock = 200, TrackStock = false, IsAvailable = true, IsActive = true };

        // Desserts & Sweets
        var gulabJamun = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Desserts & Sweets", Name = "Hot Gulab Jamun (2 Pcs)", Description = "Deep-fried milk dumplings soaked in cardamom saffron syrup", Price = 130, Stock = 80, TrackStock = false, IsAvailable = true, IsActive = true };
        var brownieIceCream = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Desserts & Sweets", Name = "Sizzling Hot Brownie with Vanilla Float", Description = "Fudge brownie on cast-iron sizzler with hot fudge and vanilla scoop", Price = 240, Stock = 80, TrackStock = false, IsAvailable = true, IsActive = true };

        // Starters & Luxury Specials
        var pCaviar = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Starters", Name = "Royal Osetra Caviar & Blinis", Description = "30g Royal Osetra caviar, buckwheat blinis, crème fraîche", Price = 145, Stock = 30, TrackStock = false, IsAvailable = true, IsActive = true };
        var pBurrata = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Starters", Name = "Winter Truffle & Burrata", Description = "Imported Pugliese burrata, shaved black truffle, heirloom tomato", Price = 34, Stock = 50, TrackStock = false, IsAvailable = true, IsActive = true };
        var pWagyu = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Mains", Name = "A5 Miyazaki Wagyu Tenderloin (8oz)", Description = "Binchotan charcoal grilled, morel jus, potato mousseline", Price = 185, Stock = 20, TrackStock = false, IsAvailable = true, IsActive = true };
        var pSeaBass = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Mains", Name = "Pan-Seared Chilean Sea Bass", Description = "Saffron champagne reduction, glazed baby leeks", Price = 78, Stock = 35, TrackStock = false, IsAvailable = true, IsActive = true };
        var pSphere = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Desserts", Name = "Valrhona Chocolate Sphere", Description = "Hot spiced caramel poured tableside, gold leaf", Price = 26, Stock = 45, TrackStock = false, IsAvailable = true, IsActive = true };

        _db.POSProducts.AddRange(
            momoCFull, momoCHalf, momoVFull, momoVHalf, momoBFull, momoChilly, fries,
            paneerMasala, chickenTikka, dalMakhani, chickenKadai, biryani, saffronPulao,
            masalaTea, freshCoffee, cappuccino, lemonHoneyGinger,
            mintMojito, freshLimeSoda, mangoLassi, blueLagoon,
            butterNaan, garlicNaan, tandooriRoti,
            gulabJamun, brownieIceCream,
            pCaviar, pBurrata, pWagyu, pSeaBass, pSphere
        );
        await _db.SaveChangesAsync();

        // 4. Seed Active Dine-in Orders for Occupied Tables
        var ordT101 = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = t101.Id,
            OrderNumber = "ORD-2005",
            KotNumber = "KOT-101",
            Outlet = "RESTAURANT",
            Status = "RECEIVED",
            OrderType = "DINE_IN",
            ServerName = "Ramesh K.",
            Subtotal = 720,
            DiscountAmount = 0,
            Tax = 72,
            ServiceCharge = 36,
            Total = 828,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-25),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-25)
        };
        ordT101.Items.Add(new RestaurantOrderItem { OrderId = ordT101.Id, ProductId = momoCFull.Id, ProductName = momoCFull.Name, UnitPrice = momoCFull.Price, Quantity = 2, Total = 360, Notes = "Extra spicy chutney" });
        ordT101.Items.Add(new RestaurantOrderItem { OrderId = ordT101.Id, ProductId = mintMojito.Id, ProductName = mintMojito.Name, UnitPrice = mintMojito.Price, Quantity = 2, Total = 360, Notes = "Less ice" });

        var ordT102 = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = t102.Id,
            OrderNumber = "ORD-2006",
            KotNumber = "KOT-102",
            Outlet = "RESTAURANT",
            Status = "SERVED",
            OrderType = "DINE_IN",
            ServerName = "Sunita D.",
            Subtotal = 980,
            DiscountAmount = 0,
            Tax = 98,
            ServiceCharge = 49,
            Total = 1127,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-50),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-10)
        };
        ordT102.Items.Add(new RestaurantOrderItem { OrderId = ordT102.Id, ProductId = chickenTikka.Id, ProductName = chickenTikka.Name, UnitPrice = chickenTikka.Price, Quantity = 1, Total = 490 });
        ordT102.Items.Add(new RestaurantOrderItem { OrderId = ordT102.Id, ProductId = butterNaan.Id, ProductName = butterNaan.Name, UnitPrice = butterNaan.Price, Quantity = 3, Total = 210 });
        ordT102.Items.Add(new RestaurantOrderItem { OrderId = ordT102.Id, ProductId = mangoLassi.Id, ProductName = mangoLassi.Name, UnitPrice = mangoLassi.Price, Quantity = 2, Total = 280 });

        var ordRoof1 = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = roof1.Id,
            OrderNumber = "ORD-2007",
            KotNumber = "KOT-103",
            Outlet = "ROOFTOP_BAR",
            Status = "PREPARING",
            OrderType = "DINE_IN",
            ServerName = "David Kim",
            Subtotal = 315,
            DiscountAmount = 0,
            Tax = 31.5,
            ServiceCharge = 15.75,
            Total = 362.25,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-15),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
        };
        ordRoof1.Items.Add(new RestaurantOrderItem { OrderId = ordRoof1.Id, ProductId = pWagyu.Id, ProductName = pWagyu.Name, UnitPrice = pWagyu.Price, Quantity = 1, Total = 185 });
        ordRoof1.Items.Add(new RestaurantOrderItem { OrderId = ordRoof1.Id, ProductId = pSeaBass.Id, ProductName = pSeaBass.Name, UnitPrice = pSeaBass.Price, Quantity = 1, Total = 78 });
        ordRoof1.Items.Add(new RestaurantOrderItem { OrderId = ordRoof1.Id, ProductId = pSphere.Id, ProductName = pSphere.Name, UnitPrice = pSphere.Price, Quantity = 2, Total = 52 });

        var ordPool1 = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = pool1.Id,
            OrderNumber = "ORD-2009",
            KotNumber = "KOT-105",
            Outlet = "RESTAURANT",
            Status = "READY",
            OrderType = "DINE_IN",
            ServerName = "Prakash Y.",
            Subtotal = 380,
            DiscountAmount = 0,
            Tax = 38,
            ServiceCharge = 19,
            Total = 437,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-30),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        ordPool1.Items.Add(new RestaurantOrderItem { OrderId = ordPool1.Id, ProductId = momoChilly.Id, ProductName = momoChilly.Name, UnitPrice = momoChilly.Price, Quantity = 1, Total = 230, Notes = "Crispy spicy" });
        ordPool1.Items.Add(new RestaurantOrderItem { OrderId = ordPool1.Id, ProductId = lemonHoneyGinger.Id, ProductName = lemonHoneyGinger.Name, UnitPrice = lemonHoneyGinger.Price, Quantity = 1, Total = 90 });
        ordPool1.Items.Add(new RestaurantOrderItem { OrderId = ordPool1.Id, ProductId = masalaTea.Id, ProductName = masalaTea.Name, UnitPrice = masalaTea.Price, Quantity = 1, Total = 60 });

        var ordVip = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = vipSalon.Id,
            OrderNumber = "ORD-2008",
            KotNumber = "KOT-104",
            Outlet = "RESTAURANT",
            Status = "BILLED",
            OrderType = "DINE_IN",
            ServerName = "Alexander Sterling",
            Subtotal = 1318,
            DiscountAmount = 0,
            Tax = 131.8,
            ServiceCharge = 65.9,
            Total = 1515.7,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        ordVip.Items.Add(new RestaurantOrderItem { OrderId = ordVip.Id, ProductId = pCaviar.Id, ProductName = pCaviar.Name, UnitPrice = pCaviar.Price, Quantity = 2, Total = 290 });
        ordVip.Items.Add(new RestaurantOrderItem { OrderId = ordVip.Id, ProductId = pBurrata.Id, ProductName = pBurrata.Name, UnitPrice = pBurrata.Price, Quantity = 2, Total = 68 });
        ordVip.Items.Add(new RestaurantOrderItem { OrderId = ordVip.Id, ProductId = biryani.Id, ProductName = biryani.Name, UnitPrice = biryani.Price, Quantity = 2, Total = 960 });

        _db.RestaurantOrders.AddRange(ordT101, ordT102, ordRoof1, ordPool1, ordVip);
        await _db.SaveChangesAsync();

        // 5. Seed Completed Quick Sale Orders for TODAY
        var qs1 = new RestaurantOrder
        {
            HotelId = hotelId,
            OrderNumber = "QS-261028-101",
            KotNumber = "",
            Outlet = "RESTAURANT",
            Status = "COMPLETED",
            OrderType = "COUNTER_SALE",
            ServerName = "Counter Cashier",
            Subtotal = 540,
            DiscountAmount = 0,
            Tax = 0,
            ServiceCharge = 0,
            Total = 540,
            PaymentMethod = "CASH",
            IsPaid = true,
            Notes = "Customer: Walk-in Guest",
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            UpdatedAt = DateTime.UtcNow.AddHours(-3)
        };
        qs1.Items.Add(new RestaurantOrderItem { OrderId = qs1.Id, ProductId = momoCFull.Id, ProductName = momoCFull.Name, UnitPrice = momoCFull.Price, Quantity = 2, Total = 360 });
        qs1.Items.Add(new RestaurantOrderItem { OrderId = qs1.Id, ProductId = lemonHoneyGinger.Id, ProductName = lemonHoneyGinger.Name, UnitPrice = lemonHoneyGinger.Price, Quantity = 2, Total = 180 });

        var bill1 = new Bill
        {
            HotelId = hotelId,
            BillNumber = "BILL-2026-000101",
            BillingType = "QUICK_BILL",
            OrderId = qs1.Id,
            OrderNumber = qs1.OrderNumber,
            CustomerName = "Walk-in Guest",
            ServerOrStaff = "Counter Cashier",
            Subtotal = 540,
            GrandTotal = 540,
            AmountPaid = 540,
            PaymentStatus = "PAID",
            PaymentMethod = "CASH",
            ItemsJson = JsonSerializer.Serialize(qs1.Items.Select(i => new { name = i.ProductName, quantity = i.Quantity, unitPrice = i.UnitPrice, total = i.Total })),
            CreatedAt = qs1.CreatedAt,
            UpdatedAt = qs1.UpdatedAt
        };

        var qs2 = new RestaurantOrder
        {
            HotelId = hotelId,
            OrderNumber = "QS-261028-102",
            KotNumber = "",
            Outlet = "RESTAURANT",
            Status = "COMPLETED",
            OrderType = "COUNTER_SALE",
            ServerName = "Counter Cashier",
            Subtotal = 620,
            DiscountAmount = 0,
            Tax = 0,
            ServiceCharge = 0,
            Total = 620,
            PaymentMethod = "UPI",
            IsPaid = true,
            Notes = "Customer: Bikram Thapa",
            CreatedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-40),
            UpdatedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-40)
        };
        qs2.Items.Add(new RestaurantOrderItem { OrderId = qs2.Id, ProductId = biryani.Id, ProductName = biryani.Name, UnitPrice = biryani.Price, Quantity = 1, Total = 480 });
        qs2.Items.Add(new RestaurantOrderItem { OrderId = qs2.Id, ProductId = masalaTea.Id, ProductName = masalaTea.Name, UnitPrice = masalaTea.Price, Quantity = 2, Total = 140 });

        var bill2 = new Bill
        {
            HotelId = hotelId,
            BillNumber = "BILL-2026-000102",
            BillingType = "QUICK_BILL",
            OrderId = qs2.Id,
            OrderNumber = qs2.OrderNumber,
            CustomerName = "Bikram Thapa",
            ServerOrStaff = "Counter Cashier",
            Subtotal = 620,
            GrandTotal = 620,
            AmountPaid = 620,
            PaymentStatus = "PAID",
            PaymentMethod = "UPI",
            ItemsJson = JsonSerializer.Serialize(qs2.Items.Select(i => new { name = i.ProductName, quantity = i.Quantity, unitPrice = i.UnitPrice, total = i.Total })),
            CreatedAt = qs2.CreatedAt,
            UpdatedAt = qs2.UpdatedAt
        };

        var qs3 = new RestaurantOrder
        {
            HotelId = hotelId,
            OrderNumber = "QS-261028-103",
            KotNumber = "",
            Outlet = "RESTAURANT",
            Status = "COMPLETED",
            OrderType = "TAKEAWAY",
            ServerName = "David Kim",
            Subtotal = 790,
            DiscountAmount = 0,
            Tax = 0,
            ServiceCharge = 0,
            Total = 790,
            PaymentMethod = "CARD",
            IsPaid = true,
            Notes = "Customer: Sarah Jenkins",
            CreatedAt = DateTime.UtcNow.AddMinutes(-45),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-45)
        };
        qs3.Items.Add(new RestaurantOrderItem { OrderId = qs3.Id, ProductId = fries.Id, ProductName = fries.Name, UnitPrice = fries.Price, Quantity = 2, Total = 300 });
        qs3.Items.Add(new RestaurantOrderItem { OrderId = qs3.Id, ProductId = mintMojito.Id, ProductName = mintMojito.Name, UnitPrice = mintMojito.Price, Quantity = 2, Total = 360 });
        qs3.Items.Add(new RestaurantOrderItem { OrderId = qs3.Id, ProductId = gulabJamun.Id, ProductName = gulabJamun.Name, UnitPrice = gulabJamun.Price, Quantity = 1, Total = 130 });

        var bill3 = new Bill
        {
            HotelId = hotelId,
            BillNumber = "BILL-2026-000103",
            BillingType = "QUICK_BILL",
            OrderId = qs3.Id,
            OrderNumber = qs3.OrderNumber,
            CustomerName = "Sarah Jenkins",
            ServerOrStaff = "David Kim",
            Subtotal = 790,
            GrandTotal = 790,
            AmountPaid = 790,
            PaymentStatus = "PAID",
            PaymentMethod = "CARD",
            ItemsJson = JsonSerializer.Serialize(qs3.Items.Select(i => new { name = i.ProductName, quantity = i.Quantity, unitPrice = i.UnitPrice, total = i.Total })),
            CreatedAt = qs3.CreatedAt,
            UpdatedAt = qs3.UpdatedAt
        };

        var qs4 = new RestaurantOrder
        {
            HotelId = hotelId,
            OrderNumber = "QS-261028-104",
            KotNumber = "",
            Outlet = "RESTAURANT",
            Status = "COMPLETED",
            OrderType = "COUNTER_SALE",
            ServerName = "Counter Cashier",
            Subtotal = 740,
            DiscountAmount = 0,
            Tax = 0,
            ServiceCharge = 0,
            Total = 740,
            PaymentMethod = "CASH",
            IsPaid = true,
            Notes = "Customer: Anita Gurung",
            CreatedAt = DateTime.UtcNow.AddMinutes(-12),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-12)
        };
        qs4.Items.Add(new RestaurantOrderItem { OrderId = qs4.Id, ProductId = momoChilly.Id, ProductName = momoChilly.Name, UnitPrice = momoChilly.Price, Quantity = 2, Total = 460 });
        qs4.Items.Add(new RestaurantOrderItem { OrderId = qs4.Id, ProductId = mangoLassi.Id, ProductName = mangoLassi.Name, UnitPrice = mangoLassi.Price, Quantity = 2, Total = 280 });

        var bill4 = new Bill
        {
            HotelId = hotelId,
            BillNumber = "BILL-2026-000104",
            BillingType = "QUICK_BILL",
            OrderId = qs4.Id,
            OrderNumber = qs4.OrderNumber,
            CustomerName = "Anita Gurung",
            ServerOrStaff = "Counter Cashier",
            Subtotal = 740,
            GrandTotal = 740,
            AmountPaid = 740,
            PaymentStatus = "PAID",
            PaymentMethod = "CASH",
            ItemsJson = JsonSerializer.Serialize(qs4.Items.Select(i => new { name = i.ProductName, quantity = i.Quantity, unitPrice = i.UnitPrice, total = i.Total })),
            CreatedAt = qs4.CreatedAt,
            UpdatedAt = qs4.UpdatedAt
        };

        _db.RestaurantOrders.AddRange(qs1, qs2, qs3, qs4);
        _db.Bills.AddRange(bill1, bill2, bill3, bill4);
        await _db.SaveChangesAsync();

        // 6. Seed Table Reservations for TODAY
        var tr1 = new TableReservation
        {
            HotelId = hotelId,
            TableId = t103.Id,
            CustomerName = "Pooja Sharma",
            PhoneNumber = "9841223344",
            ReservationDate = DateTime.UtcNow.Date,
            ReservationTime = "19:30",
            PartySize = 4,
            DurationMinutes = 120,
            Status = "CONFIRMED",
            ReservationCode = "TR-1005",
            SpecialRequests = "Birthday celebration, window side preference",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var tr2 = new TableReservation
        {
            HotelId = hotelId,
            TableId = roof2.Id,
            CustomerName = "Eleanor Vance",
            PhoneNumber = "9800001111",
            ReservationDate = DateTime.UtcNow.Date,
            ReservationTime = "20:00",
            PartySize = 2,
            DurationMinutes = 90,
            Status = "CONFIRMED",
            ReservationCode = "TR-1006",
            SpecialRequests = "Quiet romantic corner",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.TableReservations.AddRange(tr1, tr2);
        await _db.SaveChangesAsync();
    }
}
