namespace Hospitality.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PoNumber { get; set; } = string.Empty; // PO-2026-XXXX or PUR-2026-XXXX
    public string? InvoiceNumber { get; set; }
    public string? PanVatNumber { get; set; }
    public string? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string? SupplierName { get; set; }

    public string PurchaseType { get; set; } = "INVENTORY"; // INVENTORY, CASH, CREDIT, EXPENSE, FIXED_ASSET, RETURN, SIMPLE, FULL
    public double Subtotal { get; set; } = 0;
    public double Discount { get; set; } = 0;
    public double Tax { get; set; } = 0;
    public double AdditionalCharges { get; set; } = 0;
    public double FreightCharges { get; set; } = 0;
    public double RoundOff { get; set; } = 0;
    public double TotalAmount { get; set; }
    public double PaidAmount { get; set; } = 0;
    public double DueAmount { get; set; } = 0;

    public string PaymentMethod { get; set; } = "Cash"; // Cash, Bank, QR, Card, Credit, Split
    public string PaymentStatus { get; set; } = "Paid"; // Paid, Partially Paid, Unpaid
    public string ReceivingStatus { get; set; } = "FULLY_RECEIVED"; // PENDING, PARTIALLY_RECEIVED, FULLY_RECEIVED
    public string Status { get; set; } = "POSTED"; // DRAFT, PENDING_APPROVAL, APPROVED, POSTED, RECEIVED, CANCELLED, RETURNED
    public string? Notes { get; set; }
    public string? AttachmentUrl { get; set; }
    public string CreatedBy { get; set; } = "Admin";
    public string? ApprovedBy { get; set; }

    public string? BranchOrOutlet { get; set; } = "Restaurant Main";
    public string? Warehouse { get; set; } = "Central Store";
    public string? PurchaseOrderRef { get; set; }
    public string? GrnNumber { get; set; }
    public string? JournalEntryId { get; set; }

    public string ItemsJson { get; set; } = "[]"; // JSON array of purchased items
    public string AllocationsJson { get; set; } = "[]"; // JSON breakdown of hotel vs restaurant allocated quantities
    public string PaymentsJson { get; set; } = "[]"; // JSON array of payment records
    public string ReturnsJson { get; set; } = "[]"; // JSON array of return records

    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? InvoiceDate { get; set; }
    public DateTime? ReceivedAt { get; set; }

    /// <summary>
    /// Due date for credit purchases. Calculated as purchase date + supplier payment terms.
    /// </summary>
    public DateTime? DueDate { get; set; }
}
