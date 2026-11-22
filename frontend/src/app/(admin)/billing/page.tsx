'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import {
  FileText,
  Search,
  RefreshCw,
  Printer,
  Eye,
  Pencil,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  DollarSign,
  Receipt,
  UtensilsCrossed,
  Hotel,
  Zap,
  Truck,
  ShoppingBag,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Copy,
  Mail,
  MessageCircle,
  X,
  Share2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BillData, BillingType, BillPaymentStatus, BillingSummaryData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ViewBillModal } from '@/components/billing/ViewBillModal';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';

// Addresses mapping for realistic guest location data
const CUSTOMER_ADDRESSES: Record<string, string> = {
  'bill-10589': 'Dhobighat-Lalitpur',
  'bill-10588': 'Dhobighat-Lalitpur',
  'bill-10587': 'Tolchhikhel, Lalitpur',
  'bill-10586': 'Jawalakhel, Lalitpur',
  'bill-10585': 'Jawalakhel, Lalitpur',
  'bill-10584': 'Patan Sundhara',
  'bill-10583': 'Suryabinayak, Bhaktapur',
  'bill-10582': 'Dillibazar Kathmandu',
  'bill-10581': 'Jawalakhel, Lalitpur',
  'bill-10580': 'Dillibazar Kathmandu',
};

// Default high-fidelity billing entries matching standard hospitality & reference layout
const DEFAULT_DEMO_BILLS: BillData[] = [
  {
    id: 'bill-10589',
    hotelId: 'h-1',
    billNumber: 'KD/10589/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Mr. Naresh Nepali',
    customerPhone: '9841234567',
    roomNumber: null,
    tableNumber: 'Table T-4',
    subtotal: 1200,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 156,
    serviceCharge: 120,
    roundOff: 0,
    grandTotal: 1476,
    amountPaid: 1251,
    balanceDue: 225,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T11:37:00',
    serverOrStaff: 'Ramesh K.',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T11:37:00',
  },
  {
    id: 'bill-10588',
    hotelId: 'h-1',
    billNumber: 'KD/10588/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Ms. Prajuna Adhikari',
    customerPhone: '9851122334',
    roomNumber: null,
    tableNumber: 'Table T-2',
    subtotal: 800,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 104,
    serviceCharge: 80,
    roundOff: 0,
    grandTotal: 984,
    amountPaid: 634,
    balanceDue: 350,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Fonepay',
    createdAt: '2026-11-22T11:36:00',
    serverOrStaff: 'Staff',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T11:36:00',
  },
  {
    id: 'bill-10587',
    hotelId: 'h-1',
    billNumber: 'KD/10587/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Ms. Tilak Kumar Limbu',
    customerPhone: '9801234567',
    roomNumber: null,
    tableNumber: null,
    notes: 'Takeaway',
    subtotal: 1500,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 195,
    serviceCharge: 150,
    roundOff: 0,
    grandTotal: 1845,
    amountPaid: 1495,
    balanceDue: 350,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T11:15:00',
    serverOrStaff: 'Waiter',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T11:15:00',
  },
  {
    id: 'bill-10586',
    hotelId: 'h-1',
    billNumber: 'KD/10586/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Ms. Asta Maya Deshar',
    customerPhone: '9812345678',
    roomNumber: null,
    tableNumber: 'Table T-Pool-1',
    subtotal: 3500,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 455,
    serviceCharge: 350,
    roundOff: 0,
    grandTotal: 4305,
    amountPaid: 2380,
    balanceDue: 1925,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Credit Card',
    createdAt: '2026-11-22T10:40:00',
    serverOrStaff: 'David Kim',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:40:00',
  },
  {
    id: 'bill-10585',
    hotelId: 'h-1',
    billNumber: 'KD/10585/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Ms. Niruta Budhathoki',
    customerPhone: '9849876543',
    roomNumber: null,
    tableNumber: null,
    notes: 'Delivery',
    subtotal: 4200,
    discountAmount: 200,
    discountPercent: 0,
    taxAmount: 520,
    serviceCharge: 400,
    roundOff: 0,
    grandTotal: 4920,
    amountPaid: 2895,
    balanceDue: 2025,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T10:39:00',
    serverOrStaff: 'Staff',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:39:00',
  },
  {
    id: 'bill-10584',
    hotelId: 'h-1',
    billNumber: 'KD/10584/83-84',
    billingType: 'QUICK_BILL',
    customerName: 'Ms. Santu Maharjan',
    customerPhone: '9860112233',
    roomNumber: null,
    tableNumber: null,
    subtotal: 300,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 39,
    serviceCharge: 0,
    roundOff: 0,
    grandTotal: 339,
    amountPaid: 269,
    balanceDue: 70,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Fonepay',
    createdAt: '2026-11-22T10:29:00',
    serverOrStaff: 'Counter',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:29:00',
  },
  {
    id: 'bill-10583',
    hotelId: 'h-1',
    billNumber: 'KD/10583/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'MR. AMRIT BAHADUR THAPA',
    customerPhone: '9841002233',
    roomNumber: null,
    tableNumber: 'Table T-3',
    subtotal: 650,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 84.5,
    serviceCharge: 65,
    roundOff: 0,
    grandTotal: 799.5,
    amountPaid: 609.5,
    balanceDue: 190,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T10:26:00',
    serverOrStaff: 'Ramesh K.',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:26:00',
  },
  {
    id: 'bill-10582',
    hotelId: 'h-1',
    billNumber: 'KD/10582/83-84',
    billingType: 'ROOM_SERVICE',
    customerName: 'Mr. Ang Dorje Lama',
    customerPhone: '9851098765',
    roomNumber: '204',
    tableNumber: null,
    subtotal: 550,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 71.5,
    serviceCharge: 55,
    roundOff: 0,
    grandTotal: 676.5,
    amountPaid: 496.5,
    balanceDue: 180,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T10:22:00',
    serverOrStaff: 'Waiter',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:22:00',
  },
  {
    id: 'bill-10581',
    hotelId: 'h-1',
    billNumber: 'KD/10581/83-84',
    billingType: 'HOTEL_CHECKOUT',
    customerName: 'Mr. Sijan Parajuli',
    customerPhone: '9841887766',
    roomNumber: '102',
    tableNumber: null,
    subtotal: 4500,
    discountAmount: 500,
    discountPercent: 0,
    taxAmount: 520,
    serviceCharge: 0,
    roundOff: 0,
    grandTotal: 4520,
    amountPaid: 3720,
    balanceDue: 800,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-11-22T10:07:00',
    serverOrStaff: 'Front Desk',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:07:00',
  },
  {
    id: 'bill-10580',
    hotelId: 'h-1',
    billNumber: 'KD/10580/83-84',
    billingType: 'TABLE_ORDER',
    customerName: 'Ms. Muna Gurung',
    customerPhone: '9803112233',
    roomNumber: null,
    tableNumber: 'Table T-6',
    subtotal: 750,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 97.5,
    serviceCharge: 75,
    roundOff: 0,
    grandTotal: 922.5,
    amountPaid: 732.5,
    balanceDue: 190,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Cash',
    createdAt: '2026-11-22T10:06:00',
    serverOrStaff: 'Waiter',
    itemsJson: '[]',
    paymentsJson: '[]',
    updatedAt: '2026-11-22T10:06:00',
  },
];

function BillingContent() {
  const toast = useToast();
  const searchParams = useSearchParams();

  // URL query params initialization
  const initialType = searchParams.get('type') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';

  // State
  const [bills, setBills] = useState<BillData[]>(DEFAULT_DEMO_BILLS);
  const [summary, setSummary] = useState<BillingSummaryData>({
    totalBilled: 0,
    totalPaid: 0,
    totalDue: 0,
    totalBills: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filters (Layout matching image)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [isToday, setIsToday] = useState<boolean>(false);
  const [isYesterday, setIsYesterday] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals & Popovers
  const [viewBill, setViewBill] = useState<BillData | null>(null);
  const [paymentBill, setPaymentBill] = useState<BillData | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<string>('sn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Close menus on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMoreMenuId(null);
      setShowSettingsMenu(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, []);

  // Load Bills from API (merges with demo data if empty)
  const loadBills = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBills({
        search: searchQuery.trim() || undefined,
        billingType: selectedType !== 'ALL' ? selectedType : undefined,
        paymentStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: 1,
        pageSize: 100,
      });

      if (res.items && res.items.length > 0) {
        setBills(res.items);
      } else {
        setBills(DEFAULT_DEMO_BILLS);
      }

      if (res.summary) {
        setSummary(res.summary);
      }
    } catch {
      // Fallback gracefully to default bills
      setBills(DEFAULT_DEMO_BILLS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [selectedType, selectedStatus]);

  // Today checkbox toggle
  const handleToggleToday = () => {
    if (isToday) {
      setIsToday(false);
      setStartDate('');
      setEndDate('');
    } else {
      setIsToday(true);
      setIsYesterday(false);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
    setCurrentPage(1);
  };

  // Yesterday checkbox toggle
  const handleToggleYesterday = () => {
    if (isYesterday) {
      setIsYesterday(false);
      setStartDate('');
      setEndDate('');
    } else {
      setIsYesterday(true);
      setIsToday(false);
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setIsToday(false);
    setIsYesterday(false);
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField === field) {
      return (
        <span className="text-[#0B3D32] dark:text-emerald-400 font-bold ml-1">
          {sortDirection === 'asc' ? '▲' : '▼'}
        </span>
      );
    }
    return <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">⇅</span>;
  };

  // Payment success handler
  const handlePaymentSuccess = (updatedBill: BillData) => {
    setBills((prev) =>
      prev.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    );
    toast.success('Payment Recorded', `Bill #${updatedBill.billNumber} balance updated.`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['SN', 'Bill No', 'Date', 'Source', 'Customer Name', 'Mobile No', 'Payment Status', 'Due', 'Balance', 'Total'];
      const rows = filteredAndSortedBills.map((b, idx) => {
        const sn = b.billNumber.replace(/\D/g, '') || String(idx + 1);
        const source = b.tableNumber || (b.roomNumber ? `Room ${b.roomNumber}` : b.notes || 'Walk-in');
        return [
          sn,
          b.billNumber,
          new Date(b.createdAt).toLocaleString(),
          source,
          b.customerName || 'Walk-in Guest',
          b.customerPhone || '',
          b.paymentStatus,
          b.balanceDue.toFixed(2),
          b.amountPaid.toFixed(2),
          b.grandTotal.toFixed(2),
        ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Bills_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export Ready', 'Bills report downloaded successfully.');
    } catch {
      toast.error('Export Failed', 'Could not generate CSV report.');
    }
  };

  // Render payment status text with indicator
  const getPaymentStatusBadge = (status: BillPaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>PAID</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>PARTIAL</span>
          </span>
        );
      case 'CREDIT':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-blue-600 dark:text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>CREDIT</span>
          </span>
        );
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>UNPAID</span>
          </span>
        );
      case 'VOID':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>VOID</span>
          </span>
        );
      default:
        return (
          <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  // Render clean source text (Table, Hotel Room, Delivery, Takeaway, Room Service, Counter)
  const renderSourceRef = (b: BillData) => {
    // 1. Hotel Stay Checkout
    if (b.billingType === 'HOTEL_CHECKOUT' || (b.roomNumber && b.bookingCode)) {
      return (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          Room {b.roomNumber}
        </span>
      );
    }

    // 2. Room Service
    if (b.billingType === 'ROOM_SERVICE' || (b.roomNumber && !b.tableNumber)) {
      return (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          Room {b.roomNumber} (RS)
        </span>
      );
    }

    // 3. Restaurant Table (Dine-in)
    if (b.tableNumber) {
      return (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          Table {b.tableNumber}
        </span>
      );
    }

    // 4. Delivery
    if (b.notes?.toLowerCase().includes('delivery') || b.packingStatus === 'DELIVERY') {
      return (
        <span className="font-medium text-amber-700 dark:text-amber-400">
          Delivery
        </span>
      );
    }

    // 5. Takeaway
    if (b.notes?.toLowerCase().includes('takeaway') || b.packingStatus === 'TAKEAWAY') {
      return (
        <span className="font-medium text-blue-700 dark:text-blue-400">
          Takeaway
        </span>
      );
    }

    // 6. Quick Counter / Walk-in
    return (
      <span className="text-slate-500 dark:text-slate-400">
        Walk-in
      </span>
    );
  };

  // Filter and sort bills
  const filteredAndSortedBills = useMemo(() => {
    let list = [...bills];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const address =
          CUSTOMER_ADDRESSES[b.id] ||
          (b.roomNumber ? `Room ${b.roomNumber}` : b.tableNumber ? `Table ${b.tableNumber}` : '');
        return (
          b.billNumber.toLowerCase().includes(q) ||
          (b.customerName || '').toLowerCase().includes(q) ||
          (b.customerPhone || '').toLowerCase().includes(q) ||
          address.toLowerCase().includes(q) ||
          (b.orderNumber || '').toLowerCase().includes(q) ||
          b.billingType.toLowerCase().includes(q)
        );
      });
    }

    // Filter by type
    if (selectedType !== 'ALL') {
      list = list.filter((b) => b.billingType === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'ALL') {
      list = list.filter((b) => b.paymentStatus === selectedStatus);
    }

    // Filter by date
    if (startDate) {
      list = list.filter((b) => b.createdAt >= startDate);
    }
    if (endDate) {
      const endOfDay = `${endDate}T23:59:59`;
      list = list.filter((b) => b.createdAt <= endOfDay);
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'sn') {
        const numA = parseInt(a.billNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.billNumber.replace(/\D/g, '')) || 0;
        valA = numA;
        valB = numB;
      } else if (sortField === 'billNumber') {
        valA = a.billNumber;
        valB = b.billNumber;
      } else if (sortField === 'source' || sortField === 'table') {
        valA = a.tableNumber || a.roomNumber || a.notes || a.billingType || '';
        valB = b.tableNumber || b.roomNumber || b.notes || b.billingType || '';
      } else if (sortField === 'date') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortField === 'customerName') {
        valA = (a.customerName || '').toLowerCase();
        valB = (b.customerName || '').toLowerCase();
      } else if (sortField === 'mobile') {
        valA = a.customerPhone || '';
        valB = b.customerPhone || '';
      } else if (sortField === 'address') {
        valA = (CUSTOMER_ADDRESSES[a.id] || a.roomNumber || a.tableNumber || '').toLowerCase();
        valB = (CUSTOMER_ADDRESSES[b.id] || b.roomNumber || b.tableNumber || '').toLowerCase();
      } else if (sortField === 'paymentStatus' || sortField === 'status') {
        valA = a.paymentStatus;
        valB = b.paymentStatus;
      } else if (sortField === 'due') {
        valA = a.balanceDue;
        valB = b.balanceDue;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [bills, searchQuery, selectedType, selectedStatus, startDate, endDate, sortField, sortDirection]);

  // Pagination calculation
  const totalEntries = filteredAndSortedBills.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBills = useMemo(() => {
    return filteredAndSortedBills.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedBills, startIndex, pageSize]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-14 select-none">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Billing & Invoices
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/quick-sale"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Bill</span>
          </Link>
          <button
            type="button"
            onClick={loadBills}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh bills ledger"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (Pattern & Layout exactly matching reference) */}
      <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-[#FAFBFB] dark:bg-slate-900/60">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
            {/* Left Controls: Show entries + Today + Yestdy + Date Pickers + Clear + Gear */}
            <div className="flex items-center gap-2.5 flex-wrap text-slate-700 dark:text-slate-300">
              {/* Show Entries Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-slate-600 dark:text-slate-400">Show</span>
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
                <span className="text-slate-600 dark:text-slate-400">entries</span>
              </div>

              {/* Today Checkbox */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer ml-1 select-none">
                <input
                  type="checkbox"
                  checked={isToday}
                  onChange={handleToggleToday}
                  className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Today</span>
              </label>

              {/* Yestdy Checkbox */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isYesterday}
                  onChange={handleToggleYesterday}
                  className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Yestdy</span>
              </label>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setIsToday(false);
                    setIsYesterday(false);
                    setCurrentPage(1);
                  }}
                  className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setIsToday(false);
                    setIsYesterday(false);
                    setCurrentPage(1);
                  }}
                  className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Clear Button (Orange warm button matching image) */}
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
                        loadBills();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                      <span>Refresh Records</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Clean Search Input */}
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
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-t border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-16 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>SN</span>
                    {renderSortIndicator('sn')}
                  </div>
                </th>

                {/* Bill No */}
                <th
                  onClick={() => handleSort('billNumber')}
                  className="py-2.5 px-3 w-36 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Bill No</span>
                    {renderSortIndicator('billNumber')}
                  </div>
                </th>

                {/* Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 w-36 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                {/* Source */}
                <th
                  onClick={() => handleSort('source')}
                  className="py-2.5 px-3 w-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Source</span>
                    {renderSortIndicator('source')}
                  </div>
                </th>

                {/* Customer Name */}
                <th
                  onClick={() => handleSort('customerName')}
                  className="py-2.5 px-3 min-w-[140px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Customer Name</span>
                    {renderSortIndicator('customerName')}
                  </div>
                </th>

                {/* Mobile No */}
                <th
                  onClick={() => handleSort('mobile')}
                  className="py-2.5 px-3 w-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Mobile No</span>
                    {renderSortIndicator('mobile')}
                  </div>
                </th>

                {/* Payment Status */}
                <th
                  onClick={() => handleSort('paymentStatus')}
                  className="py-2.5 px-3 min-w-[120px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Payment Status</span>
                    {renderSortIndicator('paymentStatus')}
                  </div>
                </th>

                {/* Due / Balance */}
                <th
                  onClick={() => handleSort('due')}
                  className="py-2.5 px-3 w-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-r border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span>Due / Balance</span>
                    {renderSortIndicator('due')}
                  </div>
                </th>

                {/* Action */}
                <th className="py-2.5 px-3 w-48 text-left">
                  <span>Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                      <span>Loading billing records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    No billing records found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b, idx) => {
                  const snNumber = b.billNumber.replace(/\D/g, '') || String(startIndex + idx + 1);
                  const formattedDateTime = new Date(b.createdAt).toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });

                  return (
                    <tr
                      key={b.id}
                      className="group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                    >
                      {/* SN */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                        {snNumber}
                      </td>

                      {/* Bill No */}
                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {b.billNumber}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {formattedDateTime}
                      </td>

                      {/* Source (Right after Date) */}
                      <td className="py-2 px-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {renderSourceRef(b)}
                      </td>

                      {/* Customer Name */}
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium border-r border-slate-200 dark:border-slate-700/60">
                        {b.customerName || 'Walk-in Guest'}
                      </td>

                      {/* Mobile No */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {b.customerPhone || '—'}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2 px-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {getPaymentStatusBadge(b.paymentStatus)}
                      </td>

                      {/* Due / Balance */}
                      <td className="py-2 px-3 font-mono whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {b.balanceDue > 0 ? (
                          <>
                            <span className="text-[#e74c3c] font-semibold">
                              {b.balanceDue.toFixed(2)}
                            </span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-slate-600 dark:text-slate-400">0.00</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-600 dark:text-slate-400">0.00</span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {b.amountPaid.toFixed(2)}
                            </span>
                          </>
                        )}
                      </td>

                      {/* Action: 4 colored buttons side-by-side matching the reference image */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* 1. Edit / Settle (Teal Square Button) */}
                          <button
                            type="button"
                            onClick={() => setPaymentBill(b)}
                            title="Edit / Record Payment"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#1abc9c] hover:bg-[#16a085] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* 2. Print (Orange Button) */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewBill(b);
                              setTimeout(() => {
                                if (typeof window !== 'undefined') window.print();
                              }, 300);
                            }}
                            title="Print Invoice"
                            className="h-[25px] px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#f39c12] hover:bg-[#e08e0b] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>

                          {/* 3. View (Cyan Square Button) */}
                          <button
                            type="button"
                            onClick={() => setViewBill(b)}
                            title="View Invoice Document"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#00acd6] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {/* 4. More Dropdown (Blue Button) */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenMoreMenuId(openMoreMenuId === b.id ? null : b.id)}
                              title="More Actions"
                              className="h-[25px] px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#3c8dbc] hover:bg-[#367fa9] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>More</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {openMoreMenuId === b.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewBill(b);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>View Details</span>
                                </button>
                                {b.balanceDue > 0.01 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentBill(b);
                                      setOpenMoreMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Record Payment</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(b.billNumber);
                                      toast.success('Copied', `Bill #${b.billNumber} copied.`);
                                    }
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy Bill No</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewBill(b);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Thermal Receipt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info('Send to Mail', `Email delivery for Bill #${b.billNumber} will be available soon.`);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                                >
                                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Send to Mail</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info('Send to WhatsApp', `WhatsApp delivery for Bill #${b.billNumber} will be available soon.`);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
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

        {/* Table Footer: DataTables Style Pagination (matching image) */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 select-none">
          {/* Left: Entries Counter */}
          <div>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {Math.min(startIndex + pageSize, totalEntries)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {totalEntries.toLocaleString()}
            </strong>{' '}
            entries
          </div>

          {/* Right: DataTables Style Pagination */}
          <div className="flex items-center gap-1 text-xs">
            {/* Previous */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safeCurrentPage) <= 2
                );
              })
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const isGap = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {isGap && (
                      <span className="px-1.5 text-slate-400 select-none">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'min-w-[26px] h-[26px] px-2 font-mono text-xs rounded-[2px] transition-colors cursor-pointer flex items-center justify-center',
                        page === safeCurrentPage
                          ? 'bg-[#00a65a] dark:bg-emerald-600 text-white font-bold'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            {/* Next */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Document View & Print Modal */}
      <ViewBillModal
        bill={viewBill}
        isOpen={!!viewBill}
        onClose={() => setViewBill(null)}
        onOpenRecordPayment={(b) => setPaymentBill(b)}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        bill={paymentBill}
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 p-12 text-center text-xs text-slate-400">
          Loading Shared Billing & Invoicing System...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
