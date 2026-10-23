namespace Hospitality.Domain.Entities;

public class HousekeepingTask : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string RoomId { get; set; } = string.Empty;
    public Room? Room { get; set; }

    public string? AssignedTo { get; set; }
    public string TaskType { get; set; } = "FULL_CLEAN"; // FULL_CLEAN, TOUCH_UP, TURNDOWN, DEEP_CLEAN, INSPECTION
    public string Priority { get; set; } = "NORMAL"; // URGENT, HIGH, NORMAL, LOW
    public string Status { get; set; } = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED
    public string? Notes { get; set; }
    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
