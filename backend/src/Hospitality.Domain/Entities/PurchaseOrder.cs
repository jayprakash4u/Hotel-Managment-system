namespace Hospitality.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PoNumber { get; set; } = string.Empty; // PO-2026-XXXX
    public string SupplierId { get; set; } = string.Empty;
    public Supplier? Supplier { get; set; }

    public double TotalAmount { get; set; }
    public string Status { get; set; } = "RECEIVED"; // PENDING, ORDERED, RECEIVED, CANCELLED
    public string ItemsJson { get; set; } = "[]"; // JSON array of purchased items
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReceivedAt { get; set; }
}
