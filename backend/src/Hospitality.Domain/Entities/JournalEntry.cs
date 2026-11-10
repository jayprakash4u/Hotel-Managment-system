namespace Hospitality.Domain.Entities;

public class JournalEntry : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string EntryNumber { get; set; } = string.Empty; // e.g. "JV-2026-0001"
    public DateTime EntryDate { get; set; } = DateTime.UtcNow;
    public string EntryType { get; set; } = "GENERAL"; // GENERAL, ADJUSTMENT, OPENING, CLOSING
    public string? Reference { get; set; } // Reference # or Bill #
    public string Description { get; set; } = string.Empty; // Narration
    public double TotalDebit { get; set; } = 0.0;
    public double TotalCredit { get; set; } = 0.0;
    public string Status { get; set; } = "POSTED"; // DRAFT, POSTED, REVERSED
    public string SourceModule { get; set; } = "MANUAL"; // MANUAL, POS_SALE, ROOM_BILL, PURCHASE, EXPENSE, PAYROLL
    public string? SourceTransactionId { get; set; }
    public string CreatedBy { get; set; } = "Admin";
    public string? PostedBy { get; set; }
    public DateTime? PostedAt { get; set; }
    public string? ReversedFromId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<JournalEntryLine> Lines { get; set; } = new();
}
