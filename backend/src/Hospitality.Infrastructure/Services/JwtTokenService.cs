using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Hospitality.Application.Interfaces;

namespace Hospitality.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(string userId, string username, string role, string? hotelId)
    {
        var secret = _configuration["Jwt:Key"] ?? "GrandHospitalitySuperSecretKey2026!ForDevelopmentOnlyMustBeLongEnough";
        var issuer = _configuration["Jwt:Issuer"] ?? "HospitalityApi";
        var audience = _configuration["Jwt:Audience"] ?? "HospitalityClient";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Role, role),
            new("userId", userId),
            new("username", username),
            new("role", role)
        };

        if (!string.IsNullOrEmpty(hotelId))
        {
            claims.Add(new Claim("hotelId", hotelId));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
