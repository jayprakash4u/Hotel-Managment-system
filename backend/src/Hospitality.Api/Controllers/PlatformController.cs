using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/platform")]
public class PlatformController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public PlatformController(HospitalityDbContext db)
    {
        _db = db;
    }

    public record PlatformLoginRequest(string Username, string Password);

    [HttpPost("auth/login")]
    public async Task<IActionResult> Login([FromBody] PlatformLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(ApiResponse.Fail("Username and password are required."));
        }

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Role == "PLATFORM_ADMIN" && u.Username.ToLower() == req.Username.Trim().ToLower());

        if (user == null)
        {
            // For development convenience: if demo platform admin credentials
            if (req.Username == "platform_admin" || req.Username == "admin")
            {
                user = new User
                {
                    Username = req.Username,
                    Name = "Platform Administrator",
                    Role = "PLATFORM_ADMIN",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                    HotelId = null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }
            else
            {
                return Unauthorized(ApiResponse.Fail("Invalid platform credentials."));
            }
        }

        bool valid = false;
        try { valid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash); } catch { valid = (req.Password == user.PasswordHash); }

        if (!valid)
        {
            return Unauthorized(ApiResponse.Fail("Invalid platform credentials."));
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            username = user.Username,
            name = user.Name
        }));
    }

    [HttpPost("auth/logout")]
    public IActionResult Logout()
    {
        return Ok(ApiResponse.Ok("Logged out successfully."));
    }

    [HttpGet("hotels")]
    public async Task<IActionResult> GetHotels()
    {
        var hotels = await _db.Hotels
            .Include(h => h.AdminUser)
            .Include(h => h.Rooms)
            .Include(h => h.Reservations)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        var result = hotels.Select(h => new
        {
            id = h.Id,
            name = h.Name,
            slug = h.Slug,
            address = h.Address,
            totalFloors = h.TotalFloors,
            currency = h.Currency,
            timezone = h.Timezone,
            status = h.Status,
            adminUser = h.AdminUser != null ? new
            {
                username = h.AdminUser.Username,
                name = h.AdminUser.Name,
                lastLoginAt = h.AdminUser.LastLoginAt
            } : null,
            _count = new
            {
                rooms = h.Rooms.Count,
                reservations = h.Reservations.Count
            },
            createdAt = h.CreatedAt
        });

        return Ok(ApiResponse.Ok(result));
    }

    public record RegisterHotelInput(
        string Name,
        string Address,
        int TotalFloors,
        string? Currency,
        string? Timezone,
        string AdminUsername,
        string AdminName,
        string? AdminPassword
    );

    [HttpPost("hotels")]
    public async Task<IActionResult> RegisterHotel([FromBody] RegisterHotelInput req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.AdminUsername))
        {
            return BadRequest(ApiResponse.Fail("Hotel name and admin username are required."));
        }

        var baseSlug = req.Name.Trim().ToLower().Replace(" ", "-").Replace("&", "and");
        var slug = baseSlug;
        var suffix = 1;
        while (await _db.Hotels.AnyAsync(h => h.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        var password = !string.IsNullOrWhiteSpace(req.AdminPassword) ? req.AdminPassword : $"Aura@{Random.Shared.Next(10000, 99999)}";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var hotel = new Hotel
        {
            Name = req.Name,
            Slug = slug,
            Address = req.Address,
            TotalFloors = req.TotalFloors > 0 ? req.TotalFloors : 1,
            Currency = req.Currency ?? "NPR",
            Timezone = req.Timezone ?? "Asia/Kathmandu",
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var adminUser = new User
        {
            Username = req.AdminUsername.Trim().ToLower(),
            Name = req.AdminName,
            PasswordHash = passwordHash,
            Role = "HOTEL_ADMIN",
            HotelId = hotel.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Hotels.Add(hotel);
        _db.Users.Add(adminUser);
        await _db.SaveChangesAsync();

        var summary = new
        {
            id = hotel.Id,
            name = hotel.Name,
            slug = hotel.Slug,
            address = hotel.Address,
            totalFloors = hotel.TotalFloors,
            currency = hotel.Currency,
            timezone = hotel.Timezone,
            status = hotel.Status,
            adminUser = new
            {
                username = adminUser.Username,
                name = adminUser.Name,
                lastLoginAt = adminUser.LastLoginAt
            },
            _count = new { rooms = 0, reservations = 0 },
            createdAt = hotel.CreatedAt
        };

        return Ok(ApiResponse.Ok(new
        {
            hotel = summary,
            credentials = new { username = adminUser.Username, password }
        }));
    }

    public record UpdateHotelStatusRequest(string Status);

    [HttpPatch("hotels/{id}")]
    public async Task<IActionResult> UpdateHotelStatus(string id, [FromBody] UpdateHotelStatusRequest req)
    {
        var hotel = await _db.Hotels.Include(h => h.AdminUser).FirstOrDefaultAsync(h => h.Id == id);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel not found."));
        }

        hotel.Status = req.Status.ToUpper();
        hotel.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            id = hotel.Id,
            name = hotel.Name,
            slug = hotel.Slug,
            address = hotel.Address,
            totalFloors = hotel.TotalFloors,
            currency = hotel.Currency,
            timezone = hotel.Timezone,
            status = hotel.Status,
            adminUser = hotel.AdminUser != null ? new
            {
                username = hotel.AdminUser.Username,
                name = hotel.AdminUser.Name,
                lastLoginAt = hotel.AdminUser.LastLoginAt
            } : null,
            createdAt = hotel.CreatedAt
        }));
    }

    [HttpPost("hotels/{id}/reset-password")]
    public async Task<IActionResult> ResetAdminPassword(string id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.HotelId == id);
        if (user == null)
        {
            return NotFound(ApiResponse.Fail("Admin user for hotel not found."));
        }

        var newPassword = $"AuraPass@{Random.Shared.Next(10000, 99999)}";
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            username = user.Username,
            password = newPassword
        }));
    }
}
