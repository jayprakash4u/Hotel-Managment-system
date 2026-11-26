using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class Reservation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string RoomId { get; set; } = string.Empty;
    public Room? Room { get; set; }
    public string GuestId { get; set; } = string.Empty;
    public Guest? Guest { get; set; }

    public string BookingCode { get; set; } = string.Empty; // e.g. BK-1001 or RES-XXXXXX
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }

    [NotMapped]
    public DateTime CheckInDate
    {
        get => CheckIn;
        set => CheckIn = value;
    }

    [NotMapped]
    public DateTime CheckOutDate
    {
        get => CheckOut;
        set => CheckOut = value;
    }

    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public string Status { get; set; } = "CONFIRMED"; // CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW, RESERVED
    public double TotalAmount { get; set; } = 0;
    public double PaidAmount { get; set; } = 0;

    [NotMapped]
    public double AdvancePaid
    {
        get => PaidAmount;
        set => PaidAmount = value;
    }

    public string PaymentStatus { get; set; } = "UNPAID"; // UNPAID, PARTIAL, PAID, REFUNDED
    public string Source { get; set; } = "DIRECT"; // DIRECT, WALK_IN, CORPORATE, TRAVEL_AGENT, INDIVIDUAL_REFERRAL
    public string? PartnerId { get; set; }
    public string? PartnerType { get; set; } // CORPORATE, TRAVEL_AGENT, INDIVIDUAL_REFERRAL
    public string? BillingArrangement { get; set; } // COMPANY_ACCOUNT, GUEST_DIRECT, SPLIT_BILLING
    public string? PaymentResponsibility { get; set; } // COMPANY_PAYS, GUEST_PAYS, SPLIT
    public double SplitCompanyAmount { get; set; } = 0;
    public double SplitGuestAmount { get; set; } = 0;
    public double NegotiatedRate { get; set; } = 0;
    public double CalculatedCommission { get; set; } = 0;
    public string? SpecialRequests { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FolioItem> FolioItems { get; set; } = new List<FolioItem>();
}
