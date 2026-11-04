namespace Hospitality.Domain.Entities;

public class CreditOverrideAudit : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string CustomerId { get; set; } = string.Empty;
    public Customer? Customer { get; set; }

    public string? BillId { get; set; }
    public string? BillNumber { get; set; }

    public double PreviousAvailableCredit { get; set; } = 0;
    public double BillAmount { get; set; } = 0;
    public double OverrideAmount { get; set; } = 0;

    public string Reason { get; set; } = string.Empty;
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime ApprovedAt { get; set; } = DateTime.UtcNow;
}

