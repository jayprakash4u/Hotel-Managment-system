namespace Hospitality.Domain.Entities;

public class JournalEntry : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string EntryNumber { get; set; } = string.Empty; // e.g. "JV-2026-0001"
    public DateTime EntryDate { get; set; } = DateTime.UtcNow;
    public string? Reference { get; set; } // Reference # or Bill #
    public string Description { get; set; } = string.Empty; // Narration
    public double TotalDebit { get; set; } = 0.0;
    public double TotalCredit { get; set; } = 0.0;
    public string Status { get; set; } = "POSTED"; // DRAFT, POSTED, VOID
    public string SourceModule { get; set; } = "MANUAL"; // MANUAL, BILLING, HOTEL_FOLIO, RESTAURANT, EXPENSE
    public string CreatedBy { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<JournalEntryLine> Lines { get; set; } = new();
}
