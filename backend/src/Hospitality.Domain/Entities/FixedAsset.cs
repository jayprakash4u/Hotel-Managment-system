namespace Hospitality.Domain.Entities;

public class FixedAsset : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AssetCode { get; set; } = string.Empty; // FA-KIT-0001
    public string AssetName { get; set; } = string.Empty;

    // Category
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string Location { get; set; } = "Main Kitchen"; // Main Kitchen, Dining Hall, Bar, Front Desk, Office, Rooftop, Storage
    public string Department { get; set; } = "Kitchen";
    public string? AssignedTo { get; set; }
    public string? SerialNumber { get; set; }
    public string? Barcode { get; set; }
    public string? BranchOrOutlet { get; set; } = "Main Restaurant";

    // Purchase Information
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
    public string? SupplierName { get; set; }
    public string? SupplierInvoiceNumber { get; set; }
    public double PurchaseCost { get; set; }
    public double AdditionalCapitalizedCosts { get; set; } = 0;
    public double TotalCapitalizedCost { get; set; }

    public string AcquisitionPaymentMode { get; set; } = "BANK"; // BANK, CASH, CREDIT, OPENING_BALANCE
    public string? PaymentAccountId { get; set; }
    public string? PaymentAccountCode { get; set; }
    public string? PaymentAccountName { get; set; }
    public string? PaymentReference { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }

    // Capitalization Journal Entry
    public string? AcquisitionJournalEntryId { get; set; }
    public string? AcquisitionJournalEntryNumber { get; set; }

    // Depreciation Configuration
    public string DepreciationMethod { get; set; } = "STRAIGHT_LINE";
    public int UsefulLifeYears { get; set; } = 5;
    public int UsefulLifeMonths { get; set; } = 60;
    public double ResidualValue { get; set; } = 0;
    public double DepreciableAmount { get; set; }
    public double AnnualDepreciation { get; set; }
    public double MonthlyDepreciation { get; set; }
    public DateTime DepreciationStartDate { get; set; } = DateTime.UtcNow;
    public string DepreciationFrequency { get; set; } = "MONTHLY";

    // Live Balances
    public double AccumulatedDepreciation { get; set; } = 0;
    public double CurrentBookValue { get; set; }
    public DateTime? LastDepreciationDate { get; set; }
    public int DepreciationPeriodsPostedCount { get; set; } = 0;

    // Chart of Accounts Linkage
    public string AssetAccountId { get; set; } = string.Empty;
    public string AssetAccountCode { get; set; } = string.Empty;
    public string AssetAccountName { get; set; } = string.Empty;

    public string AccumulatedDepreciationAccountId { get; set; } = string.Empty;
    public string AccumulatedDepreciationAccountCode { get; set; } = string.Empty;
    public string AccumulatedDepreciationAccountName { get; set; } = string.Empty;

    public string DepreciationExpenseAccountId { get; set; } = string.Empty;
    public string DepreciationExpenseAccountCode { get; set; } = string.Empty;
    public string DepreciationExpenseAccountName { get; set; } = string.Empty;

    // Status: ACTIVE, FULLY_DEPRECIATED, DISPOSED, DRAFT
    public string Status { get; set; } = "ACTIVE";

    // Disposal Information (if disposed/retired)
    public DateTime? DisposalDate { get; set; }
    public string? DisposalType { get; set; } // SOLD, SCRAPPED, WRITTEN_OFF, LOST_DAMAGED
    public double DisposalAmount { get; set; } = 0; // Sale proceeds
    public string? DisposalReceivingAccountId { get; set; }
    public string? DisposalReceivingAccountCode { get; set; }
    public string? DisposalReceivingAccountName { get; set; }
    public double NetBookValueAtDisposal { get; set; } = 0;
    public double GainOrLossAmount { get; set; } = 0;
    public bool IsGain { get; set; } = false;
    public string? DisposalReason { get; set; }
    public string? DisposalReference { get; set; }
    public string? DisposalJournalEntryId { get; set; }
    public string? DisposalJournalEntryNumber { get; set; }
    public string? DisposedBy { get; set; }
    public DateTime? DisposedAt { get; set; }

    public string CreatedBy { get; set; } = "Staff";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Collections
    public List<AssetDepreciationEntry> DepreciationEntries { get; set; } = new();
    public List<AssetMovement> Movements { get; set; } = new();
}

