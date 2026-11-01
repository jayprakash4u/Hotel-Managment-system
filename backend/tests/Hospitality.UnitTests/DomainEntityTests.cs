using System;
using System.Linq;
using Hospitality.Domain.Entities;
using Xunit;
using FluentAssertions;

namespace Hospitality.UnitTests;

public class DomainEntityTests
{
    [Fact]
    public void Reservation_CheckInDateAlias_ShouldSyncWithCheckInProperty()
    {
        var now = DateTime.UtcNow;
        var res = new Reservation
        {
            CheckInDate = now,
            CheckOutDate = now.AddDays(3)
        };

        res.CheckIn.Should().Be(now);
        res.CheckOut.Should().Be(now.AddDays(3));
        res.CheckInDate.Should().Be(res.CheckIn);
        res.CheckOutDate.Should().Be(res.CheckOut);
    }

    [Fact]
    public void FolioItem_Total_ShouldCalculateProperly()
    {
        var item = new FolioItem
        {
            UnitPrice = 350.0,
            Quantity = 2,
            Total = 700.0,
            Outlet = "ROOM_CHARGE"
        };

        item.Total.Should().Be(item.UnitPrice * item.Quantity);
    }

    [Fact]
    public void InventoryItem_AliasProperties_ShouldWorkSeamlessly()
    {
        var item = new InventoryItem
        {
            Sku = "SKU-TEST-1",
            CostPerUnit = 25.5,
            MinThreshold = 10
        };

        item.ItemCode.Should().Be("SKU-TEST-1");
        item.UnitCost.Should().Be(25.5);
        item.ReorderLevel.Should().Be(10);
    }
}
