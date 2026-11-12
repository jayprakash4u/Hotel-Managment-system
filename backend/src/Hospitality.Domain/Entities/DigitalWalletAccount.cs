namespace Hospitality.Domain.Entities;

public class DigitalWalletAccount : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string WalletProvider { get; set; } = "eSewa"; // eSewa, Khalti, IME Pay, Fonepay, Other
    public string WalletAccountName { get; set; } = string.Empty; // e.g. "eSewa Merchant Account - Dining POS"
    public string MerchantId { get; set; } = string.Empty; // e.g. "ESEWA_POS_01"
    public string? RegisteredMobileNumber { get; set; } // e.g. "9801234567"
    public string? MerchantReference { get; set; }
    public string BranchOrOutlet { get; set; } = "Main Restaurant";
    public string Currency { get; set; } = "NPR";

    public double OpeningBalance { get; set; } = 0.0;
    public DateTime OpeningBalanceDate { get; set; } = DateTime.UtcNow;
    public double CurrentBalance { get; set; } = 0.0;

    public string? SettlementBankAccountId { get; set; } // Linked to Bank Account in Accounts (e.g. 1050)
    public string? AccountId { get; set; } // Linked Chart of Account (e.g. 1070)
    public Account? Account { get; set; }

    public bool DirectBankSettlement { get; set; } = false; // If true, settlements bypass staging wallet
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

