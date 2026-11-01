using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class Bill : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    /// <summary>
    /// Permanent unique bill number (e.g. BILL-2026-000001).
    /// Concurrency-safe and unique per hotel business.
    /// </summary>
    public string BillNumber { get; set; } = string.Empty;

    /// <summary>
    /// Billing type: QUICK_BILL, WALK_IN, TABLE_ORDER, ROOM_SERVICE, HOTEL_CHECKOUT
    /// </summary>
    public string BillingType { get; set; } = "QUICK_BILL";

    // References to source records
    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? ReservationId { get; set; }
    public string? BookingCode { get; set; }
    public string? GuestId { get; set; }
    public string? RoomNumber { get; set; }
    public string? TableNumber { get; set; }
    public string? ServerOrStaff { get; set; }

    // Customer info (Optional, not required for restaurant / quick sales)
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }

    // Financial breakdown
    public double Subtotal { get; set; } = 0;
    public double DiscountAmount { get; set; } = 0;
    public double DiscountPercent { get; set; } = 0;
    public double TaxAmount { get; set; } = 0;
    public double ServiceCharge { get; set; } = 0;
    public double RoundOff { get; set; } = 0;
    public double GrandTotal { get; set; } = 0;
    public double AmountPaid { get; set; } = 0;
    public double BalanceDue { get; set; } = 0;

    // Payment status: UNPAID, PARTIAL, PAID, VOID, REFUNDED
    public string PaymentStatus { get; set; } = "PAID";
    public string PaymentMethod { get; set; } = "CASH"; // CASH, CARD, UPI, ROOM_FOLIO, SPLIT, BANK_TRANSFER

    // Immutable JSON snapshots of line items and payment ledger for audit safety & reprints
    public string ItemsJson { get; set; } = "[]";
    public string PaymentsJson { get; set; } = "[]";

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
