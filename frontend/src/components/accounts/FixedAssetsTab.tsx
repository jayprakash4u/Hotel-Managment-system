'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  SlidersHorizontal,
  X,
  CreditCard,
  Edit2,
  Trash2,
  RotateCcw,
  BarChart3,
  Layers,
  ArrowRight,
  Check,
  Tag,
  Receipt,
  DollarSign,
  ArrowLeftRight,
  Play,
  Settings,
  HelpCircle,
  Hash,
  MapPin,
  Briefcase
} from 'lucide-react';
import { fixedAssetsApi, api } from '@/lib/api';
import {
  FixedAssetItem,
  AssetCategoryItem,
  AssetDepreciationEntryItem,
  AssetMovementItem,
  FixedAssetsSummary,
  FixedAssetsReportsData,
  CreateFixedAssetDto,
  TransferAssetDto,
  DisposeAssetDto,
  BatchDepreciationDto,
  CreateAssetCategoryDto,
  AccountItem
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function FixedAssetsTab() {
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<FixedAssetItem[]>([]);
  const [summary, setSummary] = useState<FixedAssetsSummary>({
    totalAssetCost: 0,
    accumulatedDepreciation: 0,
    currentBookValue: 0,
    totalActiveAssets: 0,
    fullyDepreciatedCount: 0,
    disposedCount: 0,
    draftCount: 0,
    totalAssetsCount: 0,
  });

  const [categories, setCategories] = useState<AssetCategoryItem[]>([]);
  const [glAccounts, setGlAccounts] = useState<Array<{
    id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    subCategory?: string;
    currentBalance: number;
  }>>([]);

  // Pagination & Filtering
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBatchDeprModalOpen, setIsBatchDeprModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPrintSlipModalOpen, setIsPrintSlipModalOpen] = useState(false);

  // Selected Asset & Sub-tab in Detail Modal
  const [selectedAsset, setSelectedAsset] = useState<FixedAssetItem | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'SCHEDULE' | 'MOVEMENTS' | 'DISPOSAL'>('SCHEDULE');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State - Add / Edit Asset
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('Main Kitchen');
  const [formDepartment, setFormDepartment] = useState('Food & Beverage');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formBranch, setFormBranch] = useState('Main Outlet');
  const [formPurchaseDate, setFormPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formPurchaseCost, setFormPurchaseCost] = useState<number | ''>('');
  const [formAdditionalCosts, setFormAdditionalCosts] = useState<number | ''>(0);
  const [formPaymentMode, setFormPaymentMode] = useState<'BANK' | 'CASH' | 'CREDIT' | 'OPENING_BALANCE'>('BANK');
  const [formPaymentAccountId, setFormPaymentAccountId] = useState('');
  const [formPaymentRef, setFormPaymentRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formUsefulLifeYears, setFormUsefulLifeYears] = useState<number | ''>(5);
  const [formResidualValue, setFormResidualValue] = useState<number | ''>(0);
  const [formDeprStartDate, setFormDeprStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formAutoCapitalize, setFormAutoCapitalize] = useState(true);

  // Form State - Batch Depreciation
  const now = new Date();
  const [batchYear, setBatchYear] = useState<number>(now.getFullYear());
  const [batchMonth, setBatchMonth] = useState<number>(now.getMonth() + 1);

  // Form State - Transfer Asset
  const [transferLocation, setTransferLocation] = useState('Dining Hall');
  const [transferDepartment, setTransferDepartment] = useState('Service');
  const [transferAssignedTo, setTransferAssignedTo] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferredBy, setTransferredBy] = useState('General Manager');

  // Form State - Dispose Asset
  const [disposalDate, setDisposalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [disposalType, setDisposalType] = useState<'SOLD' | 'SCRAPPED' | 'WRITTEN_OFF'>('SOLD');
  const [disposalAmount, setDisposalAmount] = useState<number | ''>(0);
  const [disposalReceivingAccountId, setDisposalReceivingAccountId] = useState('');
  const [disposalReason, setDisposalReason] = useState('');
  const [disposalRef, setDisposalRef] = useState('');

  // Form State - Category Setup
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrefix, setNewCatPrefix] = useState('FA');
  const [newCatAssetAccountId, setNewCatAssetAccountId] = useState('');
  const [newCatAccumAccountId, setNewCatAccumAccountId] = useState('');
  const [newCatExpenseAccountId, setNewCatExpenseAccountId] = useState('');
  const [newCatLife, setNewCatLife] = useState<number>(5);
  const [newCatResidualPct, setNewCatResidualPct] = useState<number>(5);
  const [newCatDesc, setNewCatDesc] = useState('');

  // Reports
  const [reportsData, setReportsData] = useState<FixedAssetsReportsData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fixedAssetsApi.getSummary();
      if (res) setSummary(res);
    } catch (err: any) {
      console.error('Failed to load fixed assets summary:', err);
    }
  }, []);

  // 2. Fetch Assets List
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fixedAssetsApi.getAssets({
        search: searchQuery.trim() || undefined,
        categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        location: locationFilter !== 'ALL' ? locationFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        page,
        pageSize,
      });

      if (res) {
        setAssets(res.items || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load fixed assets register.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, locationFilter, departmentFilter, page, pageSize, toastError]);

  // 3. Fetch Master Metadata (Categories & GL Accounts)
  const fetchMasterData = useCallback(async () => {
    try {
      const [catsRes, accountsRes] = await Promise.all([
        fixedAssetsApi.getCategories(),
        fixedAssetsApi.getAccountsMetadata(),
      ]);

      if (catsRes) {
        setCategories(catsRes);
        if (catsRes.length > 0 && !formCategoryId) {
          setFormCategoryId(catsRes[0].id);
          setFormUsefulLifeYears(catsRes[0].defaultUsefulLifeYears || 5);
        }
      }

      if (accountsRes) {
        setGlAccounts(accountsRes);
        // Default bank/cash account
        const defaultCashOrBank = accountsRes.find((a) => a.accountType === 'ASSET' && (a.accountCode.startsWith('101') || a.accountCode.startsWith('102')));
        if (defaultCashOrBank && !formPaymentAccountId) {
          setFormPaymentAccountId(defaultCashOrBank.id);
        }
        if (defaultCashOrBank && !disposalReceivingAccountId) {
          setDisposalReceivingAccountId(defaultCashOrBank.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load master metadata for fixed assets:', err);
    }
  }, [formCategoryId, formPaymentAccountId, disposalReceivingAccountId]);

  // Initial Load
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchSummary();
    fetchAssets();
  }, [fetchSummary, fetchAssets]);

  // Sync category defaults when formCategoryId changes in Add Modal
  const handleCategoryChange = (catId: string) => {
    setFormCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      if (cat.defaultUsefulLifeYears) {
        setFormUsefulLifeYears(cat.defaultUsefulLifeYears);
      }
      if (cat.defaultResidualValuePercentage && formPurchaseCost) {
        const cost = Number(formPurchaseCost) + Number(formAdditionalCosts || 0);
        setFormResidualValue(Math.round((cost * cat.defaultResidualValuePercentage) / 100));
      }
    }
  };

  // Live Calculations for Add Form
  const liveTotalCapitalized = useMemo(() => {
    const cost = Number(formPurchaseCost) || 0;
    const add = Number(formAdditionalCosts) || 0;
    return cost + add;
  }, [formPurchaseCost, formAdditionalCosts]);

  const liveDepreciableAmount = useMemo(() => {
    const residual = Number(formResidualValue) || 0;
    return Math.max(0, liveTotalCapitalized - residual);
  }, [liveTotalCapitalized, formResidualValue]);

  const liveAnnualDepreciation = useMemo(() => {
    const years = Number(formUsefulLifeYears) || 0;
    if (years <= 0) return 0;
    return Math.round((liveDepreciableAmount / years) * 100) / 100;
  }, [liveDepreciableAmount, formUsefulLifeYears]);

  const liveMonthlyDepreciation = useMemo(() => {
    return Math.round((liveAnnualDepreciation / 12) * 100) / 100;
  }, [liveAnnualDepreciation]);

  // Open Detailed Asset View
  const handleViewAsset = async (asset: FixedAssetItem) => {
    try {
      const detailed = await fixedAssetsApi.getAssetById(asset.id);
      setSelectedAsset(detailed);
      setDetailActiveTab('SCHEDULE');
      setIsDetailModalOpen(true);
    } catch (err: any) {
      toastError('Failed to fetch asset details: ' + (err?.message || ''));
    }
  };

  // Open Edit Modal (allowed for DRAFT or updating metadata)
  const handleOpenEdit = (asset: FixedAssetItem) => {
    setSelectedAsset(asset);
    setFormName(asset.assetName);
    setFormCategoryId(asset.categoryId);
    setFormDescription(asset.description || '');
    setFormLocation(asset.location || 'Main Kitchen');
    setFormDepartment(asset.department || 'Food & Beverage');
    setFormAssignedTo(asset.assignedTo || '');
    setFormSerialNumber(asset.serialNumber || '');
    setFormBarcode(asset.barcode || '');
    setFormBranch(asset.branchOrOutlet || 'Main Outlet');
    setFormPurchaseDate(asset.purchaseDate.slice(0, 10));
    setFormSupplierName(asset.supplierName || '');
    setFormInvoiceNumber(asset.supplierInvoiceNumber || '');
    setFormPurchaseCost(asset.purchaseCost);
    setFormAdditionalCosts(asset.additionalCapitalizedCosts);
    setFormPaymentMode((asset.acquisitionPaymentMode as any) || 'BANK');
    setFormPaymentAccountId(asset.paymentAccountId || '');
    setFormPaymentRef(asset.paymentReference || '');
    setFormNotes(asset.notes || '');
    setFormUsefulLifeYears(asset.usefulLifeYears);
    setFormResidualValue(asset.residualValue);
    setFormDeprStartDate(asset.depreciationStartDate.slice(0, 10));
    setIsEditModalOpen(true);
  };

  // Submit Add / Edit Asset
  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toastError('Asset name is required.');
      return;
    }
    if (!formCategoryId) {
      toastError('Please select an asset category.');
      return;
    }
    const cost = Number(formPurchaseCost);
    if (!cost || cost <= 0) {
      toastError('Purchase cost must be greater than zero.');
      return;
    }
    const lifeYears = Number(formUsefulLifeYears);
    if (!lifeYears || lifeYears <= 0) {
      toastError('Useful life must be at least 1 year.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: CreateFixedAssetDto = {
        assetName: formName.trim(),
        categoryId: formCategoryId,
        description: formDescription.trim() || undefined,
        location: formLocation.trim() || 'Main Kitchen',
        department: formDepartment.trim() || 'Food & Beverage',
        assignedTo: formAssignedTo.trim() || undefined,
        serialNumber: formSerialNumber.trim() || undefined,
        barcode: formBarcode.trim() || undefined,
        branchOrOutlet: formBranch.trim() || 'Main Outlet',
        purchaseDate: new Date(formPurchaseDate).toISOString(),
        supplierName: formSupplierName.trim() || undefined,
        supplierInvoiceNumber: formInvoiceNumber.trim() || undefined,
        purchaseCost: cost,
        additionalCapitalizedCosts: Number(formAdditionalCosts) || 0,
        acquisitionPaymentMode: formPaymentMode,
        paymentAccountId: formPaymentMode !== 'OPENING_BALANCE' ? formPaymentAccountId || undefined : undefined,
        paymentReference: formPaymentRef.trim() || undefined,
        notes: formNotes.trim() || undefined,
        usefulLifeYears: lifeYears,
        residualValue: Number(formResidualValue) || 0,
        depreciationStartDate: new Date(formDeprStartDate).toISOString(),
        depreciationFrequency: 'MONTHLY',
        autoCapitalize: formAutoCapitalize,
        createdBy: 'Admin Accountant',
      };

      if (isEditModalOpen && selectedAsset) {
        await fixedAssetsApi.updateAsset(selectedAsset.id, payload);
        success(`Fixed asset ${selectedAsset.assetCode} updated.`);
        setIsEditModalOpen(false);
      } else {
        const created = await fixedAssetsApi.createAsset(payload);
        success(`Fixed asset ${created.assetCode} created and registered successfully!`);
        setIsAddModalOpen(false);
      }

      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save asset.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Delete Draft Asset
  const handleDeleteAsset = async (asset: FixedAssetItem) => {
    if (asset.status !== 'DRAFT') {
      toastError('Only assets in DRAFT status can be deleted. Use Dispose for active assets.');
      return;
    }
    if (!confirm(`Delete draft asset ${asset.assetCode} (${asset.assetName})?`)) return;

    try {
      setIsSubmittingAction(true);
      await fixedAssetsApi.deleteAsset(asset.id);
      success(`Draft asset ${asset.assetCode} deleted.`);
      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete asset.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Post Single Month Depreciation
  const handlePostPeriodDepreciation = async (assetId: string, periodNumber?: number) => {
    try {
      setIsSubmittingAction(true);
      const res = await fixedAssetsApi.postAssetDepreciation(assetId, periodNumber);
      success(`Depreciation posted! JV #${res.journalEntryNumber} for period ${res.periodKey} (Rs. ${res.depreciationAmount.toLocaleString()}).`);
      
      // Refresh current detailed asset if open
      if (selectedAsset && selectedAsset.id === assetId) {
        const refreshed = await fixedAssetsApi.getAssetById(assetId);
        setSelectedAsset(refreshed);
      }
      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post monthly depreciation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Run Batch Monthly Depreciation
  const handleRunBatchDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAction(true);
      const res = await fixedAssetsApi.runBatchDepreciation({
        year: batchYear,
        month: batchMonth,
      });

      if (res.processedAssetsCount === 0) {
        toastError(`No pending depreciation entries found for period ${res.periodKey}.`);
      } else {
        success(`Batch run completed for ${res.periodKey}! Posted Rs. ${res.totalDepreciationAmount.toLocaleString()} across ${res.processedAssetsCount} assets.`);
        setIsBatchDeprModalOpen(false);
      }

      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Batch depreciation failed.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (asset: FixedAssetItem) => {
    if (asset.status === 'DISPOSED') {
      toastError('Cannot transfer a disposed asset.');
      return;
    }
    setSelectedAsset(asset);
    setTransferLocation(asset.location || 'Dining Hall');
    setTransferDepartment(asset.department || 'Food & Beverage');
    setTransferAssignedTo(asset.assignedTo || '');
    setTransferReason('');
    setIsTransferModalOpen(true);
  };

  // Submit Asset Transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!transferLocation.trim()) {
      toastError('Target location is required.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: TransferAssetDto = {
        toLocation: transferLocation.trim(),
        toDepartment: transferDepartment.trim() || undefined,
        toAssignedTo: transferAssignedTo.trim() || undefined,
        reason: transferReason.trim() || 'Internal asset relocation',
        transferredBy: transferredBy.trim() || 'Manager',
      };

      await fixedAssetsApi.transferAsset(selectedAsset.id, payload);
      success(`Asset ${selectedAsset.assetCode} transferred to ${transferLocation}.`);
      setIsTransferModalOpen(false);

      if (isDetailModalOpen) {
        const refreshed = await fixedAssetsApi.getAssetById(selectedAsset.id);
        setSelectedAsset(refreshed);
      }
      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record asset transfer.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Disposal Modal
  const handleOpenDispose = (asset: FixedAssetItem) => {
    if (asset.status === 'DISPOSED') {
      toastError('This asset is already disposed.');
      return;
    }
    setSelectedAsset(asset);
    setDisposalDate(new Date().toISOString().slice(0, 10));
    setDisposalType('SOLD');
    setDisposalAmount(0);
    setDisposalReason('');
    setDisposalRef('');
    setIsDisposeModalOpen(true);
  };

  // Live Disposal Gain / Loss Calculation
  const disposalGainOrLoss = useMemo(() => {
    if (!selectedAsset) return { amount: 0, isGain: false };
    const proceeds = Number(disposalAmount) || 0;
    const nbv = selectedAsset.currentBookValue;
    const diff = proceeds - nbv;
    return {
      amount: Math.abs(Math.round(diff * 100) / 100),
      isGain: diff >= 0,
    };
  }, [selectedAsset, disposalAmount]);

  // Submit Disposal
  const handleSubmitDisposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const proceeds = Number(disposalAmount) || 0;
    if (disposalType === 'SOLD' && proceeds > 0 && !disposalReceivingAccountId) {
      toastError('Please select a bank or cash receiving account for disposal proceeds.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: DisposeAssetDto = {
        disposalDate: new Date(disposalDate).toISOString(),
        disposalType,
        disposalAmount: proceeds,
        receivingAccountId: proceeds > 0 ? disposalReceivingAccountId || undefined : undefined,
        reason: disposalReason.trim() || `Asset derecognized via ${disposalType}`,
        reference: disposalRef.trim() || undefined,
        disposedBy: 'Senior Accountant',
      };

      const disposed = await fixedAssetsApi.disposeAsset(selectedAsset.id, payload);
      success(`Asset ${selectedAsset.assetCode} disposed! Derecognized with JV #${disposed.disposalJournalEntryNumber || ''}.`);
      setIsDisposeModalOpen(false);

      if (isDetailModalOpen) {
        const refreshed = await fixedAssetsApi.getAssetById(selectedAsset.id);
        setSelectedAsset(refreshed);
      }
      fetchSummary();
      fetchAssets();
    } catch (err: any) {
      toastError(err?.message || 'Failed to dispose asset.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Create New Asset Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toastError('Category name is required.');
      return;
    }
    if (!newCatAssetAccountId || !newCatAccumAccountId || !newCatExpenseAccountId) {
      toastError('All three General Ledger accounts (Cost, Contra-Asset, Expense) must be mapped.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: CreateAssetCategoryDto = {
        categoryName: newCatName.trim(),
        codePrefix: newCatPrefix.trim().toUpperCase() || 'FA',
        assetAccountId: newCatAssetAccountId,
        accumulatedDepreciationAccountId: newCatAccumAccountId,
        depreciationExpenseAccountId: newCatExpenseAccountId,
        defaultUsefulLifeYears: Number(newCatLife) || 5,
        defaultResidualValuePercentage: Number(newCatResidualPct) || 0,
        description: newCatDesc.trim() || undefined,
      };

      const created = await fixedAssetsApi.createCategory(payload);
      success(`Asset category "${created.categoryName}" added.`);
      setNewCatName('');
      setNewCatDesc('');
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create category.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: AssetCategoryItem) => {
    if (cat.isSystem) {
      toastError('System default categories cannot be deleted.');
      return;
    }
    if (!confirm(`Delete category "${cat.categoryName}"? Assets must not be linked to it.`)) return;

    try {
      await fixedAssetsApi.deleteCategory(cat.id);
      success('Category deleted.');
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete category.');
    }
  };

  // Open Reports Modal
  const openReportsModal = async () => {
    setIsReportsModalOpen(true);
    try {
      setReportsLoading(true);
      const rep = await fixedAssetsApi.getReports();
      setReportsData(rep);
    } catch (err: any) {
      toastError('Failed to load fixed assets reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  // Export Asset Register to CSV
  const handleExportCSV = () => {
    const headers = [
      'Asset Code',
      'Asset Name',
      'Category',
      'Location',
      'Department',
      'Assigned To',
      'Serial Number',
      'Purchase Date',
      'Purchase Cost',
      'Additional Costs',
      'Total Capitalized Cost',
      'Useful Life (Yrs)',
      'Residual Value',
      'Annual Depr',
      'Monthly Depr',
      'Accumulated Depr',
      'Current Book Value',
      'Status',
      'Last Depr Date',
    ];

    const rows = assets.map((a) => [
      a.assetCode,
      `"${a.assetName.replace(/"/g, '""')}"`,
      `"${a.categoryName}"`,
      `"${a.location}"`,
      `"${a.department}"`,
      `"${a.assignedTo || ''}"`,
      `"${a.serialNumber || ''}"`,
      new Date(a.purchaseDate).toLocaleDateString(),
      a.purchaseCost,
      a.additionalCapitalizedCosts,
      a.totalCapitalizedCost,
      a.usefulLifeYears,
      a.residualValue,
      a.annualDepreciation,
      a.monthlyDepreciation,
      a.accumulatedDepreciation,
      a.currentBookValue,
      a.status,
      a.lastDepreciationDate ? new Date(a.lastDepreciationDate).toLocaleDateString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fixed_Assets_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Print Slip
  const handlePrintSlip = (asset: FixedAssetItem) => {
    setSelectedAsset(asset);
    setIsPrintSlipModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
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
            <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 stroke-[1.25]" />
            Fixed Assets Management
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormName('');
              setFormPurchaseCost('');
              setFormAdditionalCosts(0);
              setFormResidualValue(0);
              setFormNotes('');
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fixed Asset</span>
          </button>

          <button
            onClick={() => setIsBatchDeprModalOpen(true)}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-emerald-700 text-[#0B3D32] dark:text-emerald-400 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 transition-colors"
            title="Batch calculate and post monthly straight-line depreciation to General Ledger"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Depreciation</span>
          </button>

          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Categories</span>
          </button>

          <button
            onClick={openReportsModal}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Reports</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              fetchSummary();
              fetchAssets();
            }}
            disabled={loading}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0B3D32]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Compact Financial Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Asset Cost */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Asset Cost</span>
            <Building2 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            Rs. {summary.totalAssetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Historical Gross Cost</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{summary.totalAssetsCount} Registered</span>
          </div>
        </div>

        {/* Accumulated Depreciation */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Accumulated Depr.</span>
            <RotateCcw className="w-4 h-4 text-amber-600 stroke-[1.25]" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            Rs. {summary.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Written Off</span>
            <span className="font-medium text-amber-700 dark:text-amber-300">
              {summary.totalAssetCost > 0
                ? `${Math.round((summary.accumulatedDepreciation / summary.totalAssetCost) * 100)}% Depreciated`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Current Book Value */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Current Book Value</span>
            <DollarSign className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 stroke-[1.25]" />
          </div>
          <div className="text-xl font-bold text-[#0B3D32] dark:text-emerald-400">
            Rs. {summary.currentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Balance Sheet Carrying Net</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
              Net Asset
            </span>
          </div>
        </div>

        {/* Active Assets Status Breakdown */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Active Assets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.totalActiveAssets} <span className="text-xs font-normal text-slate-500">Active</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {summary.fullyDepreciatedCount} Fully Depr.
            </span>
            <span>•</span>
            <span className="text-slate-500">{summary.disposedCount} Disposed</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search code, name, serial #, custodian..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Depreciating)</option>
              <option value="FULLY_DEPRECIATED">Fully Depreciated</option>
              <option value="DISPOSED">Disposed / Written Off</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setLocationFilter('ALL');
                setDepartmentFilter('ALL');
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* 4. Asset Register Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Asset Code</th>
                <th className="py-2.5 px-3">Asset Name &amp; Category</th>
                <th className="py-2.5 px-3">Location &amp; Dept</th>
                <th className="py-2.5 px-3">Purchase Date</th>
                <th className="py-2.5 px-3 text-right">Capitalized Cost</th>
                <th className="py-2.5 px-3 text-right">Accum. Depr.</th>
                <th className="py-2.5 px-3 text-right">Current Book Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                      <span>Loading fixed assets register...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.25]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No fixed assets found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try adjusting your filters.'
                        : 'Click "+ Add Fixed Asset" to register your restaurant equipment.'}
                    </p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Code */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                        {asset.assetCode}
                      </span>
                      {asset.serialNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          SN: {asset.serialNumber}
                        </div>
                      )}
                    </td>

                    {/* Name & Category */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {asset.assetName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                          {asset.categoryName}
                        </span>
                        {asset.assignedTo && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <User className="w-3 h-3" /> {asset.assignedTo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location & Dept */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {asset.location}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5 text-slate-400" />
                        {asset.department}
                      </div>
                    </td>

                    {/* Purchase Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {new Date(asset.purchaseDate).toLocaleDateString()}
                    </td>

                    {/* Capitalized Cost */}
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      Rs. {asset.totalCapitalizedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Accumulated Depreciation */}
                    <td className="py-2.5 px-3 text-right font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      Rs. {asset.accumulatedDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Current Book Value */}
                    <td className="py-2.5 px-3 text-right font-bold text-[#0B3D32] dark:text-emerald-400 whitespace-nowrap">
                      Rs. {asset.currentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {asset.status === 'ACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ACTIVE
                        </span>
                      )}
                      {asset.status === 'FULLY_DEPRECIATED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          FULLY DEPR.
                        </span>
                      )}
                      {asset.status === 'DISPOSED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          DISPOSED
                        </span>
                      )}
                      {asset.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          DRAFT
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Details & Schedule */}
                        <button
                          onClick={() => handleViewAsset(asset)}
                          className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
                          title="View Asset Details & Schedule"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Post Next Month Depreciation (If ACTIVE) */}
                        {asset.status === 'ACTIVE' && (
                          <button
                            onClick={() => handlePostPeriodDepreciation(asset.id)}
                            className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Post Next Monthly Depreciation Period"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Transfer */}
                        {asset.status !== 'DISPOSED' && (
                          <button
                            onClick={() => handleOpenTransfer(asset)}
                            className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Transfer Location / Department"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Dispose */}
                        {asset.status !== 'DISPOSED' && (
                          <button
                            onClick={() => handleOpenDispose(asset)}
                            className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Dispose / Derecognize Asset"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Slip */}
                        <button
                          onClick={() => handlePrintSlip(asset)}
                          className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Asset Tag / Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete if Draft */}
                        {asset.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Permanent DataTables Bottom-Right Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {totalCount}
            </span>{' '}
            assets
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                « First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Last »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT FIXED ASSET                                           */}
      {/* ========================================================================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <Building2 className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isEditModalOpen ? `Edit Asset: ${selectedAsset?.assetCode}` : 'Register New Fixed Asset'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Straight-line depreciation with automatic monthly schedules and General Ledger posting
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAsset} className="space-y-4 text-xs">
              {/* Section 1: Basic Information */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  1. Asset Identification &amp; Category
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Asset Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commercial 4-Burner Gas Range"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Asset Category *
                    </label>
                    <select
                      required
                      value={formCategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName} ({c.codePrefix}-XXXX)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Main Kitchen / Bar / Dining"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Food & Beverage / Front Desk"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Assigned To / Custodian
                    </label>
                    <input
                      type="text"
                      value={formAssignedTo}
                      onChange={(e) => setFormAssignedTo(e.target.value)}
                      placeholder="e.g. Head Chef / Bar Captain"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={formSerialNumber}
                      onChange={(e) => setFormSerialNumber(e.target.value)}
                      placeholder="e.g. SN-892348-KG"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Acquisition & Capitalization */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  2. Purchase &amp; Capitalization Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Cost (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={formPurchaseCost}
                      onChange={(e) => setFormPurchaseCost(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Additional Capitalized (Freight/Duty)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={formAdditionalCosts}
                      onChange={(e) => setFormAdditionalCosts(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Acquisition Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    >
                      <option value="BANK">Bank Account</option>
                      <option value="CASH">Cash Account</option>
                      <option value="CREDIT">Supplier Credit (Payable 2010)</option>
                      <option value="OPENING_BALANCE">Historical Opening Balance (No Bank Outflow)</option>
                    </select>
                  </div>

                  {formPaymentMode !== 'OPENING_BALANCE' && formPaymentMode !== 'CREDIT' && (
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Disbursement Bank / Cash Account *
                      </label>
                      <select
                        value={formPaymentAccountId}
                        onChange={(e) => setFormPaymentAccountId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                      >
                        {glAccounts
                          .filter((a) => a.accountType === 'ASSET' && (a.accountCode.startsWith('101') || a.accountCode.startsWith('102') || a.accountCode.startsWith('105')))
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.accountCode}) — Rs. {acc.currentBalance.toLocaleString()}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Total Capitalized Cost (Historical Basis):
                  </span>
                  <span className="font-bold text-sm text-[#0B3D32] dark:text-emerald-300">
                    Rs. {liveTotalCapitalized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Section 3: Depreciation Parameters */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  3. Depreciation Parameters (Straight-Line Method)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Useful Life (Years) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="50"
                      required
                      value={formUsefulLifeYears}
                      onChange={(e) => setFormUsefulLifeYears(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Residual / Scrap Value (Rs.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={formResidualValue}
                      onChange={(e) => setFormResidualValue(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Depreciation Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDeprStartDate}
                      onChange={(e) => setFormDeprStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-slate-100 dark:bg-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Depreciable Base</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      Rs. {liveDepreciableAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Annual Depreciation</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      Rs. {liveAnnualDepreciation.toLocaleString()} / yr
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Monthly Depreciation</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {liveMonthlyDepreciation.toLocaleString()} / mo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoCapitalizeCheckbox"
                    checked={formAutoCapitalize}
                    onChange={(e) => setFormAutoCapitalize(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
                  />
                  <label htmlFor="autoCapitalizeCheckbox" className="text-slate-700 dark:text-slate-300 text-xs">
                    Auto-capitalize &amp; post acquisition Journal Entry to General Ledger immediately
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isEditModalOpen ? 'Save Changes' : 'Register & Generate Schedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSET DETAILS & DEPRECIATION SCHEDULE MODAL                       */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                    {selectedAsset.assetCode}
                  </span>
                  <span className="text-slate-400">•</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedAsset.assetName}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedAsset.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : selectedAsset.status === 'FULLY_DEPRECIATED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Category: {selectedAsset.categoryName} | Location: {selectedAsset.location} ({selectedAsset.department})
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Financial Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-center">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Capitalized Cost</div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  Rs. {selectedAsset.totalCapitalizedCost.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Accumulated Depr.</div>
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  Rs. {selectedAsset.accumulatedDepreciation.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Current Book Value</div>
                <div className="font-bold text-[#0B3D32] dark:text-emerald-400">
                  Rs. {selectedAsset.currentBookValue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Monthly Depr. Rate</div>
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  Rs. {selectedAsset.monthlyDepreciation.toLocaleString()} / mo
                </div>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-3 text-xs font-semibold">
              <button
                onClick={() => setDetailActiveTab('SCHEDULE')}
                className={`pb-2 px-2 transition-colors border-b-2 ${
                  detailActiveTab === 'SCHEDULE'
                    ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Depreciation Schedule ({selectedAsset.depreciationEntries?.length || 0} Periods)
              </button>

              <button
                onClick={() => setDetailActiveTab('MOVEMENTS')}
                className={`pb-2 px-2 transition-colors border-b-2 ${
                  detailActiveTab === 'MOVEMENTS'
                    ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Movement / Transfer Log ({selectedAsset.movements?.length || 0})
              </button>

              {selectedAsset.status === 'DISPOSED' && (
                <button
                  onClick={() => setDetailActiveTab('DISPOSAL')}
                  className={`pb-2 px-2 transition-colors border-b-2 ${
                    detailActiveTab === 'DISPOSAL'
                      ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Disposal / Derecognition
                </button>
              )}
            </div>

            {/* Tab 1: Depreciation Schedule Table */}
            {detailActiveTab === 'SCHEDULE' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[50vh]">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Posted Periods:{' '}
                    <strong className="text-emerald-600">
                      {selectedAsset.depreciationPeriodsPostedCount}
                    </strong>{' '}
                    / {selectedAsset.depreciationEntries?.length || 0}
                  </span>
                  {selectedAsset.status === 'ACTIVE' && (
                    <button
                      onClick={() => handlePostPeriodDepreciation(selectedAsset.id)}
                      disabled={isSubmittingAction}
                      className="px-3 py-1 rounded bg-[#0B3D32] hover:bg-[#082b23] text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Post Next Month</span>
                    </button>
                  )}
                </div>

                <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-2.5 text-center">#</th>
                        <th className="py-2 px-2.5">Period Key</th>
                        <th className="py-2 px-2.5 text-right">Opening Basis</th>
                        <th className="py-2 px-2.5 text-right">Depreciation</th>
                        <th className="py-2 px-2.5 text-right">Accumulated</th>
                        <th className="py-2 px-2.5 text-right">Closing Value</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                        <th className="py-2 px-2.5 text-center">GL Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {selectedAsset.depreciationEntries?.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                            entry.status === 'POSTED' ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">
                            {entry.periodNumber}
                          </td>
                          <td className="py-1.5 px-2.5 font-medium text-slate-700 dark:text-slate-300">
                            {entry.periodKey}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-600 dark:text-slate-400">
                            Rs. {entry.openingBookValue.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                            Rs. {entry.depreciationAmount.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-600 dark:text-slate-400">
                            Rs. {entry.accumulatedDepreciation.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-bold text-[#0B3D32] dark:text-emerald-400">
                            Rs. {entry.closingBookValue.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            {entry.status === 'POSTED' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                POSTED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {entry.journalEntryNumber || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Movements Log */}
            {detailActiveTab === 'MOVEMENTS' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[50vh]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Asset Location &amp; Custody Audit Log</span>
                  <button
                    onClick={() => handleOpenTransfer(selectedAsset)}
                    className="px-2.5 py-1 rounded bg-[#0B3D32] hover:bg-[#082b23] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Transfer Now</span>
                  </button>
                </div>

                {(!selectedAsset.movements || selectedAsset.movements.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No relocation history recorded for this asset yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded border border-slate-200 dark:border-slate-800">
                    {selectedAsset.movements.map((m) => (
                      <div key={m.id} className="p-3 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span>{m.fromLocation || 'Initial'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[#0B3D32] dark:text-emerald-400 font-bold">{m.toLocation}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Reason: {m.reason || 'Relocation'} • By: {m.transferredBy || 'Admin'}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(m.transferDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Disposal Details */}
            {detailActiveTab === 'DISPOSAL' && selectedAsset.status === 'DISPOSED' && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                    Asset Derecognized &amp; Disposed
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    JV #{selectedAsset.disposalJournalEntryNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Disposal Date</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedAsset.disposalDate ? new Date(selectedAsset.disposalDate).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Disposal Type</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedAsset.disposalType}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Sale Proceeds</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {selectedAsset.disposalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Net Gain / Loss</span>
                    <div className={`font-bold ${selectedAsset.isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedAsset.isGain ? '+' : '-'} Rs. {selectedAsset.gainOrLossAmount.toLocaleString()} (
                      {selectedAsset.isGain ? 'Gain' : 'Loss'})
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <strong>Disposal Reason:</strong> {selectedAsset.disposalReason || 'N/A'}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                onClick={() => handlePrintSlip(selectedAsset)}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Asset Tag</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BATCH MONTHLY DEPRECIATION RUN MODAL                              */}
      {/* ========================================================================= */}
      {isBatchDeprModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <Play className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Run Batch Monthly Depreciation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Processes and posts straight-line depreciation for all active assets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchDeprModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunBatchDepreciation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2040"
                    required
                    value={batchYear}
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Month *
                  </label>
                  <select
                    value={batchMonth}
                    onChange={(e) => setBatchMonth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  >
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ].map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m} ({idx + 1 < 10 ? `0${idx + 1}` : idx + 1})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Target Period: {batchYear}-{batchMonth < 10 ? `0${batchMonth}` : batchMonth}
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  This will generate double-entry Journal Entries for all active fixed assets with pending depreciation for this month.
                  Debit: Depreciation Expense (58xx) | Credit: Accumulated Depreciation (16xx).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchDeprModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Post Batch Depreciation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASSET TRANSFER MODAL                                              */}
      {/* ========================================================================= */}
      {isTransferModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <ArrowLeftRight className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Transfer Asset: {selectedAsset.assetCode}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Record location, department, or custodian transfer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Current Custody</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAsset.location} ({selectedAsset.department})
                </div>
                {selectedAsset.assignedTo && (
                  <div className="text-[11px] text-slate-500">Custodian: {selectedAsset.assignedTo}</div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Location *
                </label>
                <input
                  type="text"
                  required
                  value={transferLocation}
                  onChange={(e) => setTransferLocation(e.target.value)}
                  placeholder="e.g. 2nd Floor Dining / Bar Counter"
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Department
                </label>
                <input
                  type="text"
                  value={transferDepartment}
                  onChange={(e) => setTransferDepartment(e.target.value)}
                  placeholder="e.g. Service / Housekeeping"
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Custodian / Assigned To
                </label>
                <input
                  type="text"
                  value={transferAssignedTo}
                  onChange={(e) => setTransferAssignedTo(e.target.value)}
                  placeholder="e.g. Dining Floor Supervisor"
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Capacity expansion in 2nd floor banquet"
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ASSET DISPOSAL / DERECOGNITION MODAL                              */}
      {/* ========================================================================= */}
      {isDisposeModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Dispose Fixed Asset: {selectedAsset.assetCode}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Derecognize cost, accumulated depreciation, and recognize gain/loss on disposal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDisposeModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDisposal} className="space-y-3 text-xs">
              {/* Asset Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Original Cost</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Rs. {selectedAsset.totalCapitalizedCost.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Accum. Depr.</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">
                    Rs. {selectedAsset.accumulatedDepreciation.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Net Book Value</div>
                  <div className="font-bold text-[#0B3D32] dark:text-emerald-400">
                    Rs. {selectedAsset.currentBookValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Disposal Type *
                  </label>
                  <select
                    value={disposalType}
                    onChange={(e) => setDisposalType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  >
                    <option value="SOLD">Sale of Asset (With Cash/Bank Proceeds)</option>
                    <option value="SCRAPPED">Scrapped (Zero or Salvage Proceeds)</option>
                    <option value="WRITTEN_OFF">Written Off (Total Loss / Damaged)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Disposal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={disposalDate}
                    onChange={(e) => setDisposalDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sale / Recovery Proceeds (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={disposalAmount}
                    onChange={(e) => setDisposalAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Receiving Account (if proceeds &gt; 0)
                  </label>
                  <select
                    value={disposalReceivingAccountId}
                    onChange={(e) => setDisposalReceivingAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  >
                    {glAccounts
                      .filter((a) => a.accountType === 'ASSET' && (a.accountCode.startsWith('101') || a.accountCode.startsWith('102') || a.accountCode.startsWith('105')))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.accountCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Live Realized Gain / Loss Card */}
              <div className={`p-3 rounded-lg border text-xs ${
                disposalGainOrLoss.isGain
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Realized {disposalGainOrLoss.isGain ? 'Gain on Disposal (Account 4930)' : 'Loss on Disposal (Account 6200)'}:</span>
                  <span className="text-sm">
                    Rs. {disposalGainOrLoss.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  Accounting entry: Derecognizes Asset Cost (Credit Rs. {selectedAsset.totalCapitalizedCost.toLocaleString()}) and Accumulated Depr. (Debit Rs. {selectedAsset.accumulatedDepreciation.toLocaleString()}).
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Disposal Reason / Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                  placeholder="e.g. Upgraded to larger commercial refrigeration unit. Old unit sold to scrap buyer."
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDisposeModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm &amp; Derecognize Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ASSET CATEGORIES CONFIGURATION MODAL                              */}
      {/* ========================================================================= */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <Tag className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fixed Asset Categories &amp; GL Account Mapping
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Maps each asset category to Cost Account (15xx), Contra Asset (16xx), and Depreciation Expense (58xx)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Existing Categories Table */}
              <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                      <th className="py-2 px-3">Category Name</th>
                      <th className="py-2 px-3">Prefix</th>
                      <th className="py-2 px-3">Asset Cost Account</th>
                      <th className="py-2 px-3">Accum. Contra Account</th>
                      <th className="py-2 px-3">Expense Account</th>
                      <th className="py-2 px-3 text-center">Default Life</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {cat.categoryName}
                          {cat.isSystem && (
                            <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                              System
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {cat.codePrefix}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {cat.assetAccountName} ({cat.assetAccountCode})
                        </td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400">
                          {cat.accumulatedDepreciationAccountName} ({cat.accumulatedDepreciationAccountCode})
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {cat.depreciationExpenseAccountName} ({cat.depreciationExpenseAccountCode})
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {cat.defaultUsefulLifeYears} yrs
                        </td>
                        <td className="py-2 px-3 text-center">
                          {!cat.isSystem ? (
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Category Form */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  + Add Custom Category
                </span>

                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. POS & Sound Systems"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Code Prefix *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={newCatPrefix}
                        onChange={(e) => setNewCatPrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. POS"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono font-bold focus:outline-hidden focus:border-[#0B3D32]"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Default Useful Life (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newCatLife}
                        onChange={(e) => setNewCatLife(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Asset Cost Account (15xx) *
                      </label>
                      <select
                        required
                        value={newCatAssetAccountId}
                        onChange={(e) => setNewCatAssetAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                      >
                        <option value="">Select Asset Account...</option>
                        {glAccounts
                          .filter((a) => a.accountCode.startsWith('15'))
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.accountCode})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Accum. Depr. Account (16xx) *
                      </label>
                      <select
                        required
                        value={newCatAccumAccountId}
                        onChange={(e) => setNewCatAccumAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                      >
                        <option value="">Select Contra-Asset Account...</option>
                        {glAccounts
                          .filter((a) => a.accountCode.startsWith('16'))
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.accountCode})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Depr. Expense Account (58xx) *
                      </label>
                      <select
                        required
                        value={newCatExpenseAccountId}
                        onChange={(e) => setNewCatExpenseAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                      >
                        <option value="">Select Expense Account...</option>
                        {glAccounts
                          .filter((a) => a.accountCode.startsWith('58'))
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.accountCode})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingAction}
                      className="px-4 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Category</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: FIXED ASSET REPORTS MODAL                                         */}
      {/* ========================================================================= */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <BarChart3 className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fixed Assets Portfolio &amp; Depreciation Reports
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comprehensive asset register, category allocations, and historical disposal realizations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportsLoading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                <span>Generating portfolio analytics...</span>
              </div>
            ) : reportsData ? (
              <div className="space-y-4 text-xs">
                {/* High-level Totals */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Total Portfolio Cost</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      Rs. {reportsData.totalCost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Total Depreciated</span>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                      Rs. {reportsData.totalAccumulatedDepreciation.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Net Carrying Value</span>
                    <div className="text-base font-bold text-[#0B3D32] dark:text-emerald-400">
                      Rs. {reportsData.totalBookValue.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Category Breakdown Table */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Asset Class &amp; Category Breakdown
                  </h4>
                  <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                          <th className="py-2 px-3">Asset Category</th>
                          <th className="py-2 px-3 text-center">Count</th>
                          <th className="py-2 px-3 text-right">Gross Cost</th>
                          <th className="py-2 px-3 text-right">Accum. Depr.</th>
                          <th className="py-2 px-3 text-right">Net Book Value</th>
                          <th className="py-2 px-3 text-right">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reportsData.byCategory.map((cat) => (
                          <tr key={cat.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {cat.categoryName}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">
                              {cat.count}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-100">
                              Rs. {cat.totalCost.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">
                              Rs. {cat.accumulatedDepreciation.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-[#0B3D32] dark:text-emerald-400">
                              Rs. {cat.currentBookValue.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                              {cat.costPercentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Disposed Assets Summary Table */}
                {reportsData.disposedAssets.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Disposal Realization Audit ({reportsData.disposedAssets.length} Assets)
                    </h4>
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                            <th className="py-2 px-3">Asset</th>
                            <th className="py-2 px-3">Disposal Date</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3 text-right">Gross Cost</th>
                            <th className="py-2 px-3 text-right">NBV at Disposal</th>
                            <th className="py-2 px-3 text-right">Proceeds</th>
                            <th className="py-2 px-3 text-right">Gain / (Loss)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportsData.disposedAssets.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2 px-3">
                                <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                  {d.assetCode}
                                </span>{' '}
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{d.assetName}</span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                {new Date(d.disposalDate).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                {d.disposalType}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                                Rs. {d.totalCapitalizedCost.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                                Rs. {d.netBookValueAtDisposal.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-emerald-600">
                                Rs. {d.disposalAmount.toLocaleString()}
                              </td>
                              <td className={`py-2 px-3 text-right font-bold ${d.isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {d.isGain ? '+' : '-'} Rs. {d.gainOrLossAmount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: PRINTABLE ASSET TAG / BARCODE SLIP                                */}
      {/* ========================================================================= */}
      {isPrintSlipModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Asset Physical Barcode Tag
              </h3>
              <button
                onClick={() => setIsPrintSlipModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Tag Card */}
            <div
              id="printable-asset-slip"
              className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white text-slate-900 space-y-3 font-sans"
            >
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="text-[10px] tracking-widest uppercase font-bold text-emerald-800">
                  EVEREST FAMILY RESTAURANT
                </div>
                <div className="text-[12px] font-extrabold text-slate-900">
                  FIXED ASSET IDENTIFICATION TAG
                </div>
              </div>

              {/* Barcode Mock Visual */}
              <div className="text-center py-2 bg-slate-50 rounded border border-slate-200">
                <div className="font-mono text-2xl tracking-[0.25em] font-extrabold text-slate-900 py-1">
                  ||| | |||| | ||| || |||
                </div>
                <div className="font-mono font-bold text-sm text-[#0B3D32]">
                  {selectedAsset.assetCode}
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Asset Name:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedAsset.assetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Category:</span>
                  <span className="font-medium text-slate-800">{selectedAsset.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Location:</span>
                  <span className="font-medium text-slate-800">{selectedAsset.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Department:</span>
                  <span className="font-medium text-slate-800">{selectedAsset.department}</span>
                </div>
                {selectedAsset.serialNumber && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Serial #:</span>
                    <span className="text-slate-800">{selectedAsset.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Acquired:</span>
                  <span className="text-slate-800">{new Date(selectedAsset.purchaseDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 uppercase tracking-wider">
                Property of Everest Family Restaurant • Do Not Remove Tag
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

