namespace Hospitality.Domain.Entities;

public class PartnerCommissionPayment : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PartnerId { get; set; } = string.Empty;
    public BusinessPartner? Partner { get; set; }

    public string PaymentNumber { get; set; } = string.Empty; // e.g. CPAY-2026-0001
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public double Amount { get; set; } = 0;
    public string PaymentMethod { get; set; } = "CASH"; // CASH, BANK_TRANSFER, CHEQUE, WALLET, OTHER
    public string? ReferenceNumber { get; set; }
    public string? PaidBy { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
