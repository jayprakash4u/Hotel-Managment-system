namespace Hospitality.Domain.Entities;

public class IncomeCategory : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string CategoryName { get; set; } = string.Empty; // e.g. "Catering Income", "Event / Party Income"
    public string CategoryType { get; set; } = "OPERATING"; // "OPERATING" or "NON_OPERATING"
    
    // Linked Chart of Accounts Income Account
    public string AccountId { get; set; } = string.Empty;
    public Account? Account { get; set; }
    public string AccountCode { get; set; } = string.Empty; // e.g. "4310"
    public string AccountName { get; set; } = string.Empty; // e.g. "Catering Income"

    public string? Description { get; set; }
    public bool IsSystem { get; set; } = false; // System default categories cannot be deleted
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

