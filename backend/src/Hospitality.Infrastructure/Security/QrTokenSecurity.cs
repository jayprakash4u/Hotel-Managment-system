using System;
using System.Security.Cryptography;
using System.Text;

namespace Hospitality.Infrastructure.Security;

public static class QrTokenSecurity
{
    /// <summary>
    /// Generates a cryptographically strong, URL-safe random token.
    /// E.g. "qr_8f1a2c4e5b6d7e8f9a0b1c2d3e4f5a6b"
    /// </summary>
    public static string GenerateSecureToken(int byteLength = 24)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        // Clean URL-friendly hex string
        return "qr_" + Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Computes deterministic SHA-256 hash of the raw token.
    /// Only this hash is stored in the database.
    /// </summary>
    public static string HashToken(string rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) return string.Empty;
        var bytes = Encoding.UTF8.GetBytes(rawToken.Trim());
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
