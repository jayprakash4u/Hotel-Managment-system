namespace Hospitality.Domain.Entities;

public class AccountMapping : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string TransactionType { get; set; } = string.Empty; // POS_CASH_SALE, POS_BANK_SALE, POS_CREDIT_SALE, ROOM_REVENUE, INVENTORY_PURCHASE_CASH, INVENTORY_PURCHASE_CREDIT, EXPENSE_PAYMENT, PAYROLL
    public string TransactionCategory { get; set; } = "OPERATIONAL"; // POS, HOTEL, INVENTORY, PAYROLL, EXPENSE
    
    public string DebitAccountId { get; set; } = string.Empty;
    public Account? DebitAccount { get; set; }

    public string CreditAccountId { get; set; } = string.Empty;
    public Account? CreditAccount { get; set; }

    public string? TaxAccountId { get; set; }
    public Account? TaxAccount { get; set; }

    public string? ServiceChargeAccountId { get; set; }
    public Account? ServiceChargeAccount { get; set; }

    public string? DiscountAccountId { get; set; }
    public Account? DiscountAccount { get; set; }

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

