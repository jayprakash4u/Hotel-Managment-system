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

        // 8. Seed Restaurant Tables
        var tables = new List<RestaurantTable>
        {
            new RestaurantTable { HotelId = hotelId, TableNumber = "T-101", Section = "Indoor Fine Dining", Capacity = 2, Status = "OCCUPIED" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "T-102", Section = "Indoor Fine Dining", Capacity = 4, Status = "OCCUPIED" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "T-103", Section = "Indoor Fine Dining", Capacity = 4, Status = "FREE" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "T-104", Section = "Indoor Fine Dining", Capacity = 6, Status = "FREE" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-1", Section = "Skyline Rooftop Terrace", Capacity = 2, Status = "OCCUPIED" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-2", Section = "Skyline Rooftop Terrace", Capacity = 4, Status = "RESERVED" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "ROOF-3", Section = "Skyline Rooftop Terrace", Capacity = 4, Status = "FREE" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "POOL-1", Section = "Poolside Lounge & Bar", Capacity = 4, Status = "OCCUPIED" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "POOL-2", Section = "Poolside Lounge & Bar", Capacity = 2, Status = "FREE" },
            new RestaurantTable { HotelId = hotelId, TableNumber = "VIP-SALON", Section = "Private Executive Dining", Capacity = 10, Status = "BILLED" }
        };
        _db.RestaurantTables.AddRange(tables);

        // 9. Seed POS Products
        var pCaviar = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Starters", Name = "Royal Osetra Caviar & Blinis", Description = "30g Royal Osetra caviar, buckwheat blinis, crème fraîche", Price = 145, Stock = 30 };
        var pBurrata = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Starters", Name = "Winter Truffle & Burrata", Description = "Imported Pugliese burrata, shaved black truffle, heirloom tomato", Price = 34, Stock = 50 };
        var pWagyu = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Mains", Name = "A5 Miyazaki Wagyu Tenderloin (8oz)", Description = "Binchotan charcoal grilled, morel jus, potato mousseline", Price = 185, Stock = 20 };
        var pSeaBass = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Mains", Name = "Pan-Seared Chilean Sea Bass", Description = "Saffron champagne reduction, glazed baby leeks", Price = 78, Stock = 35 };
        var pSphere = new POSProduct { HotelId = hotelId, Outlet = "RESTAURANT", Category = "Desserts", Name = "Valrhona Chocolate Sphere", Description = "Hot spiced caramel poured tableside, gold leaf", Price = 26, Stock = 45 };
        var pCocktail = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Signature Cocktails", Name = "Aura Golden Hour (24k Infused)", Description = "Clase Azul Reposado, Grand Marnier, saffron agave, yuzu, gold dust", Price = 38, Stock = 75 };
        var pOldFashioned = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Signature Cocktails", Name = "Smoked Truffle Old Fashioned", Description = "WhistlePig 10yr, black walnut bitters, applewood mist", Price = 32, Stock = 80 };
        var pDom = new POSProduct { HotelId = hotelId, Outlet = "ROOFTOP_BAR", Category = "Champagne & Wine", Name = "Dom Pérignon Vintage 2013", Description = "Prestige cuvée champagne bottle", Price = 450, Stock = 15 };
        var pBreakfast = new POSProduct { HotelId = hotelId, Outlet = "ROOM_SERVICE", Category = "Breakfast", Name = "Grand Royal Breakfast In Bed", Description = "Lobster eggs benedict, artisanal pastries, fresh juice, champagne", Price = 65, Stock = 100 };
        var pBurger = new POSProduct { HotelId = hotelId, Outlet = "ROOM_SERVICE", Category = "All-Day Dining", Name = "Midnight Wagyu Smash Burger", Description = "Double wagyu patty, gruyère, black truffle aioli, fries", Price = 42, Stock = 100 };
        var pSpa = new POSProduct { HotelId = hotelId, Outlet = "ZENITH_SPA", Category = "Signature Massages", Name = "Aura Celestial 90-Min Massage", Description = "Deep tissue therapy using warm volcanic stones & argan oil", Price = 260, Stock = 100 };

        _db.POSProducts.AddRange(pCaviar, pBurrata, pWagyu, pSeaBass, pSphere, pCocktail, pOldFashioned, pDom, pBreakfast, pBurger, pSpa);
        await _db.SaveChangesAsync();

        // 10. Seed Suppliers & Inventory
        var supplier1 = new Supplier { HotelId = hotelId, Name = "Gourmet World Provisions Ltd.", ContactName = "Marco Bellini", Email = "marco@gourmetworld.com", Phone = "+1 (800) 555-0192", Category = "F&B Raw Materials", Address = "450 Harbor Boulevard, Suite 12" };
        var supplier2 = new Supplier { HotelId = hotelId, Name = "Maison de Luxe Paris Amenities", ContactName = "Camille Dupont", Email = "camille@maisonluxe.fr", Phone = "+33 1 44 55 66 77", Category = "Luxury Amenities & Toiletries", Address = "18 Rue de la Paix, Paris" };
        _db.Suppliers.AddRange(supplier1, supplier2);
        await _db.SaveChangesAsync();

        var inv1 = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Egyptian Cotton King Sheet Sets (800 TC)", Category = "LINEN", Sku = "HOT-LIN-101", CurrentStock = 48, MinThreshold = 20, Unit = "sets", CostPerUnit = 85.0 };
        var inv2 = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Hermès Paris Eau d'Orange Verte Shampoo (80ml)", Category = "TOILETRIES", Sku = "HOT-TOI-204", CurrentStock = 18, MinThreshold = 35, Unit = "bottles", CostPerUnit = 6.2, SupplierId = supplier2.Id };
        var invTowel = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Plush Turkish Cotton Bath Towels", Category = "LINEN", Sku = "HOT-LIN-102", CurrentStock = 75, MinThreshold = 30, Unit = "pieces", CostPerUnit = 24.5 };
        var invSoap = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Organic Guest Amenities Bath Soap Bars", Category = "TOILETRIES", Sku = "HOT-TOI-205", CurrentStock = 120, MinThreshold = 50, Unit = "pieces", CostPerUnit = 2.8, SupplierId = supplier2.Id };
        var invCleaning = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Multi-Surface Disinfectant Concentrate (5L)", Category = "CLEANING_SUPPLIES", Sku = "HOT-CLN-301", CurrentStock = 15, MinThreshold = 8, Unit = "bottles", CostPerUnit = 28.0 };
        var invHotelWater = new InventoryItem { HotelId = hotelId, Department = "HOTEL", Name = "Bottled Spring Water (Minibar 500ml)", Category = "GUEST_AMENITIES", Sku = "HOT-AMN-401", CurrentStock = 85, MinThreshold = 40, Unit = "bottles", CostPerUnit = 0.8, SupplierId = supplier1.Id };

        var inv3 = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "A5 Miyazaki Wagyu Striploin Loins (Whole)", Category = "FOOD_RAW", Sku = "RES-FNB-301", CurrentStock = 8, MinThreshold = 10, Unit = "kg", CostPerUnit = 140.0, SupplierId = supplier1.Id };
        var invWater = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "San Pellegrino Sparkling Water (750ml)", Category = "BEVERAGES", Sku = "RES-BEV-201", CurrentStock = 110, MinThreshold = 30, Unit = "bottles", CostPerUnit = 2.4, SupplierId = supplier1.Id };
        var invBeer = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Heineken Premium Lager Beer (330ml Can)", Category = "BEVERAGES", Sku = "RES-BEV-202", CurrentStock = 144, MinThreshold = 48, Unit = "cans", CostPerUnit = 1.9, SupplierId = supplier1.Id };
        var invSugar = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Refined White Cane Sugar (25kg Bag)", Category = "PANTRY", Sku = "RES-PAN-101", CurrentStock = 35, MinThreshold = 15, Unit = "kg", CostPerUnit = 1.6, SupplierId = supplier1.Id };
        var invFlour = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Unbleached Premium Wheat Baking Flour", Category = "PANTRY", Sku = "RES-PAN-102", CurrentStock = 45, MinThreshold = 20, Unit = "kg", CostPerUnit = 1.4, SupplierId = supplier1.Id };
        var invOil = new InventoryItem { HotelId = hotelId, Department = "RESTAURANT", Name = "Pure Sunflower Cooking Oil (5L Tin)", Category = "FOOD_RAW", Sku = "RES-FNB-302", CurrentStock = 20, MinThreshold = 8, Unit = "tins", CostPerUnit = 14.5, SupplierId = supplier1.Id };

        _db.InventoryItems.AddRange(inv1, inv2, invTowel, invSoap, invCleaning, invHotelWater, inv3, invWater, invBeer, invSugar, invFlour, invOil);
        await _db.SaveChangesAsync();

        pBurger.InventoryItemId = inv3.Id;
        pBurger.TrackStock = true;
        pBurger.Stock = 15;
        await _db.SaveChangesAsync();

        _db.StockMovements.Add(new StockMovement { ItemId = inv3.Id, Department = "RESTAURANT", Quantity = -2, Type = "POS_CONSUMPTION", Reason = "Dinner service orders ORD-1048 & ORD-1045", PerformedBy = "Chef Jean-Pierre" });
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
}
