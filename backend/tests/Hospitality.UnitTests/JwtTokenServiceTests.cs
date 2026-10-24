using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Hospitality.Infrastructure.Services;
using Xunit;
using FluentAssertions;
using Moq;

namespace Hospitality.UnitTests;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _service;

    public JwtTokenServiceTests()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Jwt:Key"]).Returns("GrandHospitalitySuperSecretKey2026!ForDevelopmentOnlyMustBeLongEnough");
        configMock.Setup(c => c["Jwt:Issuer"]).Returns("HospitalityApi");
        configMock.Setup(c => c["Jwt:Audience"]).Returns("HospitalityClient");

        _service = new JwtTokenService(configMock.Object);
    }

    [Fact]
    public void GenerateToken_ShouldReturnValidJwtWithCorrectClaims()
    {
        var userId = "user-123";
        var username = "alexander";
        var role = "HOTEL_ADMIN";
        var hotelId = "hotel-456";

        var tokenString = _service.GenerateToken(userId, username, role, hotelId);

        tokenString.Should().NotBeNullOrWhiteSpace();

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(tokenString);

        token.Issuer.Should().Be("HospitalityApi");
        token.Audiences.Should().Contain("HospitalityClient");

        var claims = token.Claims;
        claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == userId);
        claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == username);
        claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == role);
        claims.Should().Contain(c => c.Type == "hotelId" && c.Value == hotelId);
    }
}
