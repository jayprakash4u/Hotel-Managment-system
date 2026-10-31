# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Hospitality Management System API (.NET 8)
# Root-level Dockerfile for zero-config Render deployments
# ---------------------------------------------------------------------------

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /build

# Copy project files first for optimal layer caching
COPY backend/src/Hospitality.Api/Hospitality.Api.csproj src/Hospitality.Api/
COPY backend/src/Hospitality.Application/Hospitality.Application.csproj src/Hospitality.Application/
COPY backend/src/Hospitality.Domain/Hospitality.Domain.csproj src/Hospitality.Domain/
COPY backend/src/Hospitality.Infrastructure/Hospitality.Infrastructure.csproj src/Hospitality.Infrastructure/
COPY backend/src/Hospitality.Persistence/Hospitality.Persistence.csproj src/Hospitality.Persistence/

# Restore dependencies
RUN dotnet restore src/Hospitality.Api/Hospitality.Api.csproj

# Copy source code
COPY backend/src/ ./src/

# Publish Release build
RUN dotnet publish src/Hospitality.Api/Hospitality.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    --nologo

# =========================================================================
# Runtime Stage
# =========================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
ENV ConnectionStrings__DefaultConnection=""

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "dotnet Hospitality.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\""]
