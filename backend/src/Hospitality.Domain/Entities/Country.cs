namespace Hospitality.Domain.Entities;

public class Country : BaseEntity
{
    public string CountryCode { get; set; } = string.Empty; // ISO 3166-1 alpha-2, e.g. "NP", "IN", "US"
    public string CountryName { get; set; } = string.Empty; // e.g. "Nepal", "India", "United States"
    public string NationalityName { get; set; } = string.Empty; // e.g. "Nepali", "Indian", "American"
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
