using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Persistence.Seeders;

public static class MembershipSeeder
{
    public static async Task SeedMembershipsAsync(HospitalityDbContext db, ILogger? logger = null)
    {
        try
        {
            // 1. Ensure tables and indexes exist in PostgreSQL
            await db.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""MembershipTier"" (
                    ""id"" text PRIMARY KEY,
                    ""code"" varchar(50) NOT NULL,
                    ""name"" text NOT NULL,
                    ""description"" text NOT NULL DEFAULT '',
                    ""minNights"" integer NOT NULL DEFAULT 0,
                    ""hotelDiscountEnabled"" boolean NOT NULL DEFAULT false,
                    ""hotelDiscountType"" varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
                    ""hotelDiscountValue"" double precision NOT NULL DEFAULT 0,
                    ""hotelMaxDiscount"" double precision,
                    ""restaurantDiscountEnabled"" boolean NOT NULL DEFAULT false,
                    ""restaurantDiscountType"" varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
                    ""restaurantDiscountValue"" double precision NOT NULL DEFAULT 0,
                    ""restaurantMaxDiscount"" double precision,
                    ""color"" text NOT NULL DEFAULT '#64748B',
                    ""benefitsJson"" text NOT NULL DEFAULT '[]',
                    ""isActive"" boolean NOT NULL DEFAULT true,
                    ""displayOrder"" integer NOT NULL DEFAULT 1,
                    ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                    ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_MembershipTier_code"" ON ""MembershipTier"" (""code"");
                CREATE INDEX IF NOT EXISTS ""IX_MembershipTier_minNights"" ON ""MembershipTier"" (""minNights"");

                CREATE TABLE IF NOT EXISTS ""GuestMembership"" (
                    ""id"" text PRIMARY KEY,
                    ""guestId"" text NOT NULL,
                    ""membershipNumber"" varchar(50) NOT NULL,
                    ""currentTierId"" text NOT NULL,
                    ""status"" varchar(20) NOT NULL DEFAULT 'ACTIVE',
                    ""memberSince"" timestamp with time zone NOT NULL DEFAULT now(),
                    ""lifetimeCompletedStays"" integer NOT NULL DEFAULT 0,
                    ""lifetimeCompletedNights"" integer NOT NULL DEFAULT 0,
                    ""qualifyingNights"" integer NOT NULL DEFAULT 0,
                    ""expiryDate"" timestamp with time zone,
                    ""lastUpgradedAt"" timestamp with time zone,
                    ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                    ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_GuestMembership_membershipNumber"" ON ""GuestMembership"" (""membershipNumber"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_GuestMembership_guestId"" ON ""GuestMembership"" (""guestId"");

                CREATE TABLE IF NOT EXISTS ""MembershipHistory"" (
                    ""id"" text PRIMARY KEY,
                    ""guestMembershipId"" text NOT NULL,
                    ""oldTierName"" text NOT NULL,
                    ""newTierName"" text NOT NULL,
                    ""qualifyingNights"" integer NOT NULL DEFAULT 0,
                    ""reason"" text NOT NULL,
                    ""performedBy"" text NOT NULL DEFAULT 'System',
                    ""createdAt"" timestamp with time zone NOT NULL DEFAULT now()
                );

                CREATE INDEX IF NOT EXISTS ""IX_MembershipHistory_guestMembershipId"" ON ""MembershipHistory"" (""guestMembershipId"");

                CREATE TABLE IF NOT EXISTS ""MembershipDiscountApplication"" (
                    ""id"" text PRIMARY KEY,
                    ""billId"" text,
                    ""invoiceNumber"" text,
                    ""reservationId"" text,
                    ""orderId"" text,
                    ""guestId"" text NOT NULL,
                    ""membershipNumber"" text NOT NULL,
                    ""tierName"" text NOT NULL,
                    ""module"" varchar(20) NOT NULL DEFAULT 'HOTEL',
                    ""discountType"" varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
                    ""discountValue"" double precision NOT NULL DEFAULT 0,
                    ""actualDiscountAmount"" double precision NOT NULL DEFAULT 0,
                    ""subtotalBeforeDiscount"" double precision NOT NULL DEFAULT 0,
                    ""eligibleItemsSummary"" text,
                    ""appliedBy"" text NOT NULL DEFAULT 'Front Desk Staff',
                    ""appliedAt"" timestamp with time zone NOT NULL DEFAULT now()
                );

                CREATE INDEX IF NOT EXISTS ""IX_MembershipDiscountApp_membershipNumber"" ON ""MembershipDiscountApplication"" (""membershipNumber"");
                CREATE INDEX IF NOT EXISTS ""IX_MembershipDiscountApp_billId"" ON ""MembershipDiscountApplication"" (""billId"");
            ");

            // 2. Seed Default 4 Membership Tiers if not already present
            var tierCount = await db.MembershipTiers.CountAsync();
            if (tierCount == 0)
            {
                var defaultTiers = new List<MembershipTier>
                {
                    new MembershipTier
                    {
                        Id = "tier-regular",
                        Code = "REGULAR",
                        Name = "Regular Member",
                        Description = "Base membership tier for newly registered guests (0–4 completed nights).",
                        MinNights = 0,
                        HotelDiscountEnabled = false,
                        HotelDiscountType = "PERCENTAGE",
                        HotelDiscountValue = 0,
                        RestaurantDiscountEnabled = false,
                        RestaurantDiscountType = "PERCENTAGE",
                        RestaurantDiscountValue = 0,
                        Color = "#64748B",
                        BenefitsJson = "[\"Welcome refreshment on check-in\",\"High-speed guest Wi-Fi\",\"Earn qualifying nights toward tier upgrades\"]",
                        IsActive = true,
                        DisplayOrder = 1,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new MembershipTier
                    {
                        Id = "tier-silver",
                        Code = "SILVER",
                        Name = "Silver Member",
                        Description = "Preferred status for returning hotel guests with 5–14 completed nights.",
                        MinNights = 5,
                        HotelDiscountEnabled = true,
                        HotelDiscountType = "PERCENTAGE",
                        HotelDiscountValue = 5,
                        RestaurantDiscountEnabled = false,
                        RestaurantDiscountType = "PERCENTAGE",
                        RestaurantDiscountValue = 0,
                        Color = "#475569",
                        BenefitsJson = "[\"5% direct discount on eligible room bookings\",\"Early check-in from 11:00 AM (upon availability)\",\"Priority front desk service\"]",
                        IsActive = true,
                        DisplayOrder = 2,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new MembershipTier
                    {
                        Id = "tier-gold",
                        Code = "GOLD",
                        Name = "Gold Member",
                        Description = "VIP privileges for guests with 15–29 completed nights.",
                        MinNights = 15,
                        HotelDiscountEnabled = true,
                        HotelDiscountType = "PERCENTAGE",
                        HotelDiscountValue = 10,
                        RestaurantDiscountEnabled = true,
                        RestaurantDiscountType = "PERCENTAGE",
                        RestaurantDiscountValue = 5,
                        Color = "#D97706",
                        BenefitsJson = "[\"10% direct discount on eligible room bookings\",\"5% direct discount on restaurant dining\",\"Complimentary breakfast upgrade\",\"Late check-out up to 1:00 PM\"]",
                        IsActive = true,
                        DisplayOrder = 3,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new MembershipTier
                    {
                        Id = "tier-platinum",
                        Code = "PLATINUM",
                        Name = "Platinum Member",
                        Description = "Elite hospitality tier for VIP frequent guests with 30+ completed nights.",
                        MinNights = 30,
                        HotelDiscountEnabled = true,
                        HotelDiscountType = "PERCENTAGE",
                        HotelDiscountValue = 15,
                        RestaurantDiscountEnabled = true,
                        RestaurantDiscountType = "PERCENTAGE",
                        RestaurantDiscountValue = 10,
                        Color = "#4F46E5",
                        BenefitsJson = "[\"15% direct discount on eligible room bookings\",\"10% direct discount on restaurant dining\",\"Guaranteed room upgrade (subject to availability)\",\"Executive lounge access\",\"Late check-out up to 3:00 PM\",\"Dedicated hospitality manager\"]",
                        IsActive = true,
                        DisplayOrder = 4,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                db.MembershipTiers.AddRange(defaultTiers);
                await db.SaveChangesAsync();
                logger?.LogInformation("MembershipSeeder: Successfully seeded default 4 membership tiers.");
            }

            // 3. Migrate existing guests without membership into Regular Membership (or higher based on completed stays)
            var guestsWithoutMembership = await db.Guests
                .Where(g => !db.GuestMemberships.Any(m => m.GuestId == g.Id))
                .ToListAsync();

            if (guestsWithoutMembership.Count > 0)
            {
                var tiers = await db.MembershipTiers
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.MinNights)
                    .ToListAsync();

                var regularTier = tiers.FirstOrDefault(t => t.Code == "REGULAR") ?? tiers.First();

                var existingMemCount = await db.GuestMemberships.CountAsync();
                int nextNumber = 10001 + existingMemCount;

                var newMemberships = new List<GuestMembership>();
                var newHistories = new List<MembershipHistory>();

                foreach (var guest in guestsWithoutMembership)
                {
                    // Calculate completed qualifying nights for this guest
                    var completedReservations = await db.Reservations
                        .Where(r => r.GuestId == guest.Id && r.Status == "CHECKED_OUT")
                        .ToListAsync();

                    int completedStays = completedReservations.Count;
                    int completedNights = 0;
                    foreach (var res in completedReservations)
                    {
                        var nights = (int)Math.Max(1, (res.CheckOut - res.CheckIn).TotalDays);
                        completedNights += nights;
                    }

                    // Determine tier based on completed nights
                    var eligibleTier = regularTier;
                    foreach (var tier in tiers.OrderByDescending(t => t.MinNights))
                    {
                        if (completedNights >= tier.MinNights)
                        {
                            eligibleTier = tier;
                            break;
                        }
                    }

                    var memId = Guid.NewGuid().ToString("N");
                    var memNumber = $"MEM-{nextNumber++}";

                    var mem = new GuestMembership
                    {
                        Id = memId,
                        GuestId = guest.Id,
                        MembershipNumber = memNumber,
                        CurrentTierId = eligibleTier.Id,
                        Status = "ACTIVE",
                        MemberSince = guest.CreatedAt,
                        LifetimeCompletedStays = completedStays,
                        LifetimeCompletedNights = completedNights,
                        QualifyingNights = completedNights,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    newMemberships.Add(mem);
                    newHistories.Add(new MembershipHistory
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        GuestMembershipId = memId,
                        OldTierName = "None",
                        NewTierName = eligibleTier.Name,
                        QualifyingNights = completedNights,
                        Reason = "Automatic enrollment & initial migration from existing guest profile",
                        PerformedBy = "System Migration",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                db.GuestMemberships.AddRange(newMemberships);
                db.MembershipHistories.AddRange(newHistories);
                await db.SaveChangesAsync();
                logger?.LogInformation("MembershipSeeder: Successfully enrolled {Count} existing guests with memberships.", newMemberships.Count);
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "MembershipSeeder: Error during membership tables seeding or guest enrollment migration.");
        }
    }
}
