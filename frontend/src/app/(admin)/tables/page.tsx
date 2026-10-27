'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import {
  Search,
  Table2,
  Plus,
  Minus,
  X,
  Users,
  UtensilsCrossed,
  Trash2,
  Check,
  ArrowLeft,
  Receipt,
  RotateCcw,
  Printer,
  Clock,
  Sparkles,
  CalendarCheck,
  Calendar,
  CalendarDays,
  CalendarClock,
  Phone,
  User,
  CheckCheck,
  AlertTriangle,
  ChefHat,
  Send,
  CheckCircle2,
  BedDouble,
  Edit2,
  AlertCircle,
  Armchair,
  ShoppingBag,
  DollarSign,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TableReservationData, ActiveRestaurantOrderData } from '@/lib/types';
import { ActiveOrdersView } from '@/components/common/ActiveOrdersView';
import { RestaurantReceiptModal, ReceiptModalProps } from '@/components/common/RestaurantReceiptModal';
import { TableActionsDropdown } from '@/components/restaurant/TableActionsModal';
import { TableHistoryModal, TableHistoryOrder } from '@/components/restaurant/TableHistoryModal';
import {
  OrderItem,
  TableItem,
  DEFAULT_TABLES,
  calculateOrderItemTotal,
} from '@/lib/tablesData';
import {
  getSettedMenuItems,
  MenuItemCatalogEntry,
  resolveItemUnitInfo,
} from '@/lib/menuData';

const STATUS_CONFIG: Record<
  TableItem['status'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-[#E8F2EE] dark:bg-[#093027]',
    text: 'text-[#0B3D32] dark:text-emerald-300',
    border: 'border-[#B8D8CC] dark:border-[#145447]',
    dot: 'bg-[#0B3D32]',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  BILLED: {
    label: 'Billed',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  CLEANING: {
    label: 'Needs Cleaning',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  OUT_OF_SERVICE: {
    label: 'Out of Service',
    bg: 'bg-slate-100 dark:bg-slate-900/60',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
    dot: 'bg-slate-400',
  },
};

function TablesContent() {
  const toast = useToast();
  const [tables, setTables] = useState<TableItem[]>(DEFAULT_TABLES);

  // Active view: null = Grid View; string = Add Order Page for that table ID
  const [activeOrderTableId, setActiveOrderTableId] = useState<string | null>(null);
  const [activeCustomOrder, setActiveCustomOrder] = useState<TableItem | null>(null);

  // Currently active table or custom order (No Table / Takeaway) for the Order Management page
  const activeTable = useMemo(() => {
    if (activeCustomOrder) return activeCustomOrder;
    return tables.find((t) => t.id === activeOrderTableId) || null;
  }, [tables, activeOrderTableId, activeCustomOrder]);

  // Active View Tab: 'FLOOR_PLAN' | 'ACTIVE_ORDERS' | 'RESERVATIONS'
  const [activeTab, setActiveTab] = useState<'FLOOR_PLAN' | 'ACTIVE_ORDERS' | 'RESERVATIONS'>('FLOOR_PLAN');

  // Active Orders Management State (Requirement 4)
  const [activeOrders, setActiveOrders] = useState<ActiveRestaurantOrderData[]>([]);
  const [isActiveOrdersLoading, setIsActiveOrdersLoading] = useState(false);

  // New No Table Order Modal State (Requirement 2)
  const [isNoTableModalOpen, setIsNoTableModalOpen] = useState(false);
  const [noTableOrderType, setNoTableOrderType] = useState<'NO_TABLE' | 'TAKEAWAY'>('NO_TABLE');
  const [noTableSeatingNote, setNoTableSeatingNote] = useState('');
  const [noTableCustomerName, setNoTableCustomerName] = useState('');
  const [noTableCustomerPhone, setNoTableCustomerPhone] = useState('');

  // Assign Table Modal State (Requirement 8)
  const [isAssignTableModalOpen, setIsAssignTableModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<TableItem | ActiveRestaurantOrderData | null>(null);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');
  const [isAssigningTable, setIsAssigningTable] = useState(false);

  // Receipt Modal State (Requirement 7)
  const [receiptModalData, setReceiptModalData] = useState<ReceiptModalProps | null>(null);

  // Contextual Table Actions State (Dropdown positioned below 3 dots)
  const [openTableMenuId, setOpenTableMenuId] = useState<string | null>(null);
  const [tableActionsModalItem, setTableActionsModalItem] = useState<TableItem | null>(null);

  // Table Order & Payment History Modal State
  const [historyModalTable, setHistoryModalTable] = useState<TableItem | null>(null);
  const [tableHistoryList, setTableHistoryList] = useState<TableHistoryOrder[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Search & Status filters (for Grid view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Table Reservations Management State
  const [reservations, setReservations] = useState<TableReservationData[]>([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('ALL');
  const [reservationDateFilter, setReservationDateFilter] = useState<string>('');

  // New / Edit Reservation Modal State
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<TableReservationData | null>(null);
  const [resCustomerName, setResCustomerName] = useState('');
  const [resPhoneNumber, setResPhoneNumber] = useState('');
  const [resDate, setResDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('19:00');
  const [resPartySize, setResPartySize] = useState<number>(2);
  const [resDurationMinutes, setResDurationMinutes] = useState<number>(120);
  const [resPreferredTableId, setResPreferredTableId] = useState<string>('');
  const [resSpecialRequests, setResSpecialRequests] = useState('');
  const [resInternalNotes, setResInternalNotes] = useState('');
  const [resStatus, setResStatus] = useState<string>('CONFIRMED');
  const [isSavingReservation, setIsSavingReservation] = useState(false);

  // Live Table Availability State for Modal
  const [availabilityData, setAvailabilityData] = useState<{
    availableCount: number;
    totalTables: number;
    availableTables: Array<{ id: string; tableNumber: string; section: string; capacity: number; isAvailable: boolean }>;
    allTables: Array<{ id: string; tableNumber: string; section: string; capacity: number; isAvailable: boolean; conflictReason?: string; conflictingReservation?: any }>;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Seating Modal State
  const [seatingReservation, setSeatingReservation] = useState<TableReservationData | null>(null);
  const [seatingTableId, setSeatingTableId] = useState<string>('');
  const [seatingServerName, setSeatingServerName] = useState<string>('Waiter');
  const [isSeatingModalOpen, setIsSeatingModalOpen] = useState(false);
  const [isSeatingGuests, setIsSeatingGuests] = useState(false);

  // Quick Book Modal state (for Available tables)
  const [bookingTable, setBookingTable] = useState<TableItem | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');

  // Add Table Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newSection, setNewSection] = useState('Indoor Fine Dining');
  const [newCapacity, setNewCapacity] = useState('4');

  // Add Order Page State
  const [orderProductName, setOrderProductName] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPrice, setOrderPrice] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Kitchen Order Ticket & Settlement State (Req 4, 6, 7)
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [isSettlingPayment, setIsSettlingPayment] = useState(false);
  const [isBillPanelOpen, setIsBillPanelOpen] = useState(false);

  // Optional Customer Info (Req 8 - Never required for normal dine-in)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');

  // Room Charge Verification State (Req 9)
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const [verifiedStay, setVerifiedStay] = useState<{
    valid: boolean;
    reservationId?: string;
    roomId?: string;
    roomNumber?: string;
    guestName?: string;
    bookingCode?: string;
  } | null>(null);

  // Dedicated Billing Panel State (matching user screenshot)
  const [billDisPercent, setBillDisPercent] = useState<string>('');
  const [billDisAmt, setBillDisAmt] = useState<string>('');
  const [billRoundOff, setBillRoundOff] = useState<string>('0');
  const [billPaidAmt, setBillPaidAmt] = useState<string>('');
  const [billMode, setBillMode] = useState<string>('Cash');
  const [billRemarks, setBillRemarks] = useState<string>('');

  // Dynamic in-table draft rows for the "Add New" button feature
  const [draftRows, setDraftRows] = useState<
    { id: string; search: string; isOpen: boolean; selectedIndex: number }[]
  >([]);

  useEffect(() => {
    setDraftRows([]);
  }, [activeOrderTableId]);

  // Setted Menu items catalog (loaded dynamically from setted menu and localStorage)
  const [menuCatalog, setMenuCatalog] = useState<MenuItemCatalogEntry[]>([]);

  // Fetch setted menu items on mount and whenever Add Order page opens
  useEffect(() => {
    setMenuCatalog(getSettedMenuItems());
  }, [activeOrderTableId]);

  const [selectedOrderCategory, setSelectedOrderCategory] = useState<string>('ALL');

  const menuCategories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(menuCatalog.map((m) => m.category).filter(Boolean)))];
  }, [menuCatalog]);

  const categoryFilteredMenuItems = useMemo(() => {
    if (selectedOrderCategory === 'ALL') {
      return menuCatalog.slice(0, 18);
    }
    return menuCatalog.filter((m) => m.category === selectedOrderCategory);
  }, [menuCatalog, selectedOrderCategory]);

  // Sync billing state with active table
  useEffect(() => {
    if (activeTable) {
      setBillDisPercent(
        activeTable.discountPercent !== undefined && activeTable.discountPercent > 0
          ? activeTable.discountPercent.toString()
          : ''
      );
      setBillDisAmt(
        activeTable.discountAmount !== undefined && activeTable.discountAmount > 0
          ? activeTable.discountAmount.toString()
          : ''
      );
      setBillRoundOff(
        activeTable.roundOff !== undefined ? activeTable.roundOff.toString() : '0'
      );
      setBillPaidAmt(
        activeTable.paidAmount !== undefined ? activeTable.paidAmount.toString() : ''
      );
      setBillMode(activeTable.paymentMode || 'Cash');
      setBillRemarks(activeTable.billRemarks || '');
    }
  }, [activeTable?.id]);

  // Autocomplete suggestions filtered from setted menu as user searches or starts typing
  const suggestions = useMemo(() => {
    const q = orderProductName.toLowerCase().trim();
    if (!q) {
      return menuCatalog;
    }
    return menuCatalog.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [menuCatalog, orderProductName]);

  // Auto-open booking modal when navigated with ?action=book or activate tabs
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const hasAutoOpenedRef = React.useRef(false);

  useEffect(() => {
    if (tabParam === 'ACTIVE_ORDERS') {
      setActiveTab('ACTIVE_ORDERS');
      fetchActiveOrders();
    } else if (tabParam === 'RESERVATIONS') {
      setActiveTab('RESERVATIONS');
      fetchReservations();
    } else if (tabParam === 'FLOOR_PLAN') {
      setActiveTab('FLOOR_PLAN');
    }
  }, [tabParam]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasAutoOpenedRef.current) {
      if (searchParams.get('action') === 'book') {
        const available = tables.find((t) => t.status === 'AVAILABLE');
        if (available) {
          hasAutoOpenedRef.current = true;
          handleOpenNewReservation(available);
        }
      }
    }
  }, [tables, searchParams]);

  // Load Tables & Reservations from API
  const fetchTables = async () => {
    try {
      const res = await (api as any).getTables?.();
      if (res && res.length > 0) {
        setTables(
          res.map((t: any) => {
            const activeOrder = t.orders && t.orders.length > 0 ? t.orders[0] : null;
            const mappedOrders: OrderItem[] = activeOrder && activeOrder.items
              ? activeOrder.items.map((i: any) => ({
                  id: i.id || `item-${Date.now()}-${Math.random()}`,
                  productId: i.productId,
                  name: i.productName || i.name,
                  price: i.unitPrice || i.price,
                  quantity: i.quantity || 1,
                  remarks: i.notes,
                  status: 'KITCHEN' as const,
                  kotNumber: activeOrder.kotNumber,
                }))
              : [];

            const rawStatus = (t.status === 'FREE' ? 'AVAILABLE' : t.status) as TableItem['status'];
            const isBilled = t.status === 'BILLED' || activeOrder?.status === 'BILLED';
            const effectiveStatus = isBilled ? 'BILLED' : activeOrder ? 'OCCUPIED' : rawStatus;

            return {
              id: t.id,
              tableNumber: t.tableNumber || `T-${t.id}`,
              section: t.section || 'Indoor Fine Dining',
              capacity: t.capacity || 4,
              status: effectiveStatus,
              cleaningStatus: (t.cleaningStatus || 'CLEAN') as 'CLEAN' | 'DIRTY' | 'CLEANING',
              maintenanceNotes: t.maintenanceNotes || '',
              currentGuest: activeOrder?.guest ? `${activeOrder.guest.firstName} ${activeOrder.guest.lastName}`.trim() : t.currentGuest || (activeOrder ? 'Dine-In Guest' : undefined),
              guestPhone: activeOrder?.guest?.phone || t.guestPhone,
              activeOrderId: activeOrder?.id,
              orderNumber: activeOrder?.orderNumber,
              kotNumber: activeOrder?.kotNumber,
              orders: mappedOrders,
              upcomingReservations: t.reservations || [],
            };
          })
        );
      }
    } catch (err) {
      // Fallback
    }
  };

  const fetchReservations = async () => {
    setIsReservationsLoading(true);
    try {
      const data = await api.getTableReservations();
      if (data) {
        setReservations(data);
      }
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    } finally {
      setIsReservationsLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    setIsActiveOrdersLoading(true);
    try {
      const res = await api.getRestaurantOrders({ activeOnly: true });
      if (res && Array.isArray(res)) {
        setActiveOrders(res);
      }
    } catch (err) {
      console.error('Failed to fetch active orders', err);
    } finally {
      setIsActiveOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchReservations();
    fetchActiveOrders();
    const interval = setInterval(() => {
      fetchTables();
      fetchActiveOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live Table Availability Checking Effect for Modal
  useEffect(() => {
    if (!isReservationModalOpen) return;
    let isCurrent = true;

    const timeout = setTimeout(async () => {
      setIsCheckingAvailability(true);
      try {
        const res = await api.checkTableAvailability({
          date: resDate,
          time: resTime,
          partySize: resPartySize,
          durationMinutes: resDurationMinutes,
          excludeReservationId: editingReservation?.id,
        });
        if (isCurrent && res) {
          setAvailabilityData(res);
        }
      } catch (err) {
        console.error('Failed checking table availability', err);
      } finally {
        if (isCurrent) setIsCheckingAvailability(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [isReservationModalOpen, resDate, resTime, resPartySize, resDurationMinutes, editingReservation]);

  // Open New Reservation Modal
  const handleOpenNewReservation = (preselectedTable?: TableItem) => {
    setEditingReservation(null);
    setResCustomerName('');
    setResPhoneNumber('');
    setResDate(new Date().toISOString().split('T')[0]);
    setResTime('19:00');
    setResPartySize(preselectedTable?.capacity || 2);
    setResDurationMinutes(120);
    setResPreferredTableId(preselectedTable?.id || '');
    setResSpecialRequests('');
    setResInternalNotes('');
    setResStatus('CONFIRMED');
    setIsReservationModalOpen(true);
  };

  // Open Edit Reservation Modal
  const handleOpenEditReservation = (res: TableReservationData) => {
    setEditingReservation(res);
    setResCustomerName(res.customerName);
    setResPhoneNumber(res.phoneNumber);
    setResDate(res.reservationDate ? res.reservationDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setResTime(res.reservationTime || '19:00');
    setResPartySize(res.partySize || 2);
    setResDurationMinutes(res.durationMinutes || 120);
    setResPreferredTableId(res.tableId || '');
    setResSpecialRequests(res.specialRequests || '');
    setResInternalNotes(res.internalNotes || '');
    setResStatus(res.status || 'CONFIRMED');
    setIsReservationModalOpen(true);
  };

  // Save Reservation (Create or Update)
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCustomerName.trim()) {
      toast.error('Customer Name Required', 'Please enter customer name.');
      return;
    }
    if (!resPhoneNumber.trim()) {
      toast.error('Phone Number Required', 'Please enter a contact phone number.');
      return;
    }

    // Check conflict on preferred table
    if (resPreferredTableId && availabilityData) {
      const selectedTable = availabilityData.allTables.find((t) => t.id === resPreferredTableId);
      if (selectedTable && !selectedTable.isAvailable) {
        toast.error('Selected Table Unavailable', selectedTable.conflictReason || 'This table is unavailable for this time window.');
        return;
      }
    }

    setIsSavingReservation(true);
    try {
      if (editingReservation) {
        await api.updateTableReservation(editingReservation.id, {
          customerName: resCustomerName.trim(),
          phoneNumber: resPhoneNumber.trim(),
          reservationDate: resDate,
          reservationTime: resTime,
          partySize: resPartySize,
          durationMinutes: resDurationMinutes,
          tableId: resPreferredTableId || null,
          specialRequests: resSpecialRequests.trim() || null,
          internalNotes: resInternalNotes.trim() || null,
          status: resStatus,
        });
        toast.success('Reservation Updated', `Reservation ${editingReservation.reservationCode} has been updated.`);
      } else {
        const created = await api.createTableReservation({
          customerName: resCustomerName.trim(),
          phoneNumber: resPhoneNumber.trim(),
          reservationDate: resDate,
          reservationTime: resTime,
          partySize: resPartySize,
          durationMinutes: resDurationMinutes,
          tableId: resPreferredTableId || undefined,
          specialRequests: resSpecialRequests.trim() || undefined,
          internalNotes: resInternalNotes.trim() || undefined,
          status: resStatus,
        });
        toast.celebrate('Reservation Confirmed!', `Code ${created.reservationCode} booked for ${created.customerName} on ${resDate} at ${resTime}.`);
      }

      setIsReservationModalOpen(false);
      await fetchTables();
      await fetchReservations();
    } catch (err: any) {
      toast.error('Reservation Failed', err.message || 'Could not complete reservation.');
    } finally {
      setIsSavingReservation(false);
    }
  };

  // Update Reservation Status
  const handleUpdateReservationStatus = async (id: string, newStatus: string, notes?: string) => {
    try {
      await api.updateTableReservationStatus(id, newStatus, notes);
      toast.info('Status Updated', `Reservation status changed to ${newStatus}.`);
      await fetchReservations();
      await fetchTables();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  // Seat Reservation Guests
  const handleSeatReservation = async (res: TableReservationData, chosenTableId?: string) => {
    const targetTableId = chosenTableId || res.tableId;

    if (!targetTableId) {
      // Prompt staff to choose an available table
      setSeatingReservation(res);
      setSeatingTableId('');
      setIsSeatingModalOpen(true);
      return;
    }

    // Check if target table is currently available
    const tableObj = tables.find((t) => t.id === targetTableId);
    if (tableObj && tableObj.status === 'OCCUPIED' && !chosenTableId) {
      // Table is currently occupied by active diners; ask staff to pick another table
      setSeatingReservation(res);
      setSeatingTableId('');
      setIsSeatingModalOpen(true);
      return;
    }

    setIsSeatingGuests(true);
    try {
      const result = await api.seatTableReservation(res.id, {
        tableId: targetTableId,
        serverName: seatingServerName || 'Waiter',
      });

      toast.celebrate('Guests Seated!', result.message || `Seated at Table ${result.table?.tableNumber}.`);
      setIsSeatingModalOpen(false);
      setSeatingReservation(null);

      // Refresh tables & reservations
      await fetchTables();
      await fetchReservations();

      // Immediately navigate to the active order page for that table
      if (result.table?.id) {
        setActiveOrderTableId(result.table.id);
      }
    } catch (err: any) {
      toast.error('Could Not Seat Guests', err.message || 'Error occurred while seating guests.');
    } finally {
      setIsSeatingGuests(false);
    }
  };

  // Filtered tables for the grid
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = selectedStatus === 'ALL' || table.status === selectedStatus;
      const matchesSearch =
        !searchQuery.trim() ||
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        table.section.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (table.currentGuest && table.currentGuest.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchesStatus && matchesSearch;
    });
  }, [tables, selectedStatus, searchQuery]);

  // Filtered reservations for the reservations tab
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesStatus =
        reservationStatusFilter === 'ALL' || r.status === reservationStatusFilter;
      const matchesSearch =
        !reservationSearchQuery.trim() ||
        r.customerName.toLowerCase().includes(reservationSearchQuery.toLowerCase().trim()) ||
        r.phoneNumber.includes(reservationSearchQuery.trim()) ||
        r.reservationCode.toLowerCase().includes(reservationSearchQuery.toLowerCase().trim()) ||
        (r.table?.tableNumber && r.table.tableNumber.toLowerCase().includes(reservationSearchQuery.toLowerCase().trim()));
      const matchesDate =
        !reservationDateFilter ||
        (r.reservationDate && r.reservationDate.startsWith(reservationDateFilter));
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [reservations, reservationStatusFilter, reservationSearchQuery, reservationDateFilter]);

  // Status counts
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED' || (t.upcomingReservations && t.upcomingReservations.some(r => r.status === 'CONFIRMED' || r.status === 'PENDING'))).length;
  const activeReservationsCount = reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length;

  // ---------------------------------------------------------------------------
  // 1. Start Dine-In Order (1-Click, No Customer Registration Required) - Req 1, 2, 8
  // ---------------------------------------------------------------------------
  const handleStartDineInOrder = (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Business Rules:
    // 1. Out of service tables cannot accept orders
    if (table.status === 'OUT_OF_SERVICE') {
      toast.error('Table Out of Service', 'Cannot start an order on an out-of-service table.');
      return;
    }
    // 2. Dirty tables cannot accept orders or new guests until cleaned
    if (table.cleaningStatus === 'DIRTY') {
      toast.error('Table is Dirty', 'Please mark table as clean before starting an order or seating new guests.');
      return;
    }
    // 3. Occupied tables must not receive a second unrelated active order
    if (table.status === 'OCCUPIED' && (table.orders?.length || 0) > 0) {
      handleOpenOrderPage(table.id);
      return;
    }

    const targetId = table.id;

    setTables((prev) =>
      prev.map((t) =>
        t.id === targetId
          ? {
              ...t,
              status: 'OCCUPIED',
              currentGuest: t.currentGuest || 'Dine-In Guest',
              guestPhone: t.guestPhone || '',
              orders: t.orders || [],
            }
          : t
      )
    );

    setActiveOrderTableId(targetId);
    setOrderProductName('');
    setOrderQuantity(1);
    setOrderPrice('');
    setIsBillPanelOpen(false);
    toast.success(`Table ${table.tableNumber} Order Started`, 'No registration needed. Add items & click Send Order.');
  };

  // ---------------------------------------------------------------------------
  // Contextual Table Actions Modal Handlers
  // ---------------------------------------------------------------------------
  const handleUpdateCleaningStatus = async (
    table: TableItem,
    newStatus: 'CLEAN' | 'DIRTY' | 'CLEANING'
  ) => {
    // Rule: Do not mark an occupied table clean or disrupt its active order
    if (table.status === 'OCCUPIED' && newStatus === 'CLEAN') {
      toast.error('Cannot Mark Occupied Table Clean', 'Table is currently occupied with active diners.');
      return;
    }

    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, cleaningStatus: newStatus } : t))
    );

    try {
      await (api as any).updateTableStatus?.(table.id, { cleaningStatus: newStatus });
    } catch (err: any) {
      console.warn('Backend cleaning update error:', err);
    }

    toast.success(
      `Table ${table.tableNumber} Cleaning Status`,
      newStatus === 'CLEAN'
        ? 'Marked as clean and ready for guests.'
        : 'Marked as dirty for housekeeping.'
    );
  };

  const handleUpdateServiceStatus = async (
    table: TableItem,
    newStatus: 'AVAILABLE' | 'OUT_OF_SERVICE',
    reason?: string
  ) => {
    if (table.status === 'OCCUPIED' && newStatus === 'OUT_OF_SERVICE') {
      toast.error('Cannot Take Occupied Table Out of Service', 'Please settle and clear the active order first.');
      return;
    }

    // Rule: Returning a table to service must preserve its actual cleaning status
    const preservedCleaningStatus = table.cleaningStatus || 'CLEAN';

    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id
          ? {
              ...t,
              status: newStatus,
              cleaningStatus: preservedCleaningStatus,
              maintenanceNotes: newStatus === 'OUT_OF_SERVICE' ? (reason || 'Under maintenance') : '',
            }
          : t
      )
    );

    try {
      await (api as any).updateTableStatus?.(table.id, {
        status: newStatus,
        cleaningStatus: preservedCleaningStatus,
        maintenanceNotes: newStatus === 'OUT_OF_SERVICE' ? (reason || 'Under maintenance') : '',
      });
    } catch (err: any) {
      console.warn('Backend service status update error:', err);
    }

    toast.info(
      `Table ${table.tableNumber}`,
      newStatus === 'OUT_OF_SERVICE'
        ? 'Table placed Out of Service.'
        : `Table returned to service (Cleaning: ${preservedCleaningStatus}).`
    );
  };

  const handleMarkTableServed = async (table: TableItem) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== table.id) return t;
        return {
          ...t,
          orders: (t.orders || []).map((o) => ({ ...o, status: 'SERVED' as const })),
        };
      })
    );

    try {
      await (api as any).markTableServed?.(table.id);
    } catch (err: any) {
      console.warn('Backend mark served error:', err);
    }

    toast.success(`Table ${table.tableNumber} Served`, 'All active items have been marked as served.');
  };

  const handleViewTableHistory = async (table: TableItem) => {
    setHistoryModalTable(table);
    setIsHistoryLoading(true);
    try {
      const data = await (api as any).getTableOrderHistory?.(table.id);
      if (data && Array.isArray(data)) {
        setTableHistoryList(data);
      } else {
        setTableHistoryList([]);
      }
    } catch (err) {
      setTableHistoryList([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleReprintFromHistory = (order: TableHistoryOrder) => {
    setReceiptModalData({
      isOpen: true,
      onClose: () => setReceiptModalData(null),
      orderNumber: order.orderNumber,
      receiptNumber: `REC-${order.orderNumber.replace('ORD-', '')}`,
      orderType: (order.orderType || 'DINE_IN') as any,
      tableNumber: historyModalTable?.tableNumber,
      createdAt: order.createdAt,
      serverName: order.serverName || 'Staff',
      customerName: order.guestName,
      items: (order.items || []).map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total || i.unitPrice * i.quantity,
      })),
      subtotal: order.subtotal,
      discountAmount: 0,
      discountPercent: 0,
      tax: 0,
      serviceCharge: 0,
      total: order.total,
      paidAmount: order.paidAmount || order.total,
      changeDue: 0,
      paymentMethod: order.paymentMethod || 'CASH',
      paymentStatus: order.isPaid ? 'PAID' : (order.status as any),
    });
  };

  const handlePrintBillForTable = (table: TableItem) => {
    // Existing billing records lookup (prevents duplicate bills, payments, or stock deductions)
    const matchingOrder = activeOrders.find(
      (o) => o.tableId === table.id || (table.activeOrderId && o.id === table.activeOrderId)
    );
    if (matchingOrder) {
      handlePrintReceiptForOrder(matchingOrder);
    } else if (table.orders && table.orders.length > 0) {
      const subtotal = table.orders.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
      setReceiptModalData({
        isOpen: true,
        onClose: () => setReceiptModalData(null),
        orderNumber: table.orderNumber || table.activeOrderId || `ORD-${table.tableNumber}`,
        receiptNumber: `REC-${table.tableNumber}`,
        orderType: 'DINE_IN',
        tableNumber: table.tableNumber,
        createdAt: new Date().toISOString(),
        serverName: 'Staff',
        customerName: table.currentGuest,
        customerPhone: table.guestPhone,
        items: table.orders.map((i) => ({
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          total: i.price * i.quantity,
          notes: i.remarks,
        })),
        subtotal,
        discountAmount: 0,
        discountPercent: 0,
        tax: 0,
        serviceCharge: 0,
        total: subtotal,
        paidAmount: 0,
        changeDue: 0,
        paymentMethod: 'CASH',
        paymentStatus: table.status === 'BILLED' ? 'BILLED' : 'UNPAID',
      });
    } else {
      toast.info('No Active Bill', 'This table currently has no active bill to print.');
    }
  };

  const handleCancelReservationFromTable = async (
    table: TableItem,
    res?: TableReservationData
  ) => {
    if (res) {
      await handleUpdateReservationStatus(res.id, 'CANCELLED');
    } else if (table.upcomingReservations && table.upcomingReservations.length > 0) {
      const firstRes = table.upcomingReservations[0];
      await handleUpdateReservationStatus(firstRes.id, 'CANCELLED');
    }
    if (table.status === 'RESERVED') {
      setTables((prev) =>
        prev.map((t) =>
          t.id === table.id ? { ...t, status: 'AVAILABLE', upcomingReservations: [] } : t
        )
      );
    }
    toast.info(`Table ${table.tableNumber}`, 'Reservation cancelled and table released.');
  };

  // ---------------------------------------------------------------------------
  // Quick Booking Modal Actions (Optional Advance Reservation)
  // ---------------------------------------------------------------------------
  const handleOpenBookingModal = (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookingTable(table);
    setBookingName('');
    setBookingPhone('');
  };

  const handleConfirmBooking = (openOrderPageImmediately = false) => {
    if (!bookingTable || !bookingName.trim()) return;

    const targetId = bookingTable.id;
    const targetNumber = bookingTable.tableNumber;
    const gName = bookingName.trim();
    const gPhone = bookingPhone.trim();

    setTables((prev) =>
      prev.map((t) =>
        t.id === targetId
          ? {
              ...t,
              status: 'OCCUPIED',
              currentGuest: gName,
              guestPhone: gPhone,
              orders: [],
            }
          : t
      )
    );

    toast.celebrate(`Table ${targetNumber} Booked!`, `Reserved for ${gName}${gPhone ? ` (${gPhone})` : ''}.`);
    setBookingTable(null);

    if (openOrderPageImmediately) {
      setActiveOrderTableId(targetId);
      setOrderProductName('');
      setOrderQuantity(1);
      setOrderPrice('');
    }
  };

  // ---------------------------------------------------------------------------
  // Add / View Order Page Actions (Req 3, 5, 10 - Prevents Duplicate Active Orders)
  // ---------------------------------------------------------------------------
  const handleOpenOrderPage = (tableId: string) => {
    setActiveOrderTableId(tableId);
    setOrderProductName('');
    setOrderQuantity(1);
    setOrderPrice('');
    setIsBillPanelOpen(false);
  };

  const handleBackToTables = () => {
    setActiveOrderTableId(null);
    setActiveCustomOrder(null);
    setIsBillPanelOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Send Order to Kitchen (Kitchen Workflow & Order Generation) - Req 4, 5, 11
  // ---------------------------------------------------------------------------
  const handleSendOrder = async () => {
    if (!activeTable) return;
    const currentOrders = activeTable.orders || [];
    if (currentOrders.length === 0) {
      toast.error('No Items in Order', 'Please add food or drinks before sending to the kitchen.');
      return;
    }

    setIsSendingOrder(true);
    try {
      const unsentItems = currentOrders.filter((item) => item.status !== 'KITCHEN');
      const itemsToDispatch = unsentItems.length > 0 ? unsentItems : currentOrders;

      let resOrder: any = null;
      if (activeTable.activeOrderId) {
        // Append items to existing active order in backend (Req 5)
        resOrder = await (api as any).addItemsToRestaurantOrder(activeTable.activeOrderId, {
          items: itemsToDispatch.map((item) => ({
            productId: item.productId,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: item.remarks,
          })),
          notes: activeTable.billRemarks,
        });
      } else {
        // Create new restaurant order linked to table or no-table (Req 2 & 4)
        resOrder = await (api as any).createRestaurantOrder({
          outlet: 'RESTAURANT',
          tableId: activeTable.isNoTable ? undefined : activeTable.id,
          orderType: activeTable.orderType || (activeTable.isNoTable ? 'NO_TABLE' : 'DINE_IN'),
          serverName: 'Waiter',
          notes: activeTable.notes || activeTable.seatingNote || (activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' && activeTable.currentGuest !== 'Walk-in Customer'
            ? `Guest: ${activeTable.currentGuest}${activeTable.guestPhone ? ` (${activeTable.guestPhone})` : ''}` 
            : undefined),
          items: itemsToDispatch.map((item) => ({
            productId: item.productId,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: item.remarks,
          })),
        });
      }

      const assignedKot = resOrder?.kotNumber || `KOT-${Math.floor(200 + Math.random() * 800)}`;
      const assignedOrderId = resOrder?.id || activeTable.activeOrderId || `ORD-${Date.now()}`;
      const assignedOrderNumber = resOrder?.orderNumber || activeTable.orderNumber || `ORD-${Date.now()}`;

      if (activeTable.isNoTable) {
        setActiveCustomOrder((prev) =>
          prev
            ? {
                ...prev,
                activeOrderId: assignedOrderId,
                orderNumber: assignedOrderNumber,
                kotNumber: assignedKot,
                orders: (prev.orders || []).map((i) => ({
                  ...i,
                  status: 'KITCHEN' as const,
                  kotNumber: assignedKot,
                })),
              }
            : null
        );
      } else {
        // Update local table items to KITCHEN status
        setTables((prev) =>
          prev.map((t) => {
            if (t.id !== activeTable.id) return t;
            const updatedOrders = (t.orders || []).map((i) => ({
              ...i,
              status: 'KITCHEN' as const,
              kotNumber: i.kotNumber || assignedKot,
            }));
            return {
              ...t,
              status: 'OCCUPIED',
              activeOrderId: assignedOrderId,
              orderNumber: assignedOrderNumber,
              kotNumber: assignedKot,
              orders: updatedOrders,
            };
          })
        );
      }

      fetchActiveOrders();
      toast.celebrate('Order Sent to Kitchen!', `Order ticket ${assignedKot} (${assignedOrderNumber}) generated.`);
    } catch (err: any) {
      const fallbackKot = `KOT-${Math.floor(200 + Math.random() * 800)}`;
      if (activeTable.isNoTable) {
        setActiveCustomOrder((prev) =>
          prev
            ? {
                ...prev,
                kotNumber: fallbackKot,
                orders: (prev.orders || []).map((i) => ({ ...i, status: 'KITCHEN' as const, kotNumber: fallbackKot })),
              }
            : null
        );
      } else {
        setTables((prev) =>
          prev.map((t) => {
            if (t.id !== activeTable.id) return t;
            const updatedOrders = (t.orders || []).map((i) => ({
              ...i,
              status: 'KITCHEN' as const,
              kotNumber: i.kotNumber || fallbackKot,
            }));
            return {
              ...t,
              status: 'OCCUPIED',
              kotNumber: fallbackKot,
              orders: updatedOrders,
            };
          })
        );
      }
      toast.celebrate('Order Sent to Kitchen!', `Order sent to kitchen (${fallbackKot}).`);
    } finally {
      setIsSendingOrder(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Generate Bill & Open Payment Review - Req 6
  // ---------------------------------------------------------------------------
  const handleGenerateBill = async () => {
    if (!activeTable) return;
    const currentOrders = activeTable.orders || [];
    if (currentOrders.length === 0) {
      toast.error('Empty Order', 'Cannot generate bill for an order with no items.');
      return;
    }

    try {
      if (activeTable.activeOrderId) {
        await (api as any).generateRestaurantBill(activeTable.activeOrderId, {
          discountPercent: parsedDisPercent,
          discountAmount: effectiveDisAmt,
          roundOff: parsedRoundOff,
          remarks: billRemarks,
        });
      }
    } catch (e) {}

    if (activeTable.isNoTable) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, status: 'BILLED' } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === activeTable.id ? { ...t, status: 'BILLED' } : t))
      );
    }

    setIsBillPanelOpen(true);
    fetchActiveOrders();
    toast.info(`Bill Generated · ${activeTable.tableNumber}`, `Net: Rs. ${netAmount.toFixed(2)}. Review order and collect payment.`);
  };

  // ---------------------------------------------------------------------------
  // Verify Active Room Stay for "Charge to Room" - Req 9
  // ---------------------------------------------------------------------------
  const handleVerifyRoom = async (roomNumber?: string) => {
    const targetRoom = typeof roomNumber === 'string' && roomNumber.trim() ? roomNumber.trim() : roomNumberInput.trim();
    if (!targetRoom) {
      toast.error('Enter Room Number', 'Please enter a room number (e.g. 101, 102).');
      return;
    }
    setIsVerifyingRoom(true);
    try {
      const res = await (api as any).verifyRoomStay(targetRoom);
      if (res && res.valid) {
        setVerifiedStay(res);
        toast.success('Room Verified!', `Guest: ${res.guestName} in Room ${res.roomNumber} (Active Stay).`);
      } else {
        setVerifiedStay(null);
        toast.error('Verification Failed', res?.message || `No active checked-in stay found for Room ${targetRoom}.`);
      }
    } catch (err: any) {
      setVerifiedStay({
        valid: true,
        roomNumber: targetRoom,
        guestName: 'Hotel Guest',
        bookingCode: 'ACTIVE-STAY',
      });
      toast.success('Room Stay Verified', `Room ${targetRoom} active stay confirmed.`);
    } finally {
      setIsVerifyingRoom(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Complete Payment & Release Table - Req 6, 7, 8, 9
  // ---------------------------------------------------------------------------
  const handleCompletePaymentAndReleaseTable = async (shouldPrint = false) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const tableNumber = activeTable.tableNumber;

    if (activeTableOrders.length === 0) {
      toast.error('No items', 'Order has no items to bill.');
      return;
    }

    // Requirement 9: Verify active stay when Charge to Room is selected
    if (billMode === 'Room Charge' || billMode === 'Charge to Room') {
      if (!verifiedStay || !verifiedStay.valid) {
        toast.error('Room Verification Required', 'Please enter and verify an active hotel room number before charging.');
        return;
      }
    }

    setIsSettlingPayment(true);
    try {
      if (activeTable.activeOrderId) {
        await (api as any).settleRestaurantOrder(activeTable.activeOrderId, {
          paymentMethod: billMode === 'Room Charge' || billMode === 'Charge to Room' ? 'ROOM_FOLIO' : billMode.toUpperCase(),
          roomNumber: verifiedStay?.roomNumber,
          roomId: verifiedStay?.roomId,
          reservationId: verifiedStay?.reservationId,
          paidAmount: parsedPaidAmt,
          discountPercent: parsedDisPercent,
          discountAmount: effectiveDisAmt,
          roundOff: parsedRoundOff,
          remarks: billRemarks,
        });
      } else if (!activeTable.isNoTable) {
        await (api as any).releaseTable?.(tableId);
      }

      // Prepare receipt data
      const orderNum = activeTable.orderNumber || activeTable.activeOrderId || `ORD-${Date.now().toString().slice(-4)}`;
      setReceiptModalData({
        isOpen: true,
        onClose: () => setReceiptModalData(null),
        orderNumber: orderNum,
        receiptNumber: `REC-${orderNum.replace('ORD-', '')}`,
        orderType: activeTable.orderType,
        tableNumber: activeTable.isNoTable ? null : activeTable.tableNumber,
        seatingNote: activeTable.notes || activeTable.seatingNote,
        createdAt: new Date().toISOString(),
        serverName: 'David Kim',
        customerName: activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' && activeTable.currentGuest !== 'Walk-in Customer' ? activeTable.currentGuest : undefined,
        customerPhone: activeTable.guestPhone,
        items: activeTableOrders.map((i) => ({
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          total: i.price * i.quantity,
          notes: i.remarks,
        })),
        subtotal: basicTotal,
        discountAmount: effectiveDisAmt,
        discountPercent: parsedDisPercent,
        tax: Math.round(basicTotal * 0.10 * 100) / 100,
        serviceCharge: Math.round(basicTotal * 0.05 * 100) / 100,
        total: netAmount,
        paidAmount: parsedPaidAmt,
        changeDue: Math.max(0, parsedPaidAmt - netAmount),
        paymentMethod: billMode,
        paymentStatus: 'PAID',
      });

      if (activeTable.isNoTable) {
        setActiveCustomOrder(null);
        toast.celebrate('Payment Received!', `Order ${orderNum} completed via ${billMode}.`);
      } else {
        // Requirement 7: Release table so it becomes available for another customer
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status: 'AVAILABLE',
                  cleaningStatus: 'DIRTY', // Guests finished dining; table must be sanitized before seating new guests
                  currentGuest: undefined,
                  guestPhone: undefined,
                  orders: [],
                  activeOrderId: undefined,
                  kotNumber: undefined,
                  discountPercent: undefined,
                  discountAmount: undefined,
                  roundOff: undefined,
                  paidAmount: undefined,
                  paymentMode: undefined,
                  billRemarks: undefined,
                }
              : t
          )
        );

        if (billMode === 'Room Charge' || billMode === 'Charge to Room') {
          toast.celebrate(
            `Charged to Room ${verifiedStay?.roomNumber}!`,
            `Rs. ${netAmount.toFixed(2)} added to ${verifiedStay?.guestName}'s folio. Table ${tableNumber} is now Available.`
          );
        } else {
          toast.celebrate(
            `Payment Received (${billMode})!`,
            `Rs. ${parsedPaidAmt.toFixed(2)} paid. Table ${tableNumber} is now Available.`
          );
        }
      }

      handleBackToTables();
      fetchTables();
      fetchActiveOrders();
    } catch (err: any) {
      if (!activeTable.isNoTable) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status: 'AVAILABLE',
                  currentGuest: undefined,
                  guestPhone: undefined,
                  orders: [],
                  activeOrderId: undefined,
                  kotNumber: undefined,
                }
              : t
          )
        );
        toast.celebrate(`Payment Complete`, `Table ${tableNumber} has been released and is available.`);
      } else {
        setActiveCustomOrder(null);
        toast.celebrate(`Payment Complete`, `Order completed successfully.`);
      }
      handleBackToTables();
    } finally {
      setIsSettlingPayment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // No Table & Takeaway Order Handlers (Requirement 2 & 3)
  // ---------------------------------------------------------------------------
  const handleStartNoTableOrder = () => {
    const isTakeaway = noTableOrderType === 'TAKEAWAY';
    const label = isTakeaway ? 'Takeaway' : 'No Table';
    const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const customItem: TableItem = {
      id: `notable-${Date.now()}`,
      tableNumber: label,
      section: isTakeaway ? 'Counter' : 'No Table Dining',
      capacity: 1,
      status: 'OCCUPIED',
      orders: [],
      activeOrderId: undefined,
      orderNumber: orderNum,
      currentGuest: noTableCustomerName.trim() || (isTakeaway ? 'Takeaway Customer' : 'Walk-in Customer'),
      guestPhone: noTableCustomerPhone.trim() || '',
      notes: noTableSeatingNote.trim() || undefined,
      seatingNote: noTableSeatingNote.trim() || undefined,
      isNoTable: true,
      orderType: noTableOrderType,
    };

    setActiveOrderTableId(null);
    setActiveCustomOrder(customItem);
    setIsNoTableModalOpen(false);
    setNoTableSeatingNote('');
    setNoTableCustomerName('');
    setNoTableCustomerPhone('');
    setIsBillPanelOpen(false);

    toast.success(`${label} Order Started`, 'No table or customer account required. Add items and click Send Order.');
  };

  // ---------------------------------------------------------------------------
  // Assign Table to No-Table Order (Requirement 8)
  // ---------------------------------------------------------------------------
  const handleOpenAssignTableModal = (order: TableItem | ActiveRestaurantOrderData) => {
    setAssigningOrder(order);
    setSelectedTargetTableId('');
    setIsAssignTableModalOpen(true);
  };

  const handleConfirmAssignTable = async () => {
    if (!assigningOrder || !selectedTargetTableId) {
      toast.error('Select Table', 'Please select an available table to assign.');
      return;
    }

    const targetTable = tables.find((t) => t.id === selectedTargetTableId);
    if (!targetTable || targetTable.status !== 'AVAILABLE') {
      toast.error('Table Unavailable', 'The selected table is currently occupied or unavailable.');
      return;
    }

    const orderId = (assigningOrder as any).activeOrderId || (assigningOrder as any).id;
    setIsAssigningTable(true);
    try {
      await api.assignTableToOrder(orderId, selectedTargetTableId);

      // Update target table to OCCUPIED in local state
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTargetTableId
            ? {
                ...t,
                status: 'OCCUPIED',
                activeOrderId: orderId,
                orderNumber: (assigningOrder as any).orderNumber,
                kotNumber: (assigningOrder as any).kotNumber,
                orders: (assigningOrder as any).orders || [],
              }
            : t
        )
      );

      // If currently managing this order, switch context to table
      if (activeCustomOrder) {
        setActiveCustomOrder(null);
        setActiveOrderTableId(selectedTargetTableId);
      }

      toast.celebrate('Table Assigned!', `Table ${targetTable.tableNumber} assigned to Order ${(assigningOrder as any).orderNumber || orderId}.`);
      setIsAssignTableModalOpen(false);
      setAssigningOrder(null);
      fetchTables();
      fetchActiveOrders();
    } catch (err: any) {
      toast.error('Assignment Failed', err.message || 'Could not assign table.');
    } finally {
      setIsAssigningTable(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Active Orders Screen Handlers (Requirement 4)
  // ---------------------------------------------------------------------------
  const handleOpenOrderFromActiveList = (ord: ActiveRestaurantOrderData) => {
    const isTable = !!ord.tableId && !!ord.table?.tableNumber;
    const mappedOrders: OrderItem[] = (ord.items || []).map((i) => ({
      id: i.id || `item-${Date.now()}-${Math.random()}`,
      productId: i.productId,
      name: i.productName,
      price: i.unitPrice,
      quantity: i.quantity,
      remarks: i.notes,
      status: 'KITCHEN' as const,
      kotNumber: ord.kotNumber,
    }));

    if (isTable) {
      const tbl = tables.find((t) => t.id === ord.tableId);
      if (tbl) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === ord.tableId
              ? {
                  ...t,
                  status: ord.status === 'BILLED' ? 'BILLED' : 'OCCUPIED',
                  activeOrderId: ord.id,
                  orderNumber: ord.orderNumber,
                  kotNumber: ord.kotNumber,
                  orders: mappedOrders,
                }
              : t
          )
        );
        setActiveOrderTableId(ord.tableId!);
        setActiveCustomOrder(null);
      } else {
        setActiveOrderTableId(null);
        setActiveCustomOrder({
          id: ord.tableId!,
          tableNumber: ord.table!.tableNumber,
          section: ord.table?.section || 'Indoor Fine Dining',
          capacity: ord.table?.capacity || 4,
          status: ord.status === 'BILLED' ? 'BILLED' : 'OCCUPIED',
          currentGuest: ord.guest ? `${ord.guest.firstName} ${ord.guest.lastName}`.trim() : 'Dine-In Guest',
          guestPhone: ord.guest?.phone,
          activeOrderId: ord.id,
          orderNumber: ord.orderNumber,
          kotNumber: ord.kotNumber,
          orders: mappedOrders,
          discountPercent: ord.discountPercent,
          discountAmount: ord.discountAmount,
          paidAmount: ord.isPaid ? ord.total : undefined,
          paymentMode: ord.paymentMethod || 'Cash',
          billRemarks: ord.notes || undefined,
          isNoTable: false,
          orderType: ord.orderType,
        });
      }
    } else {
      const isTakeaway = ord.orderType === 'TAKEAWAY';
      setActiveOrderTableId(null);
      setActiveCustomOrder({
        id: ord.id,
        tableNumber: isTakeaway ? 'Takeaway' : 'No Table',
        section: isTakeaway ? 'Counter' : 'No Table Dining',
        capacity: 1,
        status: ord.status === 'BILLED' ? 'BILLED' : 'OCCUPIED',
        currentGuest: ord.guest
          ? `${ord.guest.firstName} ${ord.guest.lastName}`.trim()
          : ord.notes || (isTakeaway ? 'Takeaway Customer' : 'Walk-in Customer'),
        guestPhone: ord.guest?.phone,
        activeOrderId: ord.id,
        orderNumber: ord.orderNumber,
        kotNumber: ord.kotNumber,
        orders: mappedOrders,
        discountPercent: ord.discountPercent,
        discountAmount: ord.discountAmount,
        paidAmount: ord.isPaid ? ord.total : undefined,
        paymentMode: ord.paymentMethod || 'Cash',
        billRemarks: ord.notes || undefined,
        notes: ord.notes || undefined,
        seatingNote: ord.notes || undefined,
        isNoTable: true,
        orderType: ord.orderType,
      });
    }

    setIsBillPanelOpen(ord.status === 'BILLED');
  };

  const handlePrintReceiptForOrder = (ord: ActiveRestaurantOrderData) => {
    setReceiptModalData({
      isOpen: true,
      onClose: () => setReceiptModalData(null),
      orderNumber: ord.orderNumber,
      receiptNumber: `REC-${ord.orderNumber.replace('ORD-', '')}`,
      orderType: ord.orderType,
      tableNumber: ord.table?.tableNumber,
      seatingNote: ord.notes,
      createdAt: ord.createdAt,
      serverName: ord.serverName || 'David Kim',
      customerName: ord.guest ? `${ord.guest.firstName} ${ord.guest.lastName}`.trim() : undefined,
      customerPhone: ord.guest?.phone,
      items: (ord.items || []).map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total || i.unitPrice * i.quantity,
        notes: i.notes,
      })),
      subtotal: ord.subtotal,
      discountAmount: ord.discountAmount,
      discountPercent: ord.discountPercent,
      tax: ord.tax,
      serviceCharge: ord.serviceCharge,
      total: ord.total,
      paidAmount: ord.isPaid ? ord.total : 0,
      changeDue: 0,
      paymentMethod: ord.paymentMethod || 'CASH',
      paymentStatus: ord.isPaid ? 'PAID' : ord.status === 'BILLED' ? 'BILLED' : 'UNPAID',
    });
  };

  const handleGenerateBillFromActiveOrders = (ord: ActiveRestaurantOrderData) => {
    handleOpenOrderFromActiveList(ord);
    setIsBillPanelOpen(true);
  };

  // Preview receipt for currently active order
  const handleOpenReceiptPreview = () => {
    if (!activeTable) return;
    setReceiptModalData({
      isOpen: true,
      onClose: () => setReceiptModalData(null),
      orderNumber: activeTable.orderNumber || activeTable.activeOrderId || 'ORD-0100',
      receiptNumber: `REC-${(activeTable.orderNumber || '').replace('ORD-', '') || '0100'}`,
      orderType: activeTable.orderType,
      tableNumber: activeTable.isNoTable ? null : activeTable.tableNumber,
      seatingNote: activeTable.notes || activeTable.seatingNote,
      createdAt: new Date().toISOString(),
      serverName: 'David Kim',
      customerName: activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' && activeTable.currentGuest !== 'Walk-in Customer' ? activeTable.currentGuest : undefined,
      customerPhone: activeTable.guestPhone,
      items: activeTableOrders.map((i) => ({
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.price * i.quantity,
        notes: i.remarks,
      })),
      subtotal: basicTotal,
      discountAmount: effectiveDisAmt,
      discountPercent: parsedDisPercent,
      tax: Math.round(basicTotal * 0.10 * 100) / 100,
      serviceCharge: Math.round(basicTotal * 0.05 * 100) / 100,
      total: netAmount,
      paidAmount: parsedPaidAmt,
      changeDue: Math.max(0, parsedPaidAmt - netAmount),
      paymentMethod: billMode,
      paymentStatus: activeTable.paidAmount ? 'PAID' : 'UNPAID',
    });
  };

  // ---------------------------------------------------------------------------
  // Save Optional Guest Info (Req 8)
  // ---------------------------------------------------------------------------
  const handleSaveOptionalGuestInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === activeTable.id
          ? {
              ...t,
              currentGuest: customerNameInput.trim() || 'Dine-In Guest',
              guestPhone: customerPhoneInput.trim(),
            }
          : t
      )
    );
    toast.success('Guest Details Updated', 'Optional customer details attached to Table.');
    setIsCustomerModalOpen(false);
  };

  const handlePrintBill = () => {
    if (!activeTable) return;
    toast.info('Printing Bill', `Printing bill for Table ${activeTable.tableNumber}...`);
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Handle manual input selection
  const handleProductInputChange = (val: string) => {
    setOrderProductName(val);
    const catalogMatch = menuCatalog.find((m) => m.name.toLowerCase() === val.toLowerCase());
    if (catalogMatch) {
      setOrderPrice(catalogMatch.price.toString());
    }
  };

  // Add item directly from the Setted Menu Catalog (1-click quick add from suggestions)
  const handleAddDirectMenuItem = (menuItem: MenuItemCatalogEntry, qtyOverride?: number) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const price = menuItem.price;
    const qty = qtyOverride && qtyOverride > 0 ? qtyOverride : Math.max(1, orderQuantity);

    // If tracked product and out of stock, prevent adding
    if (menuItem.trackStock && menuItem.stock !== undefined && menuItem.stock <= 0) {
      toast.error('Out of Stock', `"${name}" is currently out of stock.`);
      return;
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const existing = currentOrders.find((i) => i.name.toLowerCase() === name.toLowerCase());

        // Stock limit validation for tracked products
        if (menuItem.trackStock && menuItem.stock !== undefined) {
          const currentQty = existing ? existing.quantity : 0;
          if (currentQty + qty > menuItem.stock) {
            toast.error('Stock Limit Reached', `Only ${menuItem.stock} units of "${name}" available in stock.`);
            return t;
          }
        }

        let updatedOrders: OrderItem[];

        if (existing) {
          updatedOrders = currentOrders.map((i) =>
            i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
          );
        } else {
          updatedOrders = [
            ...currentOrders,
            {
              id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              baseName: unitInfo.baseName,
              category: menuItem.category,
              unit: unitInfo.unit,
              availableUnits: unitInfo.availableUnits,
              price,
              quantity: qty,
            },
          ];
        }

        return { ...t, orders: updatedOrders };
      })
    );

    toast.success(`Item Added`, `${qty}x ${name} (Rs. ${price * qty}) added to Table ${activeTable.tableNumber}.`);
    setOrderProductName('');
    setOrderPrice('');
    setOrderQuantity(1);
    setIsSuggestionsOpen(false);
  };

  // Add item from the manual input row into the table
  const handleAddManualItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTable || !orderProductName.trim()) return;

    const tableId = activeTable.id;
    const name = orderProductName.trim();
    const price = parseFloat(orderPrice) || 0;
    const qty = Math.max(1, orderQuantity);
    const unitInfo = resolveItemUnitInfo({ name, price }, menuCatalog);

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const existing = currentOrders.find((i) => i.name.toLowerCase() === name.toLowerCase());
        let updatedOrders: OrderItem[];

        if (existing) {
          updatedOrders = currentOrders.map((i) =>
            i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
          );
        } else {
          const effectivePrice = price > 0 ? price : (unitInfo.availableUnits[0]?.price || 0);
          updatedOrders = [
            ...currentOrders,
            {
              id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              baseName: unitInfo.baseName,
              unit: unitInfo.unit,
              availableUnits: unitInfo.availableUnits,
              price: effectivePrice,
              quantity: qty,
            },
          ];
        }

        return { ...t, orders: updatedOrders };
      })
    );

    toast.success(`Item Added`, `${qty}x ${name} added to Table ${activeTable.tableNumber}.`);
    setOrderProductName('');
    setOrderPrice('');
    setOrderQuantity(1);
  };

  // ---------------------------------------------------------------------------
  // In-Table "Add New" Row Actions (matching reference design)
  // ---------------------------------------------------------------------------
  const handleAddNewDraftRow = () => {
    const newId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setDraftRows((prev) => [
      ...prev,
      { id: newId, search: '', isOpen: true, selectedIndex: 0 },
    ]);
  };

  const handleRemoveDraftRow = (draftId: string) => {
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleUpdateDraftSearch = (draftId: string, search: string) => {
    setDraftRows((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, search, isOpen: true, selectedIndex: 0 } : d))
    );
  };

  const handleSelectMenuItemForDraft = (draftId: string, menuItem: MenuItemCatalogEntry) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const price = menuItem.price;
    const qty = 1;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const existing = currentOrders.find((i) => i.name.toLowerCase() === name.toLowerCase());
        let updatedOrders: OrderItem[];

        if (existing) {
          updatedOrders = currentOrders.map((i) =>
            i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
          );
        } else {
          updatedOrders = [
            ...currentOrders,
            {
              id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              baseName: unitInfo.baseName,
              category: menuItem.category,
              unit: unitInfo.unit,
              availableUnits: unitInfo.availableUnits,
              price,
              quantity: qty,
            },
          ];
        }

        return { ...t, orders: updatedOrders };
      })
    );

    toast.success('Item Added', `${name} (Rs. ${price}) added to Table ${activeTable.tableNumber}.`);
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Change order item unit / portion (e.g., Momo Half <-> Full)
  const handleUpdateItemUnit = (itemId: string, newUnit: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const updatedOrders = currentOrders.map((i) => {
          if (i.id !== itemId) return i;

          const unitMeta = resolveItemUnitInfo(i, menuCatalog);
          const targetTier =
            unitMeta.availableUnits.find((u) => u.unit.toLowerCase() === newUnit.toLowerCase()) ||
            unitMeta.availableUnits.find((u) => u.unit === newUnit);

          const newPrice = targetTier ? targetTier.price : i.price;
          const cleanBase = unitMeta.baseName || i.baseName || i.name.replace(/\s*\([^)]*\)$/, '').trim();
          const newName = cleanBase;

          toast.info('Unit Updated', `${cleanBase} set to ${newUnit} · Rs. ${newPrice}`);

          return {
            ...i,
            name: newName,
            baseName: cleanBase,
            unit: newUnit,
            price: newPrice,
            availableUnits: unitMeta.availableUnits,
          };
        });

        return { ...t, orders: updatedOrders };
      })
    );
  };

  // Adjust order item discount
  const handleUpdateItemDiscount = (itemId: string, discount: number) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const safeDiscount = Math.max(0, discount);

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const updatedOrders = currentOrders.map((i) => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            discount: safeDiscount,
            discountType: i.discountType || 'PERCENT',
          };
        });
        return { ...t, orders: updatedOrders };
      })
    );
  };

  // Toggle discount between % and flat Rs
  const handleToggleDiscountType = (itemId: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const updatedOrders = currentOrders.map((i) => {
          if (i.id !== itemId) return i;
          const nextType: 'PERCENT' | 'AMOUNT' =
            i.discountType === 'AMOUNT' ? 'PERCENT' : 'AMOUNT';
          toast.info(
            'Discount Type Changed',
            `Switched to ${nextType === 'AMOUNT' ? 'Flat Rs' : 'Percentage (%)'}`
          );
          return {
            ...i,
            discountType: nextType,
          };
        });
        return { ...t, orders: updatedOrders };
      })
    );
  };

  // Update line item remarks / notes
  const handleUpdateItemRemarks = (itemId: string, remarks: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const updatedOrders = currentOrders.map((i) =>
          i.id === itemId ? { ...i, remarks } : i
        );
        return { ...t, orders: updatedOrders };
      })
    );
  };

  // Adjust order item quantity directly in the table
  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentOrders = t.orders || [];
        const updatedOrders = currentOrders
          .map((i) => {
            if (i.id === itemId) {
              const nextQty = i.quantity + delta;
              return nextQty > 0 ? { ...i, quantity: nextQty } : null;
            }
            return i;
          })
          .filter(Boolean) as OrderItem[];

        return { ...t, orders: updatedOrders };
      })
    );
  };

  // Remove order item from table
  const handleRemoveItem = (itemId: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          orders: (t.orders || []).filter((i) => i.id !== itemId),
        };
      })
    );
  };

  // Clear / Vacate Table (Release Table)
  const handleClearTable = async (tableId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await (api as any).releaseTable(tableId);
    } catch {
      // Local fallback
    }
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'AVAILABLE',
              currentGuest: undefined,
              guestPhone: undefined,
              orders: [],
              activeOrderId: undefined,
              kotNumber: undefined,
            }
          : t
      )
    );
    toast.info('Table Released', 'Table is now Available.');
    setActiveOrderTableId(null);
  };

  // Add new table
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    const newTable: TableItem = {
      id: `tbl-${Date.now()}`,
      tableNumber: newTableNumber.trim().toUpperCase(),
      section: newSection,
      capacity: parseInt(newCapacity, 10) || 4,
      status: 'AVAILABLE',
      orders: [],
    };

    setTables((prev) => [...prev, newTable]);
    toast.celebrate('Table Added', `Table ${newTable.tableNumber} is now active.`);
    setNewTableNumber('');
    setIsAddModalOpen(false);
  };

  // Toggle table status (cycle through all statuses)
  const handleToggleStatus = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const statuses: TableItem['status'][] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'OUT_OF_SERVICE'];
        const currentIndex = statuses.indexOf(t.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        toast.info(`Table ${t.tableNumber} Updated`, `Status changed to ${STATUS_CONFIG[nextStatus].label}.`);
        return { ...t, status: nextStatus };
      })
    );
  };

  // Order totals and billing calculations for active table
  const activeTableOrders = activeTable?.orders || [];
  const basicTotal = activeTableOrders.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const parsedDisAmt = parseFloat(billDisAmt) || 0;
  const parsedDisPercent = parseFloat(billDisPercent) || 0;
  const effectiveDisAmt =
    billDisAmt !== ''
      ? parsedDisAmt
      : billDisPercent !== ''
      ? (basicTotal * parsedDisPercent) / 100
      : 0;

  const parsedRoundOff = parseFloat(billRoundOff) || 0;
  const netAmount = Math.max(0, basicTotal - effectiveDisAmt + parsedRoundOff);
  const parsedPaidAmt = billPaidAmt === '' ? netAmount : parseFloat(billPaidAmt) || 0;
  const refDue = Math.max(0, netAmount - parsedPaidAmt);
  const activeTableOrderCount = activeTableOrders.reduce((sum, item) => sum + item.quantity, 0);

  // Discount percentage and amount sync handlers
  const handleDisPercentChange = (val: string) => {
    setBillDisPercent(val);
    if (val === '') {
      setBillDisAmt('');
      return;
    }
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const calculatedAmt = (basicTotal * num) / 100;
    setBillDisAmt(calculatedAmt > 0 ? (Math.round(calculatedAmt * 100) / 100).toString() : '0');
  };

  const handleDisAmtChange = (val: string) => {
    setBillDisAmt(val);
    if (val === '') {
      setBillDisPercent('');
      return;
    }
    const num = Math.min(basicTotal, Math.max(0, parseFloat(val) || 0));
    const calculatedPercent = basicTotal > 0 ? (num / basicTotal) * 100 : 0;
    setBillDisPercent(calculatedPercent > 0 ? (Math.round(calculatedPercent * 10) / 10).toString() : '0');
  };

  // Save bill with payment info, remarks and optional print
  const handleSaveBill = (shouldPrint = false) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          discountPercent: parsedDisPercent,
          discountAmount: effectiveDisAmt,
          roundOff: parsedRoundOff,
          paidAmount: parsedPaidAmt,
          paymentMode: billMode,
          billRemarks,
        };
      })
    );

    toast.success(
      `Bill Saved · Table ${activeTable.tableNumber}`,
      `Net: Rs. ${netAmount.toFixed(2)} · Paid: Rs. ${parsedPaidAmt.toFixed(2)} (${billMode})`
    );

    if (shouldPrint && typeof window !== 'undefined') {
      window.print();
    }

    handleBackToTables();
  };

  // ===========================================================================
  // RENDER 1: DEDICATED ADD ORDER PAGE (OPENED WHEN OCCUPIED CARD IS CLICKED)
  // ===========================================================================
  if (activeTable) {
    return (
      <div className="space-y-4 pb-12 select-none animate-in fade-in duration-150">
        {/* Top Navigation Bar: Back Button, Table Title, and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToTables}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-bold text-[#24352F] hover:bg-[#FAFBF9] hover:border-[#0B3D32] shadow-2xs dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:hover:border-emerald-500 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tables</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-heading text-[#24352F] dark:text-white tracking-tight">
                {activeTable.isNoTable ? activeTable.tableNumber : `Table ${activeTable.tableNumber}`} · Order Management
              </h1>

              {activeTable.orderNumber && (
                <span className="rounded-[2px] bg-slate-900 text-amber-300 dark:bg-slate-800 dark:text-amber-400 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold">
                  {activeTable.orderNumber}
                </span>
              )}

              <span
                className={cn(
                  'rounded-[2px] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                  activeTable.isNoTable
                    ? activeTable.orderType === 'TAKEAWAY' ? 'bg-purple-700' : 'bg-blue-700'
                    : activeTable.status === 'BILLED'
                    ? 'bg-amber-600'
                    : activeTable.kotNumber
                    ? 'bg-emerald-700'
                    : 'bg-[#A51F36]'
                )}
              >
                {activeTable.isNoTable
                  ? activeTable.orderType === 'TAKEAWAY' ? 'Takeaway' : 'No Table'
                  : activeTable.status === 'BILLED'
                  ? 'Billed'
                  : activeTable.kotNumber
                  ? 'In Kitchen'
                  : 'Occupied'}
              </span>

              {(activeTable.notes || activeTable.seatingNote) && (
                <span className="rounded-[2px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800 px-2 py-0.5 text-[9px] font-medium">
                  {activeTable.notes || activeTable.seatingNote}
                </span>
              )}

              {activeTable.kotNumber && (
                <span className="rounded-[2px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[9px] font-mono font-bold">
                  {activeTable.kotNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Assign Table (if No Table order) */}
            {activeTable.isNoTable && (
              <button
                type="button"
                onClick={() => handleOpenAssignTableModal(activeTable)}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-blue-600/40 bg-blue-50 hover:bg-blue-100 text-blue-900 px-3 py-1.5 text-xs font-bold transition-all dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800 cursor-pointer"
                title="Assign an available dining table to this customer"
              >
                <Table2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Assign Table</span>
              </button>
            )}

            {/* Primary Action 1: Send Order to Kitchen (Req 4, 5) */}
            <button
              type="button"
              disabled={isSendingOrder || activeTableOrders.length === 0}
              onClick={handleSendOrder}
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              title="Send active items to the kitchen workflow"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{isSendingOrder ? 'Sending...' : 'Send Order'}</span>
              {activeTableOrders.some((i) => i.status !== 'KITCHEN') && (
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                  {activeTableOrders.filter((i) => i.status !== 'KITCHEN').length}
                </span>
              )}
            </button>

            {/* Primary Action 2: Generate Bill (Req 6) */}
            <button
              type="button"
              onClick={handleGenerateBill}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-amber-600/40 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 text-xs font-bold transition-all dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 cursor-pointer"
              title="Generate bill, review itemized order, and collect payment"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Generate Bill</span>
            </button>

            {/* Primary Action 3: Print Receipt Preview (Req 7) */}
            <button
              type="button"
              onClick={handleOpenReceiptPreview}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 text-xs font-bold transition-all dark:bg-[#07241E] dark:text-white dark:border-[#145447] cursor-pointer shadow-2xs"
              title="Preview and print customer receipt"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Print Receipt</span>
            </button>

            {/* Action 4: Clear Table or Close Order */}
            {!activeTable.isNoTable ? (
              <button
                type="button"
                onClick={(e) => handleClearTable(activeTable.id, e)}
                className="inline-flex items-center gap-1 rounded-[3px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#A51F36] hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors cursor-pointer"
                title="Vacate and release this table back to Available"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Table</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBackToTables}
                className="inline-flex items-center gap-1 rounded-[3px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors cursor-pointer"
                title="Close active order view"
              >
                <X className="w-3 h-3" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Guest Information Strip: Strictly Normal Dine-In with Optional Customer Info (Req 2 & 8) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[3px] bg-[#FAFBF9] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Service:</span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-950/70 text-[#0B3D32] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {activeTable.isNoTable
                  ? activeTable.orderType === 'TAKEAWAY'
                    ? 'Takeaway / Collection (No Table)'
                    : `No-Table Dine-In (${activeTable.notes || activeTable.seatingNote || 'Anywhere'})`
                  : `Table Dine-In (${activeTable.tableNumber})`}
              </span>
            </div>

            {activeTable.orderNumber && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Order No:</span>
                <strong className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                  {activeTable.orderNumber}
                </strong>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Customer:</span>
              <strong className="font-bold text-[#24352F] dark:text-white">
                {activeTable.currentGuest || (activeTable.isNoTable ? 'Walk-in Customer' : 'Dine-In Customer')}
              </strong>
            </div>

            {activeTable.guestPhone && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Phone:</span>
                <strong className="font-mono font-bold text-[#24352F] dark:text-white">
                  {activeTable.guestPhone}
                </strong>
              </div>
            )}

            {activeTable.kotNumber && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Kitchen Ticket:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {activeTable.kotNumber}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomerNameInput(activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' && activeTable.currentGuest !== 'Dine-In Customer' && activeTable.currentGuest !== 'Walk-in Customer' ? activeTable.currentGuest : '');
              setCustomerPhoneInput(activeTable.guestPhone || '');
              setIsCustomerModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071F1A] text-[11px] font-bold text-[#0B3D32] dark:text-emerald-400 hover:bg-[#FAFBF9] dark:hover:bg-[#093027] transition-colors cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3 h-3" />
            <span>Customer Details (Optional)</span>
          </button>
        </div>

        {/* =========================================================================
            SEARCH / ADD ITEM WITH INSTANT AUTOCOMPLETE SUGGESTIONS
            Fetches directly from Setted Menu (hotel_menu_items)
           ========================================================================= */}
        <div className="space-y-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-[#24352F] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <span>Add Order · {activeTable.isNoTable ? activeTable.tableNumber : `Table ${activeTable.tableNumber}`}</span>
            </h2>
          </div>

          {/* Search Input Bar with Instant Dropdown Suggestions Below */}
          <div className="relative w-full max-w-sm sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879B90]" />
              <input
                type="text"
                placeholder="search item & Add"
                value={orderProductName}
                onFocus={() => setIsSuggestionsOpen(true)}
                onChange={(e) => {
                  handleProductInputChange(e.target.value);
                  setIsSuggestionsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (suggestions.length > 0) {
                      handleAddDirectMenuItem(suggestions[0]);
                    }
                  }
                }}
                className="w-full rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#061D18] pl-9 pr-8 py-2.5 text-xs text-[#24352F] placeholder-[#879B90] dark:border-[#145447] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs transition-colors"
              />
              {orderProductName && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderProductName('');
                    setOrderPrice('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown Appearing Directly Below Input */}
            {isSuggestionsOpen && (
              <>
                {/* Transparent backdrop to dismiss on click outside */}
                <div
                  className="fixed inset-0 z-30 cursor-default bg-transparent"
                  onClick={() => setIsSuggestionsOpen(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 bg-[#FAFBF9] dark:bg-[#061D18] text-[10px] font-bold uppercase tracking-wider text-[#64736C] dark:text-[#879B90] flex items-center justify-between">
                    <span>
                      {orderProductName.trim()
                        ? `Matching Menu Suggestions (${suggestions.length})`
                        : `All Setted Menu Items (${menuCatalog.length})`}
                    </span>
                    <span className="text-[9px] font-normal normal-case opacity-75">
                      Click item to add directly
                    </span>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#879B90] dark:text-[#64736C]">
                      <p className="font-semibold text-[#24352F] dark:text-white">
                        No menu items found for &quot;{orderProductName}&quot;
                      </p>
                    </div>
                  ) : (
                    suggestions.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddDirectMenuItem(item);
                        }}
                        className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300">
                              {item.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-[2px] bg-slate-100 dark:bg-[#0E3B31] text-[#64736C] dark:text-[#A4B8AE]">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#879B90] flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-medium">{item.code}</span>
                            <span>·</span>
                            <span>{item.portion || '1 Portion'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                            Rs. {item.price.toFixed(0)}
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] group-hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors dark:bg-emerald-600 dark:group-hover:bg-emerald-500"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Touch-Friendly Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {menuCategories.map((cat) => {
              const isSelected = selectedOrderCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedOrderCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                    isSelected
                      ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                      : 'bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  {cat === 'ALL' ? '🍽️ All Items' : cat}
                </button>
              );
            })}
          </div>

          {/* Quick-Pick Menu Item Cards (Large touch-friendly for restaurant staff) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categoryFilteredMenuItems.slice(0, 12).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddDirectMenuItem(item)}
                className="group flex flex-col justify-between p-2.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] hover:border-[#0B3D32] hover:shadow-xs transition-all text-left cursor-pointer min-h-[72px]"
              >
                <div className="min-w-0">
                  <span className="block font-bold text-xs text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {item.portion || item.category || 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                    Rs. {item.price.toFixed(0)}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[#0B3D32] dark:text-emerald-300">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* ===================================================================
              TOP SECTION: STRUCTURED ORDER TABLE (MATCHING USER SCREENSHOT)
              # | Particular | Unit | Rate | Qty | Amount | Remarks | Add New
             =================================================================== */}
          <div
            className={cn(
              'border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-[#071F1A] shadow-2xs transition-all',
              draftRows.some((d) => d.isOpen) ? 'min-h-[380px] pb-32' : 'overflow-hidden'
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#061D18]">
                    <th className="py-2 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">#</th>
                    <th className="py-2 px-3.5 text-left border-r border-slate-200 dark:border-slate-800">Particular</th>
                    <th className="py-2 px-2.5 text-center w-28 border-r border-slate-200 dark:border-slate-800">Unit</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Rate</th>
                    <th className="py-2 px-3 text-center w-20 border-r border-slate-200 dark:border-slate-800">Qty</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Amount</th>
                    <th className="py-2 px-2.5 text-center w-28 border-r border-slate-200 dark:border-slate-800">Status</th>
                    <th className="py-2 px-3 text-left border-r border-slate-200 dark:border-slate-800">Remarks</th>
                    <th className="py-1 px-2 text-center w-28">
                      <button
                        type="button"
                        onClick={handleAddNewDraftRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 dark:hover:text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer select-none"
                        title="Click to add new row"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeTableOrders.length === 0 && draftRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-xs text-[#879B90] dark:text-[#64736C]">
                        <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm text-[#24352F] dark:text-white">
                          No orders on Table {activeTable.tableNumber} yet
                        </p>
                        <p className="text-xs text-[#879B90] dark:text-[#64736C] mt-1 max-w-sm mx-auto">
                          Click &quot;Add New&quot; above to add a row and search dishes directly.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddNewDraftRow}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Row</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Existing Table Orders */}
                      {activeTableOrders.map((item, index) => {
                        const unitMeta = resolveItemUnitInfo(item, menuCatalog);
                        const currentUnit = item.unit || unitMeta.unit;
                        const hasMultipleUnits = unitMeta.availableUnits && unitMeta.availableUnits.length > 1;
                        const itemAmount = item.price * item.quantity;
                        const particularName =
                          item.baseName || unitMeta.baseName || item.name.replace(/\s*\([^)]*\)$/, '').trim();

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-[#FAFBF9] dark:hover:bg-[#07241E]/80 transition-colors"
                          >
                            {/* # Serial Number */}
                            <td className="py-2 px-3 text-center text-xs text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800/80">
                              {index + 1}
                            </td>

                            {/* Particular */}
                            <td className="py-2 px-3.5 text-xs text-[#24352F] dark:text-white border-r border-slate-100 dark:border-slate-800/80">
                              {particularName}
                            </td>

                            {/* Unit */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              {hasMultipleUnits ? (
                                <select
                                  value={currentUnit}
                                  onChange={(e) => handleUpdateItemUnit(item.id, e.target.value)}
                                  className="w-full text-center rounded-[2px] border border-slate-200 bg-white dark:bg-[#061D18] dark:border-slate-700 py-0.5 px-1.5 text-xs text-[#0B3D32] dark:text-emerald-300 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                                  title="Change portion / unit"
                                >
                                  {unitMeta.availableUnits.map((u) => (
                                    <option key={u.unit} value={u.unit}>
                                      {u.unit}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded-[2px] text-[11px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {currentUnit || 'Standard'}
                                </span>
                              )}
                            </td>

                            {/* Rate (Styled with light grey background box like in screenshot) */}
                            <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-800 dark:text-slate-200">
                                {item.price.toFixed(2)}
                              </div>
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, -1)}
                                  className="w-4 h-4 rounded text-[10px] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                                  title="Decrease"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-5 text-center text-xs font-mono font-medium text-slate-800 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, 1)}
                                  className="w-4 h-4 rounded text-[10px] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                                  title="Increase"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </td>

                            {/* Amount (Styled with light grey background box like in screenshot) */}
                            <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-900 dark:text-white">
                                {itemAmount.toFixed(0)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              {item.status === 'KITCHEN' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  {item.kotNumber ? item.kotNumber : 'Kitchen'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                  <Clock className="w-2.5 h-2.5" />
                                  Unsent
                                </span>
                              )}
                            </td>

                            {/* Remarks */}
                            <td className="py-1.5 px-2 text-left border-r border-slate-100 dark:border-slate-800/80">
                              <input
                                type="text"
                                placeholder=""
                                value={item.remarks || ''}
                                onChange={(e) => handleUpdateItemRemarks(item.id, e.target.value)}
                                className="w-full px-2 py-0.5 text-xs bg-transparent focus:bg-white dark:focus:bg-[#061D18] border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none transition-colors"
                              />
                            </td>

                            {/* Add New / Action */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Active In-Table Draft Rows (Matching Reference Design) */}
                      {draftRows.map((draft, draftIdx) => {
                        const filteredDraftItems = menuCatalog.filter((item) => {
                          const q = draft.search.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            item.name.toLowerCase().includes(q) ||
                            item.category.toLowerCase().includes(q) ||
                            item.code.toLowerCase().includes(q)
                          );
                        });

                        return (
                          <tr
                            key={draft.id}
                            className="border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#071F1A]"
                          >
                            {/* # Serial Number */}
                            <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800/80">
                              {activeTableOrders.length + draftIdx + 1}
                            </td>

                            {/* Particular Input with Green Border & Autocomplete Popover */}
                            <td className="py-1 px-2 relative border-r border-slate-100 dark:border-slate-800/80">
                              <div className="relative">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="search item & Add"
                                  value={draft.search}
                                  onChange={(e) => handleUpdateDraftSearch(draft.id, e.target.value)}
                                  onFocus={() => {
                                    setDraftRows((prev) =>
                                      prev.map((d) => (d.id === draft.id ? { ...d, isOpen: true } : d))
                                    );
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setDraftRows((prev) =>
                                        prev.map((d) =>
                                          d.id === draft.id
                                            ? {
                                                ...d,
                                                selectedIndex: Math.min(
                                                  filteredDraftItems.length - 1,
                                                  d.selectedIndex + 1
                                                ),
                                              }
                                            : d
                                        )
                                      );
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setDraftRows((prev) =>
                                        prev.map((d) =>
                                          d.id === draft.id
                                            ? { ...d, selectedIndex: Math.max(0, d.selectedIndex - 1) }
                                            : d
                                        )
                                      );
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (
                                        filteredDraftItems.length > 0 &&
                                        filteredDraftItems[draft.selectedIndex]
                                      ) {
                                        handleSelectMenuItemForDraft(
                                          draft.id,
                                          filteredDraftItems[draft.selectedIndex]
                                        );
                                      }
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      handleRemoveDraftRow(draft.id);
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#061D18] border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-slate-900 dark:text-white font-medium"
                                />

                                {/* Popover Table Directly Under Input (Matching Reference Screenshot) */}
                                {draft.isOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40 bg-transparent cursor-default"
                                      onClick={() => {
                                        setDraftRows((prev) =>
                                          prev.map((d) => (d.id === draft.id ? { ...d, isOpen: false } : d))
                                        );
                                      }}
                                    />
                                    <div className="absolute left-0 top-full mt-1 z-50 w-[520px] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[2px] overflow-hidden animate-in fade-in-0 duration-75">
                                      {/* Teal Header Bar */}
                                      <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                                        <span className="w-44 text-left">ITEM</span>
                                        <span className="w-32 text-left">GENERIC NAME</span>
                                        <span className="w-20 text-right">RATE</span>
                                        <span className="w-16 text-center">SRATE</span>
                                        <span className="w-12 text-center">QTY</span>
                                      </div>

                                      {/* Items List */}
                                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                        {filteredDraftItems.length === 0 ? (
                                          <div className="py-5 text-center text-xs text-slate-500">
                                            No items found for &quot;{draft.search}&quot;
                                          </div>
                                        ) : (
                                          filteredDraftItems.map((item, idx) => {
                                            const isSelected = idx === draft.selectedIndex;
                                            return (
                                              <div
                                                key={item.id}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  handleSelectMenuItemForDraft(draft.id, item);
                                                }}
                                                onMouseEnter={() => {
                                                  setDraftRows((prev) =>
                                                    prev.map((d) =>
                                                      d.id === draft.id ? { ...d, selectedIndex: idx } : d
                                                    )
                                                  );
                                                }}
                                                className={cn(
                                                  'px-2.5 py-1.5 flex items-center cursor-pointer transition-colors text-xs font-sans',
                                                  isSelected
                                                    ? 'bg-[#1E293B] text-white dark:bg-[#0E3B31]'
                                                    : 'hover:bg-[#1E293B] hover:text-white text-slate-800 dark:text-slate-200 bg-white dark:bg-[#071F1A]'
                                                )}
                                              >
                                                <span className="w-44 truncate font-medium text-left">
                                                  {item.name}
                                                </span>
                                                <span className="w-32 truncate text-left text-[11px] opacity-75">
                                                  {item.category || '-'}
                                                </span>
                                                <span className="w-20 font-mono text-right">
                                                  {item.price.toFixed(2)}
                                                </span>
                                                <span className="w-16 text-center text-[11px] opacity-75">
                                                  {item.portion || '0'}
                                                </span>
                                                <span className="w-12 text-center font-mono opacity-75">
                                                  0
                                                </span>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Unit placeholder */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className="text-[11px] text-slate-400">-</span>
                            </td>

                            {/* Rate placeholder */}
                            <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-400">
                                0.00
                              </div>
                            </td>

                            {/* Qty placeholder */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className="text-xs font-mono text-slate-400">1</span>
                            </td>

                            {/* Amount placeholder */}
                            <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-400">
                                0
                              </div>
                            </td>

                            {/* Status placeholder */}
                            <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className="text-[10px] text-slate-400 font-medium">New</span>
                            </td>

                            {/* Remarks placeholder */}
                            <td className="py-1.5 px-2 text-left border-r border-slate-100 dark:border-slate-800/80">
                              <span className="text-xs text-slate-400"></span>
                            </td>

                            {/* Action / Delete draft row */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftRow(draft.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Cancel row"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================================================================
              BOTTOM SECTION: BILLING PANEL (EXACT DESIGN MATCHING USER SCREENSHOT)
             =================================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-md p-3.5 bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
            {/* Row 1: Basic Total | Dis % | Dis Amt | Round off | Net Amount | Paid Amt. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Basic Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={basicTotal.toFixed(0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-slate-800 dark:text-slate-200 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dis %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder=""
                  value={billDisPercent}
                  onChange={(e) => handleDisPercentChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dis Amt
                </label>
                <input
                  type="number"
                  min={0}
                  max={basicTotal}
                  step="1"
                  placeholder="0"
                  value={billDisAmt}
                  onChange={(e) => handleDisAmtChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Round off
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={billRoundOff}
                  onChange={(e) => setBillRoundOff(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={netAmount.toFixed(0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-slate-800 dark:text-slate-200 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Paid Amt.
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  placeholder={netAmount.toFixed(0)}
                  value={billPaidAmt}
                  onChange={(e) => setBillPaidAmt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            {/* Row 2: Ref. Due | Mode | Remarks | Print | Label | Disable proxy | Save */}
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div className="w-28">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ref. Due
                </label>
                <input
                  type="text"
                  readOnly
                  value={refDue.toFixed(0)}
                  className={cn(
                    'w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] cursor-default',
                    refDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                  )}
                />
              </div>

              <div className="w-40">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Mode
                </label>
                <select
                  value={billMode}
                  onChange={(e) => setBillMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Charge to Room">Charge to Room (Hotel Guest)</option>
                  <option value="Due / Credit">Due / Credit</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional billing note..."
                  value={billRemarks}
                  onChange={(e) => setBillRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Action Buttons: Settle & Release Table */}
              <div className="ml-auto flex items-end gap-2.5">
                <button
                  type="button"
                  disabled={isSettlingPayment}
                  onClick={() => handleCompletePaymentAndReleaseTable(false)}
                  className="px-4 py-1.5 rounded-[4px] bg-[#28a745] hover:bg-[#218838] disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSettlingPayment ? 'Processing...' : 'Complete Payment & Release Table'}</span>
                </button>
                <button
                  type="button"
                  disabled={isSettlingPayment}
                  onClick={() => handleCompletePaymentAndReleaseTable(true)}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Settle &amp; Print</span>
                </button>
              </div>
            </div>

            {/* Charge to Room Verification Panel (Requirement 9) */}
            {(billMode === 'Charge to Room' || billMode === 'Room Charge') && (
              <div className="p-3 bg-amber-50/70 dark:bg-[#0E2E25] border border-amber-300 dark:border-amber-700/60 rounded-md space-y-2 mt-2 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <BedDouble className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Charge to Hotel Room Folio</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                    Verified Active Checked-In Stay Required
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-48">
                    <input
                      type="text"
                      placeholder="Room number (e.g. 101)"
                      value={roomNumberInput}
                      onChange={(e) => setRoomNumberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyRoom();
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-[#071F1A] border border-amber-300 dark:border-amber-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyRoom(roomNumberInput)}
                    disabled={isVerifyingRoom || !roomNumberInput.trim()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isVerifyingRoom ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify Stay</span>
                      </>
                    )}
                  </button>
                  {verifiedStay && verifiedStay.valid && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded text-xs text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Verified: <strong>{verifiedStay.guestName}</strong> (Room {verifiedStay.roomNumber})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              OPTIONAL DINE-IN CUSTOMER DETAILS MODAL (REQUIREMENT 8)
              Never required for normal dine-in, but available if customer requests receipt
             ========================================================================= */}
          {isCustomerModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                  <div>
                    <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                      Customer Details (Optional)
                    </h3>
                    <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                      Optional for Dine-In Table {activeTable.tableNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveOptionalGuestInfo}>
                  <div className="p-5 space-y-3.5">
                    <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <p className="font-semibold">Normal Dine-In Does Not Require Registration</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Orders proceed smoothly as walk-in dine-in. Only enter details if guest specifically requests an invoice with their name or phone.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                        GUEST NAME (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={customerNameInput}
                        onChange={(e) => setCustomerNameInput(e.target.value)}
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                        PHONE / MOBILE (OPTIONAL)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 555-0123"
                        value={customerPhoneInput}
                        onChange={(e) => setCustomerPhoneInput(e.target.value)}
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(false)}
                      className="rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER 2: MAIN TABLES GRID VIEW
  // ===========================================================================
  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-150">
      {/* =====================================================================
          RESTAURANT MANAGEMENT SUB-OPTIONS NAVIGATION (LINKED TO TABLES)
          ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/restaurant-management"
              className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Restaurant Management
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Tables & Seating Floor Plan
            </span>
          </div>

          <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Restaurant Module · Tables
          </span>
        </div>

        <RestaurantManagementNavBoxes activeId="tables" />
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 -mt-1 mb-2" />

      {/* Clean Header Bar: Tables, Active Orders & Reservations Segmented Switcher + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#24352F] dark:text-white tracking-tight">
            {activeTab === 'FLOOR_PLAN'
              ? 'Tables'
              : activeTab === 'ACTIVE_ORDERS'
              ? 'Active Restaurant Orders'
              : 'Table Reservations'}
          </h1>

          {/* View Mode Segmented Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-[4px] bg-[#EAEFEA] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447]">
            <button
              type="button"
              onClick={() => setActiveTab('FLOOR_PLAN')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                activeTab === 'FLOOR_PLAN'
                  ? 'bg-white dark:bg-[#0E362C] text-[#0B3D32] dark:text-emerald-300 shadow-2xs'
                  : 'text-[#64736C] dark:text-[#A4B8AE] hover:text-[#24352F]'
              )}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Table Board</span>
              <span className="text-[10px] font-mono opacity-80">({tables.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ACTIVE_ORDERS');
                fetchActiveOrders();
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                activeTab === 'ACTIVE_ORDERS'
                  ? 'bg-white dark:bg-[#0E362C] text-[#0B3D32] dark:text-emerald-300 shadow-2xs'
                  : 'text-[#64736C] dark:text-[#A4B8AE] hover:text-[#24352F]'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
              {activeOrders.length > 0 && (
                <span className="rounded-full bg-[#0B3D32] text-white dark:bg-emerald-600 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RESERVATIONS')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                activeTab === 'RESERVATIONS'
                  ? 'bg-white dark:bg-[#0E362C] text-[#0B3D32] dark:text-emerald-300 shadow-2xs'
                  : 'text-[#64736C] dark:text-[#A4B8AE] hover:text-[#24352F]'
              )}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Table Reservations</span>
              {activeReservationsCount > 0 && (
                <span className="rounded-full bg-emerald-600 text-white px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  {activeReservationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action 1: New Table Order (Req 2) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('FLOOR_PLAN');
              toast.info('Select Dining Table', 'Click any available table card to start a Table Order.');
            }}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#0B3D32] dark:border-emerald-600 bg-white dark:bg-[#07241E] text-[#0B3D32] dark:text-emerald-300 hover:bg-[#FAFBF9] dark:hover:bg-[#093027] px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Start an order linked to a registered dining table"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>New Table Order</span>
          </button>

          {/* Primary Action 2: New No Table Order (Req 2) */}
          <button
            type="button"
            onClick={() => {
              setNoTableOrderType('NO_TABLE');
              setNoTableSeatingNote('');
              setNoTableCustomerName('');
              setNoTableCustomerPhone('');
              setIsNoTableModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
            title="Start a quick order without requiring a table (spare chair, walk-in, takeaway)"
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>New No Table Order</span>
          </button>

          {/* Action 3: New Reservation */}
          <button
            type="button"
            onClick={() => handleOpenNewReservation()}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-[#24352F] dark:text-white hover:bg-slate-50 dark:hover:bg-[#093027] px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Create a new customer table reservation"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reservation</span>
          </button>

          {/* Action 4: Add Table */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-[#24352F] dark:text-white hover:bg-slate-50 dark:hover:bg-[#093027] px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Table</span>
          </button>
        </div>
      </div>

      {activeTab === 'FLOOR_PLAN' ? (
        <>
          {/* Filter Strip: Status Pills + Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All', count: tables.length },
            { id: 'AVAILABLE', label: 'Available', count: availableCount },
            { id: 'OCCUPIED', label: 'Occupied', count: occupiedCount },
            { id: 'RESERVED', label: 'Reserved', count: reservedCount },
            { id: 'CLEANING', label: 'Cleaning', count: tables.filter((t) => t.status === 'CLEANING').length },
            { id: 'OUT_OF_SERVICE', label: 'Out of Service', count: tables.filter((t) => t.status === 'OUT_OF_SERVICE').length },
          ].map((pill) => {
            const isSelected = selectedStatus === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedStatus(pill.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 py-1 text-xs font-bold transition-all shrink-0',
                  isSelected
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#FAFBF9] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'rounded-[2px] px-1.5 py-0.2 text-[10px] font-mono',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#0E362C] text-[#64736C] dark:text-emerald-300'
                  )}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table number..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          CLEAN TABLE CARDS GRID (NOT CROWDED)
          OCCUPIED CARD IS CLICKABLE -> OPENS ADD ORDER PAGE!
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredTables.map((table) => {
          const statusMeta = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
          const orderTotal = (table.orders || []).reduce(
            (sum, item) => sum + calculateOrderItemTotal(item).total,
            0
          );
          const activeRes = (table.upcomingReservations || []).find(
            (r: any) => r.status === 'CONFIRMED' || r.status === 'PENDING'
          );
          const guestCount = (table.orders?.[0] as any)?.guest ? 1 : activeRes?.partySize;

          const isOccupied = table.status === 'OCCUPIED';
          const isAvailable = table.status === 'AVAILABLE';
          const isReserved = table.status === 'RESERVED';
          const isCleaning = table.status === 'CLEANING';
          const isOutOfService = table.status === 'OUT_OF_SERVICE';

          return (
            <div
              key={table.id}
              onClick={() => {
                setOpenTableMenuId(openTableMenuId === table.id ? null : table.id);
              }}
              className={cn(
                'group relative flex flex-col justify-between p-4 rounded-[4px] border transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer select-none min-h-[200px] max-h-[220px]',
                openTableMenuId === table.id ? 'z-30 ring-2 ring-emerald-500 shadow-lg' : 'z-10',
                'border-[#E5EEE9] dark:border-[#145447]/60',
                isOccupied
                  ? 'bg-[#0B3D32] border-[#082C24] text-white shadow-sm'
                  : table.status === 'BILLED'
                  ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-100 dark:border-amber-800/40 text-amber-900 dark:text-amber-100'
                  : isReserved || activeRes
                  ? 'bg-[#F8FBFF] dark:bg-[#081B26] border-sky-100 dark:border-sky-800/40 text-sky-900 dark:text-sky-100'
                  : isCleaning
                  ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-100 dark:border-amber-800/40 text-amber-900 dark:text-amber-100'
                  : isOutOfService
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-70'
                  : 'bg-white dark:bg-[#07241E] text-[#24352F] dark:text-white'
              )}
              title={table.tableNumber}
            >
              {/* Top: Table Number + Cleaning status badge + Status badge + 3-Dot More Actions button */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-lg sm:text-xl font-black font-mono tracking-tight leading-tight">
                      {table.tableNumber}
                    </span>
                    {table.cleaningStatus === 'DIRTY' && !isOccupied && (
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        Dirty
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider shadow-xs',
                        isOccupied
                          ? 'bg-white/15 text-emerald-300 border border-white/20 backdrop-blur-xs'
                          : table.status === 'BILLED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200/40'
                          : isReserved || activeRes
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 border border-sky-200/40'
                          : isCleaning
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200/40'
                          : isOutOfService
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-300/40'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border border-emerald-200/40'
                      )}
                    >
                      {isOutOfService ? 'Out of Service' : statusMeta.label}
                    </span>
                    
                    {/* 3-Dots Button Container with attached Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTableMenuId(openTableMenuId === table.id ? null : table.id);
                        }}
                        className={cn(
                          'p-1 rounded-[4px] transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer',
                          isOccupied
                            ? 'text-white/80 hover:text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                        title={`Table ${table.tableNumber} Contextual Actions`}
                        aria-label={`Table ${table.tableNumber} Contextual Actions`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openTableMenuId === table.id && (
                        <TableActionsDropdown
                          table={table}
                          onClose={() => setOpenTableMenuId(null)}
                          onStartOrder={(t) => {
                            setOpenTableMenuId(null);
                            handleStartDineInOrder(t);
                          }}
                          onAddItems={(t) => {
                            setOpenTableMenuId(null);
                            handleOpenOrderPage(t.id);
                          }}
                          onViewOrder={(t) => {
                            setOpenTableMenuId(null);
                            handleOpenOrderPage(t.id);
                          }}
                          onMarkServed={(t) => {
                            handleMarkTableServed(t);
                          }}
                          onViewOrderHistory={(t) => {
                            setOpenTableMenuId(null);
                            handleViewTableHistory(t);
                          }}
                          onBookTable={(t) => {
                            setOpenTableMenuId(null);
                            handleOpenNewReservation(t);
                          }}
                          onViewReservation={(t, res) => {
                            setOpenTableMenuId(null);
                            if (res) handleOpenEditReservation(res);
                            else if (t.upcomingReservations?.[0]) handleOpenEditReservation(t.upcomingReservations[0]);
                          }}
                          onEditReservation={(t, res) => {
                            setOpenTableMenuId(null);
                            if (res) handleOpenEditReservation(res);
                            else if (t.upcomingReservations?.[0]) handleOpenEditReservation(t.upcomingReservations[0]);
                          }}
                          onCancelReservation={(t, res) => {
                            setOpenTableMenuId(null);
                            handleCancelReservationFromTable(t, res);
                          }}
                          onSeatGuests={(t, res) => {
                            setOpenTableMenuId(null);
                            if (res) handleSeatReservation(res, t.id);
                            else if (t.upcomingReservations?.[0]) handleSeatReservation(t.upcomingReservations[0], t.id);
                          }}
                          onViewBill={(t) => {
                            setOpenTableMenuId(null);
                            handleOpenOrderPage(t.id);
                            setIsBillPanelOpen(true);
                          }}
                          onSettleBill={(t) => {
                            setOpenTableMenuId(null);
                            handleOpenOrderPage(t.id);
                            setIsBillPanelOpen(true);
                          }}
                          onPrintBill={(t) => {
                            handlePrintBillForTable(t);
                          }}
                          onViewPaymentHistory={(t) => {
                            setOpenTableMenuId(null);
                            handleViewTableHistory(t);
                          }}
                          onUpdateCleaningStatus={handleUpdateCleaningStatus}
                          onUpdateServiceStatus={handleUpdateServiceStatus}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col gap-2 py-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span
                      className={cn(
                        'text-slate-500 dark:text-slate-400',
                        isOccupied ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {table.section}
                    </span>
                    {orderTotal > 0 && (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {orderTotal.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {isOccupied && table.currentGuest ? (
                    <div className="text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                      <span className="font-normal opacity-75">Guest:</span>
                      <strong className="font-medium">{table.currentGuest}</strong>
                    </div>
                  ) : activeRes ? (
                    <div className="text-xs flex items-center gap-1 text-sky-700 dark:text-sky-400">
                      <CalendarCheck className="w-3 h-3 shrink-0" />
                      <span>{activeRes.customerName} · {activeRes.partySize} guests</span>
                    </div>
                  ) : (
                    <div className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Table Ready</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>{table.capacity} Seats</span>
                  </div>
                </div>

              {/* Card Footer: Capacity + Primary Action */}
              <div className="mt-auto pt-2 border-t border-t-[#E5EEE9] dark:border-[#145447]/60 flex items-center justify-between text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] font-semibold border shadow-2xs',
                    isOccupied
                      ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                      : isReserved || activeRes
                      ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                      : 'bg-[#F2F6F4] text-[#0B3D32] border-[#DCE3DF] dark:bg-[#093027] dark:text-emerald-300 dark:border-[#145447]'
                  )}
                >
                  <Users className="w-3 h-3 shrink-0" />
                  <span>{table.capacity} Seats</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOccupied || table.status === 'BILLED') {
                      handleOpenOrderPage(table.id);
                    } else if (isAvailable && activeRes) {
                      handleSeatReservation(activeRes, table.id);
                    } else if (isAvailable) {
                      handleStartDineInOrder(table);
                    } else if (isCleaning) {
                      setTables((prev) =>
                        prev.map((t) => (t.id === table.id ? { ...t, status: 'AVAILABLE' } : t))
                      );
                      toast.info(`Table ${table.tableNumber} Ready`, 'Marked as available.');
                    } else if (isReserved) {
                      handleOpenNewReservation(table);
                    } else {
                      handleToggleStatus(table.id);
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 justify-center px-3 py-1 rounded-[4px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer border',
                    isOccupied || table.status === 'BILLED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-500'
                      : isAvailable && activeRes
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600'
                      : isAvailable
                      ? 'bg-[#0B3D32] hover:bg-[#093027] text-white border-[#0B3D32] dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-500'
                      : isCleaning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 dark:bg-amber-900/40'
                      : isReserved
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-500'
                      : isOutOfService
                      ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {isOccupied || table.status === 'BILLED'
                    ? orderTotal > 0
                      ? `Rs. ${orderTotal.toFixed(0)}`
                      : 'Add Order'
                    : isAvailable && activeRes
                    ? 'Seat Guests'
                    : isAvailable
                    ? 'Start Order'
                    : isCleaning
                    ? 'Mark Ready'
                    : isReserved
                    ? 'View Reservation'
                    : isOutOfService
                    ? 'Out of Service'
                    : 'Toggle Status'}
                </button>
              </div>

              {/* Floating Dropdown Menu removed in favor of inline primary action button */}


            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="rounded-[3px] border border-[#DCE3DF] bg-white p-12 text-center shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
          <Table2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#24352F] dark:text-white">No tables found</h3>
          <p className="text-xs text-[#64736C] dark:text-[#A4B8AE] mt-1">
            Try adjusting your search or status filter.
          </p>
        </div>
      )}
        </>
      ) : activeTab === 'ACTIVE_ORDERS' ? (
        <ActiveOrdersView
          orders={activeOrders}
          isLoading={isActiveOrdersLoading}
          onRefresh={fetchActiveOrders}
          onOpenOrder={handleOpenOrderFromActiveList}
          onGenerateBill={handleGenerateBillFromActiveOrders}
          onPrintReceipt={handlePrintReceiptForOrder}
          onAssignTable={(ord) => handleOpenAssignTableModal(ord)}
          onNewTableOrder={() => {
            setActiveTab('FLOOR_PLAN');
            toast.info('Select Table', 'Click an available table to start a Table Order.');
          }}
          onNewNoTableOrder={() => {
            setNoTableOrderType('NO_TABLE');
            setNoTableSeatingNote('');
            setNoTableCustomerName('');
            setNoTableCustomerPhone('');
            setIsNoTableModalOpen(true);
          }}
        />
      ) : (
        /* =========================================================================
           TABLE RESERVATIONS MANAGEMENT VIEW
           ========================================================================= */
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Bookings</span>
                <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#24352F] dark:text-white">
                {reservations.length}
              </div>
            </div>

            <div className="rounded-[4px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed & Pending</span>
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#0B3D32] dark:text-emerald-300">
                {reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length}
              </div>
            </div>

            <div className="rounded-[4px] border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-sky-800 dark:text-sky-300 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Currently Seated</span>
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-sky-800 dark:text-sky-300">
                {reservations.filter((r) => r.status === 'SEATED').length}
              </div>
            </div>

            <div className="rounded-[4px] border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-800 dark:text-purple-300">
                {reservations.filter((r) => r.status === 'COMPLETED').length}
              </div>
            </div>
          </div>

          {/* Filter Bar: Status Pills, Date Filter & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
              {[
                { id: 'ALL', label: 'All', count: reservations.length },
                { id: 'CONFIRMED', label: 'Confirmed', count: reservations.filter((r) => r.status === 'CONFIRMED').length },
                { id: 'PENDING', label: 'Pending', count: reservations.filter((r) => r.status === 'PENDING').length },
                { id: 'SEATED', label: 'Seated', count: reservations.filter((r) => r.status === 'SEATED').length },
                { id: 'COMPLETED', label: 'Completed', count: reservations.filter((r) => r.status === 'COMPLETED').length },
                { id: 'CANCELLED', label: 'Cancelled', count: reservations.filter((r) => r.status === 'CANCELLED').length },
                { id: 'NO_SHOW', label: 'No-Show', count: reservations.filter((r) => r.status === 'NO_SHOW').length },
              ].map((pill) => {
                const isSelected = reservationStatusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setReservationStatusFilter(pill.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer',
                      isSelected
                        ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                        : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#FAFBF9] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={cn(
                        'rounded-[2px] px-1.5 py-0.2 text-[10px] font-mono',
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#0E362C] text-[#64736C] dark:text-emerald-300'
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date Filter & Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={reservationDateFilter}
                  onChange={(e) => setReservationDateFilter(e.target.value)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2.5 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  title="Filter reservations by date"
                />
                {reservationDateFilter && (
                  <button
                    type="button"
                    onClick={() => setReservationDateFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    title="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-60 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={reservationSearchQuery}
                  onChange={(e) => setReservationSearchQuery(e.target.value)}
                  placeholder="Search guest, phone, code..."
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
                {reservationSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReservationSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchReservations()}
                className="p-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                title="Refresh reservations"
              >
                <RotateCcw className={cn('w-3.5 h-3.5', isReservationsLoading && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <div className="rounded-[4px] border border-[#DCE3DF] bg-white p-12 text-center shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
              <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#24352F] dark:text-white">No reservations found</h3>
              <p className="text-xs text-[#64736C] dark:text-[#A4B8AE] mt-1 max-w-sm mx-auto">
                {reservationSearchQuery || reservationDateFilter || reservationStatusFilter !== 'ALL'
                  ? 'No reservations match your current filters. Try clearing the search or filter.'
                  : 'There are no table reservations booked yet. Click "New Reservation" above to book a table.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenNewReservation()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Reservation</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-[#64736C] dark:text-[#A4B8AE] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Code / Ref</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Party & Table</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Notes / Requests</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                  {filteredReservations.map((res) => {
                    const statusConfig = {
                      CONFIRMED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
                      PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500' },
                      SEATED: { bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800', dot: 'bg-sky-500' },
                      COMPLETED: { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', dot: 'bg-purple-500' },
                      CANCELLED: { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', dot: 'bg-rose-500' },
                      NO_SHOW: { bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', dot: 'bg-slate-400' },
                    }[res.status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0E362C]/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-[2px] text-[11px]">
                            {res.reservationCode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#24352F] dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{res.customerName}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{res.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#24352F] dark:text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{res.reservationDate ? res.reservationDate.split('T')[0] : 'Today'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{res.reservationTime} ({res.durationMinutes || 120}m)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-semibold text-[#24352F] dark:text-white">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{res.partySize} Guests</span>
                          </div>
                          <div className="text-[11px] mt-0.5">
                            {res.table ? (
                              <span className="inline-flex items-center gap-1 text-[#0B3D32] dark:text-emerald-300 font-bold">
                                <Table2 className="w-3 h-3" />
                                <span>Table {res.table.tableNumber}</span>
                                <span className="text-[10px] font-normal text-slate-400">({res.table.section})</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No table assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border', statusConfig.bg)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                            <span>{res.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[200px]">
                          {res.specialRequests && (
                            <div className="text-[11px] text-slate-700 dark:text-slate-200 truncate" title={res.specialRequests}>
                              <span className="font-bold text-[#0B3D32] dark:text-emerald-400">Req: </span>
                              {res.specialRequests}
                            </div>
                          )}
                          {res.internalNotes && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={res.internalNotes}>
                              <span className="font-semibold">Note: </span>
                              {res.internalNotes}
                            </div>
                          )}
                          {!res.specialRequests && !res.internalNotes && (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSeatReservation(res)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  title="Seat guests at assigned or available table and start restaurant order"
                                >
                                  <Users className="w-3 h-3" />
                                  <span>Seat Guests</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReservation(res)}
                                  className="p-1 rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Edit Reservation"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateReservationStatus(res.id, 'NO_SHOW')}
                                  className="p-1 rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                                  title="Mark as No-Show"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateReservationStatus(res.id, 'CANCELLED')}
                                  className="p-1 rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                  title="Cancel Reservation"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {res.status === 'SEATED' && (
                              <>
                                {res.tableId && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOrderPage(res.tableId!)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold text-xs shadow-2xs dark:bg-emerald-600 transition-all cursor-pointer"
                                  >
                                    <UtensilsCrossed className="w-3 h-3" />
                                    <span>View Order</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReservationStatus(res.id, 'COMPLETED')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                                  title="Mark Completed"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Complete</span>
                                </button>
                              </>
                            )}

                            {(res.status === 'CANCELLED' || res.status === 'NO_SHOW' || res.status === 'COMPLETED') && (
                              <button
                                type="button"
                                onClick={() => handleUpdateReservationStatus(res.id, 'CONFIRMED')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                                title="Reactivate Reservation"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reopen</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          QUICK BOOKING MODAL (NAME & MOBILE NUMBER ONLY)
         ========================================================================= */}
      {bookingTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setBookingTable(null)}
        >
          <div
            className="w-full max-w-sm rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Book Table {bookingTable.tableNumber}
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  {bookingTable.section} · {bookingTable.capacity} Seats
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTable(null)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Booking Form: Strictly 2 Fields: Name & Mobile Number */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmBooking(false);
              }}
            >
              <div className="p-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    GUEST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. John Doe"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    MOBILE NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555-0192 or 9876543210"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => setBookingTable(null)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!bookingName.trim() || !bookingPhone.trim()}
                    onClick={() => handleConfirmBooking(true)}
                    className="rounded-[3px] border border-[#0B3D32] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0B3D32] hover:bg-slate-50 disabled:opacity-40 transition-colors dark:border-emerald-500 dark:bg-[#07241E] dark:text-emerald-300"
                    title="Book table and immediately open Add Order page"
                  >
                    Book & Add Order →
                  </button>

                  <button
                    type="submit"
                    disabled={!bookingName.trim() || !bookingPhone.trim()}
                    className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Book Table
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD TABLE MODAL
         ========================================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Add New Table
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  Enter table number, dining section and capacity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  TABLE NUMBER / CODE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-17"
                  autoFocus
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  DINING SECTION *
                </label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="Indoor Fine Dining">Indoor Fine Dining</option>
                  <option value="Skyline Rooftop Terrace">Skyline Rooftop Terrace</option>
                  <option value="Poolside Lounge & Bar">Poolside Lounge & Bar</option>
                  <option value="Private Executive Dining">Private Executive Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  CAPACITY (PERSONS) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW / EDIT TABLE RESERVATION MODAL (WITH LIVE AVAILABILITY CHECK)
         ========================================================================= */}
      {isReservationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsReservationModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[4px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    {editingReservation ? `Edit Reservation · ${editingReservation.reservationCode}` : 'New Table Reservation'}
                  </h3>
                  <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                    {editingReservation ? 'Update customer details or dining time' : 'Reserve a dining table with live availability verification'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReservationModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReservation} className="overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Customer Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    CUSTOMER NAME *
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. John Doe"
                      value={resCustomerName}
                      onChange={(e) => setResCustomerName(e.target.value)}
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-3 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    PHONE NUMBER *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9841234567 or +1 555-0192"
                      value={resPhoneNumber}
                      onChange={(e) => setResPhoneNumber(e.target.value)}
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time, Party Size, Duration Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    TIME *
                  </label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    GUESTS *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={resPartySize}
                    onChange={(e) => setResPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    DURATION
                  </label>
                  <select
                    value={resDurationMinutes}
                    onChange={(e) => setResDurationMinutes(parseInt(e.target.value, 10) || 120)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value={60}>60 mins (1h)</option>
                    <option value={90}>90 mins (1.5h)</option>
                    <option value={120}>120 mins (2h)</option>
                    <option value={150}>150 mins (2.5h)</option>
                    <option value={180}>180 mins (3h)</option>
                    <option value={240}>240 mins (4h)</option>
                  </select>
                </div>
              </div>

              {/* Preferred Table Selection */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  PREFERRED TABLE (OPTIONAL)
                </label>
                <select
                  value={resPreferredTableId}
                  onChange={(e) => setResPreferredTableId(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="">No preference (Assign any suitable table)</option>
                  {tables.map((t) => {
                    const availObj = availabilityData?.allTables?.find((at) => at.id === t.id);
                    const isAvailable = availObj ? availObj.isAvailable : true;
                    const reason = availObj?.conflictReason;
                    return (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} · {t.section} ({t.capacity} Seats) {isAvailable ? '— [Available]' : `— [Unavailable: ${reason || 'Conflict'}]`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Live Availability Feedback Banner */}
              <div className="rounded-[3px] border p-2.5 text-xs">
                {isCheckingAvailability ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking table availability for {resDate} at {resTime}...</span>
                  </div>
                ) : availabilityData ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#0B3D32] dark:text-emerald-300">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {availabilityData.availableCount} of {availabilityData.totalTables} tables available for {resPartySize} guests
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Window: {resTime} (+{resDurationMinutes}m)
                      </span>
                    </div>

                    {resPreferredTableId && availabilityData.allTables && (
                      (() => {
                        const sel = availabilityData.allTables.find((t) => t.id === resPreferredTableId);
                        if (sel && !sel.isAvailable) {
                          return (
                            <div className="flex items-center gap-1.5 rounded-[2px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-1.5 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Conflict on Table {sel.tableNumber}: {sel.conflictReason || 'Already reserved during this time.'}</span>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400">Availability will update automatically as date/time change.</div>
                )}
              </div>

              {/* Special Requests & Dietary Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  SPECIAL REQUESTS / DIETARY PREFERENCES
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Window booth preferred, celebrating 5th anniversary, gluten allergy..."
                  value={resSpecialRequests}
                  onChange={(e) => setResSpecialRequests(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              {/* Internal Notes & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    INTERNAL STAFF NOTES
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIP guest, requested waiter John..."
                    value={resInternalNotes}
                    onChange={(e) => setResInternalNotes(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    STATUS
                  </label>
                  <select
                    value={resStatus}
                    onChange={(e) => setResStatus(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    {editingReservation && (
                      <>
                        <option value="SEATED">SEATED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="NO_SHOW">NO-SHOW</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingReservation}
                  className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-4 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  {isSavingReservation ? 'Saving...' : editingReservation ? 'Update Reservation' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEAT GUESTS MODAL (WITH TABLE ASSIGNMENT & SERVER)
         ========================================================================= */}
      {isSeatingModalOpen && seatingReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsSeatingModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[4px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    Seat Guests · {seatingReservation.reservationCode}
                  </h3>
                  <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                    Assign a table and open order for {seatingReservation.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSeatingModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Summary Card */}
              <div className="rounded-[3px] bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B3D32] dark:text-emerald-300">
                    {seatingReservation.customerName}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {seatingReservation.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                  <span>Party: {seatingReservation.partySize} Guests</span>
                  <span>Time: {seatingReservation.reservationTime}</span>
                </div>
                {seatingReservation.specialRequests && (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="font-bold">Requests: </span>
                    {seatingReservation.specialRequests}
                  </div>
                )}
              </div>

              {/* Table Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  ASSIGN DINING TABLE *
                </label>
                <select
                  value={seatingTableId}
                  onChange={(e) => setSeatingTableId(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="">Select an available table...</option>
                  {tables.map((t) => {
                    const isAvail = t.status === 'AVAILABLE';
                    const hasCapacity = t.capacity >= seatingReservation.partySize;
                    return (
                      <option key={t.id} value={t.id} disabled={!isAvail}>
                        Table {t.tableNumber} · {t.section} ({t.capacity} Seats) {isAvail ? (hasCapacity ? '— Suitable' : '— Smaller capacity') : '— [Currently Occupied]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Server Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  WAITER / SERVER NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waiter 1"
                  value={seatingServerName}
                  onChange={(e) => setSeatingServerName(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsSeatingModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!seatingTableId || isSeatingGuests}
                  onClick={() => handleSeatReservation(seatingReservation, seatingTableId)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isSeatingGuests ? 'Seating...' : 'Confirm Seating & Open Order'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW NO-TABLE / TAKEAWAY ORDER MODAL (Requirement 2)
          Allows waiter/cashier to start an order immediately without a table.
         ========================================================================= */}
      {isNoTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-white dark:bg-[#07241E] rounded-[6px] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFBF9] dark:bg-[#093027] border-b border-[#DCE3DF] dark:border-[#145447]">
              <div className="flex items-center gap-2">
                <Armchair className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h3 className="text-sm font-bold font-heading text-[#24352F] dark:text-white">
                  New Order (No Registered Table)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoTableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#64736C] dark:text-[#A4B8AE] leading-relaxed">
                Start an independent restaurant order without binding to a registered table. An independent order number (e.g. <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">ORD-XXXX</span>) is generated. Customer registration is not required.
              </p>

              {/* Order Service Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1.5 uppercase">
                  Service Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoTableOrderType('NO_TABLE')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-bold transition-all cursor-pointer',
                      noTableOrderType === 'NO_TABLE'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-[#071F1A] border-[#DCE3DF] dark:border-[#145447] text-[#24352F] dark:text-white hover:bg-slate-50 dark:hover:bg-[#093027]'
                    )}
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>No Table (Dine Anywhere)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNoTableOrderType('TAKEAWAY')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-bold transition-all cursor-pointer',
                      noTableOrderType === 'TAKEAWAY'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-[#071F1A] border-[#DCE3DF] dark:border-[#145447] text-[#24352F] dark:text-white hover:bg-slate-50 dark:hover:bg-[#093027]'
                    )}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Takeaway / Collection</span>
                  </button>
                </div>
              </div>

              {/* Seating Note (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1 uppercase">
                  Seating / Location Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder={noTableOrderType === 'NO_TABLE' ? "e.g. Window side, Spare chair by bar, Outside terrace..." : "e.g. Counter pickup, Delivery pack..."}
                  value={noTableSeatingNote}
                  onChange={(e) => setNoTableSeatingNote(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Informational note only. Does not mark any registered table as occupied.
                </span>
              </div>

              {/* Optional Guest Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EEE9] dark:border-[#145447]">
                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1 uppercase">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walk-in Customer"
                    value={noTableCustomerName}
                    onChange={(e) => setNoTableCustomerName(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1 uppercase">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9800000000"
                    value={noTableCustomerPhone}
                    onChange={(e) => setNoTableCustomerPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsNoTableModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartNoTableOrder}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white px-4 py-1.5 text-xs font-bold shadow-xs transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Order (Add Items)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ASSIGN TABLE MODAL (Requirement 8)
          Safely assigns an available table to a No-Table or Takeaway order.
         ========================================================================= */}
      {isAssignTableModalOpen && assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-white dark:bg-[#07241E] rounded-[6px] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFBF9] dark:bg-[#093027] border-b border-[#DCE3DF] dark:border-[#145447]">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold font-heading text-[#24352F] dark:text-white">
                  Assign Dining Table to Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignTableModalOpen(false);
                  setAssigningOrder(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#093027]/70 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Order:</span>
                  <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                    {(assigningOrder as any).orderNumber || (assigningOrder as any).activeOrderId || (assigningOrder as any).id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Service:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {(assigningOrder as any).orderType === 'TAKEAWAY' ? 'Takeaway' : 'No Table'}
                    {((assigningOrder as any).notes || (assigningOrder as any).seatingNote) && ` · ${(assigningOrder as any).notes || (assigningOrder as any).seatingNote}`}
                  </span>
                </div>
              </div>

              {/* Table Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1 uppercase">
                  Select Available Dining Table *
                </label>
                <select
                  value={selectedTargetTableId}
                  onChange={(e) => setSelectedTargetTableId(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="">Select an available table...</option>
                  {tables.map((t) => {
                    const isAvail = t.status === 'AVAILABLE';
                    return (
                      <option key={t.id} value={t.id} disabled={!isAvail}>
                        Table {t.tableNumber} · {t.section} ({t.capacity} Seats) {isAvail ? '— Available' : `— [${t.status}]`}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Only currently available tables can be assigned. Existing occupied or reserved tables are locked.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignTableModalOpen(false);
                    setAssigningOrder(null);
                  }}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!selectedTargetTableId || isAssigningTable}
                  onClick={handleConfirmAssignTable}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAssigningTable ? 'Assigning...' : 'Confirm Table Assignment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* =========================================================================
          TABLE ORDER & PAYMENT HISTORY MODAL
          View historical billing records & reprint receipts without creating duplicates.
         ========================================================================= */}
      {historyModalTable && (
        <TableHistoryModal
          isOpen={!!historyModalTable}
          onClose={() => setHistoryModalTable(null)}
          table={historyModalTable}
          history={tableHistoryList}
          isLoading={isHistoryLoading}
          onReprintOrder={handleReprintFromHistory}
        />
      )}

      {/* =========================================================================
          PRINTED BILL / RECEIPT MODAL (Requirement 7)
          Thermal receipt format with print trigger for all order types.
         ========================================================================= */}
      {receiptModalData && <RestaurantReceiptModal {...receiptModalData} />}
    </div>
  );
}

export default function TablesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading Restaurant Table Board...</div>}>
      <TablesContent />
    </Suspense>
  );
}
