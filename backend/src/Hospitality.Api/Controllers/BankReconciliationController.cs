using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/bank-reconciliation")]
public class BankReconciliationController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<BankReconciliationController> _logger;

    public BankReconciliationController(HospitalityDbContext db, ILogger<BankReconciliationController> logger)
    {
        _db = db;
        _logger = logger;
    }

    #region Helper Methods

    private async Task<string> GetCurrentHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    private static string MaskString(string? input, int unmaskedEnd = 4)
    {
        if (string.IsNullOrWhiteSpace(input)) return "—";
        var clean = input.Trim();
        if (clean.Length <= unmaskedEnd) return clean;
        return new string('*', clean.Length - unmaskedEnd) + clean[^unmaskedEnd..];
    }

    private static void RecalculateSessionBalances(BankReconciliation session)
    {
        var systemLines = session.Lines.Where(l => l.LineSource == "SYSTEM").ToList();
        var statementLines = session.Lines.Where(l => l.LineSource == "STATEMENT").ToList();

        // Cleared Deposits (Credits matched) & Cleared Payments (Debits matched)
        session.TotalDepositsCleared = systemLines.Where(l => l.IsMatched).Sum(l => l.Credit);
        session.TotalPaymentsCleared = systemLines.Where(l => l.IsMatched).Sum(l => l.Debit);

        // Deposits in Transit (Unmatched system deposits/receipts)
        session.TotalDepositsInTransit = systemLines.Where(l => !l.IsMatched).Sum(l => l.Credit);

        // Outstanding Checks / Payments (Unmatched system withdrawals/payments)
        session.TotalOutstandingChecks = systemLines.Where(l => !l.IsMatched).Sum(l => l.Debit);

        // Statement lines identified as bank/wallet charges or interest that haven't been adjusted into GL
        session.BankCharges = statementLines
            .Where(l => !l.IsMatched && (l.TransactionType == "BANK_CHARGE" || l.TransactionType == "WALLET_FEE"))
            .Sum(l => l.Debit > 0 ? l.Debit : l.Amount);

        session.InterestEarned = statementLines
            .Where(l => !l.IsMatched && l.TransactionType == "INTEREST")
            .Sum(l => l.Credit > 0 ? l.Credit : l.Amount);

        // Standard Bank Reconciliation Formula:
        // Reconciled Statement Balance = Statement Ending Balance + Deposits in Transit - Outstanding Checks
        session.ReconciledBalance = session.StatementEndingBalance + session.TotalDepositsInTransit - session.TotalOutstandingChecks;

        // Adjusted Book Balance = Book Ending Balance + Interest Earned - Bank Charges
        session.AdjustedBookBalance = session.BookEndingBalance + session.InterestEarned - session.BankCharges;

        // Net Difference = Reconciled Balance - Adjusted Book Balance
        session.Difference = Math.Round(session.ReconciledBalance - session.AdjustedBookBalance, 2);

        // If difference is essentially 0 and items are matched, mark RECONCILED
        if (Math.Abs(session.Difference) < 0.01 && session.Status == "IN_PROGRESS" && (session.TotalDepositsCleared > 0 || session.TotalPaymentsCleared > 0))
        {
            session.Status = "RECONCILED";
        }
        else if (Math.Abs(session.Difference) >= 0.01 && session.Status == "RECONCILED")
        {
            session.Status = "IN_PROGRESS";
        }
    }

    #endregion

    #region 1. Accounts & Summary Endpoints

    [HttpGet("accounts")]
    public async Task<IActionResult> GetReconciliationAccounts()
    {
        var hotelId = await GetCurrentHotelIdAsync();

        // 1. Ensure Standard Hospitality Accounts are available
        var count = await _db.Accounts.CountAsync();
        if (count == 0)
        {
            var seedList = AccountsController.GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seedList);
            await _db.SaveChangesAsync();
        }

        // 2. Fetch Bank and Digital Wallet Accounts
        var accounts = await _db.Accounts
            .Where(a => a.AccountType == "ASSET" && !a.IsGroup &&
                (a.SubCategory == "Bank Accounts" ||
                 a.SubCategory == "Digital Wallets" ||
                 a.BankName != null ||
                 a.WalletProvider != null ||
                 a.AccountCode.StartsWith("105") ||
                 a.AccountCode.StartsWith("107")))
            .OrderBy(a => a.AccountCode)
            .ToListAsync();

        // 3. Find active sessions for these accounts
        var activeSessions = await _db.BankReconciliations
            .Where(r => r.Status != "FINALIZED")
            .ToDictionaryAsync(r => r.AccountId, r => r.Id);

        // 4. Find finalized line IDs to count unreconciled GL lines
        var finalizedLineIds = await _db.BankReconciliationLines
            .Where(l => l.LineSource == "SYSTEM" && l.JournalEntryLineId != null && l.Reconciliation!.Status == "FINALIZED")
            .Select(l => l.JournalEntryLineId!)
            .Distinct()
            .ToListAsync();

        var finalizedSet = new HashSet<string>(finalizedLineIds);

        var result = new List<object>();
        foreach (var acc in accounts)
        {
            var isWallet = acc.WalletProvider != null || acc.SubCategory == "Digital Wallets" || acc.AccountCode.StartsWith("107");
            var accountType = isWallet ? "DIGITAL_WALLET" : "BANK";

            // Count GL lines not yet finalized
            var glLinesCount = await _db.JournalEntryLines
                .CountAsync(l => l.AccountId == acc.Id && l.JournalEntry!.Status == "POSTED" && !finalizedSet.Contains(l.Id));

            activeSessions.TryGetValue(acc.Id, out var activeSessionId);

            result.Add(new
            {
                acc.Id,
                acc.AccountCode,
                acc.AccountName,
                AccountType = accountType,
                acc.BranchOrOutlet,
                acc.BankName,
                AccountNumber = acc.AccountNumber,
                MaskedAccountNumber = MaskString(acc.AccountNumber),
                acc.AccountHolderName,
                acc.WalletProvider,
                MerchantId = acc.MerchantId,
                MaskedMerchantId = MaskString(acc.MerchantId),
                acc.RegisteredMobileNumber,
                acc.CurrentBalance,
                acc.LastReconciledDate,
                acc.LastReconciledBalance,
                ActiveSessionId = activeSessionId,
                UnreconciledLinesCount = glLinesCount,
                acc.IsActive
            });
        }

        return Ok(ApiResponse.Ok(result));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetReconciliationSummary()
    {
        var hotelId = await GetCurrentHotelIdAsync();

        var bankAccountsCount = await _db.Accounts
            .CountAsync(a => a.AccountType == "ASSET" && !a.IsGroup &&
                (a.SubCategory == "Bank Accounts" || a.BankName != null || a.AccountCode.StartsWith("105")));

        var walletAccountsCount = await _db.Accounts
            .CountAsync(a => a.AccountType == "ASSET" && !a.IsGroup &&
                (a.SubCategory == "Digital Wallets" || a.WalletProvider != null || a.AccountCode.StartsWith("107")));

        var activeSessions = await _db.BankReconciliations
            .Where(r => r.Status != "FINALIZED")
            .ToListAsync();

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var finalizedThisMonth = await _db.BankReconciliations
            .CountAsync(r => r.Status == "FINALIZED" && r.CompletedAt >= startOfMonth);

        var lastFinalized = await _db.BankReconciliations
            .Where(r => r.Status == "FINALIZED")
            .OrderByDescending(r => r.CompletedAt ?? r.StatementDate)
            .FirstOrDefaultAsync();

        var discrepanciesCount = activeSessions.Count(r => Math.Abs(r.Difference) >= 0.01);

        return Ok(ApiResponse.Ok(new
        {
            TotalBankAccounts = bankAccountsCount,
            TotalWalletAccounts = walletAccountsCount,
            ActiveReconciliations = activeSessions.Count,
            FinalizedThisMonth = finalizedThisMonth,
            DiscrepanciesCount = discrepanciesCount,
            LastReconciledDate = lastFinalized?.StatementDate,
            LastReconciliationNumber = lastFinalized?.ReconciliationNumber
        }));
    }

    #endregion

    #region 2. Sessions Management Endpoints

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(
        [FromQuery] string? accountId,
        [FromQuery] string? accountType,
        [FromQuery] string? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = _db.BankReconciliations
            .Include(r => r.Account)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(accountId) && !accountId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.AccountId == accountId);
        }

        if (!string.IsNullOrWhiteSpace(accountType) && !accountType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.AccountType == accountType.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.Status == status.ToUpper());
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(r => r.StatementDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(r => r.StatementDate <= dateTo.Value.AddDays(1).AddTicks(-1));
        }

        var totalCount = await query.CountAsync();

        var sessions = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.ReconciliationNumber,
                r.AccountId,
                AccountName = r.Account != null ? r.Account.AccountName : "Unknown Account",
                AccountCode = r.Account != null ? r.Account.AccountCode : "",
                r.AccountType,
                BankOrWalletName = r.Account != null ? (r.Account.BankName ?? r.Account.WalletProvider ?? r.Account.AccountName) : "—",
                r.StatementDate,
                r.PeriodStartDate,
                r.PeriodEndDate,
                r.StatementOpeningBalance,
                r.StatementEndingBalance,
                r.BookOpeningBalance,
                r.BookEndingBalance,
                r.TotalDepositsCleared,
                r.TotalPaymentsCleared,
                r.TotalDepositsInTransit,
                r.TotalOutstandingChecks,
                r.ReconciledBalance,
                r.Difference,
                r.Status,
                r.ReconciledBy,
                r.ApprovedBy,
                r.CompletedAt,
                r.Notes,
                r.StatementFileName,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            Items = sessions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("sessions/{id}")]
    public async Task<IActionResult> GetSessionById(string id)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Account)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        // Dynamically re-verify balance calculations
        RecalculateSessionBalances(session);

        var systemLines = session.Lines
            .Where(l => l.LineSource == "SYSTEM")
            .OrderByDescending(l => l.TransactionDate)
            .Select(l => new
            {
                l.Id,
                l.LineSource,
                l.JournalEntryLineId,
                l.JournalEntryNumber,
                l.TransactionDate,
                l.ReferenceNumber,
                l.Description,
                l.PayeeOrPayer,
                l.Debit,
                l.Credit,
                l.Amount,
                l.TransactionType,
                l.IsMatched,
                l.MatchedLineId,
                l.MatchedAt,
                l.MatchRule,
                l.Status
            })
            .ToList();

        var statementLines = session.Lines
            .Where(l => l.LineSource == "STATEMENT")
            .OrderByDescending(l => l.TransactionDate)
            .Select(l => new
            {
                l.Id,
                l.LineSource,
                l.TransactionDate,
                l.ReferenceNumber,
                l.Description,
                l.PayeeOrPayer,
                l.Debit,
                l.Credit,
                l.Amount,
                l.TransactionType,
                l.IsMatched,
                l.MatchedLineId,
                l.MatchedAt,
                l.MatchRule,
                l.Status
            })
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            session.Id,
            session.ReconciliationNumber,
            session.AccountId,
            AccountName = session.Account?.AccountName ?? "—",
            AccountCode = session.Account?.AccountCode ?? "—",
            session.AccountType,
            BankOrProvider = session.Account?.BankName ?? session.Account?.WalletProvider ?? session.Account?.AccountName ?? "—",
            AccountNumber = session.Account?.AccountNumber,
            MerchantId = session.Account?.MerchantId,
            session.StatementDate,
            session.PeriodStartDate,
            session.PeriodEndDate,
            session.StatementOpeningBalance,
            session.StatementEndingBalance,
            session.BookOpeningBalance,
            session.BookEndingBalance,
            session.TotalDepositsCleared,
            session.TotalPaymentsCleared,
            session.TotalDepositsInTransit,
            session.TotalOutstandingChecks,
            session.BankCharges,
            session.InterestEarned,
            session.ReconciledBalance,
            session.AdjustedBookBalance,
            session.Difference,
            session.Status,
            session.ReconciledBy,
            session.ApprovedBy,
            session.CompletedAt,
            session.Notes,
            session.StatementFileName,
            session.StatementFormat,
            SystemLines = systemLines,
            StatementLines = statementLines,
            MatchedCount = session.Lines.Count(l => l.IsMatched) / 2,
            UnmatchedSystemCount = systemLines.Count(l => !l.IsMatched),
            UnmatchedStatementCount = statementLines.Count(l => !l.IsMatched)
        }));
    }

    public class CreateSessionDto
    {
        public string AccountId { get; set; } = string.Empty;
        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }
        public DateTime? StatementDate { get; set; }
        public double StatementOpeningBalance { get; set; }
        public double StatementEndingBalance { get; set; }
        public string? StatementFormat { get; set; } // STANDARD_CSV, NABIL_BANK, GLOBAL_IME, ESEWA_SETTLEMENT, KHALTI_SETTLEMENT, MANUAL
        public string? Notes { get; set; }
        public string? ReconciledBy { get; set; }
        public List<StatementLineDto>? InitialStatementLines { get; set; }
    }

    public class StatementLineDto
    {
        public DateTime TransactionDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? PayeeOrPayer { get; set; }
        public double Debit { get; set; }
        public double Credit { get; set; }
        public double Amount { get; set; }
        public string? TransactionType { get; set; }
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccountId);
        if (account == null)
            return BadRequest(ApiResponse.Fail("Invalid account selected."));

        // Check if there is already an active reconciliation session for this account
        var existingActive = await _db.BankReconciliations
            .FirstOrDefaultAsync(r => r.AccountId == dto.AccountId && r.Status != "FINALIZED");

        if (existingActive != null)
        {
            return BadRequest(ApiResponse.Fail(
                $"An active reconciliation session ({existingActive.ReconciliationNumber}) is already in progress for this account. Please continue or finalize it before creating a new one."));
        }

        var isWallet = account.WalletProvider != null || account.SubCategory == "Digital Wallets" || account.AccountCode.StartsWith("107");
        var accountType = isWallet ? "DIGITAL_WALLET" : "BANK";
        var prefix = isWallet ? "WREC" : "BREC";

        var today = DateTime.UtcNow;
        var seq = await _db.BankReconciliations.CountAsync() + 1;
        var reconNumber = $"{prefix}-{today.Year}-{seq:D4}";

        // Calculate Book Opening Balance:
        // Sum of net movements for this account before PeriodStartDate
        var priorLines = await _db.JournalEntryLines
            .Where(l => l.AccountId == account.Id && l.JournalEntry!.Status == "POSTED" && l.JournalEntry!.EntryDate < dto.PeriodStartDate)
            .ToListAsync();

        var bookOpeningBalance = account.OpeningBalance + priorLines.Sum(l => l.Debit - l.Credit);

        // Calculate current Book Ending Balance up to PeriodEndDate
        var allPeriodLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == account.Id && l.JournalEntry!.Status == "POSTED" && l.JournalEntry!.EntryDate <= dto.PeriodEndDate)
            .ToListAsync();

        var bookEndingBalance = account.OpeningBalance + allPeriodLines.Sum(l => l.Debit - l.Credit);

        // Find GL lines that were already matched in a FINALIZED session
        var finalizedLineIds = await _db.BankReconciliationLines
            .Where(l => l.LineSource == "SYSTEM" && l.JournalEntryLineId != null && l.Reconciliation!.Status == "FINALIZED")
            .Select(l => l.JournalEntryLineId!)
            .Distinct()
            .ToListAsync();

        var finalizedSet = new HashSet<string>(finalizedLineIds);

        // Load all unreconciled GL lines up to PeriodEndDate (including any prior unreconciled backlog)
        var unreconciledGLLines = allPeriodLines
            .Where(l => !finalizedSet.Contains(l.Id))
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ToList();

        var session = new BankReconciliation
        {
            HotelId = hotelId,
            ReconciliationNumber = reconNumber,
            AccountId = account.Id,
            AccountType = accountType,
            StatementDate = dto.StatementDate ?? dto.PeriodEndDate,
            PeriodStartDate = dto.PeriodStartDate,
            PeriodEndDate = dto.PeriodEndDate,
            StatementOpeningBalance = dto.StatementOpeningBalance,
            StatementEndingBalance = dto.StatementEndingBalance,
            BookOpeningBalance = bookOpeningBalance,
            BookEndingBalance = bookEndingBalance,
            Status = "IN_PROGRESS",
            ReconciledBy = string.IsNullOrWhiteSpace(dto.ReconciledBy) ? "Accountant" : dto.ReconciledBy.Trim(),
            StatementFormat = dto.StatementFormat ?? "STANDARD_CSV",
            Notes = dto.Notes
        };

        // Convert GL lines to SYSTEM Reconciliation Lines
        foreach (var gl in unreconciledGLLines)
        {
            var isDebit = gl.Debit > 0;
            var amt = isDebit ? gl.Debit : gl.Credit;

            var transType = "DEPOSIT";
            var desc = (gl.LineDescription ?? gl.JournalEntry?.Description ?? "").Trim();
            var descLower = desc.ToLower();

            if (descLower.Contains("settlement") || descLower.Contains("sweep"))
                transType = "SETTLEMENT";
            else if (descLower.Contains("transfer") || descLower.Contains("contra"))
                transType = "TRANSFER";
            else if (descLower.Contains("bank charge") || descLower.Contains("fee") || descLower.Contains("commission"))
                transType = isWallet ? "WALLET_FEE" : "BANK_CHARGE";
            else if (descLower.Contains("interest"))
                transType = "INTEREST";
            else if (isDebit)
                transType = "DEPOSIT"; // For Asset account, Debit is cash/bank increase (Deposit/Receipt)
            else
                transType = "PAYMENT"; // For Asset account, Credit is cash/bank decrease (Payment/Withdrawal)

            session.Lines.Add(new BankReconciliationLine
            {
                ReconciliationId = session.Id,
                LineSource = "SYSTEM",
                JournalEntryLineId = gl.Id,
                JournalEntryNumber = gl.JournalEntry?.EntryNumber,
                TransactionDate = gl.JournalEntry!.EntryDate,
                ReferenceNumber = gl.JournalEntry?.Reference,
                Description = string.IsNullOrWhiteSpace(desc) ? (isDebit ? "Bank Deposit" : "Bank Payment") : desc,
                Debit = gl.Credit,  // In Bank Statement terms: system Credit is a withdrawal (Debit from bank)
                Credit = gl.Debit, // In Bank Statement terms: system Debit is a deposit (Credit into bank)
                Amount = amt,
                TransactionType = transType,
                IsMatched = false,
                Status = "UNMATCHED"
            });
        }

        // Add any initial statement lines if supplied
        if (dto.InitialStatementLines != null && dto.InitialStatementLines.Count > 0)
        {
            foreach (var st in dto.InitialStatementLines)
            {
                var debit = st.Debit > 0 ? st.Debit : 0;
                var credit = st.Credit > 0 ? st.Credit : 0;
                var amt = st.Amount > 0 ? st.Amount : (debit > 0 ? debit : credit);

                session.Lines.Add(new BankReconciliationLine
                {
                    ReconciliationId = session.Id,
                    LineSource = "STATEMENT",
                    TransactionDate = st.TransactionDate,
                    ReferenceNumber = st.ReferenceNumber,
                    Description = st.Description,
                    PayeeOrPayer = st.PayeeOrPayer,
                    Debit = debit,
                    Credit = credit,
                    Amount = amt,
                    TransactionType = string.IsNullOrWhiteSpace(st.TransactionType) ? (credit > 0 ? "DEPOSIT" : "PAYMENT") : st.TransactionType,
                    IsMatched = false,
                    Status = "UNMATCHED"
                });
            }
        }

        RecalculateSessionBalances(session);

        _db.BankReconciliations.Add(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            session.Id,
            session.ReconciliationNumber,
            session.AccountId,
            session.AccountType,
            session.StatementEndingBalance,
            session.BookEndingBalance,
            session.Difference,
            TotalSystemLines = session.Lines.Count(l => l.LineSource == "SYSTEM"),
            TotalStatementLines = session.Lines.Count(l => l.LineSource == "STATEMENT")
        }, "Reconciliation session started successfully."));
    }

    #endregion

    #region 3. Statement Import & Manual Line Endpoints

    public class ImportStatementDto
    {
        public string? StatementFileName { get; set; }
        public string? StatementFormat { get; set; }
        public List<StatementLineDto> Lines { get; set; } = new();
    }

    [HttpPost("sessions/{id}/import-statement")]
    public async Task<IActionResult> ImportStatement(string id, [FromBody] ImportStatementDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot import statement lines into a finalized reconciliation session."));

        if (dto.Lines == null || dto.Lines.Count == 0)
            return BadRequest(ApiResponse.Fail("No statement records were provided."));

        session.StatementFileName = dto.StatementFileName ?? session.StatementFileName;
        session.StatementFormat = dto.StatementFormat ?? session.StatementFormat;

        foreach (var st in dto.Lines)
        {
            var debit = Math.Round(st.Debit > 0 ? st.Debit : 0, 2);
            var credit = Math.Round(st.Credit > 0 ? st.Credit : 0, 2);
            var amt = Math.Round(st.Amount > 0 ? st.Amount : (debit > 0 ? debit : credit), 2);

            var tType = st.TransactionType;
            if (string.IsNullOrWhiteSpace(tType))
            {
                var descL = (st.Description ?? "").ToLower();
                if (descL.Contains("settlement") || descL.Contains("sweep") || descL.Contains("payout"))
                    tType = "SETTLEMENT";
                else if (descL.Contains("fee") || descL.Contains("charge") || descL.Contains("commission") || descL.Contains("mdr"))
                    tType = session.AccountType == "DIGITAL_WALLET" ? "WALLET_FEE" : "BANK_CHARGE";
                else if (descL.Contains("interest") || descL.Contains("bonus"))
                    tType = "INTEREST";
                else if (credit > 0)
                    tType = "DEPOSIT";
                else
                    tType = "PAYMENT";
            }

            session.Lines.Add(new BankReconciliationLine
            {
                ReconciliationId = session.Id,
                LineSource = "STATEMENT",
                TransactionDate = st.TransactionDate,
                ReferenceNumber = st.ReferenceNumber?.Trim(),
                Description = st.Description?.Trim() ?? "Statement Item",
                PayeeOrPayer = st.PayeeOrPayer?.Trim(),
                Debit = debit,
                Credit = credit,
                Amount = amt,
                TransactionType = tType,
                IsMatched = false,
                Status = "UNMATCHED"
            });
        }

        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            ImportedCount = dto.Lines.Count,
            TotalStatementLines = session.Lines.Count(l => l.LineSource == "STATEMENT"),
            session.ReconciledBalance,
            session.Difference
        }, $"{dto.Lines.Count} statement lines imported successfully."));
    }

    [HttpPost("sessions/{id}/add-manual-line")]
    public async Task<IActionResult> AddManualStatementLine(string id, [FromBody] StatementLineDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot modify a finalized reconciliation session."));

        var debit = Math.Round(dto.Debit > 0 ? dto.Debit : 0, 2);
        var credit = Math.Round(dto.Credit > 0 ? dto.Credit : 0, 2);
        var amt = Math.Round(dto.Amount > 0 ? dto.Amount : (debit > 0 ? debit : credit), 2);

        var newLine = new BankReconciliationLine
        {
            ReconciliationId = session.Id,
            LineSource = "STATEMENT",
            TransactionDate = dto.TransactionDate,
            ReferenceNumber = dto.ReferenceNumber?.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? "Manual Statement Entry" : dto.Description.Trim(),
            PayeeOrPayer = dto.PayeeOrPayer?.Trim(),
            Debit = debit,
            Credit = credit,
            Amount = amt,
            TransactionType = string.IsNullOrWhiteSpace(dto.TransactionType) ? (credit > 0 ? "DEPOSIT" : "PAYMENT") : dto.TransactionType,
            IsMatched = false,
            Status = "UNMATCHED"
        };

        session.Lines.Add(newLine);
        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            LineId = newLine.Id,
            session.Difference
        }, "Statement line added successfully."));
    }

    #endregion

    #region 4. Matching Algorithm & Manual Pairings

    [HttpPost("sessions/{id}/auto-match")]
    public async Task<IActionResult> RunAutoMatch(string id)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot modify a finalized reconciliation session."));

        var systemUnmatched = session.Lines
            .Where(l => l.LineSource == "SYSTEM" && !l.IsMatched)
            .OrderBy(l => l.TransactionDate)
            .ToList();

        var statementUnmatched = session.Lines
            .Where(l => l.LineSource == "STATEMENT" && !l.IsMatched)
            .OrderBy(l => l.TransactionDate)
            .ToList();

        var newlyMatchedCount = 0;
        var now = DateTime.UtcNow;

        // RULE 1: Exact Reference Match & Amount
        // Cheque number, UTR, Order ID, or Transaction reference matches exactly
        foreach (var sys in systemUnmatched.Where(s => !s.IsMatched))
        {
            if (string.IsNullOrWhiteSpace(sys.ReferenceNumber)) continue;

            var match = statementUnmatched.FirstOrDefault(st =>
                !st.IsMatched &&
                !string.IsNullOrWhiteSpace(st.ReferenceNumber) &&
                string.Equals(st.ReferenceNumber.Trim(), sys.ReferenceNumber.Trim(), StringComparison.OrdinalIgnoreCase) &&
                Math.Abs(st.Amount - sys.Amount) < 0.01 &&
                ((st.Credit > 0 && sys.Credit > 0) || (st.Debit > 0 && sys.Debit > 0)));

            if (match != null)
            {
                sys.IsMatched = true;
                sys.MatchedLineId = match.Id;
                sys.MatchedAt = now;
                sys.MatchRule = "AUTO_REF";
                sys.Status = "MATCHED";

                match.IsMatched = true;
                match.MatchedLineId = sys.Id;
                match.MatchedAt = now;
                match.MatchRule = "AUTO_REF";
                match.Status = "MATCHED";

                newlyMatchedCount++;
            }
        }

        // RULE 2: Exact Amount & Date Proximity (±3 days)
        foreach (var sys in systemUnmatched.Where(s => !s.IsMatched))
        {
            var match = statementUnmatched.FirstOrDefault(st =>
                !st.IsMatched &&
                Math.Abs(st.Amount - sys.Amount) < 0.01 &&
                ((st.Credit > 0 && sys.Credit > 0) || (st.Debit > 0 && sys.Debit > 0)) &&
                Math.Abs((st.TransactionDate.Date - sys.TransactionDate.Date).TotalDays) <= 3);

            if (match != null)
            {
                sys.IsMatched = true;
                sys.MatchedLineId = match.Id;
                sys.MatchedAt = now;
                sys.MatchRule = "AUTO_EXACT";
                sys.Status = "MATCHED";

                match.IsMatched = true;
                match.MatchedLineId = sys.Id;
                match.MatchedAt = now;
                match.MatchRule = "AUTO_EXACT";
                match.Status = "MATCHED";

                newlyMatchedCount++;
            }
        }

        // RULE 3: Wallet Settlement & Transfer Traceability
        // Matches wallet sweep withdrawals with destination bank deposits without altering revenues
        foreach (var sys in systemUnmatched.Where(s => !s.IsMatched && (s.TransactionType == "SETTLEMENT" || s.TransactionType == "TRANSFER")))
        {
            var match = statementUnmatched.FirstOrDefault(st =>
                !st.IsMatched &&
                Math.Abs(st.Amount - sys.Amount) < 0.01 &&
                Math.Abs((st.TransactionDate.Date - sys.TransactionDate.Date).TotalDays) <= 5);

            if (match != null)
            {
                sys.IsMatched = true;
                sys.MatchedLineId = match.Id;
                sys.MatchedAt = now;
                sys.MatchRule = "AUTO_SETTLEMENT";
                sys.Status = "MATCHED";

                match.IsMatched = true;
                match.MatchedLineId = sys.Id;
                match.MatchedAt = now;
                match.MatchRule = "AUTO_SETTLEMENT";
                match.Status = "MATCHED";

                newlyMatchedCount++;
            }
        }

        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            NewlyMatchedCount = newlyMatchedCount,
            TotalMatched = session.Lines.Count(l => l.IsMatched) / 2,
            RemainingUnmatchedSystem = session.Lines.Count(l => l.LineSource == "SYSTEM" && !l.IsMatched),
            RemainingUnmatchedStatement = session.Lines.Count(l => l.LineSource == "STATEMENT" && !l.IsMatched),
            session.ReconciledBalance,
            session.Difference,
            session.Status
        }, $"Auto-matching completed: {newlyMatchedCount} items successfully paired."));
    }

    public class MatchPairDto
    {
        public string SystemLineId { get; set; } = string.Empty;
        public string StatementLineId { get; set; } = string.Empty;
    }

    [HttpPost("sessions/{id}/match-lines")]
    public async Task<IActionResult> MatchLines(string id, [FromBody] MatchPairDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot modify a finalized reconciliation session."));

        var sys = session.Lines.FirstOrDefault(l => l.Id == dto.SystemLineId && l.LineSource == "SYSTEM");
        var st = session.Lines.FirstOrDefault(l => l.Id == dto.StatementLineId && l.LineSource == "STATEMENT");

        if (sys == null || st == null)
            return BadRequest(ApiResponse.Fail("Invalid system or statement line specified."));

        if (sys.IsMatched || st.IsMatched)
            return BadRequest(ApiResponse.Fail("One or both selected lines are already matched."));

        var now = DateTime.UtcNow;
        sys.IsMatched = true;
        sys.MatchedLineId = st.Id;
        sys.MatchedAt = now;
        sys.MatchRule = "MANUAL";
        sys.Status = "MATCHED";

        st.IsMatched = true;
        st.MatchedLineId = sys.Id;
        st.MatchedAt = now;
        st.MatchRule = "MANUAL";
        st.Status = "MATCHED";

        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            session.ReconciledBalance,
            session.Difference,
            session.Status
        }, "Lines matched successfully."));
    }

    public class UnmatchDto
    {
        public string LineId { get; set; } = string.Empty;
    }

    [HttpPost("sessions/{id}/unmatch-lines")]
    public async Task<IActionResult> UnmatchLine(string id, [FromBody] UnmatchDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot modify a finalized reconciliation session."));

        var line = session.Lines.FirstOrDefault(l => l.Id == dto.LineId);
        if (line == null)
            return NotFound(ApiResponse.Fail("Line not found."));

        if (!line.IsMatched)
            return BadRequest(ApiResponse.Fail("Line is not currently matched."));

        var pairedLine = session.Lines.FirstOrDefault(l => l.Id == line.MatchedLineId);

        line.IsMatched = false;
        line.MatchedLineId = null;
        line.MatchedAt = null;
        line.MatchRule = null;
        line.Status = "UNMATCHED";

        if (pairedLine != null)
        {
            pairedLine.IsMatched = false;
            pairedLine.MatchedLineId = null;
            pairedLine.MatchedAt = null;
            pairedLine.MatchRule = null;
            pairedLine.Status = "UNMATCHED";
        }

        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            session.ReconciledBalance,
            session.Difference,
            session.Status
        }, "Line pair unmatched successfully."));
    }

    #endregion

    #region 5. Discrepancy Adjustment & Finalization

    public class PostAdjustmentDto
    {
        public string StatementLineId { get; set; } = string.Empty;
        public string AdjustmentType { get; set; } = "BANK_CHARGE"; // BANK_CHARGE, WALLET_FEE, INTEREST, OTHER
        public double Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }
    }

    [HttpPost("sessions/{id}/post-adjustment")]
    public async Task<IActionResult> PostAdjustment(string id, [FromBody] PostAdjustmentDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Account)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Cannot post adjustment to a finalized session."));

        var stLine = session.Lines.FirstOrDefault(l => l.Id == dto.StatementLineId && l.LineSource == "STATEMENT");
        if (stLine == null)
            return NotFound(ApiResponse.Fail("Statement line not found."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var seq = await _db.JournalEntries.CountAsync() + 1;
        var entryNumber = $"JV-ADJ-{today.Year}-{seq:D4}";

        var amount = dto.Amount > 0 ? dto.Amount : stLine.Amount;
        if (amount <= 0)
            return BadRequest(ApiResponse.Fail("Adjustment amount must be greater than zero."));

        // Determine expense or income offset account:
        // 5700: Bank Charges & POS Processing Fees
        // 5710: Digital Wallet & Gateway Charges
        // 4900: Miscellaneous / Interest Income
        Account? offsetAccount = null;
        bool isDebitAccount = false; // Is the bank account being debited (money added) or credited (money subtracted)?

        if (dto.AdjustmentType == "WALLET_FEE")
        {
            offsetAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5710")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5700");
            isDebitAccount = false;
        }
        else if (dto.AdjustmentType == "BANK_CHARGE")
        {
            offsetAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5700")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");
            isDebitAccount = false;
        }
        else if (dto.AdjustmentType == "INTEREST")
        {
            offsetAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "4900")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "REVENUE");
            isDebitAccount = true;
        }
        else
        {
            offsetAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5700");
            isDebitAccount = false;
        }

        if (offsetAccount == null)
            return BadRequest(ApiResponse.Fail("Default expense/income account not found in Chart of Accounts."));

        var narration = string.IsNullOrWhiteSpace(dto.Description)
            ? $"Reconciliation adjustment for {session.Account?.AccountName}: {stLine.Description}"
            : dto.Description.Trim();

        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = entryNumber,
            EntryDate = stLine.TransactionDate,
            EntryType = "ADJUSTMENT",
            SourceModule = "BANK_RECONCILIATION",
            Reference = dto.Reference ?? stLine.ReferenceNumber ?? session.ReconciliationNumber,
            Description = narration,
            Status = "POSTED",
            PostedBy = "Reconciliation Auditor",
            PostedAt = DateTime.UtcNow,
            TotalDebit = amount,
            TotalCredit = amount
        };

        JournalEntryLine bankGlLine;
        JournalEntryLine offsetGlLine;

        if (isDebitAccount)
        {
            // Interest Earned: Debit Bank, Credit Interest Income
            bankGlLine = new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = session.AccountId,
                AccountCode = session.Account?.AccountCode ?? "",
                AccountName = session.Account?.AccountName ?? "",
                Debit = amount,
                Credit = 0,
                LineDescription = $"Interest received per statement ({session.ReconciliationNumber})"
            };
            offsetGlLine = new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = offsetAccount.Id,
                AccountCode = offsetAccount.AccountCode,
                AccountName = offsetAccount.AccountName,
                Debit = 0,
                Credit = amount,
                LineDescription = "Interest Income earned per bank statement"
            };
            session.Account!.CurrentBalance += amount;
            session.BookEndingBalance += amount;
        }
        else
        {
            // Bank/Wallet Fee: Debit Expense (5700/5710), Credit Bank/Wallet
            offsetGlLine = new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = offsetAccount.Id,
                AccountCode = offsetAccount.AccountCode,
                AccountName = offsetAccount.AccountName,
                Debit = amount,
                Credit = 0,
                LineDescription = $"{dto.AdjustmentType.Replace('_', ' ')}: {stLine.Description}"
            };
            bankGlLine = new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = session.AccountId,
                AccountCode = session.Account?.AccountCode ?? "",
                AccountName = session.Account?.AccountName ?? "",
                Debit = 0,
                Credit = amount,
                LineDescription = $"Bank/Wallet fee deducted per statement ({session.ReconciliationNumber})"
            };
            session.Account!.CurrentBalance -= amount;
            session.BookEndingBalance -= amount;
        }

        journalEntry.Lines.Add(bankGlLine);
        journalEntry.Lines.Add(offsetGlLine);
        _db.JournalEntries.Add(journalEntry);

        // Create new SYSTEM line in reconciliation and match it with the statement line
        var newSysLine = new BankReconciliationLine
        {
            ReconciliationId = session.Id,
            LineSource = "SYSTEM",
            JournalEntryLineId = bankGlLine.Id,
            JournalEntryNumber = journalEntry.EntryNumber,
            TransactionDate = stLine.TransactionDate,
            ReferenceNumber = journalEntry.Reference,
            Description = journalEntry.Description,
            Debit = isDebitAccount ? 0 : amount,
            Credit = isDebitAccount ? amount : 0,
            Amount = amount,
            TransactionType = dto.AdjustmentType,
            IsMatched = true,
            MatchedLineId = stLine.Id,
            MatchedAt = DateTime.UtcNow,
            MatchRule = "ADJUSTMENT",
            Status = "MATCHED"
        };

        stLine.IsMatched = true;
        stLine.MatchedLineId = newSysLine.Id;
        stLine.MatchedAt = DateTime.UtcNow;
        stLine.MatchRule = "ADJUSTMENT";
        stLine.Status = "MATCHED";

        session.Lines.Add(newSysLine);

        RecalculateSessionBalances(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            JournalEntryNumber = journalEntry.EntryNumber,
            session.ReconciledBalance,
            session.Difference,
            session.Status
        }, $"Adjustment journal voucher ({journalEntry.EntryNumber}) posted and matched successfully."));
    }

    public class FinalizeSessionDto
    {
        public string? ApprovedBy { get; set; }
        public string? Notes { get; set; }
        public bool ForceApproveDifference { get; set; } = false;
        public string? DiscrepancyReason { get; set; }
    }

    [HttpPost("sessions/{id}/finalize")]
    public async Task<IActionResult> FinalizeSession(string id, [FromBody] FinalizeSessionDto dto)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Account)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("This session is already finalized."));

        RecalculateSessionBalances(session);

        if (Math.Abs(session.Difference) >= 0.01 && !dto.ForceApproveDifference)
        {
            return BadRequest(ApiResponse.Fail(
                $"Cannot finalize reconciliation: An unresolved difference of Rs. {session.Difference:N2} remains. Please investigate unmatched transactions or post an adjustment voucher before finalization."));
        }

        session.Status = "FINALIZED";
        session.CompletedAt = DateTime.UtcNow;
        session.ApprovedBy = string.IsNullOrWhiteSpace(dto.ApprovedBy) ? "Finance Director" : dto.ApprovedBy.Trim();
        session.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? session.Notes : dto.Notes.Trim();

        if (dto.ForceApproveDifference && !string.IsNullOrWhiteSpace(dto.DiscrepancyReason))
        {
            session.Notes = $"[Discrepancy Approved: {dto.DiscrepancyReason.Trim()}] {session.Notes}".Trim();
        }

        // Update the account master with last reconciliation details
        if (session.Account != null)
        {
            session.Account.LastReconciledDate = session.StatementDate;
            session.Account.LastReconciledBalance = session.StatementEndingBalance;
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            session.Id,
            session.ReconciliationNumber,
            session.Status,
            session.CompletedAt,
            session.ApprovedBy,
            session.StatementEndingBalance,
            session.ReconciledBalance,
            session.Difference
        }, $"Reconciliation session {session.ReconciliationNumber} finalized successfully. All cleared records locked."));
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> DeleteSession(string id)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        if (session.Status == "FINALIZED")
            return BadRequest(ApiResponse.Fail("Finalized reconciliation sessions cannot be deleted."));

        _db.BankReconciliationLines.RemoveRange(session.Lines);
        _db.BankReconciliations.Remove(session);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Reconciliation session cancelled and deleted."));
    }

    [HttpGet("sessions/{id}/report")]
    public async Task<IActionResult> GetReconciliationReport(string id)
    {
        var session = await _db.BankReconciliations
            .Include(r => r.Account)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (session == null)
            return NotFound(ApiResponse.Fail("Reconciliation session not found"));

        RecalculateSessionBalances(session);

        var systemLines = session.Lines.Where(l => l.LineSource == "SYSTEM").ToList();
        var depositsInTransit = systemLines.Where(l => !l.IsMatched && l.Credit > 0).OrderBy(l => l.TransactionDate).ToList();
        var outstandingPayments = systemLines.Where(l => !l.IsMatched && l.Debit > 0).OrderBy(l => l.TransactionDate).ToList();

        var report = new
        {
            session.ReconciliationNumber,
            session.AccountType,
            AccountName = session.Account?.AccountName ?? "—",
            AccountCode = session.Account?.AccountCode ?? "—",
            BankOrProvider = session.Account?.BankName ?? session.Account?.WalletProvider ?? "—",
            AccountNumber = MaskString(session.Account?.AccountNumber ?? session.Account?.MerchantId),
            session.StatementDate,
            session.PeriodStartDate,
            session.PeriodEndDate,
            session.StatementOpeningBalance,
            session.StatementEndingBalance,
            session.BookOpeningBalance,
            session.BookEndingBalance,
            session.TotalDepositsCleared,
            session.TotalPaymentsCleared,
            session.TotalDepositsInTransit,
            session.TotalOutstandingChecks,
            session.BankCharges,
            session.InterestEarned,
            session.ReconciledBalance,
            session.AdjustedBookBalance,
            session.Difference,
            session.Status,
            session.ReconciledBy,
            session.ApprovedBy,
            session.CompletedAt,
            session.Notes,
            DepositsInTransit = depositsInTransit.Select(l => new
            {
                l.TransactionDate,
                l.JournalEntryNumber,
                l.ReferenceNumber,
                l.Description,
                Amount = l.Credit
            }),
            OutstandingPayments = outstandingPayments.Select(l => new
            {
                l.TransactionDate,
                l.JournalEntryNumber,
                l.ReferenceNumber,
                l.Description,
                Amount = l.Debit
            })
        };

        return Ok(ApiResponse.Ok(report));
    }

    #endregion
}
