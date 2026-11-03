namespace Hospitality.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PoNumber { get; set; } = string.Empty; // PO-2026-XXXX
    public string? InvoiceNumber { get; set; }
    public string? PanVatNumber { get; set; }
    public string? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string? SupplierName { get; set; }

    public string PurchaseType { get; set; } = "FULL"; // "SIMPLE" or "FULL"
    public double Subtotal { get; set; } = 0;
    public double Discount { get; set; } = 0;
    public double Tax { get; set; } = 0;
    public double AdditionalCharges { get; set; } = 0;
    public double TotalAmount { get; set; }

    public string PaymentMethod { get; set; } = "Cash"; // Cash, Bank, Card, Credit, Other
    public string PaymentStatus { get; set; } = "Paid"; // Paid, Partially Paid, Unpaid
    public string Status { get; set; } = "RECEIVED"; // PENDING, ORDERED, RECEIVED, CANCELLED
    public string? Notes { get; set; }
    public string? AttachmentUrl { get; set; }
    public string CreatedBy { get; set; } = "Admin";

    public string ItemsJson { get; set; } = "[]"; // JSON array of purchased items
    public string AllocationsJson { get; set; } = "[]"; // JSON breakdown of hotel vs restaurant allocated quantities
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReceivedAt { get; set; }
}
