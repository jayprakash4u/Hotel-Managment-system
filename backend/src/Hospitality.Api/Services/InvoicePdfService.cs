using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Hospitality.Api.Services;

public class InvoicePdfService
{
    public byte[] GenerateInvoicePdf(
        string restaurantName,
        string invoiceNumber,
        DateTime invoiceDate,
        string? customerName,
        string? customerPhone,
        List<(string name, int qty, double unitPrice, double total)> items,
        double subtotal,
        double discountAmount,
        double tax,
        double serviceCharge,
        double total,
        string paymentMethod,
        string paymentStatus)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().AlignCenter().Text(restaurantName).Bold().FontSize(18);
                    col.Item().AlignCenter().Text("Tax Invoice").FontSize(12).FontColor(Colors.Grey.Medium);
                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Invoice No: {invoiceNumber}").Bold();
                            c.Item().Text($"Date: {invoiceDate:dd-MMM-yyyy hh:mm tt}");
                            if (!string.IsNullOrWhiteSpace(customerName))
                                c.Item().Text($"Customer: {customerName}");
                            if (!string.IsNullOrWhiteSpace(customerPhone))
                                c.Item().Text($"Phone: {customerPhone}");
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text($"Payment: {paymentMethod}");
                            c.Item().Text($"Status: {paymentStatus}");
                        });
                    });

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Item").Bold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Qty").Bold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Unit Price").Bold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Total").Bold();
                        });

                        foreach (var item in items)
                        {
                            table.Cell().Padding(5).Text(item.name);
                            table.Cell().Padding(5).Text(item.qty.ToString());
                            table.Cell().Padding(5).Text(item.unitPrice.ToString("N2"));
                            table.Cell().Padding(5).Text(item.total.ToString("N2"));
                        }
                    });

                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    col.Item().PaddingTop(5).AlignRight().Column(c =>
                    {
                        c.Item().Text($"Subtotal: {subtotal:N2}");
                        if (discountAmount > 0)
                            c.Item().Text($"Discount: -{discountAmount:N2}");
                        if (tax > 0)
                            c.Item().Text($"Tax: {tax:N2}");
                        if (serviceCharge > 0)
                            c.Item().Text($"Service Charge: {serviceCharge:N2}");
                        c.Item().Text($"Total: {total:N2}").Bold().FontSize(13);
                    });

                    col.Item().PaddingTop(15).AlignCenter().Text("Thank you for visiting!").Italic();
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                });
            });
        });

        return document.GeneratePdf();
    }
}
