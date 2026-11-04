namespace Hospitality.Domain.Entities;

public class CustomerLedgerEntry : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string CustomerId { get; set; } = string.Empty;
    public Customer? Customer { get; set; }

    public string? BillId { get; set; }
    public Bill? Bill { get; set; }

    public string? PaymentId { get; set; }

    public DateTime EntryDate { get; set; } = DateTime.UtcNow;

    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Debit amount: increases customer outstanding (e.g. credit sales, opening debit)
    /// </summary>
    public double DebitAmount { get; set; } = 0;

    /// <summary>
    /// Credit amount: decreases customer outstanding (e.g. payments received, credit memo)
    /// </summary>
    public double CreditAmount { get; set; } = 0;

    /// <summary>
    /// Running customer balance after this transaction
    /// </summary>
    public double Balance { get; set; } = 0;

    /// <summary>
    /// Reference type: "CREDIT_BILL", "PAYMENT", "OPENING_BALANCE", "ADJUSTMENT", "VOID_REVERSAL"
    /// </summary>
    public string ReferenceType { get; set; } = "CREDIT_BILL";

    public string? ReferenceId { get; set; }
    public string? PaymentMode { get; set; } // CASH, ONLINE, WALLET

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

