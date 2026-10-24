using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class Supplier : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;

    [NotMapped]
    public string ContactPerson
    {
        get => ContactName;
        set => ContactName = value;
    }

    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string Category { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InventoryItem> Items { get; set; } = new List<InventoryItem>();
    public ICollection<PurchaseOrder> Purchases { get; set; } = new List<PurchaseOrder>();
}
