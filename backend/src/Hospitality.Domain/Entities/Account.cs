namespace Hospitality.Domain.Entities;

public class Account : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AccountCode { get; set; } = string.Empty; // e.g. "1010", "4010"
    public string AccountName { get; set; } = string.Empty; // e.g. "Front Desk Cash", "Room Revenue"
    public string AccountType { get; set; } = "ASSET"; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    public string SubCategory { get; set; } = "Current Asset"; // Current Asset, Fixed Asset, Operating Revenue, etc.
    public string NormalBalance { get; set; } = "DEBIT"; // DEBIT or CREDIT
    public double OpeningBalance { get; set; } = 0.0;
    public double CurrentBalance { get; set; } = 0.0;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsSystemAccount { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
