using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/guests")]
public class GuestsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public GuestsController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetGuests([FromQuery] string? search, [FromQuery] string? vipTier)
    {
        var query = _db.Guests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(vipTier))
        {
            query = query.Where(g => g.VipTier.ToUpper() == vipTier.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g =>
                g.FirstName.ToLower().Contains(s) ||
                g.LastName.ToLower().Contains(s) ||
                g.Email.ToLower().Contains(s) ||
                g.Phone.Contains(s) ||
                g.IdNumber.ToLower().Contains(s)
            );
        }

        var guests = await query.OrderBy(g => g.FirstName).ToListAsync();
        return Ok(ApiResponse.Ok(guests));
    }

    [HttpPost]
    public async Task<IActionResult> CreateGuest([FromBody] Guest guest)
    {
        if (string.IsNullOrWhiteSpace(guest.FirstName))
        {
            return BadRequest(ApiResponse.Fail("First name is required."));
        }

        // Validate Country / Nationality master relationship
        if (!string.IsNullOrWhiteSpace(guest.CountryId))
        {
            var country = await _db.Countries.FirstOrDefaultAsync(c => c.Id == guest.CountryId && c.IsActive);
            if (country == null)
            {
                return BadRequest(ApiResponse.Fail("Selected nationality or country master record is invalid or inactive."));
            }
            guest.CountryId = country.Id;
            guest.Nationality = country.NationalityName;
            guest.Country = country.CountryName;
        }
        else if (!string.IsNullOrWhiteSpace(guest.Country))
        {
            // Attempt to resolve country by name or code
            var country = await _db.Countries.FirstOrDefaultAsync(c =>
                c.IsActive &&
                (c.CountryName.ToLower() == guest.Country.Trim().ToLower() ||
                 c.NationalityName.ToLower() == guest.Country.Trim().ToLower() ||
                 c.CountryCode.ToLower() == guest.Country.Trim().ToLower()));

            if (country != null)
            {
                guest.CountryId = country.Id;
                guest.Nationality = country.NationalityName;
                guest.Country = country.CountryName;
            }
        }

        // Check if guest already exists by phone
        if (!string.IsNullOrWhiteSpace(guest.Phone))
        {
            var cleanPhone = guest.Phone.Trim();
            var existingGuest = await _db.Guests
                .Include(g => g.Membership)
                    .ThenInclude(m => m!.CurrentTier)
                .FirstOrDefaultAsync(g => g.Phone == cleanPhone);

            if (existingGuest != null)
            {
                return Ok(ApiResponse.Ok(existingGuest, "Existing guest profile found and used."));
            }
        }

        if (string.IsNullOrEmpty(guest.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            guest.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        guest.CreatedAt = DateTime.UtcNow;
        guest.UpdatedAt = DateTime.UtcNow;

        _db.Guests.Add(guest);
        await _db.SaveChangesAsync();

        // Automatic Membership Creation for New Guests (Default: Regular Member)
        var regularTier = await _db.MembershipTiers.FirstOrDefaultAsync(t => t.Code == "REGULAR")
                          ?? await _db.MembershipTiers.OrderBy(t => t.MinNights).FirstOrDefaultAsync();

        if (regularTier != null)
        {
            var totalMemberships = await _db.GuestMemberships.CountAsync();
            var newMem = new GuestMembership
            {
                Id = Guid.NewGuid().ToString("N"),
                GuestId = guest.Id,
                MembershipNumber = $"MEM-{10001 + totalMemberships}",
                CurrentTierId = regularTier.Id,
                Status = "ACTIVE",
                MemberSince = DateTime.UtcNow,
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
                Reason = "Automatic membership creation for newly registered guest",
                PerformedBy = "System",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            guest.Membership = newMem;
        }

        return Ok(ApiResponse.Ok(guest, "Guest created successfully and enrolled into membership."));
    }
}
