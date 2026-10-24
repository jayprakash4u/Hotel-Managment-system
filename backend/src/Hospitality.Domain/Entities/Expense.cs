namespace Hospitality.Domain.Entities;

public class Expense : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string ExpenseCode { get; set; } = string.Empty; // EXP-XXXX
    public string Category { get; set; } = string.Empty; // Utilities, Maintenance Supplies, F&B Raw Materials, Staff Welfare, Marketing
    public string Description { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string PaymentMode { get; set; } = "CASH_REGISTER"; // CASH_REGISTER, BANK_TRANSFER, CORPORATE_CARD
    public string PaidTo { get; set; } = string.Empty;
    public string PaidBy { get; set; } = "Finance Manager";
    public DateTime Date { get; set; } = DateTime.UtcNow;
}
