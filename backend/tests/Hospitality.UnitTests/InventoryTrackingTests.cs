using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Hospitality.Domain.Entities;
using Xunit;
using FluentAssertions;

namespace Hospitality.UnitTests;

public class InventoryTrackingTests
{
    private class ParsedItemLine
    {
        public string? ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public double Quantity { get; set; }
        public string? PurchaseUnit { get; set; }
        public string? StockUnit { get; set; }
        public double ConversionFactor { get; set; } = 1.0;
        public double TotalCost { get; set; }
        public double UnitCost { get; set; }
        public bool? TrackStock { get; set; }
    }

    private static List<ParsedItemLine> ParsePurchaseOrderItems(string? itemsJson)
    {
        var list = new List<ParsedItemLine>();
        if (string.IsNullOrWhiteSpace(itemsJson)) return list;

        using var doc = JsonDocument.Parse(itemsJson);
        foreach (var el in doc.RootElement.EnumerateArray())
        {
            var line = new ParsedItemLine();
            if (el.TryGetProperty("itemId", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                line.ItemId = idProp.GetString();
            if (el.TryGetProperty("itemName", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                line.ItemName = nameProp.GetString() ?? "";
            if (el.TryGetProperty("quantity", out var qProp) && qProp.TryGetDouble(out var q))
                line.Quantity = q;
            if (el.TryGetProperty("purchaseUnit", out var puProp) && puProp.ValueKind == JsonValueKind.String)
                line.PurchaseUnit = puProp.GetString();
            if (el.TryGetProperty("conversionFactor", out var cfProp) && cfProp.TryGetDouble(out var cf) && cf > 0)
                line.ConversionFactor = cf;
            if (el.TryGetProperty("totalCost", out var tcProp) && tcProp.TryGetDouble(out var tc))
                line.TotalCost = tc;
            if (el.TryGetProperty("trackStock", out var tsProp) && (tsProp.ValueKind == JsonValueKind.True || tsProp.ValueKind == JsonValueKind.False))
                line.TrackStock = tsProp.GetBoolean();
            list.Add(line);
        }
        return list;
    }

    private void CalculateItemTracking(InventoryItem item, List<PurchaseOrder> pos, List<StockMovement> movements)
    {
        var itemPurchases = new List<(PurchaseOrder Po, ParsedItemLine Line)>();
        foreach (var po in pos.Where(p => p.Status != "CANCELLED").OrderBy(p => p.OrderedAt))
        {
            var lines = ParsePurchaseOrderItems(po.ItemsJson);
            var matchedLine = lines.FirstOrDefault(l =>
                (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == item.Id) ||
                (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(item.Name.Trim(), StringComparison.OrdinalIgnoreCase))
            );
            if (matchedLine != null)
            {
                itemPurchases.Add((po, matchedLine));
            }
        }

        var itemMovements = movements.Where(m => m.ItemId == item.Id).OrderBy(m => m.CreatedAt).ToList();

        if (itemPurchases.Count > 0)
        {
            item.TotalPurchaseAmount = Math.Round(itemPurchases.Sum(ip => ip.Line.TotalCost), 2);
            var latest = itemPurchases.Last();
            item.LastPurchaseDate = latest.Po.OrderedAt;
            var pu = !string.IsNullOrWhiteSpace(latest.Line.PurchaseUnit) ? latest.Line.PurchaseUnit : item.Unit;
            item.LastPurchaseQuantity = $"{latest.Line.Quantity} {pu}";
            item.LastPurchaseAmount = Math.Round(latest.Line.TotalCost, 2);
            item.LastSupplierName = latest.Po.SupplierName ?? "Walk-in Supplier";

            if (itemPurchases.Count >= 2)
            {
                var prev = itemPurchases[itemPurchases.Count - 2];
                item.PreviousPurchaseDate = prev.Po.OrderedAt;
                item.PreviousPurchaseAmount = Math.Round(prev.Line.TotalCost, 2);
            }
            else
            {
                item.PreviousPurchaseDate = null;
                item.PreviousPurchaseAmount = null;
            }
        }

        if (!item.TrackStock)
        {
            item.PreviousStock = null;
            item.RecentlyAddedStock = null;
            item.StockStatus = "NOT_TRACKED";
        }
        else
        {
            if (itemPurchases.Count > 0)
            {
                var latest = itemPurchases.Last();
                var factor = latest.Line.ConversionFactor > 0 ? latest.Line.ConversionFactor : 1.0;
                item.RecentlyAddedStock = (int)Math.Round(latest.Line.Quantity * factor);

                var purchaseMovements = itemMovements.Where(m => m.Type == "PURCHASE").OrderBy(m => m.CreatedAt).ToList();
                var latestPurchaseMovement = purchaseMovements.LastOrDefault();
                item.PreviousStock = latestPurchaseMovement?.PreviousBalance ?? 0;
            }
            else
            {
                item.RecentlyAddedStock = 0;
                item.PreviousStock = 0;
            }

            item.StockStatus = item.CurrentStock <= 0 ? "OUT_OF_STOCK" : (item.CurrentStock <= item.MinThreshold ? "LOW_STOCK" : "IN_STOCK");
        }
    }

    [Fact]
    public void Scenario_Beer_StockAndPurchaseAmountTracking_ShouldMatchRequirementsExactly()
    {
        // 1. Add Beer with stock tracking enabled
        var beer = new InventoryItem
        {
            Id = "item-beer-1",
            Name = "Beer",
            Department = "RESTAURANT",
            Category = "BAR_SPIRITS",
            Sku = "BAR-BEER-01",
            TrackStock = true,
            CurrentStock = 0,
            MinThreshold = 10,
            Unit = "bottles",
            PurchaseUnit = "carton",
            ConversionFactor = 12.0
        };

        var purchaseOrders = new List<PurchaseOrder>();
        var stockMovements = new List<StockMovement>();

        // 2. Record First Purchase: 1 carton, 12 bottles, Rs. 1,800
        var purchase1Date = new DateTime(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);
        var po1 = new PurchaseOrder
        {
            Id = "po-1",
            PoNumber = "PO-20261101-0001",
            SupplierName = "Gorkha Brewery",
            PurchaseType = "FULL",
            TotalAmount = 1800,
            Status = "RECEIVED",
            OrderedAt = purchase1Date,
            ItemsJson = JsonSerializer.Serialize(new[]
            {
                new
                {
                    itemId = beer.Id,
                    itemName = beer.Name,
                    quantity = 1,
                    purchaseUnit = "carton",
                    stockUnit = "bottles",
                    conversionFactor = 12.0,
                    unitCost = 1800.0,
                    totalCost = 1800.0,
                    trackStock = true
                }
            })
        };
        purchaseOrders.Add(po1);

        // Execute stock addition for purchase 1
        var prevBal1 = beer.CurrentStock; // 0
        var addedQty1 = (int)(1 * 12.0); // 12
        beer.CurrentStock += addedQty1; // 12

        stockMovements.Add(new StockMovement
        {
            Id = "m-1",
            ItemId = beer.Id,
            Type = "PURCHASE",
            Quantity = addedQty1,
            PreviousBalance = prevBal1, // 0
            ResultingBalance = beer.CurrentStock, // 12
            CreatedAt = purchase1Date
        });

        CalculateItemTracking(beer, purchaseOrders, stockMovements);

        // Verification after Purchase 1:
        beer.PreviousStock.Should().Be(0);
        beer.RecentlyAddedStock.Should().Be(12);
        beer.CurrentStock.Should().Be(12);
        beer.LastPurchaseQuantity.Should().Be("1 carton");
        beer.LastPurchaseAmount.Should().Be(1800);
        beer.PreviousPurchaseAmount.Should().BeNull();
        beer.TotalPurchaseAmount.Should().Be(1800);

        // 3. Record Second Purchase: 1 carton, 12 bottles, Rs. 2,000
        var purchase2Date = new DateTime(2026, 11, 2, 11, 0, 0, DateTimeKind.Utc);
        var po2 = new PurchaseOrder
        {
            Id = "po-2",
            PoNumber = "PO-20261102-0002",
            SupplierName = "Gorkha Brewery",
            PurchaseType = "FULL",
            TotalAmount = 2000,
            Status = "RECEIVED",
            OrderedAt = purchase2Date,
            ItemsJson = JsonSerializer.Serialize(new[]
            {
                new
                {
                    itemId = beer.Id,
                    itemName = beer.Name,
                    quantity = 1,
                    purchaseUnit = "carton",
                    stockUnit = "bottles",
                    conversionFactor = 12.0,
                    unitCost = 2000.0,
                    totalCost = 2000.0,
                    trackStock = true
                }
            })
        };
        purchaseOrders.Add(po2);

        // Execute stock addition for purchase 2
        var prevBal2 = beer.CurrentStock; // 12
        var addedQty2 = (int)(1 * 12.0); // 12
        beer.CurrentStock += addedQty2; // 24

        stockMovements.Add(new StockMovement
        {
            Id = "m-2",
            ItemId = beer.Id,
            Type = "PURCHASE",
            Quantity = addedQty2,
            PreviousBalance = prevBal2, // 12
            ResultingBalance = beer.CurrentStock, // 24
            CreatedAt = purchase2Date
        });

        CalculateItemTracking(beer, purchaseOrders, stockMovements);

        // Verification after Purchase 2 (As explicitly requested in scenario):
        beer.PreviousStock.Should().Be(12); // Stock immediately before purchase 2
        beer.RecentlyAddedStock.Should().Be(12);
        beer.CurrentStock.Should().Be(24);
        beer.LastPurchaseQuantity.Should().Be("1 carton");
        beer.LastPurchaseAmount.Should().Be(2000);
        beer.PreviousPurchaseAmount.Should().Be(1800);
        beer.TotalPurchaseAmount.Should().Be(3800); // 1800 + 2000

        // 8. Sell or consume 3 bottles
        var saleDate = new DateTime(2026, 11, 2, 14, 0, 0, DateTimeKind.Utc);
        var saleQty = 3;
        var prevBal3 = beer.CurrentStock; // 24
        beer.CurrentStock -= saleQty; // 21

        stockMovements.Add(new StockMovement
        {
            Id = "m-3",
            ItemId = beer.Id,
            Type = "POS_CONSUMPTION",
            Quantity = -saleQty,
            PreviousBalance = prevBal3,
            ResultingBalance = beer.CurrentStock,
            CreatedAt = saleDate
        });

        CalculateItemTracking(beer, purchaseOrders, stockMovements);

        // Verification after Sale:
        // Current Stock decreases to 21 bottles
        beer.CurrentStock.Should().Be(21);
        // Previous Stock remains 12 (stock immediately before latest confirmed purchase)
        beer.PreviousStock.Should().Be(12);
        // Recently Added Stock remains 12
        beer.RecentlyAddedStock.Should().Be(12);
        // Purchase amounts remain completely unchanged after sales!
        beer.PreviousPurchaseAmount.Should().Be(1800);
        beer.LastPurchaseAmount.Should().Be(2000);
        beer.TotalPurchaseAmount.Should().Be(3800);
    }

    [Fact]
    public void NonStockTracked_Item_ShouldDisplayNotTracked_WhilePreservingPurchaseAmounts()
    {
        var chicken = new InventoryItem
        {
            Id = "item-chicken-1",
            Name = "Fresh Chicken Raw",
            Department = "RESTAURANT",
            Category = "FOOD_RAW",
            Sku = "RAW-CHK-01",
            TrackStock = false,
            CurrentStock = 0,
            Unit = "kg"
        };

        var purchaseOrders = new List<PurchaseOrder>();
        var stockMovements = new List<StockMovement>();

        var po = new PurchaseOrder
        {
            Id = "po-chk-1",
            PoNumber = "PO-CHK-001",
            SupplierName = "Valley Poultry",
            TotalAmount = 4500,
            Status = "RECEIVED",
            OrderedAt = DateTime.UtcNow,
            ItemsJson = JsonSerializer.Serialize(new[]
            {
                new
                {
                    itemId = chicken.Id,
                    itemName = chicken.Name,
                    quantity = 10,
                    purchaseUnit = "kg",
                    unitCost = 450.0,
                    totalCost = 4500.0,
                    trackStock = false
                }
            })
        };
        purchaseOrders.Add(po);

        CalculateItemTracking(chicken, purchaseOrders, stockMovements);

        chicken.PreviousStock.Should().BeNull();
        chicken.RecentlyAddedStock.Should().BeNull();
        chicken.StockStatus.Should().Be("NOT_TRACKED");
        chicken.TotalPurchaseAmount.Should().Be(4500);
        chicken.LastPurchaseAmount.Should().Be(4500);
        chicken.LastPurchaseQuantity.Should().Be("10 kg");
    }
}

