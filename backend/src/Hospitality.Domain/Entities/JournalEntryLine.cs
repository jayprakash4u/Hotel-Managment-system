namespace Hospitality.Domain.Entities;

public class JournalEntryLine : BaseEntity
{
    public string JournalEntryId { get; set; } = string.Empty;
    public JournalEntry? JournalEntry { get; set; }

    public string AccountId { get; set; } = string.Empty;
    public Account? Account { get; set; }

    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? LineDescription { get; set; }
    public double Debit { get; set; } = 0.0;
    public double Credit { get; set; } = 0.0;
}
