using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/partners")]
public class BusinessPartnersController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public BusinessPartnersController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetPartners(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? status)
    {
        var query = _db.BusinessPartners.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type) && type.ToUpper() != "ALL")
        {
            query = query.Where(p => p.PartnerType.ToUpper() == type.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            query = query.Where(p => p.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(p =>
                p.PartnerName.ToLower().Contains(s) ||
                p.PartnerCode.ToLower().Contains(s) ||
                p.Phone.Contains(s) ||
                (p.ContactPerson != null && p.ContactPerson.ToLower().Contains(s)) ||
                (p.Email != null && p.Email.ToLower().Contains(s))
            );
        }

        var partners = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(ApiResponse.Ok(partners));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPartnerById(string id)
    {
        var partner = await _db.BusinessPartners
            .Include(p => p.Commissions)
            .Include(p => p.Payments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (partner == null)
        {
            return NotFound(ApiResponse.Fail("Business partner not found."));
        }

        return Ok(ApiResponse.Ok(partner));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePartner([FromBody] BusinessPartner partner)
    {
        if (string.IsNullOrWhiteSpace(partner.PartnerName))
        {
            return BadRequest(ApiResponse.Fail("Partner name is required."));
        }

        if (string.IsNullOrWhiteSpace(partner.Phone))
        {
            return BadRequest(ApiResponse.Fail("Phone number is required."));
        }

        // Generate automatic partner code if not provided
        if (string.IsNullOrWhiteSpace(partner.PartnerCode))
        {
            var prefix = partner.PartnerType?.ToUpper() switch
            {
                "TRAVEL_AGENT" => "AGT",
                "INDIVIDUAL_REFERRAL" => "REF",
                _ => "CRP"
            };

            var count = await _db.BusinessPartners.CountAsync(p => p.PartnerType == partner.PartnerType);
            partner.PartnerCode = $"{prefix}-{1001 + count}";
        }

        partner.CreatedAt = DateTime.UtcNow;
        partner.UpdatedAt = DateTime.UtcNow;

        _db.BusinessPartners.Add(partner);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(partner, "Business partner created successfully."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePartner(string id, [FromBody] BusinessPartner updated)
    {
        var existing = await _db.BusinessPartners.FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null)
        {
            return NotFound(ApiResponse.Fail("Business partner not found."));
        }

        existing.PartnerName = updated.PartnerName;
        existing.ContactPerson = updated.ContactPerson;
        existing.Designation = updated.Designation;
        existing.Phone = updated.Phone;
        existing.AlternativePhone = updated.AlternativePhone;
        existing.Email = updated.Email;
        existing.Website = updated.Website;

        existing.Country = updated.Country;
        existing.Province = updated.Province;
        existing.District = updated.District;
        existing.City = updated.City;
        existing.Address = updated.Address;

        existing.PanVatNumber = updated.PanVatNumber;
        existing.RegistrationNumber = updated.RegistrationNumber;

        existing.CompanyType = updated.CompanyType;
        existing.DefaultPaymentResponsibility = updated.DefaultPaymentResponsibility;
        existing.CreditLimit = updated.CreditLimit;
        existing.PaymentTerms = updated.PaymentTerms;
        existing.CustomPaymentTermsDays = updated.CustomPaymentTermsDays;
        existing.NegotiatedDiscountPercent = updated.NegotiatedDiscountPercent;
        existing.NegotiatedRoomRate = updated.NegotiatedRoomRate;

        existing.ReferralType = updated.ReferralType;

        existing.CommissionEnabled = updated.CommissionEnabled;
        existing.CommissionType = updated.CommissionType;
        existing.CommissionValue = updated.CommissionValue;
        existing.CommissionBasis = updated.CommissionBasis;
        existing.CommissionPaymentRule = updated.CommissionPaymentRule;

        existing.Status = updated.Status;
        existing.Notes = updated.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(existing, "Business partner updated successfully."));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(string id, [FromBody] StatusUpdateDto dto)
    {
        var partner = await _db.BusinessPartners.FirstOrDefaultAsync(p => p.Id == id);
        if (partner == null)
        {
            return NotFound(ApiResponse.Fail("Business partner not found."));
        }

        partner.Status = dto.Status.ToUpper();
        partner.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(partner, $"Partner status changed to {partner.Status}."));
    }

    [HttpGet("commissions")]
    public async Task<IActionResult> GetAllCommissions(
        [FromQuery] string? partnerId,
        [FromQuery] string? status)
    {
        var query = _db.PartnerCommissions
            .Include(c => c.Partner)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(partnerId))
        {
            query = query.Where(c => c.PartnerId == partnerId);
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            query = query.Where(c => c.Status.ToUpper() == status.ToUpper());
        }

        var commissions = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(ApiResponse.Ok(commissions));
    }

    [HttpPatch("commissions/{id}/approve")]
    public async Task<IActionResult> ApproveCommission(string id)
    {
        var comm = await _db.PartnerCommissions.FirstOrDefaultAsync(c => c.Id == id);
        if (comm == null)
        {
            return NotFound(ApiResponse.Fail("Commission record not found."));
        }

        if (comm.Status == "PAID")
        {
            return BadRequest(ApiResponse.Fail("Cannot change status of an already paid commission."));
        }

        comm.Status = "APPROVED";
        comm.ApprovedAt = DateTime.UtcNow;
        comm.ApprovedBy = "Hotel Manager";
        comm.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(comm, "Commission approved successfully."));
    }

    [HttpPost("commissions/payout")]
    public async Task<IActionResult> PayoutCommissions([FromBody] CommissionPayoutRequest request)
    {
        if (request.CommissionIds == null || request.CommissionIds.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("At least one commission must be selected for payout."));
        }

        var commissions = await _db.PartnerCommissions
            .Where(c => request.CommissionIds.Contains(c.Id) && c.Status != "PAID")
            .ToListAsync();

        if (commissions.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("No eligible unpaid commissions found for payout."));
        }

        var partnerId = commissions.First().PartnerId;
        var partner = await _db.BusinessPartners.FirstOrDefaultAsync(p => p.Id == partnerId);
        if (partner == null)
        {
            return NotFound(ApiResponse.Fail("Business partner not found."));
        }

        var totalAmount = commissions.Sum(c => c.CommissionAmount);

        // Record payout
        var payment = new PartnerCommissionPayment
        {
            HotelId = partner.HotelId,
            PartnerId = partner.Id,
            PaymentNumber = $"CPAY-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",
            PaymentDate = DateTime.UtcNow,
            Amount = totalAmount,
            PaymentMethod = request.PaymentMethod ?? "CASH",
            ReferenceNumber = request.ReferenceNumber,
            PaidBy = "Hotel Manager",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _db.PartnerCommissionPayments.Add(payment);

        foreach (var c in commissions)
        {
            c.Status = "PAID";
            c.PaidAt = DateTime.UtcNow;
            c.PaymentId = payment.Id;
            c.UpdatedAt = DateTime.UtcNow;
        }

        // Update partner aggregate numbers
        partner.TotalCommissionPaid += totalAmount;
        partner.OutstandingCommission = Math.Max(0, partner.TotalCommissionEarned - partner.TotalCommissionPaid);
        partner.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            Payment = payment,
            CommissionsPaidCount = commissions.Count,
            TotalAmount = totalAmount
        }, "Commission payout recorded successfully."));
    }
}

public class StatusUpdateDto
{
    public string Status { get; set; } = "ACTIVE";
}

public class CommissionPayoutRequest
{
    public List<string> CommissionIds { get; set; } = new();
    public string? PaymentMethod { get; set; } = "CASH";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}
