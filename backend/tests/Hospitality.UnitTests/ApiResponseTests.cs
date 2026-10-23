using Hospitality.Application.Common.Models;
using Xunit;
using FluentAssertions;

namespace Hospitality.UnitTests;

public class ApiResponseTests
{
    [Fact]
    public void Ok_WithData_ShouldReturnSuccessTrue()
    {
        var response = ApiResponse.Ok("Test payload", "Success message");

        response.Success.Should().BeTrue();
        response.Data.Should().Be("Test payload");
        response.Message.Should().Be("Success message");
        response.Error.Should().BeNull();
    }

    [Fact]
    public void Fail_WithError_ShouldReturnSuccessFalse()
    {
        var response = ApiResponse.Fail("Unauthorized access", "Operation rejected");

        response.Success.Should().BeFalse();
        response.Error.Should().Be("Unauthorized access");
        response.Message.Should().Be("Operation rejected");
        response.Data.Should().BeNull();
    }
}
