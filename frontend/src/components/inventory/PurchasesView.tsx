'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  RotateCcw,
  Eye,
  Pencil,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  User,
  X,
  ExternalLink,
  Receipt,
  Download,
  ChevronDown,
  Check,
  Loader2,
  Printer,
  Copy,
  Mail,
  MessageCircle,
  Settings,
  Clock,
  AlertCircle,
  Package,
  PackageCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { InventoryItem, SupplierOption } from './DepartmentInventoryView';
import { NewPurchaseModal } from './NewPurchaseModal';
import { PurchaseRecord, PurchaseLineItem, SupplierRecord } from '@/lib/types';
import { fetchSuppliersList, subscribeToSuppliers } from '@/lib/suppliersData';

export type { PurchaseRecord };

export interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  items?: InventoryItem[];
  suppliers?: SupplierOption[] | SupplierRecord[];
  loading: boolean;
  onRefresh: () => void;
  defaultDepartment?: 'HOTEL' | 'RESTAURANT';
  showHeader?: boolean;
}

type PaymentStatusFilter = 'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
type ReceivingStatusFilter = 'ALL' | 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'PENDING';
type SortField =
  | 'sn'
  | 'poNumber'
  | 'date'
  | 'supplier'
  | 'invoiceNo'
  | 'items'
  | 'totalAmount'
  | 'paidAmount'
  | 'balance'
  | 'receivingStatus'
  | 'paymentStatus';

// Realistic fallback records matching the user's recommended schema
const DEFAULT_DEMO_PURCHASES: PurchaseRecord[] = [
  {
    id: 'demo-po-1',
    poNumber: 'PO-2026-0042',
    supplierInvoiceNumber: 'INV-8910',
    purchaseDate: '2026-11-22',
    supplierId: 'sup-1',
    supplierName: 'Himalayan Dairy & Fresh Farm',
    supplierPanVatNumber: '302918274',
    purchaseType: 'FULL',
    paymentStatus: 'PAID',
    paidAmount: 20905,
    balanceAmount: 0,
    receivingStatus: 'RECEIVED',
    paymentMethod: 'Bank Transfer',
    subtotal: 18500,
    tax: 2405,
    discount: 0,
    additionalCharges: 0,
    totalAmount: 20905,
    status: 'RECEIVED',
    itemsJson: '[]',
    createdBy: 'Manager',
    notes: 'Regular morning dairy supply',
    items: [
      {
        itemId: 'item-1',
        itemName: 'Fresh Full Cream Milk',
        category: 'DAIRY',
        department: 'RESTAURANT',
        quantity: 50,
        purchaseUnit: 'Ltr',
        stockUnit: 'Ltr',
        conversionFactor: 1,
        unitCost: 110,
        totalCost: 5500,
        trackStock: true,
      },
      {
        itemId: 'item-2',
        itemName: 'Amul Salted Butter 500g',
        category: 'DAIRY',
        department: 'RESTAURANT',
        quantity: 20,
        purchaseUnit: 'Pcs',
        stockUnit: 'Pcs',
        conversionFactor: 1,
        unitCost: 450,
        totalCost: 9000,
        trackStock: true,
      },
      {
        itemId: 'item-3',
        itemName: 'Fresh Paneer (Cottage Cheese)',
        category: 'DAIRY',
        department: 'RESTAURANT',
        quantity: 10,
        purchaseUnit: 'Kg',
        stockUnit: 'Kg',
        conversionFactor: 1,
        unitCost: 400,
        totalCost: 4000,
        trackStock: true,
      },
    ],
  },
  {
    id: 'demo-po-2',
    poNumber: 'PO-2026-0041',
    supplierInvoiceNumber: 'BILL-4412',
    purchaseDate: '2026-11-21',
    supplierId: 'sup-2',
    supplierName: 'Organic Greens & Veg Hub',
    supplierPanVatNumber: '601827364',
    purchaseType: 'SIMPLE',
    paymentStatus: 'PARTIALLY_PAID',
    paidAmount: 6000,
    balanceAmount: 6000,
    receivingStatus: 'PARTIALLY_RECEIVED',
    paymentMethod: 'Cash',
    subtotal: 12400,
    tax: 0,
    discount: 400,
    additionalCharges: 0,
    totalAmount: 12000,
    status: 'PARTIALLY_RECEIVED',
    itemsJson: '[]',
    createdBy: 'Head Chef',
    notes: 'Partial payment made Rs 6,000 in cash',
    items: [
      {
        itemId: 'item-4',
        itemName: 'Red Potato (Bungmati)',
        category: 'VEGETABLES',
        department: 'RESTAURANT',
        quantity: 100,
        purchaseUnit: 'Kg',
        stockUnit: 'Kg',
        conversionFactor: 1,
        unitCost: 60,
        totalCost: 6000,
        trackStock: true,
      },
      {
        itemId: 'item-5',
        itemName: 'Fresh Red Tomatoes',
        category: 'VEGETABLES',
        department: 'RESTAURANT',
        quantity: 80,
        purchaseUnit: 'Kg',
        stockUnit: 'Kg',
        conversionFactor: 1,
        unitCost: 75,
        totalCost: 6000,
        trackStock: true,
      },
    ],
  },
  {
    id: 'demo-po-3',
    poNumber: 'PO-2026-0040',
    supplierInvoiceNumber: 'INV-1099',
    purchaseDate: '2026-11-20',
    supplierId: 'sup-3',
    supplierName: 'Quality Housekeeping Linens',
    supplierPanVatNumber: '300991823',
    purchaseType: 'FULL',
    paymentStatus: 'PAID',
    paidAmount: 46460,
    balanceAmount: 0,
    receivingStatus: 'RECEIVED',
    paymentMethod: 'Cheque',
    subtotal: 42000,
    tax: 5460,
    discount: 1000,
    additionalCharges: 0,
    totalAmount: 46460,
    status: 'RECEIVED',
    itemsJson: '[]',
    createdBy: 'Admin',
    notes: 'Premium hotel room linen replenishment',
    items: [
      {
        itemId: 'item-6',
        itemName: 'Bath Towels (White 600 GSM)',
        category: 'LINEN',
        department: 'HOTEL',
        quantity: 40,
        purchaseUnit: 'Pcs',
        stockUnit: 'Pcs',
        conversionFactor: 1,
        unitCost: 650,
        totalCost: 26000,
        trackStock: true,
      },
      {
        itemId: 'item-7',
        itemName: 'Hotel Bed Sheet King Size',
        category: 'LINEN',
        department: 'HOTEL',
        quantity: 20,
        purchaseUnit: 'Pcs',
        stockUnit: 'Pcs',
        conversionFactor: 1,
        unitCost: 800,
        totalCost: 16000,
        trackStock: true,
      },
    ],
  },
  {
    id: 'demo-po-4',
    poNumber: 'PO-2026-0039',
    supplierInvoiceNumber: 'LOCAL-102',
    purchaseDate: '2026-11-19',
    supplierId: '',
    supplierName: 'Local Market Wholesale',
    supplierPanVatNumber: '',
    purchaseType: 'SIMPLE',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    balanceAmount: 8500,
    receivingStatus: 'PENDING',
    paymentMethod: 'Credit',
    subtotal: 8500,
    tax: 0,
    discount: 0,
    additionalCharges: 0,
    totalAmount: 8500,
    status: 'ORDERED',
    itemsJson: '[]',
    createdBy: 'Store Keeper',
    notes: 'Credit bill payable within 15 days',
    items: [
      {
        itemId: 'item-8',
        itemName: 'Basmati Rice Premium 25kg',
        category: 'GROCERY',
        department: 'RESTAURANT',
        quantity: 2,
        purchaseUnit: 'Bags',
        stockUnit: 'Kg',
        conversionFactor: 25,
        unitCost: 3200,
        totalCost: 6400,
        trackStock: true,
      },
      {
        itemId: 'item-9',
        itemName: 'Sunflower Cooking Oil (5L)',
        category: 'GROCERY',
        department: 'RESTAURANT',
        quantity: 2,
        purchaseUnit: 'Jars',
        stockUnit: 'Ltr',
        conversionFactor: 5,
        unitCost: 1050,
        totalCost: 2100,
        trackStock: true,
      },
    ],
  },
  {
    id: 'demo-po-5',
    poNumber: 'PO-2026-0038',
    supplierInvoiceNumber: 'INV-771',
    purchaseDate: '2026-11-18',
    supplierId: 'sup-4',
    supplierName: 'Eco Clean Chemical Supplies',
    supplierPanVatNumber: '602991024',
    purchaseType: 'FULL',
    paymentStatus: 'PAID',
    paidAmount: 10500,
    balanceAmount: 0,
    receivingStatus: 'RECEIVED',
    paymentMethod: 'Cash',
    subtotal: 9500,
    tax: 1235,
    discount: 235,
    additionalCharges: 0,
    totalAmount: 10500,
    status: 'RECEIVED',
    itemsJson: '[]',
    createdBy: 'Admin',
    notes: 'Sanitation chemicals for hotel & kitchen',
    items: [
      {
        itemId: 'item-10',
        itemName: 'Dishwashing Detergent (20L)',
        category: 'CLEANING',
        department: 'RESTAURANT',
        quantity: 1,
        purchaseUnit: 'Can',
        stockUnit: 'Ltr',
        conversionFactor: 20,
        unitCost: 4500,
        totalCost: 4500,
        trackStock: true,
      },
      {
        itemId: 'item-11',
        itemName: 'Floor Disinfectant (5L)',
        category: 'CLEANING',
        department: 'HOTEL',
        quantity: 5,
        purchaseUnit: 'Jars',
        stockUnit: 'Ltr',
        conversionFactor: 5,
        unitCost: 1000,
        totalCost: 5000,
        trackStock: true,
      },
    ],
  },
];

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  items = [],
  suppliers = [],
  loading,
  onRefresh,
  defaultDepartment = 'RESTAURANT',
  showHeader = true,
}) => {
  const toast = useToast();

  // Modals & Popovers
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseRecord | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = () => {
      setOpenMoreMenuId(null);
      setShowSettingsMenu(false);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Dynamic Suppliers with Event Subscription
  const [dynamicSuppliers, setDynamicSuppliers] = useState<any[]>(() =>
    Array.isArray(suppliers) && suppliers.length > 0 ? suppliers : []
  );

  useEffect(() => {
    let isMounted = true;
    const loadDynamicSuppliers = async () => {
      try {
        const list = await fetchSuppliersList();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setDynamicSuppliers(list);
        } else if (isMounted && suppliers && suppliers.length > 0) {
          setDynamicSuppliers(suppliers);
        }
      } catch {
        if (isMounted && suppliers && suppliers.length > 0) {
          setDynamicSuppliers(suppliers);
        }
      }
    };

    loadDynamicSuppliers();
    const unsubscribe = subscribeToSuppliers(() => {
      loadDynamicSuppliers();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [suppliers]);

  // Combined Purchases with Demo Fallback
  const effectivePurchases = useMemo(() => {
    if (purchases && purchases.length > 0) return purchases;
    return DEFAULT_DEMO_PURCHASES;
  }, [purchases]);

  // Parse items from JSON safely
  const parseItems = (po: PurchaseRecord): PurchaseLineItem[] => {
    if (po.items && Array.isArray(po.items) && po.items.length > 0) {
      return po.items;
    }
    if (!po.itemsJson) return [];
    try {
      const parsed = JSON.parse(po.itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Helper date generators for Today & Yesterday
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getYestdyStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Financial breakdown helper for Paid Amount & Balance
  const getFinancials = (po: PurchaseRecord) => {
    const total = Number(po.totalAmount) || 0;
    let paid = po.paidAmount !== undefined ? Number(po.paidAmount) : undefined;
    let balance = po.balanceAmount !== undefined ? Number(po.balanceAmount) : undefined;

    const pStatus = (po.paymentStatus || 'PAID').toUpperCase();
    if (paid === undefined) {
      if (pStatus === 'PAID') {
        paid = total;
        balance = 0;
      } else if (pStatus === 'PARTIALLY_PAID' || pStatus === 'PARTIAL') {
        paid = Math.round(total / 2);
        balance = total - paid;
      } else {
        paid = 0;
        balance = total;
      }
    } else if (balance === undefined) {
      balance = Math.max(0, total - paid);
    }

    return { total, paid, balance };
  };

  // Receiving Status helper
  const getReceivingStatus = (po: PurchaseRecord): 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'PENDING' => {
    if (po.receivingStatus) {
      const s = po.receivingStatus.toUpperCase();
      if (s.includes('PARTIAL')) return 'PARTIALLY_RECEIVED';
      if (s.includes('PEND') || s.includes('ORDER')) return 'PENDING';
      return 'RECEIVED';
    }
    const s = (po.status || 'RECEIVED').toUpperCase();
    if (s.includes('PARTIAL')) return 'PARTIALLY_RECEIVED';
    if (s.includes('ORDER') || s.includes('PEND')) return 'PENDING';
    return 'RECEIVED';
  };

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [receivingFilter, setReceivingFilter] = useState<ReceivingStatusFilter>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [isTodayChecked, setIsTodayChecked] = useState(false);
  const [isYestdyChecked, setIsYestdyChecked] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Today checkbox toggle
  const handleTodayToggle = (checked: boolean) => {
    setIsTodayChecked(checked);
    setIsYestdyChecked(false);
    if (checked) {
      const t = getTodayStr();
      setDateFrom(t);
      setDateTo(t);
    } else {
      setDateFrom('');
      setDateTo('');
    }
    setCurrentPage(1);
  };

  // Yesterday checkbox toggle
  const handleYestdyToggle = (checked: boolean) => {
    setIsYestdyChecked(checked);
    setIsTodayChecked(false);
    if (checked) {
      const y = getYestdyStr();
      setDateFrom(y);
      setDateTo(y);
    } else {
      setDateFrom('');
      setDateTo('');
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPaymentFilter('ALL');
    setReceivingFilter('ALL');
    setSupplierFilter('ALL');
    setIsTodayChecked(false);
    setIsYestdyChecked(false);
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return effectivePurchases.filter((po) => {
      // Payment Status Filter
      if (paymentFilter !== 'ALL') {
        const pStatus = (po.paymentStatus || 'PAID').toUpperCase();
        if (pStatus !== paymentFilter) return false;
      }

      // Receiving Status Filter
      if (receivingFilter !== 'ALL') {
        const rStatus = getReceivingStatus(po);
        if (rStatus !== receivingFilter) return false;
      }

      // Supplier Filter
      if (supplierFilter !== 'ALL') {
        if (supplierFilter === 'WALK_IN') {
          if (po.supplierId && po.supplierId !== 'WALK_IN') return false;
        } else {
          const selSup = dynamicSuppliers.find((s: any) => s.id === supplierFilter);
          const selName = selSup?.name?.toLowerCase();
          const matchesId = po.supplierId === supplierFilter;
          const matchesName = Boolean(selName && po.supplierName?.toLowerCase() === selName);
          if (!matchesId && !matchesName) return false;
        }
      }

      // Date Range Filter
      const poDateStr = po.purchaseDate || po.orderedAt || po.createdAt;
      if (poDateStr) {
        const poDate = new Date(poDateStr);
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (poDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (poDate > to) return false;
        }
      }

      // Search Query (Empty placeholder, matches PO, invoice, supplier, pan, items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (po.poNumber || '').toLowerCase();
        const inv = (po.supplierInvoiceNumber || po.invoiceNumber || '').toLowerCase();
        const supName = (po.supplier?.name || po.supplierName || 'Walk-in / Unregistered Supplier').toLowerCase();
        const pan = (po.supplierPanVatNumber || po.panVatNumber || '').toLowerCase();
        const lineItems = parseItems(po);
        const matchItem = lineItems.some((i) => i.itemName.toLowerCase().includes(q));

        if (
          !num.includes(q) &&
          !inv.includes(q) &&
          !supName.includes(q) &&
          !pan.includes(q) &&
          !matchItem
        ) {
          return false;
        }
      }

      return true;
    });
  }, [effectivePurchases, paymentFilter, receivingFilter, supplierFilter, dateFrom, dateTo, searchQuery, dynamicSuppliers]);

  // Sorting
  const sortedPurchases = useMemo(() => {
    const list = [...filteredPurchases];
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'sn') {
        const numA = parseInt((a.poNumber || '').replace(/\D/g, '')) || 0;
        const numB = parseInt((b.poNumber || '').replace(/\D/g, '')) || 0;
        comp = numA - numB;
      } else if (sortField === 'poNumber') {
        comp = (a.poNumber || '').localeCompare(b.poNumber || '');
      } else if (sortField === 'date') {
        const d1 = new Date(a.purchaseDate || a.orderedAt || a.createdAt || 0).getTime();
        const d2 = new Date(b.purchaseDate || b.orderedAt || b.createdAt || 0).getTime();
        comp = d1 - d2;
      } else if (sortField === 'supplier') {
        const s1 = a.supplier?.name || a.supplierName || 'Walk-in';
        const s2 = b.supplier?.name || b.supplierName || 'Walk-in';
        comp = s1.localeCompare(s2);
      } else if (sortField === 'invoiceNo') {
        const invA = a.supplierInvoiceNumber || a.invoiceNumber || '';
        const invB = b.supplierInvoiceNumber || b.invoiceNumber || '';
        comp = invA.localeCompare(invB);
      } else if (sortField === 'items') {
        const countA = parseItems(a).length;
        const countB = parseItems(b).length;
        comp = countA - countB;
      } else if (sortField === 'totalAmount') {
        comp = (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0);
      } else if (sortField === 'paidAmount') {
        comp = getFinancials(a).paid - getFinancials(b).paid;
      } else if (sortField === 'balance') {
        comp = getFinancials(a).balance - getFinancials(b).balance;
      } else if (sortField === 'receivingStatus') {
        comp = getReceivingStatus(a).localeCompare(getReceivingStatus(b));
      } else if (sortField === 'paymentStatus') {
        comp = (a.paymentStatus || 'PAID').localeCompare(b.paymentStatus || 'PAID');
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredPurchases, sortField, sortDirection]);

  // Pagination
  const totalEntries = sortedPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedPurchases = sortedPurchases.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(
        field === 'date' || field === 'totalAmount' || field === 'paidAmount' || field === 'balance'
          ? 'desc'
          : 'asc'
      );
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return (
        <span className="text-[#0B3D32] dark:text-emerald-400 font-bold ml-1">
          {sortDirection === 'asc' ? '▲' : '▼'}
        </span>
      );
    }
    return <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">⇅</span>;
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'SN',
        'Purchase No.',
        'Purchase Date',
        'Supplier',
        'Supplier Invoice No.',
        'Items Count',
        'Total Amount',
        'Paid Amount',
        'Balance',
        'Receiving Status',
        'Payment Status',
      ];

      const rows = sortedPurchases.map((po, idx) => {
        const lineItems = parseItems(po);
        const { total, paid, balance } = getFinancials(po);
        return [
          idx + 1,
          po.poNumber,
          po.purchaseDate || po.orderedAt || po.createdAt || 'N/A',
          po.supplier?.name || po.supplierName || 'Walk-in / Unregistered',
          po.supplierInvoiceNumber || po.invoiceNumber || '—',
          lineItems.length,
          total,
          paid,
          balance,
          getReceivingStatus(po),
          po.paymentStatus || 'PAID',
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Purchase_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Successful', `Exported ${sortedPurchases.length} purchase records to CSV.`);
    } catch {
      toast.error('Export Failed', 'Could not generate CSV file.');
    }
  };

  // Receiving Status text with dot indicator (Column 9)
  const renderReceivingBadge = (status: 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'PENDING') => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Received</span>
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Partially Received</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  // Payment Status text with dot indicator (Column 10)
  const renderPaymentBadge = (status?: string) => {
    const s = (status || 'PAID').toUpperCase();
    switch (s) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Paid</span>
          </span>
        );
      case 'PARTIALLY_PAID':
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Partial</span>
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Unpaid</span>
          </span>
        );
    }
  };

  // Print purchase order receipt
  const handlePrintPurchase = (po: PurchaseRecord) => {
    setViewingPurchase(po);
    setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 300);
  };

  return (
    <div className="space-y-3 font-sans select-none">
      {/* Optional Sub-Header */}
      {showHeader && (
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Purchases &amp; Goods Receipts
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewPurchaseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh purchases"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN DATATABLES CARD
         ========================================================================= */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: Show entries & Filters on left, Search on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries, Payment Status, Receiving Status, Supplier, Dates, Clear, Settings */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Show Entries */}
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value as PaymentStatusFilter);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Payment</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            {/* Receiving Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Receiving:</span>
              <select
                value={receivingFilter}
                onChange={(e) => {
                  setReceivingFilter(e.target.value as ReceivingStatusFilter);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Receiving</option>
                <option value="RECEIVED">Received</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Supplier:</span>
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">All Suppliers</option>
                <option value="WALK_IN">Direct / Walk-in Cash</option>
                {dynamicSuppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Quick Checkboxes (Today / Yestdy) */}
            <label className="inline-flex items-center gap-1 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isTodayChecked}
                onChange={(e) => handleTodayToggle(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
              />
              <span>Today</span>
            </label>

            <label className="inline-flex items-center gap-1 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isYestdyChecked}
                onChange={(e) => handleYestdyToggle(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
              />
              <span>Yestdy</span>
            </label>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setIsTodayChecked(false);
                  setIsYestdyChecked(false);
                  setCurrentPage(1);
                }}
                title="From Date"
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setIsTodayChecked(false);
                  setIsYestdyChecked(false);
                  setCurrentPage(1);
                }}
                title="To Date"
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Clear Button (Warm amber button) */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-[27px] px-3 rounded-[2px] bg-[#f39c12] hover:bg-[#e08e0b] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            >
              Clear
            </button>

            {/* Settings / Gear Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                title="Table Settings & Export"
                className="h-[27px] w-[27px] inline-flex items-center justify-center rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </button>

              {showSettingsMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportCSV();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Export to CSV / Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Print Table View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Refresh Records</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Clean Search Input with Empty Placeholder */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="h-[27px] w-full sm:w-48 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>

        {/* =========================================================================
            TABLE CONTAINER (MATCHING EXACT 11 USER-RECOMMENDED COLUMNS)
           ========================================================================= */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-t border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* 0. SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>SN</span>
                    {renderSortIndicator('sn')}
                  </div>
                </th>

                {/* 1. Purchase No. */}
                <th
                  onClick={() => handleSort('poNumber')}
                  className="py-2.5 px-3 w-36 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Purchase No.</span>
                    {renderSortIndicator('poNumber')}
                  </div>
                </th>

                {/* 2. Purchase Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Purchase Date</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                {/* 3. Supplier */}
                <th
                  onClick={() => handleSort('supplier')}
                  className="py-2.5 px-3 min-w-[160px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Supplier</span>
                    {renderSortIndicator('supplier')}
                  </div>
                </th>

                {/* 4. Supplier Invoice No. */}
                <th
                  onClick={() => handleSort('invoiceNo')}
                  className="py-2.5 px-3 w-36 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Supplier Invoice No.</span>
                    {renderSortIndicator('invoiceNo')}
                  </div>
                </th>

                {/* 5. Items */}
                <th
                  onClick={() => handleSort('items')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Items</span>
                    {renderSortIndicator('items')}
                  </div>
                </th>

                {/* 6. Total Amount */}
                <th
                  onClick={() => handleSort('totalAmount')}
                  className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Amount</span>
                    {renderSortIndicator('totalAmount')}
                  </div>
                </th>

                {/* 7. Paid Amount */}
                <th
                  onClick={() => handleSort('paidAmount')}
                  className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Paid Amount</span>
                    {renderSortIndicator('paidAmount')}
                  </div>
                </th>

                {/* 8. Balance */}
                <th
                  onClick={() => handleSort('balance')}
                  className="py-2.5 px-3 w-24 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Balance</span>
                    {renderSortIndicator('balance')}
                  </div>
                </th>

                {/* 9. Receiving Status */}
                <th
                  onClick={() => handleSort('receivingStatus')}
                  className="py-2.5 px-3 w-32 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Receiving Status</span>
                    {renderSortIndicator('receivingStatus')}
                  </div>
                </th>

                {/* 10. Payment Status */}
                <th
                  onClick={() => handleSort('paymentStatus')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Payment Status</span>
                    {renderSortIndicator('paymentStatus')}
                  </div>
                </th>

                {/* 11. Action (View, Edit, Receive, Print, More) */}
                <th className="py-2.5 px-3 w-36 text-center whitespace-nowrap">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading purchase records...</span>
                  </td>
                </tr>
              ) : paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No purchase records found matching your current filter criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ New Purchase" to record your first stock procurement.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((po, index) => {
                  const serialNumber = startIndex + index + 1;
                  const supplierDisplayName =
                    po.supplier?.name || po.supplierName || 'Walk-in / Direct Purchase';
                  const isWalkIn = !po.supplierId || po.supplierId === 'WALK_IN';
                  const items = parseItems(po);
                  const { total, paid, balance } = getFinancials(po);
                  const rStatus = getReceivingStatus(po);

                  // Date formatting
                  const rawDate = po.purchaseDate || po.orderedAt || po.createdAt;
                  let formattedDate = '—';
                  if (rawDate) {
                    try {
                      formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                    } catch {
                      formattedDate = String(rawDate);
                    }
                  }

                  const firstItemName = items[0]?.itemName;

                  return (
                    <tr
                      key={po.id}
                      className="group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                    >
                      {/* 0. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {serialNumber}
                      </td>

                      {/* 1. Purchase No. */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {po.poNumber}
                      </td>

                      {/* 2. Purchase Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {formattedDate}
                      </td>

                      {/* 3. Supplier */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'font-bold text-xs',
                              isWalkIn
                                ? 'text-slate-600 dark:text-slate-400 italic'
                                : 'text-slate-900 dark:text-slate-100'
                            )}
                          >
                            {supplierDisplayName}
                          </span>
                          {isWalkIn && (
                            <span className="px-1 py-0.2 rounded-[2px] text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                              Direct / Cash
                            </span>
                          )}
                        </div>
                        {po.supplierPanVatNumber && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            PAN: {po.supplierPanVatNumber}
                          </span>
                        )}
                      </td>

                      {/* 4. Supplier Invoice No. */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs border-r border-slate-200 dark:border-slate-700/60">
                        {po.supplierInvoiceNumber || po.invoiceNumber || '—'}
                      </td>

                      {/* 5. Items */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                        <span
                          className="font-medium text-slate-700 dark:text-slate-300 text-xs cursor-help"
                          title={items.map((i) => `${i.itemName} (${i.quantity} ${i.purchaseUnit || i.stockUnit || 'units'})`).join(', ')}
                        >
                          {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </span>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        Rs. {total.toLocaleString()}
                      </td>

                      {/* 7. Paid Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        Rs. {paid.toLocaleString()}
                      </td>

                      {/* 8. Balance */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {balance > 0 ? (
                          <span className="text-[#e74c3c]">
                            Rs. {balance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            Rs. 0
                          </span>
                        )}
                      </td>

                      {/* 9. Receiving Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {renderReceivingBadge(rStatus)}
                      </td>

                      {/* 10. Payment Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {renderPaymentBadge(po.paymentStatus)}
                      </td>

                      {/* 11. Action (View, Edit, Receive, Print, More) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View (Cyan Square Button) */}
                          <button
                            type="button"
                            onClick={() => setViewingPurchase(po)}
                            title="View Purchase Details"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#00acd6] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {/* 2. Edit (Teal Square Button) */}
                          <button
                            type="button"
                            onClick={() => setViewingPurchase(po)}
                            title="Edit Purchase Record"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#1abc9c] hover:bg-[#16a085] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* 3. Print (Orange Button) */}
                          <button
                            type="button"
                            onClick={() => handlePrintPurchase(po)}
                            title="Print Purchase Order"
                            className="h-[25px] px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#f39c12] hover:bg-[#e08e0b] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>

                          {/* 4. More Dropdown (Blue Button) */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenMoreMenuId(openMoreMenuId === po.id ? null : po.id)}
                              title="More Actions"
                              className="h-[25px] px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#3c8dbc] hover:bg-[#367fa9] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>More</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {openMoreMenuId === po.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100 text-left">
                                {/* View Details */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingPurchase(po);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>View Details</span>
                                </button>

                                {/* Edit Purchase */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingPurchase(po);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Edit Purchase</span>
                                </button>

                                {/* Receive Stock */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.success('Receive Stock', `Received items for PO #${po.poNumber}`);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Receive Stock / Goods</span>
                                </button>

                                {/* Print PO */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handlePrintPurchase(po);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Print PO</span>
                                </button>

                                {/* Copy PO Number */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(po.poNumber);
                                      toast.success('Copied', `PO #${po.poNumber} copied.`);
                                    }
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy Purchase No</span>
                                </button>

                                {/* Send to Mail */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info('Send to Mail', `Email delivery for PO #${po.poNumber} will be available soon.`);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Send to Mail</span>
                                </button>

                                {/* Send to WhatsApp */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info('Send to WhatsApp', `WhatsApp delivery for PO #${po.poNumber} will be available soon.`);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Send to WhatsApp</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            BOTTOM CONTROLS: ENTRIES COUNT & PAGINATION
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          {/* Entries count */}
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {Math.min(startIndex + pageSize, totalEntries)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalEntries}
            </span>{' '}
            entries
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
              ) {
                const isCurrent = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'min-w-[28px] h-7 px-2 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                        : 'bg-white dark:bg-surface-card border-slate-300 dark:border-border-default hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: VIEW PURCHASE DETAILS BREAKDOWN
         ========================================================================= */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col max-h-[90vh] overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {viewingPurchase.poNumber}
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.2 rounded text-[10px] font-bold uppercase',
                        (viewingPurchase.purchaseType || 'SIMPLE').toUpperCase() === 'SIMPLE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      )}
                    >
                      {(viewingPurchase.purchaseType || 'SIMPLE').toUpperCase() === 'SIMPLE'
                        ? 'Simple Purchase'
                        : 'Full Details Purchase'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Recorded on {viewingPurchase.purchaseDate || viewingPurchase.orderedAt || viewingPurchase.createdAt}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Top metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Supplier</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block truncate">
                    {viewingPurchase.supplier?.name || viewingPurchase.supplierName || 'Walk-in Supplier'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Invoice No</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {viewingPurchase.supplierInvoiceNumber || viewingPurchase.invoiceNumber || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {viewingPurchase.paymentMethod || 'CASH'} · {viewingPurchase.paymentStatus || 'PAID'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Amount</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs mt-0.5 block">
                    Rs. {(Number(viewingPurchase.totalAmount) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Purchased Items Breakdown
                </span>
                <div className="border border-slate-200 dark:border-border-default rounded-[3px] overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2.5 text-center">Qty &amp; Unit</th>
                        <th className="py-2 px-2.5 text-right">Unit Cost</th>
                        <th className="py-2 px-2.5 text-right">Line Total</th>
                        <th className="py-2 px-2.5 text-center">Stock Tracked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parseItems(viewingPurchase).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {item.itemName}
                            {item.department && (
                              <span className="text-[10px] text-slate-400 font-normal block">
                                {item.department} · {item.category || 'General'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono">
                            {item.quantity} {item.purchaseUnit || item.stockUnit || 'units'}
                            {item.conversionFactor && item.conversionFactor > 1 && (
                              <span className="text-[10px] text-slate-400 block">
                                ({item.quantity * item.conversionFactor} {item.stockUnit})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono">
                            Rs. {(Number(item.unitCost) || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            Rs. {(Number(item.totalCost) || (Number(item.quantity) * Number(item.unitCost)) || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {item.trackStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Stock Updated
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Expense Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs max-w-sm ml-auto">
                {viewingPurchase.subtotal !== undefined && viewingPurchase.subtotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">
                      Rs. {(Number(viewingPurchase.subtotal) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.discount !== undefined && viewingPurchase.discount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold text-rose-600">
                      - Rs. {(Number(viewingPurchase.discount) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.tax !== undefined && viewingPurchase.tax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax / VAT:</span>
                    <span className="font-mono font-semibold">
                      + Rs. {(Number(viewingPurchase.tax) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.additionalCharges !== undefined && viewingPurchase.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Additional Charges:</span>
                    <span className="font-mono font-semibold">
                      + Rs. {(Number(viewingPurchase.additionalCharges) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                    Rs. {(Number(viewingPurchase.totalAmount) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes & Attachment */}
              {viewingPurchase.notes && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Notes:</span>
                  <p className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 text-[11px] italic">
                    {viewingPurchase.notes}
                  </p>
                </div>
              )}

              {viewingPurchase.attachmentUrl && (
                <div className="flex items-center gap-1.5 text-xs text-sky-600">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={viewingPurchase.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold"
                  >
                    View Invoice Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-border-default flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePrintPurchase(viewingPurchase)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#1abc9c] hover:bg-[#16a085] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PO</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW PURCHASE MODAL
         ========================================================================= */}
      {isNewPurchaseOpen && (
        <NewPurchaseModal
          isOpen={isNewPurchaseOpen}
          onClose={() => setIsNewPurchaseOpen(false)}
          onPurchaseCreated={() => {
            onRefresh();
          }}
          initialDepartment={defaultDepartment}
        />
      )}
    </div>
  );
};
