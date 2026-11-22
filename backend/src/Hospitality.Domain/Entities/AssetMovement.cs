namespace Hospitality.Domain.Entities;

public class AssetMovement : BaseEntity
{
    public string FixedAssetId { get; set; } = string.Empty;
    public FixedAsset? FixedAsset { get; set; }

    public DateTime TransferDate { get; set; } = DateTime.UtcNow;

    public string? FromLocation { get; set; }
    public string? ToLocation { get; set; }

    public string? FromDepartment { get; set; }
    public string? ToDepartment { get; set; }

    public string? FromAssignedTo { get; set; }
    public string? ToAssignedTo { get; set; }

    public string? Reason { get; set; }
    public string? TransferredBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

