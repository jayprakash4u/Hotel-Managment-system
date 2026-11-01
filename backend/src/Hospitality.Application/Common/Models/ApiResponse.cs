namespace Hospitality.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null)
    {
        return new ApiResponse<T> { Success = true, Data = data, Message = message };
    }

    public static ApiResponse<T> Fail(string error, string? message = null)
    {
        return new ApiResponse<T> { Success = false, Error = error, Message = message };
    }
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok(string? message = null)
    {
        return new ApiResponse { Success = true, Message = message };
    }

    public static new ApiResponse Fail(string error, string? message = null)
    {
        return new ApiResponse { Success = false, Error = error, Message = message };
    }
}
