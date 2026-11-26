namespace Hospitality.Domain.Entities;

public class MembershipDiscountApplication : BaseEntity
{
    public string? BillId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? ReservationId { get; set; }
    public string? OrderId { get; set; }

    public string GuestId { get; set; } = string.Empty;
    public string MembershipNumber { get; set; } = string.Empty;
    public string TierName { get; set; } = string.Empty;

    public string Module { get; set; } = "HOTEL"; // HOTEL or RESTAURANT
    public string DiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
    public double DiscountValue { get; set; } = 0;
    public double ActualDiscountAmount { get; set; } = 0;
    public double SubtotalBeforeDiscount { get; set; } = 0;

    public string? EligibleItemsSummary { get; set; }
    public string AppliedBy { get; set; } = "Front Desk Staff";
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
}
