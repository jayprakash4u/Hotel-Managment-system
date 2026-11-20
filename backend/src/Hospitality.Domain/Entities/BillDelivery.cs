namespace Hospitality.Domain.Entities;

public class BillDelivery : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string BillId { get; set; } = string.Empty;
    public Bill? Bill { get; set; }

    /// <summary>PRINT, WHATSAPP, EMAIL, PDF_DOWNLOAD</summary>
    public string DeliveryMethod { get; set; } = string.Empty;

    public string? RecipientPhone { get; set; }
    public string? RecipientEmail { get; set; }

    /// <summary>PENDING, SENT, FAILED, SHARED_AWAITING_USER_ACTION</summary>
    public string Status { get; set; } = "PENDING";

    public string? ErrorDetails { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
