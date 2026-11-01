using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

namespace Hospitality.Api.Common;

/// <summary>
/// A robust JSON output formatter that serializes directly to the Response.Body stream.
/// This prevents PipeWriter incompatibility issues with TestHost in modern .NET runtimes.
/// </summary>
public class SafeJsonOutputFormatter : TextOutputFormatter
{
    private readonly JsonSerializerOptions _options;

    public SafeJsonOutputFormatter(JsonSerializerOptions options)
    {
        _options = options;
        SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("application/json"));
        SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("text/json"));
        SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("application/*+json"));
        SupportedEncodings.Add(Encoding.UTF8);
        SupportedEncodings.Add(Encoding.Unicode);
    }

    public override async Task WriteResponseBodyAsync(OutputFormatterWriteContext context, Encoding selectedEncoding)
    {
        var response = context.HttpContext.Response;
        var value = context.Object;
        var objectType = context.ObjectType ?? value?.GetType() ?? typeof(object);
        await JsonSerializer.SerializeAsync(response.Body, value, objectType, _options, context.HttpContext.RequestAborted);
    }
}
