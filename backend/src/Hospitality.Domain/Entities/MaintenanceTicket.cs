namespace Hospitality.Domain.Entities;

public class MaintenanceTicket : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string RoomId { get; set; } = string.Empty;
    public Room? Room { get; set; }

    public string TicketCode { get; set; } = string.Empty; // MNT-XXXX
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "PLUMBING"; // PLUMBING, HVAC, ELECTRICAL, FURNITURE, APPLIANCE, OTHER
    public string Priority { get; set; } = "HIGH"; // URGENT, HIGH, NORMAL, LOW
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED
    public string ReportedBy { get; set; } = "Housekeeping";
    public string? AssignedTo { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
