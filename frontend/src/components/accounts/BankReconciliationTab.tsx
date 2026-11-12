'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  Landmark,
  Wallet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Calendar,
  Sparkles,
  Link2,
  Unlink,
  Eye,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  BankReconciliationAccount,
  BankReconciliationSummary,
  BankReconciliationSessionItem,
  BankReconciliationSessionDetail,
  BankReconciliationLineItem,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function BankReconciliationTab() {
  const { success, error: toastError } = useToast();

  // Mode: 'DASHBOARD' (Hub & Setup), 'WORKSPACE' (Active Session Matching), 'HISTORY' (Past Finalized)
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'WORKSPACE' | 'HISTORY'>('DASHBOARD');

  // Loading States
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);

  // Accounts & Summary Data
  const [accounts, setAccounts] = useState<BankReconciliationAccount[]>([]);
  const [summary, setSummary] = useState<BankReconciliationSummary | null>(null);

  // History & Sessions List Data
  const [sessions, setSessions] = useState<BankReconciliationSessionItem[]>([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsPageSize, setSessionsPageSize] = useState(25);
  const [historyAccountFilter, setHistoryAccountFilter] = useState('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Active Session Detail State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<BankReconciliationSessionDetail | null>(null);

  // Workspace Filter & Selection State
  const [glFilter, setGlFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('ALL');
  const [stmtFilter, setStmtFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('ALL');
  const [selectedGlLineId, setSelectedGlLineId] = useState<string | null>(null);
  const [selectedStmtLineId, setSelectedStmtLineId] = useState<string | null>(null);

  // Setup / New Session Modal State
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'BANK' | 'DIGITAL_WALLET'>('BANK');
  const [newAccountId, setNewAccountId] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [newPeriodEnd, setNewPeriodEnd] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [newStmtDate, setNewStmtDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);
  const [newEndingBalance, setNewEndingBalance] = useState<number>(0);
  const [newFormat, setNewFormat] = useState('STANDARD_CSV');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNewSession, setIsSubmittingNewSession] = useState(false);

  // Statement Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFormat, setImportFormat] = useState('STANDARD_CSV');
  const [importCsvText, setImportCsvText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  // Add Manual Statement Line Modal State
  const [isManualLineModalOpen, setIsManualLineModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualRef, setManualRef] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualType, setManualType] = useState<'DEPOSIT' | 'PAYMENT' | 'BANK_CHARGE' | 'WALLET_FEE' | 'INTEREST'>('DEPOSIT');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [isSubmittingManualLine, setIsSubmittingManualLine] = useState(false);

  // Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentTargetStmtLine, setAdjustmentTargetStmtLine] = useState<BankReconciliationLineItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'BANK_CHARGE' | 'WALLET_FEE' | 'INTEREST'>('BANK_CHARGE');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentDesc, setAdjustmentDesc] = useState('');
  const [adjustmentRef, setAdjustmentRef] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Finalize Modal State
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalizeApprovedBy, setFinalizeApprovedBy] = useState('Finance Director');
  const [finalizeNotes, setFinalizeNotes] = useState('');
  const [forceApproveDifference, setForceApproveDifference] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [isSubmittingFinalize, setIsSubmittingFinalize] = useState(false);

  // Report / Print Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // ----------------------------------------------------
  // Initial Data Fetching
  // ----------------------------------------------------

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const res = await api.getBankReconciliationAccounts();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setAccounts(list);
      if (list.length > 0 && !newAccountId) {
        setNewAccountId(list[0].id);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load reconciliation accounts.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await api.getBankReconciliationSummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const res = await api.getBankReconciliationSessions({
        accountId: historyAccountFilter !== 'ALL' ? historyAccountFilter : undefined,
        accountType: historyTypeFilter !== 'ALL' ? historyTypeFilter : undefined,
        status: historyStatusFilter !== 'ALL' ? historyStatusFilter : undefined,
        dateFrom: historyDateFrom || undefined,
        dateTo: historyDateTo || undefined,
        page: sessionsPage,
        pageSize: sessionsPageSize,
      });
      setSessions(res.items || []);
      setTotalSessionsCount(res.totalCount || 0);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load reconciliation history.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionDetail = async (id: string) => {
    try {
      setIsLoadingSessionDetail(true);
      setActiveSessionId(id);
      const res = await api.getBankReconciliationSessionById(id);
      setActiveSession(res);
      setViewMode('WORKSPACE');
      setSelectedGlLineId(null);
      setSelectedStmtLineId(null);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load reconciliation session details.');
    } finally {
      setIsLoadingSessionDetail(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadSummary();
  }, []);

  useEffect(() => {
    if (viewMode === 'HISTORY') {
      loadSessions();
    }
  }, [viewMode, sessionsPage, sessionsPageSize, historyAccountFilter, historyTypeFilter, historyStatusFilter, historyDateFrom, historyDateTo]);

  // When selected account in modal changes, prefill balances
  useEffect(() => {
    if (newAccountId) {
      const acc = accounts.find((a) => a.id === newAccountId);
      if (acc) {
        setNewAccountType(acc.accountType);
        if (acc.lastReconciledBalance !== undefined && acc.lastReconciledBalance !== null) {
          setNewOpeningBalance(acc.lastReconciledBalance);
        } else {
          setNewOpeningBalance(acc.currentBalance);
        }
        setNewEndingBalance(acc.currentBalance);
      }
    }
  }, [newAccountId, accounts]);

  // ----------------------------------------------------
  // Actions: New Session Creation
  // ----------------------------------------------------

  const handleOpenNewSessionModal = (preselectedAccountId?: string) => {
    if (preselectedAccountId) {
      setNewAccountId(preselectedAccountId);
    } else if (accounts.length > 0 && !newAccountId) {
      setNewAccountId(accounts[0].id);
    }
    setIsNewSessionModalOpen(true);
  };

  const handleSubmitNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountId) {
      toastError('Please select a bank or digital wallet account.');
      return;
    }
    if (!newPeriodStart || !newPeriodEnd) {
      toastError('Please specify statement start and end period dates.');
      return;
    }

    try {
      setIsSubmittingNewSession(true);
      const res = await api.createBankReconciliationSession({
        accountId: newAccountId,
        periodStartDate: newPeriodStart,
        periodEndDate: newPeriodEnd,
        statementDate: newStmtDate || newPeriodEnd,
        statementOpeningBalance: Number(newOpeningBalance) || 0,
        statementEndingBalance: Number(newEndingBalance) || 0,
        statementFormat: newFormat,
        notes: newNotes.trim() || undefined,
        reconciledBy: 'Staff Accountant',
      });

      success('Reconciliation Started', `Session ${res.reconciliationNumber} created successfully.`);
      setIsNewSessionModalOpen(false);
      loadAccounts();
      loadSummary();
      loadSessionDetail(res.id);
    } catch (err: any) {
      toastError(err?.message || 'Failed to start reconciliation session.');
    } finally {
      setIsSubmittingNewSession(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Statement Import & Parsing
  // ----------------------------------------------------

  const handleOpenImportModal = () => {
    setImportCsvText('');
    setImportFileName('');
    setIsImportModalOpen(true);
  };

  const parseStatementCsv = (text: string, format: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const parsed: Array<{
      transactionDate: string;
      referenceNumber?: string;
      description: string;
      payeeOrPayer?: string;
      debit: number;
      credit: number;
      amount?: number;
      transactionType?: string;
    }> = [];

    // Header detection: check if first line looks like header
    let startIndex = 0;
    const firstLower = lines[0].toLowerCase();
    if (firstLower.includes('date') || firstLower.includes('amount') || firstLower.includes('description') || firstLower.includes('ref')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const raw = lines[i];
      // simple comma or tab split handling quotes
      const parts = raw.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());

      if (parts.length >= 3) {
        let tDate = new Date().toISOString().slice(0, 10);
        let ref = '';
        let desc = 'Statement Transaction';
        let debit = 0;
        let credit = 0;
        let tType = '';

        if (format === 'STANDARD_CSV') {
          // Date, Ref, Description, Debit, Credit
          tDate = parts[0] || tDate;
          ref = parts[1] || '';
          desc = parts[2] || 'Statement Item';
          debit = parseFloat((parts[3] || '0').replace(/[^0-9.-]/g, '')) || 0;
          credit = parseFloat((parts[4] || '0').replace(/[^0-9.-]/g, '')) || 0;
        } else if (format === 'NABIL_BANK' || format === 'GLOBAL_IME') {
          // Date, Description, Cheque/Ref, Withdrawal, Deposit, Balance
          tDate = parts[0] || tDate;
          desc = parts[1] || 'Bank Transaction';
          ref = parts[2] || '';
          debit = parseFloat((parts[3] || '0').replace(/[^0-9.-]/g, '')) || 0;
          credit = parseFloat((parts[4] || '0').replace(/[^0-9.-]/g, '')) || 0;
        } else if (format === 'ESEWA_SETTLEMENT' || format === 'KHALTI_SETTLEMENT') {
          // TxId, Date, Service/Bill, Gross, Fee, Net, Status
          ref = parts[0] || '';
          tDate = parts[1] || tDate;
          desc = parts[2] || 'Digital Wallet Settlement';
          const gross = parseFloat((parts[3] || '0').replace(/[^0-9.-]/g, '')) || 0;
          const fee = parseFloat((parts[4] || '0').replace(/[^0-9.-]/g, '')) || 0;
          credit = gross > 0 ? gross : 0;
          debit = fee > 0 ? fee : 0;
          tType = 'SETTLEMENT';
        } else {
          // Generic fallback: Date, Description, Amount
          tDate = parts[0] || tDate;
          desc = parts[1] || 'Statement Entry';
          const val = parseFloat((parts[2] || '0').replace(/[^0-9.-]/g, '')) || 0;
          if (val >= 0) credit = val;
          else debit = Math.abs(val);
        }

        // Validate date string
        const parsedDate = new Date(tDate);
        const validDateStr = isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 10) : parsedDate.toISOString().slice(0, 10);

        parsed.push({
          transactionDate: validDateStr,
          referenceNumber: ref || undefined,
          description: desc,
          debit,
          credit,
          amount: debit > 0 ? debit : credit,
          transactionType: tType || (credit > 0 ? 'DEPOSIT' : 'PAYMENT'),
        });
      }
    }

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId) return;

    if (!importCsvText.trim()) {
      toastError('Please upload a statement file or paste CSV rows.');
      return;
    }

    const parsedLines = parseStatementCsv(importCsvText, importFormat);
    if (parsedLines.length === 0) {
      toastError('Could not parse valid transactions from the provided CSV data.');
      return;
    }

    try {
      setIsSubmittingImport(true);
      await api.importBankReconciliationStatement(activeSessionId, {
        statementFileName: importFileName || 'Statement_Upload.csv',
        statementFormat: importFormat,
        lines: parsedLines,
      });

      success('Statement Imported', `${parsedLines.length} statement records loaded into session.`);
      setIsImportModalOpen(false);
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Failed to import statement lines.');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Add Manual Statement Line
  // ----------------------------------------------------

  const handleSubmitManualLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId) return;

    if (manualAmount <= 0) {
      toastError('Amount must be greater than zero.');
      return;
    }

    const isCredit = manualType === 'DEPOSIT' || manualType === 'INTEREST';
    const debit = isCredit ? 0 : manualAmount;
    const credit = isCredit ? manualAmount : 0;

    try {
      setIsSubmittingManualLine(true);
      await api.addManualStatementLine(activeSessionId, {
        transactionDate: manualDate,
        referenceNumber: manualRef.trim() || undefined,
        description: manualDesc.trim() || `${manualType} Entry`,
        debit,
        credit,
        amount: manualAmount,
        transactionType: manualType,
      });

      success('Line Added', 'Statement transaction recorded.');
      setIsManualLineModalOpen(false);
      setManualAmount(0);
      setManualDesc('');
      setManualRef('');
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Failed to add statement line.');
    } finally {
      setIsSubmittingManualLine(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Auto-Match & Manual Pairing
  // ----------------------------------------------------

  const handleRunAutoMatch = async () => {
    if (!activeSessionId) return;

    try {
      const res = await api.runAutoMatch(activeSessionId);
      success('Auto-Match Run', `${res.newlyMatchedCount || 0} matching transaction pairs identified.`);
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Auto-match failed.');
    }
  };

  const handleManualPairMatch = async () => {
    if (!activeSessionId || !selectedGlLineId || !selectedStmtLineId) {
      toastError('Please select one GL transaction and one Statement transaction to match.');
      return;
    }

    try {
      await api.matchReconciliationLines(activeSessionId, {
        systemLineId: selectedGlLineId,
        statementLineId: selectedStmtLineId,
      });

      success('Matched', 'Transactions paired successfully.');
      setSelectedGlLineId(null);
      setSelectedStmtLineId(null);
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Matching failed.');
    }
  };

  const handleUnmatch = async (lineId: string) => {
    if (!activeSessionId) return;

    try {
      await api.unmatchReconciliationLine(activeSessionId, lineId);
      success('Unmatched', 'Transaction link removed.');
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Unmatch failed.');
    }
  };

  // ----------------------------------------------------
  // Actions: Post Discrepancy Adjustment
  // ----------------------------------------------------

  const handleOpenAdjustmentModal = (stLine: BankReconciliationLineItem) => {
    setAdjustmentTargetStmtLine(stLine);
    setAdjustmentAmount(stLine.amount || (stLine.debit > 0 ? stLine.debit : stLine.credit));
    setAdjustmentDesc(stLine.description);
    setAdjustmentRef(stLine.referenceNumber || '');

    if (activeSession?.accountType === 'DIGITAL_WALLET') {
      setAdjustmentType('WALLET_FEE');
    } else if (stLine.credit > 0) {
      setAdjustmentType('INTEREST');
    } else {
      setAdjustmentType('BANK_CHARGE');
    }

    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId || !adjustmentTargetStmtLine) return;

    if (adjustmentAmount <= 0) {
      toastError('Adjustment amount must be greater than zero.');
      return;
    }

    try {
      setIsSubmittingAdjustment(true);
      const res = await api.postReconciliationAdjustment(activeSessionId, {
        statementLineId: adjustmentTargetStmtLine.id,
        adjustmentType,
        amount: adjustmentAmount,
        description: adjustmentDesc.trim() || `Reconciliation adjustment for ${adjustmentType}`,
        reference: adjustmentRef.trim() || undefined,
      });

      success('Adjustment Posted', `Journal voucher ${res.journalEntryNumber} posted and paired.`);
      setIsAdjustmentModalOpen(false);
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Adjustment posting failed.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Finalize Session
  // ----------------------------------------------------

  const handleOpenFinalizeModal = () => {
    setForceApproveDifference(false);
    setDiscrepancyReason('');
    setIsFinalizeModalOpen(true);
  };

  const handleSubmitFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId) return;

    if (activeSession && Math.abs(activeSession.difference) >= 0.01 && !forceApproveDifference) {
      toastError('Cannot finalize with an unapproved discrepancy. Please resolve differences or enable authorized override.');
      return;
    }

    try {
      setIsSubmittingFinalize(true);
      await api.finalizeBankReconciliation(activeSessionId, {
        approvedBy: finalizeApprovedBy.trim() || 'Finance Director',
        notes: finalizeNotes.trim() || undefined,
        forceApproveDifference,
        discrepancyReason: forceApproveDifference ? discrepancyReason.trim() : undefined,
      });

      success('Reconciliation Finalized', `Session ${activeSession?.reconciliationNumber} closed and locked.`);
      setIsFinalizeModalOpen(false);
      loadAccounts();
      loadSummary();
      loadSessionDetail(activeSessionId);
    } catch (err: any) {
      toastError(err?.message || 'Finalization failed.');
    } finally {
      setIsSubmittingFinalize(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Cancel / Delete Session
  // ----------------------------------------------------

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this reconciliation session? All imported statement lines and matches in this session will be removed.')) {
      return;
    }

    try {
      await api.deleteBankReconciliationSession(sessionId);
      success('Session Cancelled', 'Reconciliation session deleted.');
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setActiveSession(null);
        setViewMode('DASHBOARD');
      }
      loadAccounts();
      loadSummary();
      if (viewMode === 'HISTORY') loadSessions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to cancel session.');
    }
  };

  // ----------------------------------------------------
  // Actions: Print / Audit Report
  // ----------------------------------------------------

  const handleOpenReportModal = async (sessionId?: string) => {
    const id = sessionId || activeSessionId;
    if (!id) return;

    try {
      setIsLoadingReport(true);
      setIsReportModalOpen(true);
      const res = await api.getBankReconciliationReport(id);
      setReportData(res);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load report.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // ----------------------------------------------------
  // Filtered Lines for Workspace
  // ----------------------------------------------------

  const filteredGlLines = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.systemLines.filter((l) => {
      const isM = Boolean(l.isMatched);
      if (glFilter === 'UNMATCHED') return !isM;
      if (glFilter === 'MATCHED') return isM;
      return true;
    });
  }, [activeSession, glFilter]);

  const filteredStmtLines = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.statementLines.filter((l) => {
      const isM = Boolean(l.isMatched);
      if (stmtFilter === 'UNMATCHED') return !isM;
      if (stmtFilter === 'MATCHED') return isM;
      return true;
    });
  }, [activeSession, stmtFilter]);

  // Export Reconciliation History to CSV
  const handleExportHistoryCSV = () => {
    if (sessions.length === 0) {
      toastError('No reconciliation sessions to export.');
      return;
    }

    const headers = [
      'Reconciliation #',
      'Account Code',
      'Account Name',
      'Type',
      'Bank / Provider',
      'Statement Date',
      'Statement End Balance',
      'Book End Balance',
      'Cleared Deposits',
      'Cleared Payments',
      'Deposits in Transit',
      'Outstanding Checks',
      'Reconciled Balance',
      'Difference',
      'Status',
      'Reconciled By',
      'Completed At',
    ];

    const rows = sessions.map((s) => [
      `"${s.reconciliationNumber}"`,
      `"${s.accountCode}"`,
      `"${s.accountName.replace(/"/g, '""')}"`,
      `"${s.accountType}"`,
      `"${s.bankOrWalletName}"`,
      `"${new Date(s.statementDate).toISOString().slice(0, 10)}"`,
      (s.statementEndingBalance || 0).toFixed(2),
      (s.bookEndingBalance || 0).toFixed(2),
      (s.totalDepositsCleared || 0).toFixed(2),
      (s.totalPaymentsCleared || 0).toFixed(2),
      (s.totalDepositsInTransit || 0).toFixed(2),
      (s.totalOutstandingChecks || 0).toFixed(2),
      (s.reconciledBalance || 0).toFixed(2),
      (s.difference || 0).toFixed(2),
      `"${s.status}"`,
      `"${s.reconciledBy || ''}"`,
      `"${s.completedAt ? new Date(s.completedAt).toISOString().slice(0, 10) : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reconciliation_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSessionsPages = Math.max(1, Math.ceil(totalSessionsCount / sessionsPageSize));

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/accounts"
            className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accounts Hub</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-cyan-600 stroke-[1.25]" />
            <span>Bank &amp; Wallet Reconciliation</span>
          </span>
          {viewMode === 'WORKSPACE' && activeSession && (
            <>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                <span>{activeSession.reconciliationNumber}</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  ({activeSession.accountName})
                </span>
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'WORKSPACE' && activeSession ? (
            <>
              <button
                type="button"
                onClick={() => setViewMode('DASHBOARD')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Accounts Overview</span>
              </button>

              <button
                type="button"
                onClick={handleRunAutoMatch}
                disabled={activeSession.status === 'FINALIZED'}
                className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                title="Automatically match transactions by amount, date, and reference"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[1.25]" />
                <span>Auto-Match</span>
              </button>

              <button
                type="button"
                onClick={handleOpenImportModal}
                disabled={activeSession.status === 'FINALIZED'}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Import Statement</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualLineModalOpen(true)}
                disabled={activeSession.status === 'FINALIZED'}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Add Item</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReportModal(activeSession.id)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Statement Report</span>
              </button>

              {activeSession.status !== 'FINALIZED' && (
                <button
                  type="button"
                  onClick={handleOpenFinalizeModal}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs',
                    Math.abs(activeSession.difference) < 0.01
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.25]" />
                  <span>Finalize Reconciliation</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setViewMode('DASHBOARD')}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'DASHBOARD'
                      ? 'bg-white dark:bg-slate-900 text-[#0B3D32] dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Accounts Hub
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('HISTORY')}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'HISTORY'
                      ? 'bg-white dark:bg-slate-900 text-[#0B3D32] dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Reconciliation History
                </button>
              </div>

              {viewMode === 'HISTORY' && (
                <button
                  type="button"
                  onClick={handleExportHistoryCSV}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 stroke-[1.25]" />
                  <span>Export CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  loadAccounts();
                  loadSummary();
                  if (viewMode === 'HISTORY') loadSessions();
                }}
                disabled={isLoadingAccounts || isLoadingSummary || isLoadingSessions}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh accounts & status"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', (isLoadingAccounts || isLoadingSessions) && 'animate-spin')} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNewSessionModal()}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Start Reconciliation</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD / ACCOUNTS HUB */}
      {/* ========================================================================= */}
      {viewMode === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* Top 5 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bank Accounts
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                {summary?.totalBankAccounts ?? 0}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Digital Wallets
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                {summary?.totalWalletAccounts ?? 0}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Active Sessions
              </div>
              <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">
                {summary?.activeReconciliations ?? 0}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Finalized This Month
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {summary?.finalizedThisMonth ?? 0}
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Open Discrepancies
              </div>
              <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">
                {summary?.discrepanciesCount ?? 0}
              </div>
            </div>
          </div>

          {/* Accounts Grid & Selection Table */}
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Bank &amp; Digital Wallet Accounts Ready for Reconciliation
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {accounts.length} Accounts
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewSessionModal()}
                className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Setup Period &amp; Start</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.25]" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Account Code &amp; Name</th>
                    <th className="py-2.5 px-3">Provider / Bank</th>
                    <th className="py-2.5 px-3">Account # / Merchant ID</th>
                    <th className="py-2.5 px-3 text-right">GL Book Balance</th>
                    <th className="py-2.5 px-3 text-right">Unreconciled Items</th>
                    <th className="py-2.5 px-3">Last Reconciled</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        No bank or wallet accounts found. Check Chart of Accounts.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => {
                      const isWallet = acc.accountType === 'DIGITAL_WALLET';
                      const hasActiveSession = Boolean(acc.activeSessionId);

                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                                isWallet
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              )}
                            >
                              {isWallet ? (
                                <Wallet className="w-3 h-3 stroke-[1.25]" />
                              ) : (
                                <Landmark className="w-3 h-3 stroke-[1.25]" />
                              )}
                              <span>{isWallet ? 'Wallet' : 'Bank'}</span>
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {acc.accountName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              GL #{acc.accountCode}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {acc.bankName || acc.walletProvider || '—'}
                            </span>
                            {acc.branchOrOutlet && (
                              <div className="text-[10px] text-slate-400">
                                {acc.branchOrOutlet}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                            {acc.maskedAccountNumber || acc.maskedMerchantId || '—'}
                          </td>

                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                            Rs. {(acc.currentBalance ?? 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold',
                                acc.unreconciledLinesCount > 0
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              )}
                            >
                              {acc.unreconciledLinesCount} entries
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            {acc.lastReconciledDate ? (
                              <div>
                                <div className="font-semibold text-slate-700 dark:text-slate-300">
                                  {new Date(acc.lastReconciledDate).toLocaleDateString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Rs. {(acc.lastReconciledBalance ?? 0).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Never reconciled</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {hasActiveSession ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 animate-pulse">
                                IN PROGRESS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                READY
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            {hasActiveSession ? (
                              <button
                                type="button"
                                onClick={() => loadSessionDetail(acc.activeSessionId!)}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                              >
                                Continue Recon
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenNewSessionModal(acc.id)}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-[#0B3D32] hover:bg-[#082d25] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                              >
                                Reconcile
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ACTIVE RECONCILIATION WORKSPACE */}
      {/* ========================================================================= */}
      {viewMode === 'WORKSPACE' && activeSession && (
        <div className="space-y-4">
          {/* Top 5 Dynamic Reconciliation Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* 1. Statement Ending Balance */}
            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Statement Ending Balance
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1 truncate">
                Rs. {(activeSession.statementEndingBalance ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* 2. Cleared Total Movements */}
            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Cleared Net Movement
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                Rs. {((activeSession.totalDepositsCleared || 0) - (activeSession.totalPaymentsCleared || 0)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* 3. Deposits in Transit */}
            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Deposits in Transit (+)
              </div>
              <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1 truncate">
                Rs. {(activeSession.totalDepositsInTransit ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* 4. Outstanding Checks/Payments */}
            <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Outstanding Checks (&minus;)
              </div>
              <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-1 truncate">
                Rs. {(activeSession.totalOutstandingChecks ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* 5. Difference / Discrepancy */}
            <div
              className={cn(
                'p-3 rounded-lg border shadow-xs',
                Math.abs(activeSession.difference) < 0.01
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider flex items-center justify-between',
                  Math.abs(activeSession.difference) < 0.01
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-rose-800 dark:text-rose-300'
                )}
              >
                <span>Reconciliation Difference</span>
                {Math.abs(activeSession.difference) < 0.01 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div
                className={cn(
                  'text-base font-black mt-1 truncate',
                  Math.abs(activeSession.difference) < 0.01
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-rose-900 dark:text-rose-200'
                )}
              >
                Rs. {Math.abs(activeSession.difference).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Pair Match Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Manual Pair Match:
              </span>
              <span>
                {selectedGlLineId ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                    1 GL Item Selected
                  </span>
                ) : (
                  <span className="italic text-slate-400">Select GL Item</span>
                )}
              </span>
              <span>+</span>
              <span>
                {selectedStmtLineId ? (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 font-bold">
                    1 Statement Item Selected
                  </span>
                ) : (
                  <span className="italic text-slate-400">Select Statement Item</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualPairMatch}
                disabled={!selectedGlLineId || !selectedStmtLineId || activeSession.status === 'FINALIZED'}
                className="px-3.5 py-1.5 text-xs font-bold rounded bg-cyan-700 hover:bg-cyan-800 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Link2 className="w-3.5 h-3.5 stroke-[1.25]" />
                <span>Pair &amp; Match Selected</span>
              </button>

              {(selectedGlLineId || selectedStmtLineId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGlLineId(null);
                    setSelectedStmtLineId(null);
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Dual Split Table View: Left = GL System Entries, Right = Statement Lines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ========================================= */}
            {/* LEFT PANE: SYSTEM GL TRANSACTIONS */}
            {/* ========================================= */}
            <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    System GL Transactions (Book)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Showing {filteredGlLines.length} of {activeSession.systemLines.length} entries
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1">
                  {(['ALL', 'UNMATCHED', 'MATCHED'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGlFilter(mode)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors',
                        glFilter === mode
                          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1 max-h-[560px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <th className="py-2 px-2 w-8 text-center">#</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Ref / Voucher</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Debit (Withdrawal)</th>
                      <th className="py-2 px-2 text-right">Credit (Deposit)</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredGlLines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No GL transactions found in this view.
                        </td>
                      </tr>
                    ) : (
                      filteredGlLines.map((line) => {
                        const isMatched = Boolean(line.isMatched);
                        const isSelected = selectedGlLineId === line.id;

                        return (
                          <tr
                            key={line.id}
                            onClick={() => {
                              if (!isMatched && activeSession.status !== 'FINALIZED') {
                                setSelectedGlLineId(isSelected ? null : line.id);
                              }
                            }}
                            className={cn(
                              'transition-colors',
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-l-2 border-cyan-600'
                                : isMatched
                                ? 'bg-slate-50/40 dark:bg-slate-900/20 text-slate-500'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer'
                            )}
                          >
                            <td className="py-2 px-2 text-center">
                              {!isMatched && activeSession.status !== 'FINALIZED' ? (
                                <input
                                  type="radio"
                                  name="selectedGlLine"
                                  checked={isSelected}
                                  onChange={() => setSelectedGlLineId(isSelected ? null : line.id)}
                                  className="cursor-pointer"
                                />
                              ) : isMatched ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline-block" />
                              ) : null}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap text-[11px]">
                              {new Date(line.transactionDate).toLocaleDateString()}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap font-mono text-[11px]">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {line.journalEntryNumber || '—'}
                              </div>
                              {line.referenceNumber && (
                                <div className="text-[10px] text-slate-400">
                                  Ref: {line.referenceNumber}
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-2 max-w-[140px] truncate" title={line.description}>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {line.description}
                              </span>
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                              {line.debit > 0
                                ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                : '—'}
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {line.credit > 0
                                ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                : '—'}
                            </td>

                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              {isMatched ? (
                                <div className="inline-flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                    MATCHED
                                  </span>
                                  {activeSession.status !== 'FINALIZED' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnmatch(line.id);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-rose-600"
                                      title="Unmatch line"
                                    >
                                      <Unlink className="w-3 h-3 stroke-[1.25]" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  UNMATCHED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================= */}
            {/* RIGHT PANE: STATEMENT LINES */}
            {/* ========================================= */}
            <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Bank / Wallet Statement</span>
                    {activeSession.statementFileName && (
                      <span className="text-[10px] font-normal text-slate-400 font-mono">
                        ({activeSession.statementFileName})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Showing {filteredStmtLines.length} of {activeSession.statementLines.length} items
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1">
                  {(['ALL', 'UNMATCHED', 'MATCHED'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setStmtFilter(mode)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors',
                        stmtFilter === mode
                          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1 max-h-[560px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <th className="py-2 px-2 w-8 text-center">#</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Ref / Cheque #</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Debit (Withdrawal)</th>
                      <th className="py-2 px-2 text-right">Credit (Deposit)</th>
                      <th className="py-2 px-2 text-center">Status / Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStmtLines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No statement lines recorded. Click "Import Statement" or "Add Item".
                        </td>
                      </tr>
                    ) : (
                      filteredStmtLines.map((line) => {
                        const isMatched = Boolean(line.isMatched);
                        const isSelected = selectedStmtLineId === line.id;

                        return (
                          <tr
                            key={line.id}
                            onClick={() => {
                              if (!isMatched && activeSession.status !== 'FINALIZED') {
                                setSelectedStmtLineId(isSelected ? null : line.id);
                              }
                            }}
                            className={cn(
                              'transition-colors',
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-l-2 border-cyan-600'
                                : isMatched
                                ? 'bg-slate-50/40 dark:bg-slate-900/20 text-slate-500'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer'
                            )}
                          >
                            <td className="py-2 px-2 text-center">
                              {!isMatched && activeSession.status !== 'FINALIZED' ? (
                                <input
                                  type="radio"
                                  name="selectedStmtLine"
                                  checked={isSelected}
                                  onChange={() => setSelectedStmtLineId(isSelected ? null : line.id)}
                                  className="cursor-pointer"
                                />
                              ) : isMatched ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline-block" />
                              ) : null}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap text-[11px]">
                              {new Date(line.transactionDate).toLocaleDateString()}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap font-mono text-[11px]">
                              {line.referenceNumber || '—'}
                            </td>

                            <td className="py-2 px-2 max-w-[140px] truncate" title={line.description}>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {line.description}
                              </span>
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                              {line.debit > 0
                                ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                : '—'}
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {line.credit > 0
                                ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                                : '—'}
                            </td>

                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              {isMatched ? (
                                <div className="inline-flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                    MATCHED
                                  </span>
                                  {activeSession.status !== 'FINALIZED' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnmatch(line.id);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-rose-600"
                                      title="Unmatch line"
                                    >
                                      <Unlink className="w-3 h-3 stroke-[1.25]" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    UNMATCHED
                                  </span>
                                  {activeSession.status !== 'FINALIZED' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAdjustmentModal(line);
                                      }}
                                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                      title="Post as GL Adjustment (Bank Fee, Commission, Interest)"
                                    >
                                      Post Adj
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: RECONCILIATION HISTORY & ARCHIVE */}
      {/* ========================================================================= */}
      {viewMode === 'HISTORY' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Account:</span>
                <select
                  value={historyAccountFilter}
                  onChange={(e) => {
                    setHistoryAccountFilter(e.target.value);
                    setSessionsPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="ALL">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.accountCode}] {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Type:</span>
                <select
                  value={historyTypeFilter}
                  onChange={(e) => {
                    setHistoryTypeFilter(e.target.value);
                    setSessionsPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="ALL">All Types</option>
                  <option value="BANK">Bank Accounts Only</option>
                  <option value="DIGITAL_WALLET">Digital Wallets Only</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Status:</span>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    setSessionsPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="FINALIZED">Finalized &amp; Locked</option>
                  <option value="RECONCILED">Reconciled (Balanced)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Date From:</span>
                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => {
                    setHistoryDateFrom(e.target.value);
                    setSessionsPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Date To:</span>
                <input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => {
                    setHistoryDateTo(e.target.value);
                    setSessionsPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>
            </div>

            {(historyAccountFilter !== 'ALL' ||
              historyTypeFilter !== 'ALL' ||
              historyStatusFilter !== 'ALL' ||
              historyDateFrom ||
              historyDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setHistoryAccountFilter('ALL');
                  setHistoryTypeFilter('ALL');
                  setHistoryStatusFilter('ALL');
                  setHistoryDateFrom('');
                  setHistoryDateTo('');
                  setSessionsPage(1);
                }}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* History Data Table */}
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Session #</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Statement Date</th>
                    <th className="py-2.5 px-3 text-right">Statement Balance</th>
                    <th className="py-2.5 px-3 text-right">GL Book Balance</th>
                    <th className="py-2.5 px-3 text-right">Cleared (Net)</th>
                    <th className="py-2.5 px-3 text-right">Difference</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Auditor</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                        No reconciliation records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const isWallet = s.accountType === 'DIGITAL_WALLET';
                      const isBalanced = Math.abs(s.difference) < 0.01;

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                            {s.reconciliationNumber}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {s.accountName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              GL #{s.accountCode} &bull; {s.bankOrWalletName}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                                isWallet
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              )}
                            >
                              {isWallet ? 'Wallet' : 'Bank'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(s.statementDate).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(s.periodStartDate).toLocaleDateString()} &minus;{' '}
                              {new Date(s.periodEndDate).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            Rs. {(s.statementEndingBalance ?? 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                            Rs. {(s.bookEndingBalance ?? 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            Rs. {((s.totalDepositsCleared || 0) - (s.totalPaymentsCleared || 0)).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-black">
                            <span className={isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              Rs. {Math.abs(s.difference ?? 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                s.status === 'FINALIZED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : s.status === 'RECONCILED'
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                              )}
                            >
                              {s.status}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {s.approvedBy || s.reconciledBy || 'Staff'}
                            </div>
                            {s.completedAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(s.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => loadSessionDetail(s.id)}
                                className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Open Reconciliation Workspace"
                              >
                                <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReportModal(s.id)}
                                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Print Certificate / Statement"
                              >
                                <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                              </button>

                              {s.status !== 'FINALIZED' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(s.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                  title="Cancel session"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[1.25]" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* DataTables Permanent Bottom Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={sessionsPageSize}
                    onChange={(e) => {
                      setSessionsPageSize(Number(e.target.value));
                      setSessionsPage(1);
                    }}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>
                <span>|</span>
                <span>
                  Showing {totalSessionsCount === 0 ? 0 : (sessionsPage - 1) * sessionsPageSize + 1} to{' '}
                  {Math.min(sessionsPage * sessionsPageSize, totalSessionsCount)} of {totalSessionsCount} records
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                  disabled={sessionsPage <= 1}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: Math.min(5, totalSessionsPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalSessionsPages > 5 && sessionsPage > 3) {
                    pNum = sessionsPage - 2 + i;
                    if (pNum > totalSessionsPages) pNum = totalSessionsPages - (4 - i);
                  }
                  if (pNum <= 0) pNum = 1;

                  const isActive = pNum === sessionsPage;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setSessionsPage(pNum)}
                      className={cn(
                        'w-7 h-7 text-xs font-bold rounded transition-colors',
                        isActive
                          ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSessionsPage((p) => Math.min(totalSessionsPages, p + 1))}
                  disabled={sessionsPage >= totalSessionsPages}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: START NEW RECONCILIATION SESSION */}
      {/* ========================================================================= */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-600 stroke-[1.25]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Start Bank &amp; Wallet Reconciliation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewSession} className="mt-4 space-y-3.5 text-xs">
              {/* Account Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank or Digital Wallet Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.accountType === 'DIGITAL_WALLET' ? 'WALLET' : 'BANK'}] #{acc.accountCode} - {acc.accountName} (Bal: Rs. {acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Period From <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newPeriodStart}
                    onChange={(e) => setNewPeriodStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Period To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newPeriodEnd}
                    onChange={(e) => setNewPeriodEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    required
                  />
                </div>
              </div>

              {/* Statement Balances */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statement Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOpeningBalance}
                    onChange={(e) => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statement Ending Balance <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEndingBalance}
                    onChange={(e) => setNewEndingBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Statement Format Preset */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Statement Format
                </label>
                <select
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="STANDARD_CSV">Standard Bank CSV (Date, Ref, Description, Debit, Credit)</option>
                  <option value="NABIL_BANK">Nabil Bank e-Banking Statement</option>
                  <option value="GLOBAL_IME">Global IME Bank Statement</option>
                  <option value="ESEWA_SETTLEMENT">eSewa Merchant Settlement Report</option>
                  <option value="KHALTI_SETTLEMENT">Khalti Merchant Payout Report</option>
                  <option value="MANUAL">Manual Transaction Entry Mode</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Month-end reconciliation as per bank physical copy"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewSession}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] hover:bg-[#082d25] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingNewSession ? 'Starting Session...' : 'Start Session & Load GL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPORT STATEMENT CSV / EXCEL */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-600 stroke-[1.25]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Import Statement Lines into Session
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitImport} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Format Mapping Preset
                </label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="STANDARD_CSV">Standard Bank CSV (Date, Ref, Description, Debit, Credit)</option>
                  <option value="NABIL_BANK">Nabil Bank e-Banking CSV</option>
                  <option value="GLOBAL_IME">Global IME Bank Statement CSV</option>
                  <option value="ESEWA_SETTLEMENT">eSewa Merchant Settlement Report</option>
                  <option value="KHALTI_SETTLEMENT">Khalti Merchant Payout Report</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste CSV Data Directly
                </label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="Date,Reference,Description,Debit,Credit&#10;2026-11-01,CHQ1001,Vendor Payment,25000,0&#10;2026-11-02,TXN5502,POS Restaurant Deposit,0,45000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingImport}
                  className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingImport ? 'Importing Lines...' : 'Parse & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD MANUAL STATEMENT LINE */}
      {/* ========================================================================= */}
      {isManualLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-600 stroke-[1.25]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Manual Statement Transaction
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsManualLineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualLine} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  >
                    <option value="DEPOSIT">Bank Deposit / Receipt</option>
                    <option value="PAYMENT">Bank Withdrawal / Payment</option>
                    <option value="BANK_CHARGE">Bank Charge / Fee</option>
                    <option value="WALLET_FEE">Wallet Gateway Fee (MDR)</option>
                    <option value="INTEREST">Interest Earned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cheque # / UTR / Reference
                </label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. CHQ-9901 or TXN-4402"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Narrative <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="e.g. Cash Deposit per counter receipt"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualLineModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualLine}
                  className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingManualLine ? 'Adding Line...' : 'Add Line'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: 1-CLICK POST GL ADJUSTMENT */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && adjustmentTargetStmtLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 stroke-[1.25]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Post Reconciliation GL Adjustment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px]">
                This action creates an automated balanced journal entry and immediately marks the statement line as matched.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Category
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="BANK_CHARGE">Bank Charge (Debit 5700 Bank Charges / Credit Bank)</option>
                  <option value="WALLET_FEE">Wallet Gateway Fee (Debit 5710 Wallet Charges / Credit Wallet)</option>
                  <option value="INTEREST">Interest Earned (Debit Bank / Credit 4900 Interest Income)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Journal Description / Narration
                </label>
                <input
                  type="text"
                  value={adjustmentDesc}
                  onChange={(e) => setAdjustmentDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Slip #
                </label>
                <input
                  type="text"
                  value={adjustmentRef}
                  onChange={(e) => setAdjustmentRef(e.target.value)}
                  placeholder="e.g. STMT-CHG-NOV"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingAdjustment ? 'Posting Voucher...' : 'Post Voucher & Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FINALIZE RECONCILIATION */}
      {/* ========================================================================= */}
      {isFinalizeModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Finalize Reconciliation Session
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFinalize} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statement Ending Balance:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Rs. {(activeSession.statementEndingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reconciled Bank Balance:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Rs. {(activeSession.reconciledBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Difference:</span>
                  <span
                    className={cn(
                      'font-mono font-black',
                      Math.abs(activeSession.difference) < 0.01
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    Rs. {Math.abs(activeSession.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {Math.abs(activeSession.difference) >= 0.01 && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Difference Detected</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-[11px]">
                    <input
                      type="checkbox"
                      checked={forceApproveDifference}
                      onChange={(e) => setForceApproveDifference(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>Authorize override and close session with documented discrepancy</span>
                  </label>
                  {forceApproveDifference && (
                    <input
                      type="text"
                      placeholder="Reason for discrepancy (required for override)"
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded"
                      required
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Approved By (Finance Officer / Auditor)
                </label>
                <input
                  type="text"
                  value={finalizeApprovedBy}
                  onChange={(e) => setFinalizeApprovedBy(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Closing Notes &amp; Audit Comments
                </label>
                <textarea
                  rows={2}
                  value={finalizeNotes}
                  onChange={(e) => setFinalizeNotes(e.target.value)}
                  placeholder="e.g. All bank deposits and uncleared cheques verified against subsequent clearance"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFinalize}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingFinalize ? 'Finalizing...' : 'Lock & Finalize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: OFFICIAL RECONCILIATION STATEMENT / CERTIFICATE REPORT */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-3xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Reconciliation Statement
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded bg-[#0B3D32] text-white hover:bg-[#082d25] dark:bg-emerald-600 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoadingReport || !reportData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading statement report...</div>
            ) : (
              <div id="print-certificate-area" className="mt-4 space-y-6 text-slate-900 dark:text-slate-100 text-xs">
                {/* Header */}
                <div className="text-center pb-3 border-b-2 border-slate-900 dark:border-slate-100">
                  <h1 className="text-base font-black uppercase tracking-wider">
                    Everest Family Restaurant Pvt. Ltd.
                  </h1>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    Bank &amp; Digital Wallet Reconciliation Statement
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Session Reference: {reportData.reconciliationNumber} &bull; Generated: {new Date().toLocaleDateString()}
                  </div>
                </div>

                {/* Account & Period Meta */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                  <div>
                    <div>
                      <span className="text-slate-500">Account Name:</span>{' '}
                      <span className="font-bold">{reportData.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">GL Account Code:</span>{' '}
                      <span className="font-mono font-bold">#{reportData.accountCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Bank / Provider:</span>{' '}
                      <span className="font-semibold">{reportData.bankOrProvider}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Account # / ID:</span>{' '}
                      <span className="font-mono">{reportData.accountNumber}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>
                      <span className="text-slate-500">Statement Cut-Off Date:</span>{' '}
                      <span className="font-bold">
                        {new Date(reportData.statementDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reconciliation Period:</span>{' '}
                      <span>
                        {new Date(reportData.periodStartDate).toLocaleDateString()} &minus;{' '}
                        {new Date(reportData.periodEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>{' '}
                      <span className="font-bold uppercase text-emerald-600">{reportData.status}</span>
                    </div>
                  </div>
                </div>

                {/* Formal 4-Stage Reconciliation Calculation Schedule */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 font-bold uppercase text-[10px] tracking-wider text-slate-700 dark:text-slate-300">
                    A. Bank / Wallet Statement Reconciliation Schedule
                  </div>
                  <div className="p-3 space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex justify-between font-semibold">
                      <span>Statement Ending Balance</span>
                      <span className="font-mono font-black">
                        Rs. {(reportData.statementEndingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                        <span>ADD: Deposits in Transit (System Deposits Not Yet on Statement)</span>
                        <span className="font-mono">
                          + Rs. {(reportData.totalDepositsInTransit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {reportData.depositsInTransit && reportData.depositsInTransit.length > 0 && (
                        <div className="pl-4 pt-1 space-y-0.5 text-[10px] text-slate-500 font-mono">
                          {reportData.depositsInTransit.map((d: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>&bull; {new Date(d.transactionDate).toLocaleDateString()} &ndash; {d.description}</span>
                              <span>Rs. {Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between font-bold text-purple-700 dark:text-purple-400">
                        <span>LESS: Outstanding Cheques &amp; Payments (System Payments Not Yet Cleared)</span>
                        <span className="font-mono">
                          &minus; Rs. {(reportData.totalOutstandingChecks || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {reportData.outstandingPayments && reportData.outstandingPayments.length > 0 && (
                        <div className="pl-4 pt-1 space-y-0.5 text-[10px] text-slate-500 font-mono">
                          {reportData.outstandingPayments.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>&bull; {new Date(p.transactionDate).toLocaleDateString()} &ndash; {p.description}</span>
                              <span>Rs. {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between font-black text-sm pt-2 border-t-2 border-slate-900 dark:border-slate-100">
                      <span>EQUALS: Reconciled Bank / Wallet Balance</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">
                        Rs. {(reportData.reconciledBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section B: General Ledger Book Comparison */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 font-bold uppercase text-[10px] tracking-wider text-slate-700 dark:text-slate-300">
                    B. General Ledger Book Balance Comparison
                  </div>
                  <div className="p-3 space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex justify-between font-semibold">
                      <span>General Ledger Ending Book Balance</span>
                      <span className="font-mono font-black">
                        Rs. {(reportData.bookEndingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between font-black text-xs pt-2">
                      <span>Adjusted General Ledger Balance</span>
                      <span className="font-mono">
                        Rs. {(reportData.adjustedBookBalance || reportData.bookEndingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between font-black text-xs pt-2 text-emerald-700 dark:text-emerald-400">
                      <span>Net Difference / Variance</span>
                      <span className="font-mono">
                        Rs. {Math.abs(reportData.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sign-off Blocks */}
                <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[10px]">
                  <div>
                    <div className="border-b border-slate-400 pb-1 font-bold">
                      {reportData.reconciledBy || 'Staff Accountant'}
                    </div>
                    <div className="text-slate-400 mt-1">Prepared By (Accountant)</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 pb-1 font-bold">
                      Internal Audit Desk
                    </div>
                    <div className="text-slate-400 mt-1">Verified By (Auditor)</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 pb-1 font-bold">
                      {reportData.approvedBy || 'Finance Director'}
                    </div>
                    <div className="text-slate-400 mt-1">Approved By (Management)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
