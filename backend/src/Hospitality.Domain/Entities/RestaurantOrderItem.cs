using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class RestaurantOrderItem : BaseEntity
{
    public string OrderId { get; set; } = string.Empty;
    public RestaurantOrder? Order { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    [NotMapped]
    public string Name
    {
        get => ProductName;
        set => ProductName = value;
    }

    public double UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public double Total { get; set; }
    public string? Notes { get; set; }
}
