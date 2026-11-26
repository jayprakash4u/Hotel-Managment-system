namespace Hospitality.Domain.Entities;

public class PartnerCommission : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PartnerId { get; set; } = string.Empty;
    public BusinessPartner? Partner { get; set; }

    public string ReservationId { get; set; } = string.Empty;
    public Reservation? Reservation { get; set; }

    public string BookingCode { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int RoomNights { get; set; } = 1;

    public double EligibleAmount { get; set; } = 0;
    public string CommissionType { get; set; } = "PERCENTAGE"; // PERCENTAGE, FIXED_PER_BOOKING, FIXED_PER_ROOM_NIGHT
    public double CommissionRate { get; set; } = 0;
    public double CommissionAmount { get; set; } = 0;
    public string CalculationBasis { get; set; } = "ROOM_CHARGES";

    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, PAID, CANCELLED
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentId { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
