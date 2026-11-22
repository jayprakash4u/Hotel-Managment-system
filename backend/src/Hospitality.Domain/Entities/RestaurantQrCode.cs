using System;

namespace Hospitality.Domain.Entities;

public class RestaurantQrCode : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string? TableId { get; set; }
    public RestaurantTable? Table { get; set; }

    public string CodeType { get; set; } = "RESTAURANT"; // "RESTAURANT" or "TABLE"
    public string Label { get; set; } = string.Empty; // e.g. "Restaurant General Menu" or "Table 01"

    /// <summary>
    /// Cryptographic SHA-256 hash of the random unguessable token.
    /// The raw token is only returned to the manager at generation time and encoded into the QR image/link.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public int ScanCount { get; set; } = 0;
    public DateTime? LastScannedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
