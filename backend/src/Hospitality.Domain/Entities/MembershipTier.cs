namespace Hospitality.Domain.Entities;

public class MembershipTier : BaseEntity
{
    public string Code { get; set; } = "REGULAR"; // REGULAR, SILVER, GOLD, PLATINUM, CUSTOM
    public string Name { get; set; } = "Regular Member";
    public string Description { get; set; } = "Base membership tier for newly registered hotel guests.";
    public int MinNights { get; set; } = 0; // Qualifying nights required

    // Hotel Discount Rules
    public bool HotelDiscountEnabled { get; set; } = false;
    public string HotelDiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
    public double HotelDiscountValue { get; set; } = 0; // e.g. 10 for 10%
    public double? HotelMaxDiscount { get; set; }

    // Restaurant Discount Rules
    public bool RestaurantDiscountEnabled { get; set; } = false;
    public string RestaurantDiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
    public double RestaurantDiscountValue { get; set; } = 0; // e.g. 5 for 5%
    public double? RestaurantMaxDiscount { get; set; }

    // Visual & Privilege Attributes
    public string Color { get; set; } = "#64748B";
    public string BenefitsJson { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GuestMembership> Memberships { get; set; } = new List<GuestMembership>();
}
