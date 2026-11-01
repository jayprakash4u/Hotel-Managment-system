namespace Hospitality.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(string userId, string username, string role, string? hotelId);
}
