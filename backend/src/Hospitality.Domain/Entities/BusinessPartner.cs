namespace Hospitality.Domain.Entities;

public class BusinessPartner : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string PartnerCode { get; set; } = string.Empty; // e.g. CRP-1001, AGT-2001, REF-3001
    public string PartnerType { get; set; } = "CORPORATE"; // CORPORATE, TRAVEL_AGENT, INDIVIDUAL_REFERRAL
    public string PartnerName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Designation { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? AlternativePhone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    // Address
    public string Country { get; set; } = "Nepal";
    public string? Province { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }

    // Legal / Tax
    public string? PanVatNumber { get; set; }
    public string? RegistrationNumber { get; set; }

    // Corporate Specific
    public string? CompanyType { get; set; } // Private Limited, Public Limited, Government, NGO/INGO, Other
    public string DefaultBillingArrangement { get; set; } = "COMPANY_ACCOUNT"; // COMPANY_ACCOUNT, GUEST_DIRECT, SPLIT_BILLING
    public string DefaultPaymentResponsibility { get; set; } = "COMPANY_PAYS"; // COMPANY_PAYS, GUEST_PAYS, SPLIT
    public double CreditLimit { get; set; } = 0;
    public string PaymentTerms { get; set; } = "NET_30"; // IMMEDIATE, NET_7, NET_15, NET_30, CUSTOM
    public int CustomPaymentTermsDays { get; set; } = 0;
    public double NegotiatedDiscountPercent { get; set; } = 0;
    public double NegotiatedRoomRate { get; set; } = 0;

    // Referral Specific
    public string? ReferralType { get; set; } // LOCAL_INDIVIDUAL, TOURIST_GUIDE, TAXI_DRIVER, FREELANCE_AGENT, OTHER

    // Commission Settings (Travel Agents & Individual Referrals)
    public bool CommissionEnabled { get; set; } = false;
    public string CommissionType { get; set; } = "PERCENTAGE"; // PERCENTAGE, FIXED_PER_BOOKING, FIXED_PER_ROOM_NIGHT
    public double CommissionValue { get; set; } = 0;
    public string CommissionBasis { get; set; } = "ROOM_CHARGES"; // ROOM_CHARGES, TOTAL_RESERVATION_CHARGES
    public string CommissionPaymentRule { get; set; } = "AFTER_CHECKOUT"; // AFTER_CHECKOUT, AFTER_FULL_PAYMENT, MANUAL_APPROVAL

    // Financial Tracking Aggregations
    public int TotalBookings { get; set; } = 0;
    public double TotalCommissionEarned { get; set; } = 0;
    public double TotalCommissionPaid { get; set; } = 0;
    public double OutstandingCommission { get; set; } = 0;
    public double CorporateReceivableBalance { get; set; } = 0;

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PartnerCommission> Commissions { get; set; } = new List<PartnerCommission>();
    public ICollection<PartnerCommissionPayment> Payments { get; set; } = new List<PartnerCommissionPayment>();
}
