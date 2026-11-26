namespace Hospitality.Application.DTOs;

public class MembershipTierDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MinNights { get; set; } = 0;

    // Hotel Discount Rules
    public bool HotelDiscountEnabled { get; set; } = false;
    public string HotelDiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
    public double HotelDiscountValue { get; set; } = 0;
    public double? HotelMaxDiscount { get; set; }

    // Restaurant Discount Rules
    public bool RestaurantDiscountEnabled { get; set; } = false;
    public string RestaurantDiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
    public double RestaurantDiscountValue { get; set; } = 0;
    public double? RestaurantMaxDiscount { get; set; }

    public string Color { get; set; } = "#64748B";
    public string BenefitsJson { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 1;
}

public class MembershipHistoryDto
{
    public string Id { get; set; } = string.Empty;
    public string OldTierName { get; set; } = string.Empty;
    public string NewTierName { get; set; } = string.Empty;
    public int QualifyingNights { get; set; } = 0;
    public string Reason { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class GuestMembershipDto
{
    public string Id { get; set; } = string.Empty;
    public string GuestId { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string MembershipNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "ACTIVE";
    public DateTime MemberSince { get; set; }

    public MembershipTierDto CurrentTier { get; set; } = new();
    public MembershipTierDto? NextTier { get; set; }
    public int LifetimeCompletedStays { get; set; } = 0;
    public int LifetimeCompletedNights { get; set; } = 0;
    public int QualifyingNights { get; set; } = 0;
    public int NightsNeededForNext { get; set; } = 0;
    public int ProgressPercent { get; set; } = 100;

    public List<MembershipHistoryDto> History { get; set; } = new();
}

public class CalculateDiscountRequest
{
    public string? GuestId { get; set; }
    public string? MembershipNumber { get; set; }
    public string Module { get; set; } = "HOTEL"; // HOTEL or RESTAURANT
    public double EligibleSubtotal { get; set; } = 0;
}

public class CalculateDiscountResult
{
    public bool IsEligible { get; set; } = false;
    public string MembershipNumber { get; set; } = string.Empty;
    public string TierName { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "PERCENTAGE";
    public double DiscountValue { get; set; } = 0;
    public double CalculatedDiscountAmount { get; set; } = 0;
    public double SubtotalAfterDiscount { get; set; } = 0;
    public string Message { get; set; } = string.Empty;
}

public class RecordDiscountApplicationDto
{
    public string? BillId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? ReservationId { get; set; }
    public string? OrderId { get; set; }
    public string GuestId { get; set; } = string.Empty;
    public string MembershipNumber { get; set; } = string.Empty;
    public string TierName { get; set; } = string.Empty;
    public string Module { get; set; } = "HOTEL";
    public string DiscountType { get; set; } = "PERCENTAGE";
    public double DiscountValue { get; set; }
    public double ActualDiscountAmount { get; set; }
    public double SubtotalBeforeDiscount { get; set; }
    public string? EligibleItemsSummary { get; set; }
    public string AppliedBy { get; set; } = "Staff";
}
