using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class Staff : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "FRONT_DESK"; // ADMIN, FRONT_DESK, HOUSEKEEPING, POS_CASHIER, CONCIERGE, CHEF, FINANCE
    public string Avatar { get; set; } = string.Empty;
    public string Shift { get; set; } = "Morning (07:00 - 15:30)";

    [NotMapped]
    public bool IsActive { get; set; } = true;
}
