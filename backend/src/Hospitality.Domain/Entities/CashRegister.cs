using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class CashRegister : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Shift { get; set; } = "Morning (07:00-15:30)"; // Morning (07:00-15:30), Evening (15:00-23:30), Night (23:00-07:30)

    [NotMapped]
    public string ShiftName
    {
        get => Shift;
        set => Shift = value;
    }

    public string CashierName { get; set; } = string.Empty;
    public double OpeningFloat { get; set; } = 500.0;
    public double? ClosingCash { get; set; }
    public double CashSales { get; set; } = 0.0;
    public double CardSales { get; set; } = 0.0;
    public double RoomCharges { get; set; } = 0.0;
    public double ExpensesPaid { get; set; } = 0.0;
    public string Status { get; set; } = "OPEN"; // OPEN, CLOSED
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
}
