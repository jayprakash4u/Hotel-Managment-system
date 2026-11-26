namespace Hospitality.Domain.Entities;

public class MembershipHistory : BaseEntity
{
    public string GuestMembershipId { get; set; } = string.Empty;
    public GuestMembership? GuestMembership { get; set; }

    public string OldTierName { get; set; } = string.Empty;
    public string NewTierName { get; set; } = string.Empty;
    public int QualifyingNights { get; set; } = 0;

    public string Reason { get; set; } = "Automatic tier upgrade on stay checkout";
    public string PerformedBy { get; set; } = "System / Checkout";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
