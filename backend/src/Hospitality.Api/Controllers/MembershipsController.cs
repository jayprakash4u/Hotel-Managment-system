using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Application.DTOs;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/memberships")]
public class MembershipsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public MembershipsController(HospitalityDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Gets all configured membership tiers.
    /// </summary>
    [HttpGet("tiers")]
    public async Task<IActionResult> GetTiers()
    {
        var tiers = await _db.MembershipTiers
            .AsNoTracking()
            .OrderBy(t => t.DisplayOrder)
            .ThenBy(t => t.MinNights)
            .Select(t => new MembershipTierDto
            {
                Id = t.Id,
                Code = t.Code,
                Name = t.Name,
                Description = t.Description,
                MinNights = t.MinNights,
                HotelDiscountEnabled = t.HotelDiscountEnabled,
                HotelDiscountType = t.HotelDiscountType,
                HotelDiscountValue = t.HotelDiscountValue,
                HotelMaxDiscount = t.HotelMaxDiscount,
                RestaurantDiscountEnabled = t.RestaurantDiscountEnabled,
                RestaurantDiscountType = t.RestaurantDiscountType,
                RestaurantDiscountValue = t.RestaurantDiscountValue,
                RestaurantMaxDiscount = t.RestaurantMaxDiscount,
                Color = t.Color,
                BenefitsJson = t.BenefitsJson,
                IsActive = t.IsActive,
                DisplayOrder = t.DisplayOrder
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(tiers));
    }

    /// <summary>
    /// Creates or updates a membership tier.
    /// </summary>
    [HttpPost("tiers")]
    public async Task<IActionResult> CreateTier([FromBody] MembershipTierDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(ApiResponse.Fail("Tier Name and Code are required."));
        }

        var codeUpper = dto.Code.Trim().ToUpper();
        var exists = await _db.MembershipTiers.AnyAsync(t => t.Code == codeUpper);
        if (exists)
        {
            return BadRequest(ApiResponse.Fail($"Membership tier with code '{codeUpper}' already exists."));
        }

        var tier = new MembershipTier
        {
            Id = Guid.NewGuid().ToString("N"),
            Code = codeUpper,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            MinNights = Math.Max(0, dto.MinNights),
            HotelDiscountEnabled = dto.HotelDiscountEnabled,
            HotelDiscountType = dto.HotelDiscountType?.ToUpper() == "FIXED" ? "FIXED" : "PERCENTAGE",
            HotelDiscountValue = Math.Max(0, dto.HotelDiscountValue),
            HotelMaxDiscount = dto.HotelMaxDiscount,
            RestaurantDiscountEnabled = dto.RestaurantDiscountEnabled,
            RestaurantDiscountType = dto.RestaurantDiscountType?.ToUpper() == "FIXED" ? "FIXED" : "PERCENTAGE",
            RestaurantDiscountValue = Math.Max(0, dto.RestaurantDiscountValue),
            RestaurantMaxDiscount = dto.RestaurantMaxDiscount,
            Color = dto.Color ?? "#64748B",
            BenefitsJson = dto.BenefitsJson ?? "[]",
            IsActive = dto.IsActive,
            DisplayOrder = dto.DisplayOrder > 0 ? dto.DisplayOrder : 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.MembershipTiers.Add(tier);
        await _db.SaveChangesAsync();

        dto.Id = tier.Id;
        return Ok(ApiResponse.Ok(dto, "Membership tier created successfully."));
    }

    /// <summary>
    /// Updates an existing membership tier configuration.
    /// </summary>
    [HttpPut("tiers/{id}")]
    public async Task<IActionResult> UpdateTier(string id, [FromBody] MembershipTierDto dto)
    {
        var tier = await _db.MembershipTiers.FirstOrDefaultAsync(t => t.Id == id);
        if (tier == null)
        {
            return NotFound(ApiResponse.Fail("Membership tier not found."));
        }

        tier.Name = dto.Name.Trim();
        tier.Description = dto.Description?.Trim() ?? string.Empty;
        tier.MinNights = Math.Max(0, dto.MinNights);
        tier.HotelDiscountEnabled = dto.HotelDiscountEnabled;
        tier.HotelDiscountType = dto.HotelDiscountType?.ToUpper() == "FIXED" ? "FIXED" : "PERCENTAGE";
        tier.HotelDiscountValue = Math.Max(0, dto.HotelDiscountValue);
        tier.HotelMaxDiscount = dto.HotelMaxDiscount;
        tier.RestaurantDiscountEnabled = dto.RestaurantDiscountEnabled;
        tier.RestaurantDiscountType = dto.RestaurantDiscountType?.ToUpper() == "FIXED" ? "FIXED" : "PERCENTAGE";
        tier.RestaurantDiscountValue = Math.Max(0, dto.RestaurantDiscountValue);
        tier.RestaurantMaxDiscount = dto.RestaurantMaxDiscount;
        tier.Color = dto.Color ?? tier.Color;
        tier.BenefitsJson = dto.BenefitsJson ?? tier.BenefitsJson;
        tier.IsActive = dto.IsActive;
        tier.DisplayOrder = dto.DisplayOrder;
        tier.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(dto, "Membership tier updated successfully."));
    }

    /// <summary>
    /// Gets a guest's membership profile including tier progress and history.
    /// </summary>
    [HttpGet("guest/{guestIdOrNumber}")]
    public async Task<IActionResult> GetGuestMembership(string guestIdOrNumber)
    {
        var clean = guestIdOrNumber.Trim().ToLower();
        var mem = await _db.GuestMemberships
            .Include(m => m.CurrentTier)
            .Include(m => m.Guest)
            .Include(m => m.History)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.GuestId.ToLower() == clean || m.MembershipNumber.ToLower() == clean);

        if (mem == null)
        {
            // If guest exists but has no membership record, auto-enroll them now!
            var guest = await _db.Guests.FirstOrDefaultAsync(g => g.Id.ToLower() == clean);
            if (guest != null)
            {
                var regularTier = await _db.MembershipTiers.FirstOrDefaultAsync(t => t.Code == "REGULAR")
                                  ?? await _db.MembershipTiers.OrderBy(t => t.MinNights).FirstOrDefaultAsync();

                if (regularTier != null)
                {
                    var count = await _db.GuestMemberships.CountAsync();
                    var newMem = new GuestMembership
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        GuestId = guest.Id,
                        MembershipNumber = $"MEM-{10001 + count}",
                        CurrentTierId = regularTier.Id,
                        Status = "ACTIVE",
                        MemberSince = guest.CreatedAt,
                        LifetimeCompletedStays = 0,
                        LifetimeCompletedNights = 0,
                        QualifyingNights = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.GuestMemberships.Add(newMem);
                    _db.MembershipHistories.Add(new MembershipHistory
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        GuestMembershipId = newMem.Id,
                        OldTierName = "None",
                        NewTierName = regularTier.Name,
                        QualifyingNights = 0,
                        Reason = "Automatic enrollment upon profile inspection",
                        PerformedBy = "System",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _db.SaveChangesAsync();

                    mem = await _db.GuestMemberships
                        .Include(m => m.CurrentTier)
                        .Include(m => m.Guest)
                        .Include(m => m.History)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.Id == newMem.Id);
                }
            }
        }

        if (mem == null)
        {
            return NotFound(ApiResponse.Fail("Membership record not found."));
        }

        var allTiers = await _db.MembershipTiers
            .Where(t => t.IsActive)
            .OrderBy(t => t.MinNights)
            .ToListAsync();

        var currentTier = mem.CurrentTier ?? allTiers.FirstOrDefault() ?? new MembershipTier();
        var currentTierIndex = allTiers.FindIndex(t => t.Id == currentTier.Id);
        MembershipTier? nextTier = (currentTierIndex >= 0 && currentTierIndex < allTiers.Count - 1)
            ? allTiers[currentTierIndex + 1]
            : null;

        int nightsNeeded = nextTier != null ? Math.Max(0, nextTier.MinNights - mem.QualifyingNights) : 0;
        int progressPercent = 100;
        if (nextTier != null)
        {
            int span = nextTier.MinNights - currentTier.MinNights;
            int earned = Math.Max(0, mem.QualifyingNights - currentTier.MinNights);
            progressPercent = span > 0 ? Math.Min(100, (int)Math.Round((double)earned / span * 100)) : 100;
        }

        var result = new GuestMembershipDto
        {
            Id = mem.Id,
            GuestId = mem.GuestId,
            GuestName = mem.Guest != null ? $"{mem.Guest.FirstName} {mem.Guest.LastName}".Trim() : string.Empty,
            MembershipNumber = mem.MembershipNumber,
            Status = mem.Status,
            MemberSince = mem.MemberSince,
            LifetimeCompletedStays = mem.LifetimeCompletedStays,
            LifetimeCompletedNights = mem.LifetimeCompletedNights,
            QualifyingNights = mem.QualifyingNights,
            NightsNeededForNext = nightsNeeded,
            ProgressPercent = progressPercent,
            CurrentTier = new MembershipTierDto
            {
                Id = currentTier.Id,
                Code = currentTier.Code,
                Name = currentTier.Name,
                Description = currentTier.Description,
                MinNights = currentTier.MinNights,
                HotelDiscountEnabled = currentTier.HotelDiscountEnabled,
                HotelDiscountType = currentTier.HotelDiscountType,
                HotelDiscountValue = currentTier.HotelDiscountValue,
                HotelMaxDiscount = currentTier.HotelMaxDiscount,
                RestaurantDiscountEnabled = currentTier.RestaurantDiscountEnabled,
                RestaurantDiscountType = currentTier.RestaurantDiscountType,
                RestaurantDiscountValue = currentTier.RestaurantDiscountValue,
                RestaurantMaxDiscount = currentTier.RestaurantMaxDiscount,
                Color = currentTier.Color,
                BenefitsJson = currentTier.BenefitsJson,
                IsActive = currentTier.IsActive,
                DisplayOrder = currentTier.DisplayOrder
            },
            NextTier = nextTier != null ? new MembershipTierDto
            {
                Id = nextTier.Id,
                Code = nextTier.Code,
                Name = nextTier.Name,
                Description = nextTier.Description,
                MinNights = nextTier.MinNights,
                HotelDiscountEnabled = nextTier.HotelDiscountEnabled,
                HotelDiscountType = nextTier.HotelDiscountType,
                HotelDiscountValue = nextTier.HotelDiscountValue,
                RestaurantDiscountEnabled = nextTier.RestaurantDiscountEnabled,
                RestaurantDiscountType = nextTier.RestaurantDiscountType,
                RestaurantDiscountValue = nextTier.RestaurantDiscountValue,
                Color = nextTier.Color,
                BenefitsJson = nextTier.BenefitsJson,
                IsActive = nextTier.IsActive,
                DisplayOrder = nextTier.DisplayOrder
            } : null,
            History = mem.History
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new MembershipHistoryDto
                {
                    Id = h.Id,
                    OldTierName = h.OldTierName,
                    NewTierName = h.NewTierName,
                    QualifyingNights = h.QualifyingNights,
                    Reason = h.Reason,
                    PerformedBy = h.PerformedBy,
                    CreatedAt = h.CreatedAt
                })
                .ToList()
        };

        return Ok(ApiResponse.Ok(result));
    }

    /// <summary>
    /// Server-side validation and calculation of membership discount.
    /// Crucial Rule: Manual application required via billing checkbox.
    /// </summary>
    [HttpPost("calculate-discount")]
    public async Task<IActionResult> CalculateDiscount([FromBody] CalculateDiscountRequest req)
    {
        if (req.EligibleSubtotal <= 0)
        {
            return Ok(ApiResponse.Ok(new CalculateDiscountResult
            {
                IsEligible = false,
                Message = "Subtotal must be greater than zero."
            }));
        }

        var memQuery = _db.GuestMemberships
            .Include(m => m.CurrentTier)
            .AsNoTracking();

        GuestMembership? mem = null;
        if (!string.IsNullOrWhiteSpace(req.GuestId))
        {
            mem = await memQuery.FirstOrDefaultAsync(m => m.GuestId == req.GuestId && m.Status == "ACTIVE");
        }
        else if (!string.IsNullOrWhiteSpace(req.MembershipNumber))
        {
            mem = await memQuery.FirstOrDefaultAsync(m => m.MembershipNumber == req.MembershipNumber && m.Status == "ACTIVE");
        }

        if (mem == null || mem.CurrentTier == null || !mem.CurrentTier.IsActive)
        {
            return Ok(ApiResponse.Ok(new CalculateDiscountResult
            {
                IsEligible = false,
                Message = "Guest does not have an active membership."
            }));
        }

        var tier = mem.CurrentTier;
        bool isHotel = string.Equals(req.Module, "HOTEL", StringComparison.OrdinalIgnoreCase);

        bool isDiscountEnabled = isHotel ? tier.HotelDiscountEnabled : tier.RestaurantDiscountEnabled;
        string discountType = isHotel ? tier.HotelDiscountType : tier.RestaurantDiscountType;
        double discountValue = isHotel ? tier.HotelDiscountValue : tier.RestaurantDiscountValue;
        double? maxDiscount = isHotel ? tier.HotelMaxDiscount : tier.RestaurantMaxDiscount;

        if (!isDiscountEnabled || discountValue <= 0)
        {
            return Ok(ApiResponse.Ok(new CalculateDiscountResult
            {
                IsEligible = false,
                MembershipNumber = mem.MembershipNumber,
                TierName = tier.Name,
                Message = $"{tier.Name} is not configured with an active {req.Module.ToLower()} discount."
            }));
        }

        double calculatedAmount = 0;
        if (discountType.Equals("FIXED", StringComparison.OrdinalIgnoreCase))
        {
            calculatedAmount = Math.Min(req.EligibleSubtotal, discountValue);
        }
        else
        {
            calculatedAmount = Math.Round(req.EligibleSubtotal * (discountValue / 100.0), 2);
        }

        if (maxDiscount.HasValue && maxDiscount.Value > 0)
        {
            calculatedAmount = Math.Min(calculatedAmount, maxDiscount.Value);
        }

        calculatedAmount = Math.Max(0, Math.Min(req.EligibleSubtotal, calculatedAmount));

        return Ok(ApiResponse.Ok(new CalculateDiscountResult
        {
            IsEligible = true,
            MembershipNumber = mem.MembershipNumber,
            TierName = tier.Name,
            DiscountType = discountType,
            DiscountValue = discountValue,
            CalculatedDiscountAmount = calculatedAmount,
            SubtotalAfterDiscount = Math.Max(0, req.EligibleSubtotal - calculatedAmount),
            Message = $"{tier.Name} discount of {(discountType == "FIXED" ? $"Rs. {discountValue}" : $"{discountValue}%")} applied."
        }));
    }

    /// <summary>
    /// Records a membership discount application for permanent invoice records & audit logs.
    /// </summary>
    [HttpPost("apply-discount")]
    public async Task<IActionResult> RecordDiscountApplication([FromBody] RecordDiscountApplicationDto dto)
    {
        var application = new MembershipDiscountApplication
        {
            Id = Guid.NewGuid().ToString("N"),
            BillId = dto.BillId,
            InvoiceNumber = dto.InvoiceNumber,
            ReservationId = dto.ReservationId,
            OrderId = dto.OrderId,
            GuestId = dto.GuestId,
            MembershipNumber = dto.MembershipNumber,
            TierName = dto.TierName,
            Module = dto.Module?.ToUpper() == "RESTAURANT" ? "RESTAURANT" : "HOTEL",
            DiscountType = dto.DiscountType?.ToUpper() == "FIXED" ? "FIXED" : "PERCENTAGE",
            DiscountValue = dto.DiscountValue,
            ActualDiscountAmount = dto.ActualDiscountAmount,
            SubtotalBeforeDiscount = dto.SubtotalBeforeDiscount,
            EligibleItemsSummary = dto.EligibleItemsSummary,
            AppliedBy = dto.AppliedBy ?? "Staff",
            AppliedAt = DateTime.UtcNow
        };

        _db.MembershipDiscountApplications.Add(application);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(application, "Membership discount application recorded."));
    }

    /// <summary>
    /// Recalculates guest qualifying nights and triggers automatic tier upgrades upon checkout.
    /// </summary>
    [HttpPost("recalculate/{guestId}")]
    public async Task<IActionResult> RecalculateAndUpgrade(string guestId)
    {
        var mem = await _db.GuestMemberships
            .Include(m => m.CurrentTier)
            .FirstOrDefaultAsync(m => m.GuestId == guestId);

        if (mem == null)
        {
            return NotFound(ApiResponse.Fail("Membership not found for guest."));
        }

        // Tally completed reservations ONLY (Checked out, no cancellations or no-shows)
        var completedReservations = await _db.Reservations
            .Where(r => r.GuestId == guestId && r.Status == "CHECKED_OUT")
            .ToListAsync();

        int completedStays = completedReservations.Count;
        int completedNights = 0;
        foreach (var r in completedReservations)
        {
            var nights = (int)Math.Max(1, (r.CheckOut - r.CheckIn).TotalDays);
            completedNights += nights;
        }

        mem.LifetimeCompletedStays = completedStays;
        mem.LifetimeCompletedNights = completedNights;
        mem.QualifyingNights = completedNights;
        mem.UpdatedAt = DateTime.UtcNow;

        var allTiers = await _db.MembershipTiers
            .Where(t => t.IsActive)
            .OrderByDescending(t => t.MinNights)
            .ToListAsync();

        var eligibleTier = allTiers.FirstOrDefault(t => completedNights >= t.MinNights)
                           ?? allTiers.LastOrDefault();

        bool wasUpgraded = false;
        string oldTierName = mem.CurrentTier?.Name ?? "Regular Member";

        if (eligibleTier != null && eligibleTier.Id != mem.CurrentTierId)
        {
            mem.CurrentTierId = eligibleTier.Id;
            mem.LastUpgradedAt = DateTime.UtcNow;
            wasUpgraded = true;

            _db.MembershipHistories.Add(new MembershipHistory
            {
                Id = Guid.NewGuid().ToString("N"),
                GuestMembershipId = mem.Id,
                OldTierName = oldTierName,
                NewTierName = eligibleTier.Name,
                QualifyingNights = completedNights,
                Reason = $"Automatic checkout qualification upgrade ({completedNights} qualifying nights reached)",
                PerformedBy = "System / Checkout",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            WasUpgraded = wasUpgraded,
            OldTier = oldTierName,
            NewTier = eligibleTier?.Name ?? oldTierName,
            CompletedStays = completedStays,
            CompletedNights = completedNights,
            QualifyingNights = completedNights
        }, wasUpgraded ? "Guest upgraded to higher membership tier!" : "Guest membership nights reconciled."));
    }

    private static MembershipEligibilitySettingsDto _eligibilitySettings = new();

    /// <summary>
    /// Gets membership discount eligibility and stacking rules.
    /// </summary>
    [HttpGet("eligibility-settings")]
    public IActionResult GetEligibilitySettings()
    {
        return Ok(ApiResponse.Ok(_eligibilitySettings));
    }

    /// <summary>
    /// Updates membership discount eligibility and stacking rules.
    /// </summary>
    [HttpPost("eligibility-settings")]
    public IActionResult UpdateEligibilitySettings([FromBody] MembershipEligibilitySettingsDto dto)
    {
        _eligibilitySettings = dto;
        return Ok(ApiResponse.Ok(_eligibilitySettings, "Membership discount eligibility & stacking settings updated."));
    }

    /// <summary>
    /// Evaluates eligibility and computes stacked reservation discounts across channels.
    /// </summary>
    [HttpPost("calculate-reservation-discount")]
    public async Task<IActionResult> CalculateReservationDiscount([FromBody] CalculateReservationDiscountRequest req)
    {
        string tierCode = req.MembershipTierCode?.ToUpper() ?? "REGULAR";
        var tier = await _db.MembershipTiers
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Code == tierCode && t.IsActive);

        double tierDiscountPercent = 0;
        string tierName = tier?.Name ?? tierCode;
        if (tier != null && tier.HotelDiscountEnabled)
        {
            tierDiscountPercent = tier.HotelDiscountValue;
        }
        else
        {
            if (tierCode.Contains("PLATINUM")) tierDiscountPercent = 15;
            else if (tierCode.Contains("GOLD")) tierDiscountPercent = 10;
            else if (tierCode.Contains("SILVER")) tierDiscountPercent = 5;
        }

        bool isGuestEligible = tierDiscountPercent > 0;

        bool isAllowedBySource = req.BookingSource switch
        {
            "DIRECT_WALKIN" => _eligibilitySettings.AllowDirectWalkin,
            "CORPORATE" => _eligibilitySettings.AllowCorporate,
            "TRAVEL_AGENT" => _eligibilitySettings.AllowTravelAgent,
            "INDIVIDUAL_REFERRAL" => _eligibilitySettings.AllowIndividualReferral,
            _ => _eligibilitySettings.AllowDirectWalkin
        };

        bool isAllowedByStacking = true;
        string? stackingReason = null;
        if (req.BookingSource == "CORPORATE")
        {
            if (req.CorporateDiscountPercent > 0 && !_eligibilitySettings.AllowStackWithCorporateDiscount)
            {
                isAllowedByStacking = false;
                stackingReason = "Membership discount cannot be combined with Corporate negotiated discount.";
            }
            else if (req.HasCorporateRate && !_eligibilitySettings.AllowStackWithCorporateRate)
            {
                isAllowedByStacking = false;
                stackingReason = "Membership discount cannot be combined with Corporate negotiated room rates.";
            }
        }

        if (req.ManualDiscountAmount > 0 && !_eligibilitySettings.AllowStackWithOtherPromotions)
        {
            isAllowedByStacking = false;
            stackingReason = "Membership discount cannot be combined with promotional/manual discounts.";
        }

        string? ineligibilityReason = null;
        if (!isGuestEligible) ineligibilityReason = $"Guest membership ({tierName}) has no room discount configured.";
        else if (!isAllowedBySource) ineligibilityReason = $"Membership discounts are disabled for {req.BookingSource} bookings in Hotel Policy.";
        else if (!isAllowedByStacking) ineligibilityReason = stackingReason;
        else if (req.Subtotal <= 0) ineligibilityReason = "Subtotal must be greater than zero.";

        bool canApply = isGuestEligible && isAllowedBySource && isAllowedByStacking && req.Subtotal > 0;

        double corpDiscountAmount = req.CorporateDiscountPercent > 0
            ? Math.Round(req.Subtotal * (req.CorporateDiscountPercent / 100.0), 2)
            : 0;

        double membershipBasis = (corpDiscountAmount > 0 && _eligibilitySettings.AllowStackWithCorporateDiscount)
            ? Math.Max(0, req.Subtotal - corpDiscountAmount)
            : req.Subtotal;

        double membershipDiscountAmount = (canApply && req.ApplyMembershipDiscount && tierDiscountPercent > 0)
            ? Math.Round(membershipBasis * (tierDiscountPercent / 100.0), 2)
            : 0;

        double totalDiscount = Math.Min(req.Subtotal, corpDiscountAmount + membershipDiscountAmount + req.ManualDiscountAmount);
        double netRoomCharges = Math.Max(0, req.Subtotal - totalDiscount);

        return Ok(ApiResponse.Ok(new CalculateReservationDiscountResponse
        {
            IsAllowedByBookingSource = isAllowedBySource,
            IsAllowedByStacking = isAllowedByStacking,
            IsGuestEligible = isGuestEligible,
            CanApply = canApply,
            IneligibilityReason = ineligibilityReason,
            TierDiscountPercent = tierDiscountPercent,
            TierName = tierName,
            CorporateDiscountAmount = corpDiscountAmount,
            MembershipDiscountAmount = membershipDiscountAmount,
            ManualDiscountAmount = req.ManualDiscountAmount,
            TotalDiscountAmount = totalDiscount,
            NetRoomCharges = netRoomCharges
        }));
    }
}
