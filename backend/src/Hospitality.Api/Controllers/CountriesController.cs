using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Application.DTOs;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/countries")]
public class CountriesController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public CountriesController(HospitalityDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Gets all active countries and nationalities ordered by nationality display name.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCountries([FromQuery] string? search)
    {
        var query = _db.Countries
            .AsNoTracking()
            .Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.NationalityName.ToLower().Contains(s) ||
                c.CountryName.ToLower().Contains(s) ||
                c.CountryCode.ToLower().Contains(s)
            );
        }

        var countries = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NationalityName)
            .Select(c => new CountryDto
            {
                Id = c.Id,
                CountryCode = c.CountryCode,
                CountryName = c.CountryName,
                NationalityName = c.NationalityName,
                IsActive = c.IsActive,
                DisplayOrder = c.DisplayOrder
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(countries));
    }

    /// <summary>
    /// Gets a single country master record by ID or CountryCode.
    /// </summary>
    [HttpGet("{idOrCode}")]
    public async Task<IActionResult> GetCountry(string idOrCode)
    {
        var country = await _db.Countries
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == idOrCode || c.CountryCode.ToLower() == idOrCode.ToLower());

        if (country == null)
        {
            return NotFound(ApiResponse.Fail($"Country '{idOrCode}' not found."));
        }

        return Ok(ApiResponse.Ok(new CountryDto
        {
            Id = country.Id,
            CountryCode = country.CountryCode,
            CountryName = country.CountryName,
            NationalityName = country.NationalityName,
            IsActive = country.IsActive,
            DisplayOrder = country.DisplayOrder
        }));
    }
}
