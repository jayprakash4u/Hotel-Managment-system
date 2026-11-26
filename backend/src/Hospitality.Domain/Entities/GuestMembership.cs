namespace Hospitality.Domain.Entities;

public class GuestMembership : BaseEntity
{
    public string GuestId { get; set; } = string.Empty;
    public Guest? Guest { get; set; }

    /// <summary>
    /// Unique Membership Number (e.g. MEM-10001). Concurrency-safe & indexed.
    /// </summary>
    public string MembershipNumber { get; set; } = string.Empty;

    public string CurrentTierId { get; set; } = string.Empty;
    public MembershipTier? CurrentTier { get; set; }

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED
    public DateTime MemberSince { get; set; } = DateTime.UtcNow;

    public int LifetimeCompletedStays { get; set; } = 0;
    public int LifetimeCompletedNights { get; set; } = 0;
    public int QualifyingNights { get; set; } = 0; // Completed nights in current qualification window

    public DateTime? ExpiryDate { get; set; }
    public DateTime? LastUpgradedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MembershipHistory> History { get; set; } = new List<MembershipHistory>();
}
