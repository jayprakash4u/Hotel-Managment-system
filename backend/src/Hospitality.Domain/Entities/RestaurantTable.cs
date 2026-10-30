namespace Hospitality.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string TableNumber { get; set; } = string.Empty;
    public string Section { get; set; } = "Indoor Fine Dining";
    public int Capacity { get; set; } = 4;
    public string Status { get; set; } = "FREE"; // FREE, OCCUPIED, RESERVED, BILLED, OUT_OF_SERVICE
    public string CleaningStatus { get; set; } = "CLEAN"; // CLEAN, DIRTY, CLEANING
    public string? MaintenanceNotes { get; set; }

    public ICollection<RestaurantOrder> Orders { get; set; } = new List<RestaurantOrder>();
    public ICollection<TableReservation> Reservations { get; set; } = new List<TableReservation>();
}
