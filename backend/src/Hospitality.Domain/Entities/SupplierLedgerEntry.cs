namespace Hospitality.Domain.Entities;

public class SupplierLedgerEntry : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string SupplierId { get; set; } = string.Empty;
    public Supplier? Supplier { get; set; }

    public string? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public DateTime EntryDate { get; set; } = DateTime.UtcNow;

    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Credit amount: increases amount owed to supplier (e.g. credit purchase, opening balance).
    /// </summary>
    public double CreditAmount { get; set; } = 0;

    /// <summary>
    /// Debit amount: decreases amount owed to supplier (e.g. payment made).
    /// </summary>
    public double DebitAmount { get; set; } = 0;

    /// <summary>
    /// Running supplier balance after this transaction. Positive = amount owed.
    /// </summary>
    public double Balance { get; set; } = 0;

    /// <summary>
    /// Due date for the credit (from purchase order terms). Null for payments/adjustments.
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Reference type: "PURCHASE_CREDIT", "PAYMENT", "OPENING_BALANCE", "ADJUSTMENT", "VOID_REVERSAL"
    /// </summary>
    public string ReferenceType { get; set; } = "PURCHASE_CREDIT";

    public string? ReferenceId { get; set; }

    /// <summary>
    /// Payment mode for debit entries: "Cash", "Bank", "Card", etc.
    /// </summary>
    public string? PaymentMode { get; set; }

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
