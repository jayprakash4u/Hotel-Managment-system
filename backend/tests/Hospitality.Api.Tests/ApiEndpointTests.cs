using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Hospitality.Application.Common.Models;
using Xunit;
using FluentAssertions;

namespace Hospitality.Api.Tests;

public class ApiEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHotel_ShouldReturnSuccess()
    {
        var response = await _client.GetAsync("/api/hotel");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, because: $"Response body was: {body}");

        var json = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        json.Should().NotBeNull();
        json!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetRooms_ShouldReturnSuccess()
    {
        var response = await _client.GetAsync("/api/rooms");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        json.Should().NotBeNull();
        json!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetAnalytics_ShouldReturnSuccess()
    {
        var response = await _client.GetAsync("/api/analytics");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        json.Should().NotBeNull();
        json!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "non_existent_user",
            password = "wrong_password"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
