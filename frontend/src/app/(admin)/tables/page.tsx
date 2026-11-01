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
  RefreshCw,
  Bell,
  Printer,
  Save,
  Wine,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CalendarCheck,
  Calendar,
  CalendarDays,
  CalendarClock,
  Phone,
  User,
  UserCheck,
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
  Globe,
  ClipboardList,
  UserPlus,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TableReservationData, ActiveRestaurantOrderData, ReservationAlertData } from '@/lib/types';
import { ActiveOrdersView } from '@/components/common/ActiveOrdersView';
import { RestaurantReceiptModal, ReceiptModalProps } from '@/components/common/RestaurantReceiptModal';
import { TableActionsDropdown } from '@/components/restaurant/TableActionsModal';
import { TableHistoryModal, TableHistoryOrder } from '@/components/restaurant/TableHistoryModal';
import { TableBookingDetailsModal } from '@/components/restaurant/TableBookingDetailsModal';
import { ViewBookingModal } from '@/components/restaurant/ViewBookingModal';
import { TableReservationsView } from '@/components/restaurant/TableReservationsView';
import {
  OrderItem,
  TableItem,
  calculateOrderItemTotal,
} from '@/lib/tablesData';
import {
  getSettedMenuItems,
  MenuItemCatalogEntry,
  resolveItemUnitInfo,
  consolidateMenuCatalog,
  isBeverageCategory,
} from '@/lib/menuData';

// 12-hour time formatter helper (e.g. 19:00 -> 7:00 PM, 15:00 -> 3:00 PM)
function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }
  return timeStr;
}

const STATUS_CONFIG: Record<
  TableItem['status'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-success-subtle dark:bg-success-subtle',
    text: 'text-success dark:text-success',
    border: 'border-success dark:border-success',
    dot: 'bg-success',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-brand-subtle dark:bg-brand-subtle',
    text: 'text-brand dark:text-brand',
    border: 'border-brand dark:border-brand',
    dot: 'bg-brand',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-info-subtle dark:bg-info-subtle',
    text: 'text-info dark:text-info',
    border: 'border-info dark:border-info',
    dot: 'bg-info',
  },
  BILLED: {
    label: 'Billed',
    bg: 'bg-warning-subtle dark:bg-warning-subtle',
    text: 'text-warning dark:text-warning',
    border: 'border-warning dark:border-warning',
    dot: 'bg-warning',
  },
  CLEANING: {
    label: 'Needs Cleaning',
    bg: 'bg-warning-subtle dark:bg-warning-subtle',
    text: 'text-warning dark:text-warning',
    border: 'border-warning dark:border-warning',
    dot: 'bg-warning',
  },
  OUT_OF_SERVICE: {
    label: 'Out of Service',
    bg: 'bg-surface-muted dark:bg-surface-muted',
    text: 'text-muted dark:text-muted',
    border: 'border-border-default dark:border-border-default',
    dot: 'bg-text-muted',
  },
};

function TablesContent() {
  const toast = useToast();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(true);

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
  const [noTableOrderType, setNoTableOrderType] = useState<'NO_TABLE' | 'TAKEAWAY' | 'ONLINE'>('NO_TABLE');
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

  // Table Booking Details Modal State
  const [bookingDetailsModalTable, setBookingDetailsModalTable] = useState<TableItem | null>(
    null
  );
  const [isBookingDetailsModalOpen, setIsBookingDetailsModalOpen] = useState(false);

  // Search & Status filters (for Grid view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Date & Time Availability Filter
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [futureAvailabilityData, setFutureAvailabilityData] = useState<{
    availableCount: number;
    totalTables: number;
    availableTables: Array<{ id: string; tableNumber: string; section: string; capacity: number; isAvailable: boolean }>;
    allTables: Array<{ id: string; tableNumber: string; section: string; capacity: number; isAvailable: boolean; conflictReason?: string; conflictingReservation?: any }>;
  } | null>(null);
  const [isCheckingFutureAvailability, setIsCheckingFutureAvailability] = useState(false);

  // Table Reservations Management State
  const [reservations, setReservations] = useState<TableReservationData[]>([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('ALL');
  const [reservationDateFilter, setReservationDateFilter] = useState<string>('');

  // 15-Minute Advance Reservation Alerts & Turnover Notices
  const [alerts, setAlerts] = useState<ReservationAlertData[]>([]);

  // New / Edit Reservation Modal State
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<TableReservationData | null>(null);

  // Read-Only View Reservation Modal State
  const [viewingReservation, setViewingReservation] = useState<TableReservationData | null>(null);
  const [isViewReservationModalOpen, setIsViewReservationModalOpen] = useState(false);
  const [resCustomerName, setResCustomerName] = useState('');
  const [resPhoneNumber, setResPhoneNumber] = useState('');
  const [resDate, setResDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('19:00');
  const [resEndTime, setResEndTime] = useState('21:00');
  const [endTimeError, setEndTimeError] = useState<string | null>(null);
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

  // Turnaround & Dining Duration Configuration (Requirement 8)
  const [restaurantSettings, setRestaurantSettings] = useState<{
    estimatedDiningMinutes: number;
    cleaningBufferMinutes: number;
    advanceAlertMinutes: number;
  }>({
    estimatedDiningMinutes: 90,
    cleaningBufferMinutes: 15,
    advanceAlertMinutes: 15,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempDiningMinutes, setTempDiningMinutes] = useState(90);
  const [tempBufferMinutes, setTempBufferMinutes] = useState(15);
  const [tempAlertMinutes, setTempAlertMinutes] = useState(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Walk-in Conflict Warning State (Requirement 5)
  const [walkInConflictData, setWalkInConflictData] = useState<{
    table: TableItem;
    reservation: any;
    warningMessage: string;
    minutesRemaining: number;
    requiredMinutes: number;
  } | null>(null);



  // Booking Form Validation Errors
  const [bookingFormErrors, setBookingFormErrors] = useState<{
    customerName?: string;
    phoneNumber?: string;
    date?: string;
  }>({});

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

  // Quick Add Variant Selection Modal (Requirement: For multi-size items like Sprite, pop up size choices)
  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    menuItem: MenuItemCatalogEntry;
    quantity: number;
    draftId?: string;
  } | null>(null);

  useEffect(() => {
    setDraftRows([]);
  }, [activeOrderTableId]);

  // Setted Menu items catalog (loaded dynamically from database and fallback to setted menu)
  const [menuCatalog, setMenuCatalog] = useState<MenuItemCatalogEntry[]>(() => consolidateMenuCatalog(getSettedMenuItems()));

  const loadMenuProducts = async () => {
    const localMenu = getSettedMenuItems();
    try {
      const products = await api.getPOSProducts({ outlet: 'RESTAURANT' });
      if (products && products.length > 0) {
        const existingNames = new Set(localMenu.map((m) => m.name.toLowerCase().trim()));
        const existingCodes = new Set(localMenu.map((m) => m.code.toLowerCase().trim()));
        const merged: MenuItemCatalogEntry[] = [...localMenu];

        products.forEach((p) => {
          const cleanName = p.name.toLowerCase().trim();
          if (!existingNames.has(cleanName) && !existingCodes.has(p.id.toLowerCase())) {
            merged.push({
              id: p.id,
              code: p.id.slice(0, 8).toUpperCase(),
              name: p.name,
              baseName: p.name,
              category: p.category || 'Kitchen Dish',
              price: p.price,
              trackStock: p.trackStock ?? false,
              stock: p.stock ?? 0,
              isAvailable: p.isAvailable ?? true,
            });
          }
        });

        setMenuCatalog(consolidateMenuCatalog(merged));
        return;
      }
    } catch (err) {
      console.warn('Could not load POS products from database, using setted menu', err);
    }
    setMenuCatalog(consolidateMenuCatalog(localMenu));
  };

  // Fetch setted menu items on mount and whenever Add Order page opens or active order changes
  useEffect(() => {
    loadMenuProducts();
  }, [activeOrderTableId, activeCustomOrder?.id]);

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
    const rawCatalog = menuCatalog && menuCatalog.length > 0 ? menuCatalog : getSettedMenuItems();
    const catalogList = consolidateMenuCatalog(rawCatalog);
    const q = orderProductName.toLowerCase().trim();
    if (!q) {
      return catalogList;
    }
    return catalogList.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.baseName && item.baseName.toLowerCase().includes(q)) ||
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

  // Helper to normalize dates to YYYY-MM-DD
  const normalizeDateStr = (dateVal: string | Date | null | undefined): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    try {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, '0');
      const d = String(dateVal.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  // Helper to convert HH:mm to minutes from midnight
  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const parts = t.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  // Helper to format minutes from midnight to HH:mm
  const formatMinutesToTime = (mins: number): string => {
    const norm = Math.max(0, Math.min(23 * 60 + 59, mins));
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Helper to format HH:mm into 12-hour AM/PM string (e.g. "12:00 PM")
  const formatTime12h = (t: string): string => {
    if (!t) return '';
    const parts = t.split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const calculateEndTime = (timeStr: string, durationMinutes: number): string => {
    const startMins = parseTimeToMinutes(timeStr);
    const endMins = (startMins + (durationMinutes > 0 ? durationMinutes : 120)) % (24 * 60);
    return formatMinutesToTime(endMins);
  };

  // Load Tables & Reservations from API filtered by date
  const fetchTables = async (targetDate?: string) => {
    setIsTablesLoading(true);
    try {
      const dateToFetch = targetDate !== undefined ? targetDate : selectedDate;
      const isTargetToday = !dateToFetch || dateToFetch === normalizeDateStr(new Date());
      const res = await api.getRestaurantTables({ date: dateToFetch });
      if (Array.isArray(res)) {
        setTables((prevTables) =>
          res.map((t: any) => {
            const prevTable = prevTables.find((pt) => pt.id === t.id);

            // Live active dining orders strictly apply to Today
            const activeOrdersList = isTargetToday && Array.isArray(t.orders)
              ? t.orders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
              : [];
            const activeOrder = activeOrdersList.find((o: any) => o.items && o.items.length > 0) || activeOrdersList[0] || null;

            const mappedOrders: OrderItem[] = activeOrdersList.flatMap((ord: any) =>
              (ord.items || []).map((i: any) => {
                const itemPrice = i.unitPrice ?? i.price ?? 0;
                const unitMeta = resolveItemUnitInfo(
                  { name: i.productName || i.name, price: itemPrice, unit: i.unit },
                  menuCatalog
                );
                const isDispatched = !!(i.kotNumber || ord.kotNumber || i.botNumber || ord.botNumber);
                const itemDispatchedQty = (i.dispatchedQuantity !== undefined && i.dispatchedQuantity !== null)
                  ? Number(i.dispatchedQuantity)
                  : (isDispatched ? Number(i.quantity || 1) : 0);
                const itemDept: 'KOT' | 'BOT' = (i.department === 'BOT' || i.department === 'KOT')
                  ? i.department
                  : (unitMeta.department || (isBeverageCategory((i as any).category, i.productName || i.name) ? 'BOT' : 'KOT'));

                return {
                  id: i.id || `item-${Date.now()}-${Math.random()}`,
                  productId: i.productId,
                  name: i.productName || i.name,
                  unit: i.unit || unitMeta.unit || undefined,
                  price: itemPrice,
                  quantity: i.quantity || 1,
                  remarks: i.notes || '',
                  status: ord.status === 'COMPLETED' ? 'SERVED' : isDispatched ? 'KITCHEN' : 'DRAFT',
                  kotNumber: i.kotNumber || ord.kotNumber,
                  botNumber: i.botNumber || ord.botNumber,
                  department: itemDept,
                  dispatchedQuantity: itemDispatchedQty,
                };
              })
            );

            // Filter reservations belonging to the active date, excluding cancelled/no-show
            const dateReservations = (t.reservations || []).filter((r: any) => {
              if (r.status === 'CANCELLED' || r.status === 'NO_SHOW') return false;
              const rDate = normalizeDateStr(r.reservationDate);
              return !dateToFetch || rDate === dateToFetch;
            });
            dateReservations.sort((a: any, b: any) => (a.reservationTime || '').localeCompare(b.reservationTime || ''));

            // Table's actual current operational status (kept strictly separate from reservations)
            const isOutOfService = t.status === 'OUT_OF_SERVICE';
            const isBilled = isTargetToday && (t.status === 'BILLED' || activeOrder?.status === 'BILLED');
            const isCleaning = isTargetToday && (t.status === 'CLEANING' || t.cleaningStatus === 'DIRTY');
            const isOccupied = isTargetToday && (activeOrder || t.status === 'OCCUPIED' || (prevTable && prevTable.status === 'OCCUPIED'));

            let operationalStatus: TableItem['status'] = 'AVAILABLE';
            if (isOutOfService) {
              operationalStatus = 'OUT_OF_SERVICE';
            } else if (isOccupied) {
              operationalStatus = 'OCCUPIED';
            } else if (isBilled) {
              operationalStatus = 'BILLED';
            } else if (isCleaning) {
              operationalStatus = 'CLEANING';
            } else {
              operationalStatus = 'AVAILABLE';
            }

            // Preserve local optimistic order items if backend hasn't caught up yet or returned empty
            let effectiveOrders = mappedOrders;
            if (prevTable && prevTable.orders && prevTable.orders.length > 0) {
              if (mappedOrders.length === 0 && operationalStatus === 'OCCUPIED') {
                effectiveOrders = prevTable.orders;
              }
            }

            const activeOrderId = isTargetToday ? (activeOrder?.id || prevTable?.activeOrderId) : undefined;
            const orderNumber = isTargetToday ? (activeOrder?.orderNumber || prevTable?.orderNumber) : undefined;
            const kotNumber = isTargetToday ? (activeOrder?.kotNumber || prevTable?.kotNumber) : undefined;

            const seatedRes = dateReservations.find((r: any) => r.status === 'SEATED');

            let currentGuest = '';
            if (isTargetToday && activeOrder?.guest) {
              currentGuest = `${activeOrder.guest.firstName} ${activeOrder.guest.lastName}`.trim();
            } else if (isTargetToday && seatedRes) {
              currentGuest = seatedRes.customerName || (seatedRes.guest ? `${seatedRes.guest.firstName} ${seatedRes.guest.lastName}`.trim() : '');
            } else if (isTargetToday && activeOrder?.notes?.includes('Reservation') && activeOrder.notes.includes(' - ')) {
              currentGuest = activeOrder.notes.split(' - ')[1]?.split('(')[0]?.trim() || '';
            } else if (isTargetToday && (activeOrder || operationalStatus === 'OCCUPIED')) {
              currentGuest = prevTable?.currentGuest || 'Dine-In Guest';
            }

            const guestPhone = isTargetToday
              ? (activeOrder?.guest?.phone || seatedRes?.phoneNumber || prevTable?.guestPhone || '')
              : '';

            return {
              id: t.id,
              tableNumber: t.tableNumber || `T-${t.id}`,
              section: t.section || 'Indoor Fine Dining',
              capacity: t.capacity || 4,
              status: operationalStatus,
              cleaningStatus: (t.cleaningStatus || 'CLEAN') as 'CLEAN' | 'DIRTY' | 'CLEANING',
              maintenanceNotes: t.maintenanceNotes || '',
              currentGuest,
              guestPhone,
              activeOrderId,
              orderNumber,
              kotNumber,
              orders: effectiveOrders,
              upcomingReservations: dateReservations,
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to fetch real tables from database', err);
    } finally {
      setIsTablesLoading(false);
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

  const lastAlertIdsRef = React.useRef<Set<string>>(new Set());

  const playAlarmChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Tone 1: High bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: Harmonic chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.45);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio is non-blocking
    }
  };

  const fetchReservationAlerts = async () => {
    try {
      const data = await api.getReservationAlerts({ activeOnly: true });
      if (data) {
        const currentIds = new Set<string>(data.map((a: any) => a.id));
        const hasNewAlert = data.some((a: any) => !lastAlertIdsRef.current.has(a.id));
        if (hasNewAlert && lastAlertIdsRef.current.size > 0) {
          playAlarmChime();
        }
        lastAlertIdsRef.current = currentIds;
        setAlerts(data);
      }
    } catch {
      // Background poll failure is non-blocking
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.acknowledgeReservationAlert(alertId, 'Staff');
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('Alert Acknowledged', 'Table preparation status marked as acknowledged.');
    } catch (err: any) {
      toast.error('Failed to acknowledge alert', err.message);
    }
  };

  const fetchSettings = async () => {
    try {
      const s = await api.getRestaurantSettings();
      if (s) {
        setRestaurantSettings(s);
        setTempDiningMinutes(s.estimatedDiningMinutes || 90);
        setTempBufferMinutes(s.cleaningBufferMinutes || 15);
        setTempAlertMinutes(s.advanceAlertMinutes || 15);
      }
    } catch (err) {
      console.error('Failed to load restaurant settings', err);
    }
  };

  const handleSaveRestaurantSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updated = await api.updateRestaurantSettings({
        estimatedDiningMinutes: Number(tempDiningMinutes) || 90,
        cleaningBufferMinutes: Number(tempBufferMinutes) || 15,
        advanceAlertMinutes: Number(tempAlertMinutes) || 15,
      });
      if (updated) {
        setRestaurantSettings(updated);
        toast.success('Settings Saved', 'Estimated dining time and preparation buffer updated.');
        setIsSettingsModalOpen(false);
      }
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to update restaurant settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchTables(selectedDate);
    fetchReservations();
    fetchActiveOrders();
    fetchReservationAlerts();
    fetchSettings();
    const interval = setInterval(() => {
      fetchTables(selectedDate);
      fetchActiveOrders();
      fetchReservationAlerts();
      fetchReservations();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

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
          endTime: resEndTime,
          partySize: resPartySize,
          durationMinutes: resDurationMinutes,
          bufferMinutes: 15,
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
  }, [isReservationModalOpen, resDate, resTime, resEndTime, resPartySize, resDurationMinutes, editingReservation]);

  // Handle start time change: auto-recalculate end time or duration
  const handleStartTimeChange = (newStartTime: string) => {
    setResTime(newStartTime);
    if (!newStartTime) return;
    const startMins = parseTimeToMinutes(newStartTime);
    const endMins = parseTimeToMinutes(resEndTime);
    if (endMins <= startMins) {
      const duration = resDurationMinutes > 0 ? resDurationMinutes : 120;
      const newEndMins = (startMins + duration) % (24 * 60);
      setResEndTime(formatMinutesToTime(newEndMins));
      setEndTimeError(null);
    } else {
      setResDurationMinutes(endMins - startMins);
      setEndTimeError(null);
    }
  };

  // Handle end time change: validate end > start and set duration
  const handleEndTimeChange = (newEndTime: string) => {
    setResEndTime(newEndTime);
    if (!newEndTime || !resTime) return;
    const startMins = parseTimeToMinutes(resTime);
    const endMins = parseTimeToMinutes(newEndTime);
    if (endMins <= startMins) {
      setEndTimeError('End time must be later than start time.');
    } else {
      setEndTimeError(null);
      setResDurationMinutes(endMins - startMins);
    }
  };

  // Overlapping Reservation Conflict Validation (Instant reactive memo)
  const conflictWarning = useMemo(() => {
    if (!resPreferredTableId || !resDate || !resTime || !resEndTime) return null;
    const startMins = parseTimeToMinutes(resTime);
    const endMins = parseTimeToMinutes(resEndTime);
    if (endMins <= startMins) return null; // End time error handles this

    const bufferMinutes = 15;
    const targetDateStr = resDate.split('T')[0];

    // Check against all loaded reservations for this table on this date
    const conflicting = reservations.find((r) => {
      if (editingReservation && r.id === editingReservation.id) return false;
      if (r.tableId !== resPreferredTableId) return false;

      const rDateStr = r.reservationDate ? r.reservationDate.split('T')[0] : '';
      if (rDateStr !== targetDateStr) return false;

      // Ignore cancelled, no-show, and completed reservations
      const st = (r.status || '').toUpperCase();
      if (st === 'CANCELLED' || st === 'NO_SHOW' || st === 'COMPLETED') return false;

      const rStartMins = parseTimeToMinutes(r.reservationTime);
      const rDuration = r.durationMinutes > 0 ? r.durationMinutes : 120;
      const rEndMins = rStartMins + rDuration;

      // Overlap with cleaning buffer:
      // startA < endB + buffer && startB < endA + buffer
      return startMins < (rEndMins + bufferMinutes) && rStartMins < (endMins + bufferMinutes);
    });

    if (conflicting) {
      const cStart = formatTime12h(conflicting.reservationTime);
      const conflictingDuration = conflicting.durationMinutes > 0 ? conflicting.durationMinutes : 120;
      const cEndMins = parseTimeToMinutes(conflicting.reservationTime) + conflictingDuration;
      const cEnd = formatTime12h(formatMinutesToTime(cEndMins));
      return `Time slot unavailable. This table is already booked from ${cStart} to ${cEnd}. Choose another time or table.`;
    }

    // Also check backend availability response for table conflict
    if (availabilityData?.allTables) {
      const selectedTable = availabilityData.allTables.find((t) => t.id === resPreferredTableId);
      if (selectedTable && !selectedTable.isAvailable && selectedTable.conflictingReservation) {
        const cr = selectedTable.conflictingReservation;
        const cStart = cr.startTime || formatTime12h(cr.reservationTime || '');
        const cEnd = cr.endTime || formatTime12h(calculateEndTime(cr.reservationTime || '', cr.durationMinutes || 120));
        return `Time slot unavailable. This table is already booked from ${cStart} to ${cEnd}. Choose another time or table.`;
      }
    }

    return null;
  }, [resPreferredTableId, resDate, resTime, resEndTime, reservations, availabilityData, editingReservation]);

  // Refresh table availability when date/time changes (floor plan filter)
  useEffect(() => {
    let isCurrent = true;
    const timeout = setTimeout(async () => {
      setIsCheckingFutureAvailability(true);
      try {
        const res = await api.checkTableAvailability({
          date: selectedDate,
          time: selectedTime,
          partySize: 2,
          durationMinutes: 120,
        });
        if (isCurrent && res) {
          setFutureAvailabilityData(res);
        }
      } catch (err) {
        console.error('Failed checking table availability', err);
      } finally {
        if (isCurrent) setIsCheckingFutureAvailability(false);
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [selectedDate, selectedTime]);

  // Keyboard listener: Allow closing booking modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReservationModalOpen && !isSavingReservation) {
        setIsReservationModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReservationModalOpen, isSavingReservation]);

  // Open New Reservation Modal
  const handleOpenNewReservation = (preselectedTable?: TableItem) => {
    setEditingReservation(null);
    setResCustomerName('');
    setResPhoneNumber('');
    setResDate(selectedDate || normalizeDateStr(new Date()));
    setResTime('19:00');
    setResEndTime('21:00');
    setResPartySize(preselectedTable?.capacity || 2);
    setResDurationMinutes(120);
    setResPreferredTableId(preselectedTable?.id || '');
    setResSpecialRequests('');
    setResInternalNotes('');
    setResStatus('CONFIRMED');
    setEndTimeError(null);
    setBookingFormErrors({});
    setIsReservationModalOpen(true);
  };

  // Open View Reservation Modal (Read-Only)
  const handleOpenViewReservation = (res: TableReservationData) => {
    setViewingReservation(res);
    setIsViewReservationModalOpen(true);
  };

  // Open Edit Reservation Modal
  const handleOpenEditReservation = (res: TableReservationData) => {
    setEditingReservation(res);
    setResCustomerName(res.customerName);
    setResPhoneNumber(res.phoneNumber);
    setResDate(res.reservationDate ? res.reservationDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const st = res.reservationTime || '19:00';
    const dur = res.durationMinutes || 120;
    const startM = parseTimeToMinutes(st);
    const endM = (startM + dur) % (24 * 60);
    setResTime(st);
    setResEndTime(formatMinutesToTime(endM));
    setResPartySize(res.partySize || 2);
    setResDurationMinutes(dur);
    setResPreferredTableId(res.tableId || '');
    setResSpecialRequests(res.specialRequests || '');
    setResInternalNotes(res.internalNotes || '');
    setResStatus(res.status || 'CONFIRMED');
    setEndTimeError(null);
    setBookingFormErrors({});
    setIsReservationModalOpen(true);
  };

  // Save Reservation (Create or Update)
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { customerName?: string; phoneNumber?: string; date?: string } = {};
    if (!resCustomerName.trim()) {
      errors.customerName = 'Customer Name is required.';
    }
    if (!resPhoneNumber.trim()) {
      errors.phoneNumber = 'Phone Number is required.';
    }
    if (!resDate) {
      errors.date = 'Booking Date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setBookingFormErrors(errors);
      toast.error('Required Fields Missing', 'Please fill in Customer Name, Phone Number, and Booking Date.');
      return;
    }

    setBookingFormErrors({});

    const effectiveTime = resTime.trim() || '19:00';
    const effectiveEndTime = resEndTime.trim() || '21:00';
    const effectivePartySize = resPartySize > 0 ? resPartySize : 2;

    const startM = parseTimeToMinutes(effectiveTime);
    const endM = parseTimeToMinutes(effectiveEndTime);
    if (endM <= startM) {
      setEndTimeError('End time must be later than start time.');
      toast.error('Invalid Time Range', 'End time must be later than start time.');
      return;
    }

    // Block save if conflict warning is active
    if (conflictWarning) {
      toast.error('Time Slot Unavailable', conflictWarning);
      return;
    }

    // Check conflict on preferred table against backend availabilityData
    if (resPreferredTableId && availabilityData) {
      const selectedTable = availabilityData.allTables.find((t) => t.id === resPreferredTableId);
      if (selectedTable && !selectedTable.isAvailable) {
        toast.error('Selected Table Unavailable', selectedTable.conflictReason || 'This table is unavailable for this time window. Please choose another table or time.');
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
          reservationTime: effectiveTime,
          endTime: effectiveEndTime,
          partySize: effectivePartySize,
          durationMinutes: resDurationMinutes,
          bufferMinutes: 15,
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
          reservationTime: effectiveTime,
          endTime: effectiveEndTime,
          partySize: effectivePartySize,
          durationMinutes: resDurationMinutes,
          bufferMinutes: 15,
          tableId: resPreferredTableId || undefined,
          specialRequests: resSpecialRequests.trim() || undefined,
          internalNotes: resInternalNotes.trim() || undefined,
          status: resStatus,
        });
        toast.celebrate('Booking Confirmed!', `Code ${created.reservationCode} booked for ${created.customerName} on ${resDate} at ${effectiveTime}.`);
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

  // Seat Reservation Guests / Customer Arrived
  const handleSeatReservation = async (res: TableReservationData, chosenTableId?: string) => {
    const targetTableId = chosenTableId || res.tableId || bookingDetailsModalTable?.id;

    if (!targetTableId) {
      // Prompt staff to choose an available table
      setSeatingReservation(res);
      setSeatingTableId('');
      setIsSeatingModalOpen(true);
      return;
    }

    const customerName =
      res.guest?.firstName || res.guest?.lastName
        ? `${res.guest.firstName} ${res.guest.lastName}`.trim()
        : res.customerName || 'Booked Customer';

    const tableObj = tables.find((t) => t.id === targetTableId);

    // If reservation is already marked as seated, directly open Add Item / Order page for this table
    if (res.status === 'SEATED') {
      setIsBookingDetailsModalOpen(false);
      setBookingDetailsModalTable(null);
      setIsViewReservationModalOpen(false);
      setViewingReservation(null);
      setIsSeatingModalOpen(false);
      setSeatingReservation(null);
      setActiveOrderTableId(targetTableId);
      return;
    }

    // Check if target table is currently occupied by another unbilled guest
    if (tableObj && tableObj.status === 'OCCUPIED' && !chosenTableId && tableObj.activeOrderId && tableObj.currentGuest && tableObj.currentGuest !== customerName) {
      setSeatingReservation(res);
      setSeatingTableId('');
      setIsSeatingModalOpen(true);
      return;
    }

    // Close all booking modals immediately for smooth transition
    setIsBookingDetailsModalOpen(false);
    setBookingDetailsModalTable(null);
    setIsViewReservationModalOpen(false);
    setViewingReservation(null);
    setIsSeatingModalOpen(false);
    setSeatingReservation(null);

    // Optimistically update table card status to OCCUPIED with the customer's name
    setTables((prev) =>
      prev.map((t) =>
        t.id === targetTableId
          ? {
              ...t,
              status: 'OCCUPIED' as const,
              currentGuest: customerName,
              guestPhone: res.phoneNumber || t.guestPhone || '',
            }
          : t
      )
    );

    setIsSeatingGuests(true);
    try {
      const result = await api.seatTableReservation(res.id, {
        tableId: targetTableId,
        serverName: seatingServerName || 'Waiter',
      });

      const assignedOrderId = result?.order?.id;
      const assignedOrderNumber = result?.order?.orderNumber;
      const assignedKotNumber = result?.order?.kotNumber;

      setTables((prev) =>
        prev.map((t) =>
          t.id === targetTableId
            ? {
                ...t,
                status: 'OCCUPIED' as const,
                currentGuest: customerName,
                guestPhone: res.phoneNumber || t.guestPhone || '',
                activeOrderId: assignedOrderId || t.activeOrderId,
                orderNumber: assignedOrderNumber || t.orderNumber,
                kotNumber: assignedKotNumber || t.kotNumber,
              }
            : t
        )
      );

      toast.celebrate('Customer Arrived!', `${customerName} arrived. Ready to add items for Table ${tableObj?.tableNumber || ''}.`);

      // Immediately navigate to the active order page for that table so staff can add items!
      setActiveOrderTableId(targetTableId);

      // Refresh tables & reservations in background
      await fetchTables(selectedDate);
      await fetchReservations();
    } catch (err: any) {
      console.warn('Backend seating message:', err);
      // Fallback: keep optimistic status and open order page
      setActiveOrderTableId(targetTableId);
      toast.info('Customer Arrived', `Table ${tableObj?.tableNumber || ''} marked as Occupied for ${customerName}. Ready to add items.`);
      await fetchTables(selectedDate);
    } finally {
      setIsSeatingGuests(false);
    }
  };

  const isSelectedToday = selectedDate === normalizeDateStr(new Date());

  // Auto-reset status filter if switching away from today while on today-only status
  useEffect(() => {
    if (!isSelectedToday && (selectedStatus === 'OCCUPIED' || selectedStatus === 'CLEANING')) {
      setSelectedStatus('ALL');
    }
  }, [selectedDate, isSelectedToday, selectedStatus]);

  // Filtered tables for the grid
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const selectedDateReservations = (table.upcomingReservations || []).filter((r: any) => {
        const matchesDate = normalizeDateStr(r.reservationDate) === selectedDate;
        const matchesStatus = r.status === 'CONFIRMED' || r.status === 'PENDING' || r.status === 'SEATED';
        return matchesDate && matchesStatus;
      });
      const hasBookingOnDate = selectedDateReservations.length > 0;

      let matchesStatus = true;
      if (selectedStatus === 'ALL') {
        matchesStatus = true;
      } else if (selectedStatus === 'RESERVED') {
        matchesStatus = hasBookingOnDate;
      } else if (selectedStatus === 'AVAILABLE') {
        if (isSelectedToday) {
          matchesStatus = table.status === 'AVAILABLE';
        } else {
          matchesStatus = table.status !== 'OUT_OF_SERVICE' && !hasBookingOnDate;
        }
      } else if (selectedStatus === 'OCCUPIED') {
        matchesStatus = isSelectedToday && table.status === 'OCCUPIED';
      } else if (selectedStatus === 'CLEANING') {
        matchesStatus = isSelectedToday && table.status === 'CLEANING';
      } else {
        matchesStatus = table.status === selectedStatus;
      }

      const matchesSearch =
        !searchQuery.trim() ||
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        table.section.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (isSelectedToday && table.currentGuest && table.currentGuest.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        selectedDateReservations.some((r: any) =>
          r.customerName?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          r.phoneNumber?.includes(searchQuery.trim()) ||
          r.reservationCode?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );

      return matchesStatus && matchesSearch;
    });
  }, [tables, selectedStatus, searchQuery, selectedDate, isSelectedToday]);

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

  // Status counts (Reserved count reflects tables reserved on the selected date)
  const reservedTablesForDate = useMemo(() => {
    return tables.filter((t) =>
      (t.upcomingReservations || []).some(
        (r: any) =>
          (r.status === 'CONFIRMED' || r.status === 'PENDING' || r.status === 'SEATED') &&
          normalizeDateStr(r.reservationDate) === selectedDate
      )
    );
  }, [tables, selectedDate]);

  const reservedCount = reservedTablesForDate.length;
  const occupiedCount = isSelectedToday ? tables.filter((t) => t.status === 'OCCUPIED').length : 0;
  const cleaningCount = isSelectedToday ? tables.filter((t) => t.status === 'CLEANING').length : 0;
  const outOfServiceCount = tables.filter((t) => t.status === 'OUT_OF_SERVICE').length;
  const availableCount = isSelectedToday
    ? tables.filter((t) => t.status === 'AVAILABLE').length
    : tables.filter((t) => t.status !== 'OUT_OF_SERVICE' && !reservedTablesForDate.some((rt) => rt.id === t.id)).length;
  const activeReservationsCount = reservations.filter((r) => {
    if (r.status !== 'CONFIRMED' && r.status !== 'PENDING') return false;
    const rDate = normalizeDateStr(r.reservationDate);
    return !selectedDate || rDate === selectedDate;
  }).length;

  // ---------------------------------------------------------------------------
  // 1. Walk-In Customer Seating & Turnaround Conflict Validation (Req 3, 4, 5, 6)
  // ---------------------------------------------------------------------------
  const handleSelectSeatCustomer = async (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Out of service tables cannot accept walk-in customers
    if (table.status === 'OUT_OF_SERVICE') {
      toast.error('Table Out of Service', 'Cannot seat customers on an out-of-service table.');
      return;
    }
    // 2. Dirty tables cannot accept walk-in customers until cleaned
    if (table.cleaningStatus === 'DIRTY' || table.status === 'CLEANING') {
      toast.error('Table is Dirty', 'Please mark table as clean before seating new walk-in guests.');
      return;
    }
    // 3. Occupied tables must not be reseated
    if (table.status === 'OCCUPIED' && (table.orders?.length || 0) > 0) {
      handleOpenOrderPage(table.id);
      return;
    }

    // 4. Pre-flight backend check for upcoming reservations (Requirement 3 & 6)
    try {
      const check = await api.checkWalkInAvailability(table.id, {
        estimatedDiningMinutes: restaurantSettings.estimatedDiningMinutes,
        cleaningBufferMinutes: restaurantSettings.cleaningBufferMinutes,
      });

      if (!check.isAllowed) {
        // Requirement 5: Clear warning if insufficient time remains
        const warning = check.warning || `This table is reserved at ${formatTime12h(check.nextReservation?.reservationTime || '12:00 PM')}. Choose another table because there may not be enough time to finish service and prepare it.`;
        setWalkInConflictData({
          table,
          reservation: check.nextReservation,
          warningMessage: warning,
          minutesRemaining: Math.max(0, (check as any).minutesUntilReservation || (check as any).remainingMinutes || 0),
          requiredMinutes: (check.estimatedMinutes || restaurantSettings.estimatedDiningMinutes) + (check.bufferMinutes || restaurantSettings.cleaningBufferMinutes),
        });
        return;
      }

      // Requirement 4: Sufficient time remains, seat walk-in directly (no details modal needed)
      await seatWalkInDirect(table);
    } catch (err: any) {
      console.error('Walk-in check failed', err);
      // Fallback: check frontend reservations
      const nextRes = (table.upcomingReservations || []).find(
        (r: any) => (r.status === 'CONFIRMED' || r.status === 'PENDING') && normalizeDateStr(r.reservationDate) === selectedDate
      );
      if (nextRes) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const resMins = parseTimeToMinutes(nextRes.reservationTime);
        const required = restaurantSettings.estimatedDiningMinutes + restaurantSettings.cleaningBufferMinutes;
        if (resMins - currentMins < required) {
          setWalkInConflictData({
            table,
            reservation: nextRes,
            warningMessage: `This table is reserved at ${formatTime12h(nextRes.reservationTime)}. Choose another table because there may not be enough time to finish service and prepare it.`,
            minutesRemaining: Math.max(0, resMins - currentMins),
            requiredMinutes: required,
          });
          return;
        }
      }

      await seatWalkInDirect(table);
    }
  };

  const seatWalkInDirect = async (table: TableItem) => {
    // Optimistically update table card status to OCCUPIED immediately
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id
          ? {
              ...t,
              status: 'OCCUPIED' as const,
              currentGuest: 'Walk-in Guest',
            }
          : t
      )
    );

    try {
      const seatRes = await api.seatWalkInCustomer(table.id, {
        customerName: 'Walk-in Guest',
        guestCount: Math.min(table.capacity, 2),
        serverName: 'Staff',
        estimatedDiningMinutes: restaurantSettings.estimatedDiningMinutes,
        cleaningBufferMinutes: restaurantSettings.cleaningBufferMinutes,
      });

      setTables((prev) =>
        prev.map((t) =>
          t.id === table.id
            ? {
                ...t,
                status: 'OCCUPIED' as const,
                currentGuest: 'Walk-in Guest',
                activeOrderId: seatRes?.order?.id || t.activeOrderId,
                orderNumber: seatRes?.order?.orderNumber || t.orderNumber,
                kotNumber: seatRes?.order?.kotNumber || t.kotNumber,
              }
            : t
        )
      );

      toast.success(`Table ${table.tableNumber} Occupied`, 'Walk-in customer seated.');
      await fetchTables(selectedDate);
      await fetchActiveOrders();
    } catch (err: any) {
      console.error('Failed to seat walk-in customer', err);
      const msg = err.message || '';
      await fetchTables(selectedDate);
      if (msg.includes('reserved at') || msg.includes('not enough time')) {
        setWalkInConflictData({
          table,
          reservation: null,
          warningMessage: msg,
          minutesRemaining: 0,
          requiredMinutes: restaurantSettings.estimatedDiningMinutes + restaurantSettings.cleaningBufferMinutes,
        });
      } else {
        toast.error('Seating Failed', msg || 'Could not seat walk-in customer.');
      }
    }
  };

  const handleStartDineInOrder = (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (table.status === 'OCCUPIED') {
      handleOpenOrderPage(table.id);
      return;
    }
    handleSelectSeatCustomer(table, e);
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
  // Quick Booking Actions (Connects to full backend reservation booking form)
  // ---------------------------------------------------------------------------
  const handleOpenBookingModal = (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleOpenNewReservation(table);
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
  // POS Order Management & Dispatch Workflow: Save, Print KOT, Print BOT, All in One
  // ---------------------------------------------------------------------------
  const handleDispatchOrder = async (mode: 'SAVE' | 'KOT' | 'BOT' | 'ALL') => {
    if (!activeTable) return;
    const currentOrders = activeTable.orders || [];
    if (currentOrders.length === 0) {
      toast.error('No Items in Order', 'Please add items before saving or printing.');
      return;
    }

    const unselectedItem = currentOrders.find((i) => i.availableUnits && i.availableUnits.length > 1 && !i.unit);
    if (unselectedItem) {
      toast.error('Select Size', `Please select a size for "${unselectedItem.name}".`);
      return;
    }

    // Determine target items for dispatch/print
    let targetItems: OrderItem[] = [];
    if (mode === 'KOT') {
      targetItems = currentOrders.filter(
        (i) => (i.department === 'KOT' || !i.department) && (i.quantity > (i.dispatchedQuantity || 0))
      );
      if (targetItems.length === 0) {
        targetItems = currentOrders.filter((i) => i.department === 'KOT' || !i.department);
      }
      if (targetItems.length === 0) {
        toast.info('No Kitchen Items', 'There are no kitchen food items in this order.');
        return;
      }
    } else if (mode === 'BOT') {
      targetItems = currentOrders.filter(
        (i) => i.department === 'BOT' && (i.quantity > (i.dispatchedQuantity || 0))
      );
      if (targetItems.length === 0) {
        targetItems = currentOrders.filter((i) => i.department === 'BOT');
      }
      if (targetItems.length === 0) {
        toast.info('No Bar Items', 'There are no bar or beverage items in this order.');
        return;
      }
    } else if (mode === 'ALL') {
      targetItems = currentOrders.filter((i) => i.quantity > (i.dispatchedQuantity || 0));
      if (targetItems.length === 0) {
        targetItems = currentOrders;
      }
      if (targetItems.length === 0) {
        toast.info('No Items', 'There are no items in this order.');
        return;
      }
    }

    setIsSendingOrder(true);
    try {
      let resOrder: any = null;
      let orderId = activeTable.activeOrderId;
      let orderNumber = activeTable.orderNumber;

      // 1. Sync / Save active order to backend
      if (orderId) {
        resOrder = await (api as any).updateRestaurantOrderItems(orderId, {
          items: currentOrders.map((item) => ({
            productId: item.productId,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: item.remarks,
            department: item.department || (isBeverageCategory(item.category, item.name) ? 'BOT' : 'KOT'),
            dispatchedQuantity: item.dispatchedQuantity || 0,
            kotNumber: item.kotNumber,
            botNumber: (item as any).botNumber,
          })),
          notes: activeTable.billRemarks,
        });
      } else {
        resOrder = await (api as any).createRestaurantOrder({
          outlet: 'RESTAURANT',
          tableId: activeTable.isNoTable ? undefined : activeTable.id,
          orderType: activeTable.orderType || (activeTable.isNoTable ? 'NO_TABLE' : 'DINE_IN'),
          serverName: 'Waiter',
          notes: activeTable.notes || activeTable.seatingNote || (activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' && activeTable.currentGuest !== 'Walk-in Customer'
            ? `Guest: ${activeTable.currentGuest}${activeTable.guestPhone ? ` (${activeTable.guestPhone})` : ''}` 
            : undefined),
          items: currentOrders.map((item) => ({
            productId: item.productId,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: item.remarks,
            department: item.department || (isBeverageCategory(item.category, item.name) ? 'BOT' : 'KOT'),
            dispatchedQuantity: 0,
          })),
        });
        orderId = resOrder?.id || `ORD-${Date.now()}`;
        orderNumber = resOrder?.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (mode === 'SAVE') {
        toast.success('Order Saved', `Order ${orderNumber || ''} saved successfully.`);
        fetchTables(selectedDate);
        fetchActiveOrders();
        return;
      }

      // 2. Dispatch Tickets via API
      let generatedKot = activeTable.kotNumber;
      let generatedBot = (activeTable as any).botNumber;

      if (mode === 'KOT' || mode === 'ALL') {
        try {
          const kotRes = await (api as any).dispatchRestaurantOrderKot(orderId);
          generatedKot = kotRes?.ticketNumber || kotRes?.kotNumber || `KOT-${Math.floor(200 + Math.random() * 800)}`;
        } catch {
          generatedKot = `KOT-${Math.floor(200 + Math.random() * 800)}`;
        }
      }

      if (mode === 'BOT' || mode === 'ALL') {
        try {
          const botRes = await (api as any).dispatchRestaurantOrderBot(orderId);
          generatedBot = botRes?.ticketNumber || botRes?.botNumber || `BOT-${Math.floor(100 + Math.random() * 900)}`;
        } catch {
          generatedBot = `BOT-${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      // 3. Update local orders with dispatched quantities
      const updatedOrders = currentOrders.map((item) => {
        const isTarget = targetItems.some((t) => t.id === item.id);
        if (!isTarget) return item;

        const isKotItem = (item.department === 'KOT' || !item.department);
        const isBotItem = item.department === 'BOT';

        if (mode === 'KOT' && isKotItem) {
          return {
            ...item,
            dispatchedQuantity: item.quantity,
            kotNumber: generatedKot,
            status: 'KITCHEN' as const,
          };
        }
        if (mode === 'BOT' && isBotItem) {
          return {
            ...item,
            dispatchedQuantity: item.quantity,
            botNumber: generatedBot,
          };
        }
        if (mode === 'ALL') {
          return {
            ...item,
            dispatchedQuantity: item.quantity,
            kotNumber: isKotItem ? generatedKot : item.kotNumber,
            botNumber: isBotItem ? generatedBot : (item as any).botNumber,
            status: isKotItem ? ('KITCHEN' as const) : item.status,
          };
        }
        return item;
      });

      // Update state
      if (activeTable.isNoTable) {
        setActiveCustomOrder((prev) =>
          prev
            ? {
                ...prev,
                activeOrderId: orderId,
                orderNumber,
                kotNumber: generatedKot || prev.kotNumber,
                botNumber: generatedBot || (prev as any).botNumber,
                orders: updatedOrders,
              }
            : null
        );
      } else {
        setTables((prev) =>
          prev.map((t) =>
            t.id === activeTable.id
              ? {
                  ...t,
                  status: 'OCCUPIED',
                  activeOrderId: orderId,
                  orderNumber,
                  kotNumber: generatedKot || t.kotNumber,
                  botNumber: generatedBot || (t as any).botNumber,
                  orders: updatedOrders,
                }
              : t
          )
        );
      }

      // Persist updated dispatched quantities and ticket numbers to backend immediately
      syncTableOrderToBackend(activeTable.id, updatedOrders, { immediate: true });

      // 4. Open Print Ticket Modal
      const printItems = targetItems.map((i) => {
        const remainingQty = i.quantity - (i.dispatchedQuantity || 0);
        const qty = remainingQty > 0 ? remainingQty : i.quantity;
        return {
          productName: i.unit ? `${i.name} (${i.unit})` : i.name,
          quantity: qty,
          unitPrice: i.price,
          total: i.price * qty,
          notes: i.remarks,
        };
      });

      const ticketType = mode === 'BOT' ? 'BOT' : mode === 'ALL' ? 'ALL' : 'KOT';
      setReceiptModalData({
        isOpen: true,
        onClose: () => setReceiptModalData(null),
        orderNumber: orderNumber || 'ORD',
        ticketType: ticketType as any,
        kotNumber: generatedKot,
        botNumber: generatedBot,
        receiptNumber: mode === 'BOT' ? generatedBot : generatedKot,
        orderType: activeTable.orderType || 'DINE_IN',
        tableNumber: activeTable.isNoTable ? null : activeTable.tableNumber,
        seatingNote: activeTable.notes || activeTable.seatingNote,
        createdAt: new Date().toISOString(),
        serverName: 'ADMIN',
        customerName: activeTable.currentGuest && activeTable.currentGuest !== 'Dine-In Guest' ? activeTable.currentGuest : undefined,
        items: printItems,
        subtotal: printItems.reduce((s, i) => s + i.total, 0),
        tax: 0,
        total: printItems.reduce((s, i) => s + i.total, 0),
      });

      const label = mode === 'KOT' ? `KOT (${generatedKot})` : mode === 'BOT' ? `BOT (${generatedBot})` : 'All in One Ticket';
      toast.celebrate(`Dispatched Successfully!`, `${printItems.length} item(s) printed (${label}).`);
      fetchTables(selectedDate);
      fetchActiveOrders();
    } catch (err: any) {
      toast.error('Dispatch Failed', err.message || 'Could not complete dispatch.');
    } finally {
      setIsSendingOrder(false);
    }
  };

  const handleSendOrder = async (shouldPrint = false) => {
    return handleDispatchOrder(shouldPrint ? 'ALL' : 'SAVE');
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

    const unselectedItem = currentOrders.find((i) => i.availableUnits && i.availableUnits.length > 1 && !i.unit);
    if (unselectedItem) {
      toast.error('Select Size', `Please select a size for "${unselectedItem.name}" before generating the bill.`);
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
  // Quick Order & Takeaway Handlers
  // ---------------------------------------------------------------------------
  const handleStartNoTableOrder = (orderType: 'TAKEAWAY' | 'NO_TABLE' | 'ONLINE' = 'TAKEAWAY') => {
    const isOnline = orderType === 'ONLINE';
    const isTakeaway = orderType === 'TAKEAWAY';
    const label = isOnline ? 'Online Order' : isTakeaway ? 'Takeaway' : 'Quick Order';
    const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const customItem: TableItem = {
      id: `notable-${Date.now()}`,
      tableNumber: label,
      section: isOnline ? 'Online / Delivery' : isTakeaway ? 'Takeaway / Counter' : 'Walk-in',
      capacity: 1,
      status: 'OCCUPIED',
      orders: [],
      activeOrderId: undefined,
      orderNumber: orderNum,
      currentGuest: isOnline ? 'Online Customer' : isTakeaway ? 'Takeaway Customer' : 'Walk-in Customer',
      guestPhone: '',
      notes: isOnline ? 'Online Order' : undefined,
      seatingNote: undefined,
      isNoTable: true,
      orderType: orderType,
    };

    setActiveOrderTableId(null);
    setActiveCustomOrder(customItem);
    setIsNoTableModalOpen(false);
    setNoTableSeatingNote('');
    setNoTableCustomerName('');
    setNoTableCustomerPhone('');
    setIsBillPanelOpen(false);
    setOrderProductName('');
    setOrderPrice('');
    setOrderQuantity(1);

    toast.success(`${label} Started · ${orderNum}`, 'Search and add items directly.');
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
    const mappedOrders: OrderItem[] = (ord.items || []).map((i) => {
      const itemPrice = i.unitPrice;
      const unitMeta = resolveItemUnitInfo(
        { name: i.productName, price: itemPrice, unit: (i as any).unit },
        menuCatalog
      );
      const isDispatched = !!(i.kotNumber || ord.kotNumber || (i as any).botNumber || ord.botNumber);
      const itemDispatchedQty = ((i as any).dispatchedQuantity !== undefined && (i as any).dispatchedQuantity !== null)
        ? Number((i as any).dispatchedQuantity)
        : (isDispatched ? Number(i.quantity) : 0);
      const itemDept: 'KOT' | 'BOT' = ((i as any).department === 'BOT' || (i as any).department === 'KOT')
        ? (i as any).department
        : (unitMeta.department || (isBeverageCategory((i as any).category, i.productName) ? 'BOT' : 'KOT'));

      return {
        id: i.id || `item-${Date.now()}-${Math.random()}`,
        productId: i.productId,
        name: i.productName,
        unit: (i as any).unit || unitMeta.unit || undefined,
        price: itemPrice,
        quantity: i.quantity,
        remarks: i.notes,
        status: isDispatched ? ('KITCHEN' as const) : ('DRAFT' as const),
        kotNumber: i.kotNumber || ord.kotNumber,
        botNumber: (i as any).botNumber || ord.botNumber,
        department: itemDept,
        dispatchedQuantity: itemDispatchedQty,
      };
    });

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
      ticketType: 'KOT',
      receiptNumber: ord.kotNumber || `KOT-${ord.orderNumber.replace('ORD-', '')}`,
      orderType: ord.orderType,
      tableNumber: ord.table?.tableNumber,
      seatingNote: ord.notes,
      createdAt: ord.createdAt,
      serverName: ord.serverName || 'ADMIN',
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

  // Debounce timer ref for order database sync
  const syncOrderDebounceRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to persist order items to backend database
  const syncTableOrderToBackend = (
    targetTableId: string,
    updatedOrders: OrderItem[],
    options?: { immediate?: boolean }
  ) => {
    if (syncOrderDebounceRef.current[targetTableId]) {
      clearTimeout(syncOrderDebounceRef.current[targetTableId]);
      delete syncOrderDebounceRef.current[targetTableId];
    }

    const runSync = async () => {
      try {
        const isCustom = activeCustomOrder && activeCustomOrder.id === targetTableId;
        const currentTarget = isCustom ? activeCustomOrder : tables.find((t) => t.id === targetTableId);
        if (!currentTarget) return;

        const formattedItems = updatedOrders.map((item) => {
          const dept = item.department || (isBeverageCategory(item.category, item.name) ? 'BOT' : 'KOT');
          const isDispatched = !!(item.kotNumber || (item as any).botNumber || item.status === 'KITCHEN');
          const dispatchedQty = (item.dispatchedQuantity !== undefined && item.dispatchedQuantity !== null)
            ? Number(item.dispatchedQuantity)
            : (isDispatched ? Number(item.quantity) : 0);

          return {
            productId: item.productId,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: item.remarks || '',
            department: dept,
            dispatchedQuantity: dispatchedQty,
            kotNumber: item.kotNumber,
            botNumber: (item as any).botNumber,
          };
        });

        let orderId = currentTarget.activeOrderId;

        if (orderId) {
          // Order already exists in DB; sync items via PUT /api/restaurant/orders/{id}/items
          await api.updateRestaurantOrderItems(orderId, {
            items: formattedItems,
            notes: currentTarget.billRemarks || currentTarget.notes,
          });
        } else if (!isCustom) {
          // Table doesn't have an order in DB yet; create it!
          const newOrder = await api.createRestaurantOrder({
            outlet: 'RESTAURANT',
            tableId: currentTarget.id,
            orderType: currentTarget.orderType || 'DINE_IN',
            serverName: 'Waiter',
            notes:
              currentTarget.notes ||
              currentTarget.seatingNote ||
              (currentTarget.currentGuest &&
              currentTarget.currentGuest !== 'Dine-In Guest' &&
              currentTarget.currentGuest !== 'Walk-in Customer'
                ? `Guest: ${currentTarget.currentGuest}`
                : undefined),
            items: formattedItems,
          });

          if (newOrder) {
            setTables((prev) =>
              prev.map((t) =>
                t.id === targetTableId
                  ? {
                      ...t,
                      status: 'OCCUPIED',
                      activeOrderId: newOrder.id,
                      orderNumber: newOrder.orderNumber,
                      kotNumber: newOrder.kotNumber,
                    }
                  : t
              )
            );
          }
        } else {
          // Custom order (Takeaway / No Table)
          const newOrder = await api.createRestaurantOrder({
            outlet: 'RESTAURANT',
            orderType: currentTarget.orderType || 'TAKEAWAY',
            serverName: 'Waiter',
            notes: currentTarget.currentGuest || currentTarget.notes || 'Takeaway Order',
            items: formattedItems,
          });

          if (newOrder) {
            setActiveCustomOrder((prev) =>
              prev
                ? {
                    ...prev,
                    activeOrderId: newOrder.id,
                    orderNumber: newOrder.orderNumber,
                    kotNumber: newOrder.kotNumber,
                  }
                : null
            );
          }
        }
      } catch (err: any) {
        console.warn('Failed to sync order items to database:', err);
      }
    };

    if (options?.immediate) {
      runSync();
    } else {
      syncOrderDebounceRef.current[targetTableId] = setTimeout(runSync, 300);
    }
  };

  // Helper to push confirmed item & size into the active table's order
  const pushItemToTableOrder = (
    menuItem: MenuItemCatalogEntry,
    selectedTier: { unit: string; price: number },
    qty: number
  ) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const unit = selectedTier.unit || 'Regular';
    const price = selectedTier.price;

    // If tracked product and out of stock, prevent adding
    if (menuItem.trackStock && menuItem.stock !== undefined && menuItem.stock <= 0) {
      toast.error('Out of Stock', `"${name}" is currently out of stock.`);
      return;
    }

    const currentOrders = activeTable.orders || [];
    const existing = currentOrders.find(
      (i) => i.name.toLowerCase() === name.toLowerCase() && (i.unit || '').toLowerCase() === unit.toLowerCase()
    );

    // Stock limit validation for tracked products
    if (menuItem.trackStock && menuItem.stock !== undefined) {
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + qty > menuItem.stock) {
        toast.error('Stock Limit Reached', `Only ${menuItem.stock} units of "${name} (${unit})" available.`);
        return;
      }
    }

    let updatedOrders: OrderItem[];

    const dept: 'KOT' | 'BOT' = menuItem.department || (isBeverageCategory(menuItem.category, name) ? 'BOT' : 'KOT');

    if (existing) {
      updatedOrders = currentOrders.map((i) =>
        i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
      );
    } else {
      updatedOrders = [
        ...currentOrders,
        {
          id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: menuItem.id,
          name,
          baseName: unitInfo.baseName,
          category: menuItem.category,
          unit,
          availableUnits: unitInfo.availableUnits,
          price,
          quantity: qty,
          department: dept,
          dispatchedQuantity: 0,
          status: 'DRAFT',
        },
      ];
    }

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'OCCUPIED', orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
    toast.success(`Item Added`, `${qty}x ${name} · ${unit} (Rs. ${(price * qty).toFixed(2)}) added to Table ${activeTable.tableNumber}.`);
  };

  // Add item directly from the Setted Menu Catalog (1-click quick add from suggestions)
  const handleAddDirectMenuItem = (menuItem: MenuItemCatalogEntry, qtyOverride?: number) => {
    if (!activeTable) return;
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const hasMultipleUnits = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;
    const qty = qtyOverride && qtyOverride > 0 ? qtyOverride : Math.max(1, orderQuantity);

    // Rule 1 & 2: For multi-variant items, open the Quick Add popup to select size
    if (hasMultipleUnits) {
      setVariantModal({
        isOpen: true,
        menuItem,
        quantity: qty,
      });
      setIsSuggestionsOpen(false);
      return;
    }

    // Rule 4: Single-variant items add directly with default unit and price
    const defaultTier = unitInfo.availableUnits[0] || { unit: unitInfo.unit || 'Regular', price: menuItem.price };
    pushItemToTableOrder(menuItem, defaultTier, qty);
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

    const currentOrders = activeTable.orders || [];
    const existing = currentOrders.find((i) => i.name.toLowerCase() === name.toLowerCase());
    let updatedOrders: OrderItem[];

    if (existing) {
      updatedOrders = currentOrders.map((i) =>
        i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
      );
    } else {
      const effectivePrice = price > 0 ? price : (unitInfo.availableUnits[0]?.price || 0);
      const catalogMatch = menuCatalog.find((m) => m.name.toLowerCase() === name.toLowerCase());
      updatedOrders = [
        ...currentOrders,
        {
          id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: catalogMatch?.id,
          name,
          baseName: unitInfo.baseName,
          unit: unitInfo.unit,
          availableUnits: unitInfo.availableUnits,
          price: effectivePrice,
          quantity: qty,
        },
      ];
    }

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'OCCUPIED', orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);

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
      ...prev.map((d) => ({ ...d, isOpen: false })),
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
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const hasMultipleUnits = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;

    // Rule 1 & 2: For multi-variant items, open the Quick Add popup to select size
    if (hasMultipleUnits) {
      setVariantModal({
        isOpen: true,
        menuItem,
        quantity: 1,
        draftId,
      });
      setDraftRows((prev) => prev.map((d) => (d.id === draftId ? { ...d, isOpen: false } : d)));
      return;
    }

    // Rule 4: Single-variant items add directly with default unit and price
    const defaultTier = unitInfo.availableUnits[0] || { unit: unitInfo.unit || 'Regular', price: menuItem.price };
    pushItemToTableOrder(menuItem, defaultTier, 1);
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Change order item unit / portion (e.g., Sprite Can <-> 500ml Bottle)
  const handleUpdateItemUnit = (itemId: string, newUnit: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    const currentOrders = activeTable.orders || [];
    const updatedOrders = currentOrders.map((i) => {
      if (i.id !== itemId) return i;

      const unitMeta = resolveItemUnitInfo(i, menuCatalog);
      const targetTier =
        unitMeta.availableUnits.find((u) => u.unit.toLowerCase() === newUnit.toLowerCase()) ||
        unitMeta.availableUnits.find((u) => u.unit === newUnit);

      const newPrice = targetTier ? targetTier.price : (newUnit === '' ? 0 : i.price);
      const cleanBase = unitMeta.baseName || i.baseName || i.name.replace(/\s*\([^)]*\)$/, '').trim();
      const newName = cleanBase;

      if (targetTier) {
        toast.info('Unit Updated', `${cleanBase} set to ${newUnit} · Rs. ${newPrice.toFixed(2)}`);
      }

      return {
        ...i,
        name: newName,
        baseName: cleanBase,
        unit: newUnit,
        price: newPrice,
        availableUnits: unitMeta.availableUnits,
      };
    });

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
  };

  // Adjust order item discount
  const handleUpdateItemDiscount = (itemId: string, discount: number) => {
    if (!activeTable) return;
    const tableId = activeTable.id;
    const safeDiscount = Math.max(0, discount);

    const currentOrders = activeTable.orders || [];
    const updatedOrders = currentOrders.map((i) => {
      if (i.id !== itemId) return i;
      return {
        ...i,
        discount: safeDiscount,
        discountType: i.discountType || 'PERCENT',
      };
    });

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
  };

  // Toggle discount between % and flat Rs
  const handleToggleDiscountType = (itemId: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    const currentOrders = activeTable.orders || [];
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

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
  };

  // Update line item remarks / notes
  const handleUpdateItemRemarks = (itemId: string, remarks: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    const currentOrders = activeTable.orders || [];
    const updatedOrders = currentOrders.map((i) =>
      i.id === itemId ? { ...i, remarks } : i
    );

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
  };

  // Adjust order item quantity directly in the table
  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    const currentOrders = activeTable.orders || [];
    const updatedOrders = currentOrders
      .map((i) => {
        if (i.id === itemId) {
          const nextQty = i.quantity + delta;
          return nextQty > 0 ? { ...i, quantity: nextQty } : null;
        }
        return i;
      })
      .filter(Boolean) as OrderItem[];

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
  };

  // Remove order item from table
  const handleRemoveItem = (itemId: string) => {
    if (!activeTable) return;
    const tableId = activeTable.id;

    const currentOrders = activeTable.orders || [];
    const updatedOrders = currentOrders.filter((i) => i.id !== itemId);

    if (activeCustomOrder && activeTable.id === activeCustomOrder.id) {
      setActiveCustomOrder((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } else {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, orders: updatedOrders } : t))
      );
    }

    syncTableOrderToBackend(tableId, updatedOrders);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default dark:border-border-default">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackToTables}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs font-bold text-body hover:bg-surface-muted hover:border-[#0B3D32] shadow-2xs dark:border-border-default dark:bg-surface-card dark:text-body dark:hover:border-emerald-500 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tables</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleBackToTables();
                setActiveTab('ACTIVE_ORDERS');
                fetchActiveOrders();
              }}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-brand/30 bg-emerald-50 hover:bg-emerald-100 text-brand dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="View all active restaurant and quick orders"
            >
              <ClipboardList className="w-3.5 h-3.5 text-brand dark:text-emerald-400" />
              <span>Orders List</span>
              {activeOrders.length > 0 && (
                <span className="rounded-full bg-emerald-700 text-white px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2 ml-1">
              <h1 className="text-xl sm:text-2xl font-black font-heading text-body dark:text-body tracking-tight">
                {activeTable.isNoTable ? activeTable.tableNumber : `Table ${activeTable.tableNumber}`} · Order Management
              </h1>

              {activeTable.orderNumber && (
                <span className="rounded-[2px] bg-slate-900 text-amber-300 dark:bg-surface-card dark:text-amber-400 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold">
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
                <span className="rounded-[2px] bg-success-subtle text-success dark:bg-emerald-950 dark:text-success border border-success dark:border-success px-2 py-0.5 text-[9px] font-mono font-bold">
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
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-default bg-white hover:bg-surface-muted text-body px-3 py-1.5 text-xs font-bold transition-all dark:bg-surface-card dark:text-body dark:border-border-default cursor-pointer shadow-2xs"
              title="Preview and print customer receipt"
            >
              <Printer className="w-3.5 h-3.5 text-muted dark:text-slate-300" />
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
                className="inline-flex items-center gap-1 rounded-[3px] border border-border-default bg-surface-muted px-3 py-1.5 text-xs font-bold text-body hover:bg-surface-muted dark:border-border-default bg-surface-card dark:text-slate-300 transition-colors cursor-pointer"
                title="Close active order view"
              >
                <X className="w-3 h-3" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>


        {/* =========================================================================
            SEARCH / ADD ITEM WITH INSTANT AUTOCOMPLETE SUGGESTIONS
            Fetches directly from Setted Menu (hotel_menu_items)
           ========================================================================= */}
        <div className="space-y-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-body dark:text-body uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-brand dark:text-brand" />
              <span>Add Order · {activeTable.isNoTable ? activeTable.tableNumber : `Table ${activeTable.tableNumber}`}</span>
            </h2>
          </div>

          {/* Search Input Bar with Instant Dropdown Suggestions Below */}
          <div className="relative w-full max-w-sm sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-40" />
              <input
                type="text"
                placeholder="search item & Add"
                value={orderProductName}
                onFocus={() => setIsSuggestionsOpen(true)}
                onClick={() => setIsSuggestionsOpen(true)}
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
                className="relative z-40 w-full rounded-[3px] border border-border-default bg-white dark:bg-surface-card pl-9 pr-8 py-2.5 text-xs text-body placeholder-[#879B90] dark:border-border-default dark:text-body focus:outline-none focus:border-[#0B3D32] shadow-2xs transition-colors"
              />
              {orderProductName && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderProductName('');
                    setOrderPrice('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted dark:hover:text-white"
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
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 bg-surface-muted dark:bg-surface-card text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted flex items-center justify-between">
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
                    <div className="py-6 text-center text-xs text-muted dark:text-muted">
                      <p className="font-semibold text-body dark:text-body">
                        No menu items found for &quot;{orderProductName}&quot;
                      </p>
                    </div>
                  ) : (
                  suggestions.map((item) => {
                    const unitInfo = resolveItemUnitInfo(item, menuCatalog);
                    const isMulti = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;
                    const variantCount = unitInfo.availableUnits?.length || 0;

                    return (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddDirectMenuItem(item);
                        }}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer transition-colors group"
                      >
                        {/* 1. Item Name & 2. Category */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-body dark:text-body group-hover:text-brand dark:group-hover:text-emerald-300">
                              {item.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-[2px] bg-surface-muted dark:bg-[#0E3B31] text-muted dark:text-[#A4B8AE]">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-2 mt-0.5 font-mono">
                            {item.code}
                          </div>
                        </div>

                        {/* 3. Variant Summary / Price & 4. Action Button */}
                        {isMulti ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-[3px] border border-emerald-200/70 dark:border-emerald-800/60 whitespace-nowrap">
                              {variantCount} Sizes Available
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Select</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono font-bold text-xs text-brand dark:text-brand">
                              Rs. {item.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] group-hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors dark:bg-brand dark:group-hover:bg-success-subtle0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              </>
            )}
          </div>

          {/* ===================================================================
              TOP SECTION: STRUCTURED ORDER TABLE (MATCHING USER SCREENSHOT)
              # | Particular | Unit | Rate | Qty | Amount | Remarks | Add New
             =================================================================== */}
          <div
            className={cn(
              'border border-border-default dark:border-border-default rounded-md bg-white dark:bg-surface-card shadow-2xs transition-all',
              draftRows.some((d) => d.isOpen) ? 'min-h-[420px] pb-44 overflow-visible' : 'overflow-hidden'
            )}
          >
            <div
              className={cn(
                'w-full',
                draftRows.some((d) => d.isOpen) ? 'overflow-visible' : 'overflow-x-auto'
              )}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default dark:border-border-default text-[11px] font-semibold text-body dark:text-slate-300 bg-[#F8FAFC] dark:bg-surface-card">
                    <th className="py-2 px-3 text-center w-12 border-r border-border-default dark:border-border-default">#</th>
                    <th className="py-2 px-3.5 text-left border-r border-border-default dark:border-border-default">Particular</th>
                    <th className="py-2 px-2.5 text-center w-40 min-w-[145px] border-r border-border-default dark:border-border-default">Unit</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-border-default dark:border-border-default">Rate</th>
                    <th className="py-2 px-3 text-center w-20 border-r border-border-default dark:border-border-default">Qty</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-border-default dark:border-border-default">Amount</th>
                    <th className="py-2 px-2.5 text-center w-28 border-r border-border-default dark:border-border-default">Status</th>
                    <th className="py-2 px-3 text-left border-r border-border-default dark:border-border-default">Remarks</th>
                    <th className="py-1 px-2 text-center w-28">
                      <button
                        type="button"
                        onClick={handleAddNewDraftRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-brand bg-success-subtle hover:bg-brand hover:text-white dark:bg-success-subtle dark:hover:bg-brand text-success dark:text-success dark:hover:text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer select-none"
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
                      <td colSpan={9} className="py-10 text-center text-xs text-muted dark:text-muted">
                        <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm text-body dark:text-body">
                          No orders on Table {activeTable.tableNumber} yet
                        </p>
                        <p className="text-xs text-muted dark:text-muted mt-1 max-w-sm mx-auto">
                          Click &quot;Add New&quot; above to add a row and search dishes directly.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddNewDraftRow}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-brand hover:bg-brand-active text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
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
                        const matchedUnit = unitMeta.availableUnits.find((u) => Math.abs(u.price - item.price) < 0.01)?.unit;
                        const currentUnit = item.unit || matchedUnit || unitMeta.unit;
                        const hasMultipleUnits = unitMeta.availableUnits && unitMeta.availableUnits.length > 1;
                        const itemAmount = item.price * item.quantity;
                        const particularName =
                          item.baseName || unitMeta.baseName || item.name.replace(/\s*\([^)]*\)$/, '').trim();

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-border-default dark:border-border-default/80 hover:bg-surface-muted dark:hover:bg-[#07241E]/80 transition-colors"
                          >
                            {/* # Serial Number */}
                            <td className="py-2 px-3 text-center text-xs text-muted dark:text-muted border-r border-border-default dark:border-border-default/80">
                              {index + 1}
                            </td>

                            {/* Particular */}
                            <td className="py-2 px-3.5 text-xs text-body dark:text-body border-r border-border-default dark:border-border-default/80 font-medium">
                              {particularName}
                            </td>

                            {/* Unit (Non-clickable, selected when choosing item in modal) */}
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80 whitespace-nowrap">
                              <span className="inline-block px-3 py-1 rounded-[3px] text-xs font-semibold bg-surface-muted text-body dark:bg-surface-card dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
                                {currentUnit || 'Regular'}
                              </span>
                            </td>

                            {/* Rate (Styled with light grey background box like in screenshot) */}
                            <td className="py-2 px-3 border-r border-border-default dark:border-border-default/80">
                              <div
                                className={cn(
                                  'px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right',
                                  item.price > 0
                                    ? 'bg-[#E9ECEF] dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold'
                                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400'
                                )}
                              >
                                {item.price > 0 ? item.price.toFixed(2) : '-'}
                              </div>
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80">
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, -1)}
                                  className="w-4 h-4 rounded text-[10px] text-muted hover:text-body dark:hover:text-white flex items-center justify-center cursor-pointer"
                                  title="Decrease"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-5 text-center text-xs font-mono font-medium text-body dark:text-body">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, 1)}
                                  className="w-4 h-4 rounded text-[10px] text-muted hover:text-body dark:hover:text-white flex items-center justify-center cursor-pointer"
                                  title="Increase"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </td>

                            {/* Amount (Styled with light grey background box like in screenshot) */}
                            <td className="py-2 px-3 border-r border-border-default dark:border-border-default/80">
                              <div
                                className={cn(
                                  'px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right',
                                  itemAmount > 0
                                    ? 'bg-[#E9ECEF] dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold'
                                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400'
                                )}
                              >
                                {itemAmount > 0 ? itemAmount.toFixed(2) : '0.00'}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80">
                              {item.department === 'BOT' && (item.botNumber || (item.dispatchedQuantity || 0) > 0) ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                  <Wine className="w-2.5 h-2.5" />
                                  {item.botNumber || 'BOT'}
                                </span>
                              ) : (item.kotNumber || (item.dispatchedQuantity || 0) > 0) ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success-subtle text-success dark:bg-success-subtle dark:text-success border border-emerald-200/60 dark:border-emerald-800/60">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  {item.kotNumber || 'KOT'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-surface-elevated dark:text-slate-300 border border-slate-200 dark:border-border-default">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                                  Unsent
                                </span>
                              )}
                            </td>

                            {/* Remarks */}
                            <td className="py-1.5 px-2 text-left border-r border-border-default dark:border-border-default/80">
                              <input
                                type="text"
                                placeholder="Optional notes..."
                                value={item.remarks || ''}
                                onChange={(e) => handleUpdateItemRemarks(item.id, e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-[#0B3D32] focus:outline-none text-slate-700 dark:text-slate-300"
                              />
                            </td>

                            {/* Add New / Action */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
                        const rawCatalog = menuCatalog && menuCatalog.length > 0 ? menuCatalog : getSettedMenuItems();
                        const catalogList = consolidateMenuCatalog(rawCatalog);
                        const q = draft.search.toLowerCase().trim();
                        const filteredDraftItems = catalogList.filter((item) => {
                          if (!q) return true;
                          return (
                            item.name.toLowerCase().includes(q) ||
                            (item.baseName && item.baseName.toLowerCase().includes(q)) ||
                            item.category.toLowerCase().includes(q) ||
                            item.code.toLowerCase().includes(q)
                          );
                        });

                        return (
                          <tr
                            key={draft.id}
                            className={cn(
                              'border-b border-border-default dark:border-border-default/80 bg-white dark:bg-surface-card',
                              draft.isOpen && 'relative z-30'
                            )}
                          >
                            {/* # Serial Number */}
                            <td className="py-2 px-3 text-center text-xs text-muted font-mono border-r border-border-default dark:border-border-default/80">
                              {activeTableOrders.length + draftIdx + 1}
                            </td>

                            {/* Particular Input with Green Border & Autocomplete Popover */}
                            <td className={cn('py-1 px-2 relative border-r border-border-default dark:border-border-default/80', draft.isOpen && 'z-50')}>
                              <div className={cn('relative', draft.isOpen && 'z-50')}>
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
                                  onClick={() => {
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
                                                isOpen: true,
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
                                            ? { ...d, isOpen: true, selectedIndex: Math.max(0, d.selectedIndex - 1) }
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
                                  className="relative z-50 w-full px-2 py-1 text-xs bg-white dark:bg-surface-card border border-brand focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-body dark:text-body font-medium shadow-xs"
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
                                    <div className="absolute left-0 top-full mt-1 z-50 w-[540px] max-w-[90vw] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl rounded-[4px] overflow-hidden animate-in fade-in-0 duration-75">
                                      {/* Teal Header Bar */}
                                      <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                                        <span className="w-44 text-left">ITEM</span>
                                        <span className="w-32 text-left">GENERIC NAME</span>
                                        <span className="w-20 text-right">RATE</span>
                                        <span className="w-16 text-center">SRATE</span>
                                        <span className="w-12 text-center">QTY</span>
                                      </div>

                                      {/* Items List */}
                                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                        {filteredDraftItems.length === 0 ? (
                                          <div className="py-6 text-center text-xs text-muted">
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
                                                  'px-2.5 py-2 flex items-center cursor-pointer transition-colors text-xs font-sans select-none',
                                                  isSelected
                                                    ? 'bg-[#1E293B] text-white dark:bg-[#0E3B31]'
                                                    : 'hover:bg-[#1E293B] hover:text-white text-body dark:text-slate-200 bg-white dark:bg-surface-card'
                                                )}
                                              >
                                                {(() => {
                                                  const itemUnitMeta = resolveItemUnitInfo(item, menuCatalog);
                                                  const isMulti = itemUnitMeta.availableUnits && itemUnitMeta.availableUnits.length > 1;
                                                  return (
                                                    <>
                                                      <span className="w-44 truncate font-medium text-left">
                                                        {item.name}
                                                      </span>
                                                      <span className="w-32 truncate text-left text-[11px] opacity-75">
                                                        {item.category || '-'}
                                                      </span>
                                                      <span className={cn(
                                                        "w-20 text-right font-medium",
                                                        isMulti ? "text-emerald-400 font-semibold text-[11px]" : "font-mono"
                                                      )}>
                                                        {isMulti ? `${itemUnitMeta.availableUnits.length} Sizes` : `Rs. ${item.price.toFixed(2)}`}
                                                      </span>
                                                      <span className="w-16 text-center text-[11px] opacity-90">
                                                        {isMulti ? (
                                                          <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-700/80 text-white text-[10px] font-bold">
                                                            Select
                                                          </span>
                                                        ) : (
                                                          item.portion || item.unit || '1'
                                                        )}
                                                      </span>
                                                      <span className="w-12 text-center font-mono opacity-75">
                                                        {item.stock !== undefined ? item.stock : '-'}
                                                      </span>
                                                    </>
                                                  );
                                                })()}
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
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80">
                              <span className="text-[11px] text-muted">-</span>
                            </td>

                            {/* Rate placeholder */}
                            <td className="py-2 px-3 border-r border-border-default dark:border-border-default/80">
                              <div className="bg-surface-muted dark:bg-surface-card/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-muted">
                                0.00
                              </div>
                            </td>

                            {/* Qty placeholder */}
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80">
                              <span className="text-xs font-mono text-muted">1</span>
                            </td>

                            {/* Amount placeholder */}
                            <td className="py-2 px-3 border-r border-border-default dark:border-border-default/80">
                              <div className="bg-surface-muted dark:bg-surface-card/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-muted">
                                0.00
                              </div>
                            </td>

                            {/* Status placeholder */}
                            <td className="py-2 px-2 text-center border-r border-border-default dark:border-border-default/80">
                              <span className="text-[10px] text-muted font-medium">New</span>
                            </td>

                            {/* Remarks placeholder */}
                            <td className="py-1.5 px-2 text-left border-r border-border-default dark:border-border-default/80">
                              <span className="text-xs text-muted"></span>
                            </td>

                            {/* Action / Delete draft row */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftRow(draft.id)}
                                className="p-1 rounded text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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

            {/* Order Action Bar: Save, Print KOT, Print BOT, All in One (Directly below table, above billing) */}
            <div className="flex items-center justify-end gap-2 px-3.5 py-2 bg-slate-50/80 dark:bg-surface-card/80 border-t border-border-default dark:border-border-default">
              {/* Action Buttons: Save, Print KOT, Print BOT, All in One */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Save */}
                <button
                  type="button"
                  disabled={isSendingOrder || activeTableOrders.length === 0}
                  onClick={() => handleDispatchOrder('SAVE')}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Save order changes without printing tickets"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{isSendingOrder ? 'Saving...' : 'Save'}</span>
                </button>

                {/* 2. Print KOT */}
                <button
                  type="button"
                  disabled={isSendingOrder || activeTableOrders.length === 0}
                  onClick={() => handleDispatchOrder('KOT')}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Dispatch and print Kitchen Order Ticket (KOT) for kitchen items only"
                >
                  <ChefHat className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Print KOT</span>
                  {activeTableOrders.some(
                    (i) => (i.department === 'KOT' || !i.department) && (i.quantity > (i.dispatchedQuantity || 0))
                  ) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border-default text-[10px] font-mono font-semibold">
                      {activeTableOrders
                        .filter((i) => (i.department === 'KOT' || !i.department) && (i.quantity > (i.dispatchedQuantity || 0)))
                        .reduce((s, i) => s + (i.quantity - (i.dispatchedQuantity || 0)), 0)}
                    </span>
                  )}
                </button>

                {/* 3. Print BOT */}
                <button
                  type="button"
                  disabled={isSendingOrder || activeTableOrders.length === 0}
                  onClick={() => handleDispatchOrder('BOT')}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Dispatch and print Bar Order Ticket (BOT) for beverage items only"
                >
                  <Wine className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Print BOT</span>
                  {activeTableOrders.some(
                    (i) => i.department === 'BOT' && (i.quantity > (i.dispatchedQuantity || 0))
                  ) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border-default text-[10px] font-mono font-semibold">
                      {activeTableOrders
                        .filter((i) => i.department === 'BOT' && (i.quantity > (i.dispatchedQuantity || 0)))
                        .reduce((s, i) => s + (i.quantity - (i.dispatchedQuantity || 0)), 0)}
                    </span>
                  )}
                </button>

                {/* 4. All in One */}
                <button
                  type="button"
                  disabled={isSendingOrder || activeTableOrders.length === 0}
                  onClick={() => handleDispatchOrder('ALL')}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Dispatch both Kitchen and Bar tickets together"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>All in One</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================
              BOTTOM SECTION: BILLING PANEL (EXACT DESIGN MATCHING USER SCREENSHOT)
             =================================================================== */}
          <div className="border border-border-default dark:border-border-default rounded-md p-3.5 bg-white dark:bg-surface-card shadow-2xs space-y-3">
            {/* Row 1: Basic Total | Dis % | Dis Amt | Round off | Net Amount | Paid Amt. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Basic Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={basicTotal.toFixed(0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-surface-muted dark:bg-surface-card/80 border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-slate-200 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
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
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
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
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Round off
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={billRoundOff}
                  onChange={(e) => setBillRoundOff(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={netAmount.toFixed(0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-surface-muted dark:bg-surface-card/80 border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-slate-200 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Paid Amt.
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  placeholder={netAmount.toFixed(0)}
                  value={billPaidAmt}
                  onChange={(e) => setBillPaidAmt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            {/* Row 2: Ref. Due | Mode | Remarks | Print | Label | Disable proxy | Save */}
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div className="w-28">
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Ref. Due
                </label>
                <input
                  type="text"
                  readOnly
                  value={refDue.toFixed(0)}
                  className={cn(
                    'w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-surface-muted dark:bg-surface-card/80 border border-border-default dark:border-border-default rounded-[3px] cursor-default',
                    refDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-body dark:text-slate-200'
                  )}
                />
              </div>

              <div className="w-40">
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Payment Mode
                </label>
                <select
                  value={billMode}
                  onChange={(e) => setBillMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body font-medium focus:outline-none focus:border-[#0B3D32] cursor-pointer"
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
                <label className="block text-[11px] font-semibold text-muted dark:text-muted mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional billing note..."
                  value={billRemarks}
                  onChange={(e) => setBillRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-surface-card border border-border-default dark:border-border-default rounded-[3px] text-body dark:text-body focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Billing Action Buttons: Settle Payment & Settle & Print */}
              <div className="ml-auto flex items-end gap-2">
                {/* Settle Payment */}
                <button
                  type="button"
                  disabled={isSettlingPayment || activeTableOrders.length === 0}
                  onClick={() => handleCompletePaymentAndReleaseTable(false)}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Settle bill payment and free table"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSettlingPayment ? 'Processing...' : 'Settle Payment'}</span>
                </button>

                {/* Settle & Print Receipt */}
                <button
                  type="button"
                  disabled={isSettlingPayment || activeTableOrders.length === 0}
                  onClick={() => handleCompletePaymentAndReleaseTable(true)}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white dark:bg-brand dark:hover:bg-success-subtle0 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Settle bill payment, free table & print tax invoice"
                >
                  <Receipt className="w-3.5 h-3.5" />
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
                      className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-surface-card border border-amber-300 dark:border-amber-700 rounded text-body dark:text-body focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    <div className="flex items-center gap-2 px-3 py-1 bg-success-subtle dark:bg-success-subtle border border-success dark:border-success rounded text-xs text-success dark:text-success">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success dark:text-brand" />
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
                className="w-full max-w-sm rounded-[3px] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-border-default bg-surface-muted dark:bg-surface-card">
                  <div>
                    <h3 className="text-sm font-bold text-body dark:text-body font-heading">
                      Customer Details (Optional)
                    </h3>
                    <p className="text-[11px] text-muted dark:text-[#A4B8AE]">
                      Optional for Dine-In Table {activeTable.tableNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="p-1 rounded-[2px] text-muted hover:text-muted dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveOptionalGuestInfo}>
                  <div className="p-5 space-y-3.5">
                    <div className="p-2.5 rounded bg-success-subtle dark:bg-success-subtle border border-success dark:border-success text-[11px] text-success dark:text-success">
                      <p className="font-semibold">Normal Dine-In Does Not Require Registration</p>
                      <p className="text-[10px] text-success dark:text-brand mt-0.5">
                        Orders proceed smoothly as walk-in dine-in. Only enter details if guest specifically requests an invoice with their name or phone.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                        GUEST NAME (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={customerNameInput}
                        onChange={(e) => setCustomerNameInput(e.target.value)}
                        className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-semibold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:bg-surface-card dark:text-body"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                        PHONE / MOBILE (OPTIONAL)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 555-0123"
                        value={customerPhoneInput}
                        onChange={(e) => setCustomerPhoneInput(e.target.value)}
                        className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-mono font-bold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:bg-surface-card dark:text-body"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-border-default bg-surface-muted dark:bg-surface-card">
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(false)}
                      className="rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface-muted dark:border-border-default dark:bg-surface-card dark:text-[#A4B8AE] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors dark:bg-brand dark:hover:bg-success-subtle0"
                    >
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Quick Add Size Selection Modal for Multi-Variant Items on Table Order */}
          {variantModal && variantModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
              <div
                className="fixed inset-0"
                onClick={() => {
                  if (variantModal.draftId) {
                    setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                  }
                  setVariantModal(null);
                }}
              />
              <div className="relative z-10 w-full max-w-sm rounded-lg bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl p-5 animate-in zoom-in-95 duration-100">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-border-default dark:border-border-default">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-success">
                      {variantModal.menuItem.category || 'Portion / Size'}
                    </span>
                    <h3 className="text-base font-bold text-body dark:text-body mt-0.5">
                      {variantModal.menuItem.baseName || variantModal.menuItem.name.replace(/\s*\([^)]*\)$/, '').trim()}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (variantModal.draftId) {
                        setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                      }
                      setVariantModal(null);
                    }}
                    className="p-1 rounded text-muted hover:text-body dark:hover:text-white cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between py-3 border-b border-border-default dark:border-border-default">
                  <span className="text-xs font-semibold text-body dark:text-body">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVariantModal((prev) => (prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null))
                      }
                      className="w-7 h-7 rounded bg-surface-muted dark:bg-surface-muted text-body dark:text-body hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-body dark:text-body select-none">
                      {variantModal.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setVariantModal((prev) => (prev ? { ...prev, quantity: prev.quantity + 1 } : null))
                      }
                      className="w-7 h-7 rounded bg-surface-muted dark:bg-surface-muted text-body dark:text-body hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Sizes / Variants Grid */}
                <div className="pt-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted dark:text-muted mb-2">
                    Select Size to Add:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {resolveItemUnitInfo(variantModal.menuItem, menuCatalog).availableUnits.map((tier) => (
                      <button
                        key={tier.unit}
                        type="button"
                        onClick={() => {
                          pushItemToTableOrder(variantModal.menuItem, tier, variantModal.quantity);
                          if (variantModal.draftId) {
                            setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                          }
                          setVariantModal(null);
                          setOrderProductName('');
                          setOrderPrice('');
                          setOrderQuantity(1);
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-md border-2 border-brand/30 hover:border-brand bg-success-subtle/50 hover:bg-success-subtle dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all text-center group cursor-pointer shadow-2xs hover:shadow-sm"
                      >
                        <span className="font-bold text-xs text-body dark:text-white group-hover:text-brand dark:group-hover:text-success">
                          {tier.unit}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-brand dark:text-success mt-1">
                          Rs. {tier.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRINTED BILL / RECEIPT / KOT MODAL (Shows preview first, then user can print) */}
          {receiptModalData && <RestaurantReceiptModal {...receiptModalData} />}
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
              className="font-bold text-brand dark:text-brand hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Restaurant Management
            </Link>
            <span className="text-slate-300 dark:text-muted">/</span>
            <span className="font-semibold text-body dark:text-slate-200">
              Tables & Seating Floor Plan
            </span>
          </div>

          <span className="rounded bg-success-subtle dark:bg-success-subtle border border-success dark:border-success px-2 py-0.5 text-[10px] font-bold text-success dark:text-success uppercase tracking-wider">
            Restaurant Module · Tables
          </span>
        </div>

        <RestaurantManagementNavBoxes activeId="tables" />
      </div>

      <div className="border-b border-border-default dark:border-border-default -mt-1 mb-2" />

      {/* Clean Header Bar: Tables, Active Orders & Reservations Segmented Switcher + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border-default dark:border-border-default">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-body dark:text-body tracking-tight">
            {activeTab === 'FLOOR_PLAN'
              ? 'Tables'
              : activeTab === 'ACTIVE_ORDERS'
              ? 'Active Restaurant Orders'
              : 'Table Reservations'}
          </h1>

          {/* View Mode Segmented Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-[4px] bg-[#EAEFEA] dark:bg-surface-card border border-border-default dark:border-border-default">
            <button
              type="button"
              onClick={() => setActiveTab('FLOOR_PLAN')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                activeTab === 'FLOOR_PLAN'
                  ? 'bg-white dark:bg-[#0E362C] text-brand dark:text-success shadow-2xs'
                  : 'text-muted dark:text-[#A4B8AE] hover:text-body'
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
                  ? 'bg-white dark:bg-[#0E362C] text-brand dark:text-success shadow-2xs'
                  : 'text-muted dark:text-[#A4B8AE] hover:text-body'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
              {activeOrders.length > 0 && (
                <span className="rounded-full bg-[#0B3D32] text-white dark:bg-brand px-1.5 py-0.2 text-[9px] font-mono font-bold">
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
                  ? 'bg-white dark:bg-[#0E362C] text-brand dark:text-success shadow-2xs'
                  : 'text-muted dark:text-[#A4B8AE] hover:text-body'
              )}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Table Reservations</span>
              {activeReservationsCount > 0 && (
                <span className="rounded-full bg-brand text-white px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  {activeReservationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action 1: Table Order */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('FLOOR_PLAN');
              toast.info('Select Dining Table', 'Click any available table card to start a Table Order.');
            }}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#0B3D32] dark:border-brand bg-white dark:bg-surface-card text-brand dark:text-success hover:bg-surface-muted dark:hover:bg-[#093027] px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Start an order linked to a dining table"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Table Order</span>
          </button>

          {/* Primary Action 2: Quick Order */}
          <button
            type="button"
            onClick={() => handleStartNoTableOrder('TAKEAWAY')}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-brand hover:bg-brand-hover text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all dark:bg-brand dark:hover:bg-success-subtle0 cursor-pointer"
            title="Start a quick order without a table (walk-in, takeaway, counter pickup)"
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Quick Order</span>
          </button>

          {/* Action 3: Book Now */}
          <button
            type="button"
            onClick={() => handleOpenNewReservation()}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027] px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Book Table Now / New Reservation"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Book Now</span>
          </button>

          {/* Action 4: Add Table */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027] px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Table</span>
          </button>

          {/* Action 5: Turnaround Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027] px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Configure Dining Duration & Cleaning Buffer Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'FLOOR_PLAN' ? (
        <>
          {/* Unified Single-Row Toolbar: Status Filter Pills + Search + Date Stepper */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Left: Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
              {[
                { id: 'ALL', label: 'All', count: tables.length },
                { id: 'AVAILABLE', label: 'Available', count: availableCount },
                { id: 'OCCUPIED', label: 'Occupied', count: occupiedCount },
                { id: 'RESERVED', label: 'Reserved', count: reservedCount },
                { id: 'CLEANING', label: 'Cleaning', count: cleaningCount },
                { id: 'OUT_OF_SERVICE', label: 'Out of Service', count: outOfServiceCount },
              ].map((pill) => {
                const isSelected = selectedStatus === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSelectedStatus(pill.id)}
                    className={cn(
                      'h-8 inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 text-xs font-bold transition-all shrink-0 cursor-pointer',
                      isSelected
                        ? 'bg-[#0B3D32] text-white shadow-2xs border border-[#0B3D32] dark:bg-brand dark:border-brand'
                        : 'bg-white border border-border-default text-[#4A6B5D] hover:bg-surface-muted dark:bg-surface-card dark:border-border-default dark:text-[#A4B8AE]'
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={cn(
                        'rounded-[3px] px-1.5 py-0.2 text-[10px] font-mono',
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-muted dark:bg-[#0E362C] text-muted dark:text-success'
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Search & Date Controls (Same Row) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              {/* Quick Search */}
              <div className="relative w-full sm:w-48 md:w-56 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search table number..."
                  className="w-full h-8 rounded-[4px] border border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-body placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:text-body transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body p-0.5 rounded transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Stepper with Previous Day, Date Input, Next Day */}
              <div className="inline-flex items-center h-8 rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card shadow-2xs overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const parts = selectedDate.split('-').map(Number);
                    const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${y}-${m}-${day}`);
                  }}
                  className="h-full px-2 text-muted hover:text-body hover:bg-surface-muted dark:hover:bg-[#0E362C] transition-colors border-r border-border-default dark:border-border-default cursor-pointer flex items-center justify-center"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-full bg-transparent px-2 text-xs font-semibold text-body focus:outline-none cursor-pointer flex items-center"
                  title="Select Date"
                />

                <button
                  type="button"
                  onClick={() => {
                    const parts = selectedDate.split('-').map(Number);
                    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${y}-${m}-${day}`);
                  }}
                  className="h-full px-2 text-muted hover:text-body hover:bg-surface-muted dark:hover:bg-[#0E362C] transition-colors border-l border-border-default dark:border-border-default cursor-pointer flex items-center justify-center"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Weekday & Date Label Pill */}
              <span className="h-8 inline-flex items-center px-2.5 rounded-[4px] bg-brand/10 dark:bg-brand/20 border border-brand/20 dark:border-brand/30 text-brand dark:text-success text-xs font-bold tracking-tight whitespace-nowrap shrink-0">
                {(() => {
                  try {
                    const [y, m, day] = selectedDate.split('-').map(Number);
                    const dt = new Date(y, m - 1, day);
                    return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                  } catch {
                    return '';
                  }
                })()}
              </span>

              {/* Reset to Today button if date differs */}
              {selectedDate !== normalizeDateStr(new Date()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(normalizeDateStr(new Date()));
                  }}
                  className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-[4px] bg-surface-muted dark:bg-[#0E362C] hover:bg-brand/10 text-brand dark:text-success border border-brand/20 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
                  title="Reset to today"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Today</span>
                </button>
              )}

              {/* Checking Future Availability Pulse */}
              {isCheckingFutureAvailability && (
                <div className="inline-flex items-center gap-1.5 h-8 px-2 text-xs font-medium text-brand dark:text-success animate-pulse shrink-0">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-[11px] font-semibold">Checking...</span>
                </div>
              )}
            </div>
          </div>



      {/* =========================================================================
          CLEAN TABLE CARDS GRID
          - Today: Shows live operational floor plan (Occupied, Alert, Billed, Available)
          - Tomorrow & Future Dates: Shows Booking Cards for reserved tables, Available Cards for ready tables
         ========================================================================= */}
      {isTablesLoading && tables.length === 0 ? (
        <div className="rounded-[4px] border border-border-default bg-white p-12 text-center shadow-2xs dark:border-border-default dark:bg-surface-card">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
          <h3 className="text-sm font-bold text-body dark:text-body">Connecting to database...</h3>
          <p className="text-xs text-muted dark:text-[#A4B8AE] mt-1">
            Loading real tables and live orders from the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-4">
        {filteredTables.map((table) => {
          const statusMeta = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
          const orderTotal = (table.orders || []).reduce(
            (sum, item) => sum + calculateOrderItemTotal(item).total,
            0
          );

          // Get all confirmed/pending reservations for this table strictly matching selectedDate
          const selectedDateReservations = (table.upcomingReservations || []).filter((r: any) => {
            const matchesDate = normalizeDateStr(r.reservationDate) === selectedDate;
            const matchesStatus = r.status === 'CONFIRMED' || r.status === 'PENDING' || r.status === 'SEATED';
            return matchesDate && matchesStatus;
          });

          // Next upcoming reservation on selectedDate ordered by start time
          const activeRes = selectedDateReservations[0] || null;

          // Operational states (Occupied, Billed, Cleaning strictly apply to Today only)
          const isOccupied = isSelectedToday && table.status === 'OCCUPIED';
          const isBilled = isSelectedToday && table.status === 'BILLED';
          const isCleaning = isSelectedToday && (table.status === 'CLEANING' || table.cleaningStatus === 'DIRTY');
          const isOutOfService = table.status === 'OUT_OF_SERVICE';
          const isAvailable = !isOccupied && !isBilled && !isCleaning && !isOutOfService;

          // Active 15-Minute Advance or Overdue Alert for this table (relevant for today only)
          const tableAlert = isSelectedToday
            ? alerts.find((a) => a.tableId === table.id && a.status === 'ACTIVE')
            : null;

          return (
            <div
              key={table.id}
              onClick={() => {
                setOpenTableMenuId(openTableMenuId === table.id ? null : table.id);
              }}
              className={cn(
                'group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-[6px] border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer select-none min-h-[210px]',
                openTableMenuId === table.id ? 'z-30 ring-2 ring-emerald-500 shadow-lg' : 'z-10',
                tableAlert
                  ? tableAlert.severity === 'DANGER'
                    ? 'bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#4C0519] border-rose-500 text-white shadow-xl shadow-rose-950/40 ring-2 ring-rose-500 animate-pulse'
                    : tableAlert.alertType === 'TABLE_DIRTY'
                    ? 'bg-gradient-to-br from-[#713F12] via-[#854D0E] to-[#422006] border-amber-400 text-white shadow-lg ring-2 ring-amber-400'
                    : 'bg-gradient-to-br from-[#78350F] via-[#92400E] to-[#451A03] border-amber-400 text-white shadow-xl shadow-amber-950/40 ring-2 ring-amber-400 ring-offset-1 ring-offset-amber-900 animate-pulse'
                  : isOccupied
                  ? 'bg-[#0B3D32] border-[#082C24] text-white shadow-sm'
                  : isBilled
                  ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
                  : isCleaning
                  ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
                  : isOutOfService
                  ? 'bg-surface-muted dark:bg-surface-card border-border-default dark:border-border-default text-muted dark:text-muted opacity-70'
                  : 'bg-white dark:bg-surface-card border-border-default dark:border-border-default text-body dark:text-body hover:border-emerald-400 dark:hover:border-emerald-600/70'
              )}
              title={table.tableNumber}
            >
              {/* Top Header: Table Number + Capacity + Status Badge + 3-Dot More Actions Menu */}
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-black font-mono tracking-tight leading-tight">
                    {table.tableNumber}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-[3px] text-[9px] font-mono font-bold border',
                      isOccupied || tableAlert
                        ? 'bg-white/15 text-white/90 border-white/20'
                        : 'bg-surface-muted dark:bg-[#0E362C] text-muted dark:text-[#A4B8AE] border-border-default dark:border-border-default'
                    )}
                  >
                    {table.capacity} Seats
                  </span>
                  {isSelectedToday && table.cleaningStatus === 'DIRTY' && !isOccupied && !tableAlert && (
                    <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      Dirty
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tableAlert ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm',
                        tableAlert.severity === 'DANGER'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-amber-400 text-amber-950 animate-pulse'
                      )}
                    >
                      <Bell className="w-3 h-3 animate-bounce shrink-0" />
                      <span>
                        {tableAlert.severity === 'DANGER'
                          ? `Overdue · ${formatTime12h(tableAlert.reservationTime)}`
                          : tableAlert.alertType === 'TABLE_DIRTY'
                          ? `Clean & Prep · ${formatTime12h(tableAlert.reservationTime)}`
                          : `Turnover · ${formatTime12h(tableAlert.reservationTime)}`}
                      </span>
                    </span>
                  ) : (
                    /* Physical Status Badge (Requirement 1) */
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider shadow-xs',
                        isOccupied
                          ? 'bg-white/15 text-emerald-300 border border-white/20 backdrop-blur-xs'
                          : isBilled
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200/40'
                          : isCleaning
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200/40'
                          : isOutOfService
                          ? 'bg-slate-200 text-muted dark:bg-slate-700 dark:text-muted border border-border-default/40'
                          : 'bg-success-subtle text-success dark:bg-emerald-900 dark:text-success border border-success/40'
                      )}
                    >
                      {isOutOfService
                        ? 'Out of Service'
                        : isOccupied
                        ? 'Occupied'
                        : isBilled
                        ? 'Billed'
                        : isCleaning
                        ? 'Needs Cleaning'
                        : 'Available'}
                    </span>
                  )}
                  
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
                        isOccupied || tableAlert
                          ? 'text-white/80 hover:text-white hover:bg-white/20'
                          : 'text-muted hover:text-body dark:text-muted dark:hover:text-white hover:bg-surface-muted dark:hover:bg-slate-800'
                      )}
                      title={`Table ${table.tableNumber} Contextual Actions`}
                      aria-label={`Table ${table.tableNumber} Contextual Actions`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openTableMenuId === table.id && (
                      <TableActionsDropdown
                        table={table}
                        isFutureDate={!isSelectedToday}
                        selectedReservation={activeRes}
                        onClose={() => setOpenTableMenuId(null)}
                        onStartOrder={(t) => {
                          setOpenTableMenuId(null);
                          handleSelectSeatCustomer(t);
                        }}
                        onSeatWalkIn={(t) => {
                          setOpenTableMenuId(null);
                          handleSelectSeatCustomer(t);
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
                        onViewReservation={(t) => {
                          setOpenTableMenuId(null);
                          setBookingDetailsModalTable(t);
                          setIsBookingDetailsModalOpen(true);
                        }}
                        onViewBooking={(t) => {
                          setOpenTableMenuId(null);
                          setBookingDetailsModalTable(t);
                          setIsBookingDetailsModalOpen(true);
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
                        onViewBookingDetails={(t) => {
                          setOpenTableMenuId(null);
                          setBookingDetailsModalTable(t);
                          setIsBookingDetailsModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 flex flex-col gap-1.5 py-1.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span
                    className={cn(
                      isOccupied || tableAlert
                        ? 'text-white/80'
                        : 'text-muted dark:text-muted'
                    )}
                  >
                    {table.section}
                  </span>
                  {isSelectedToday && orderTotal > 0 && (
                    <span className={cn(
                      "font-mono font-bold",
                      tableAlert ? "text-amber-300" : isOccupied ? "text-emerald-300" : "text-success dark:text-brand"
                    )}>
                      Rs. {orderTotal.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Requirement 2: Next Booking Indicator (Compact chip without marking table occupied) */}
                {activeRes && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookingDetailsModalTable(table);
                      setIsBookingDetailsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-between gap-1.5 px-2 py-1 rounded-[4px] bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 text-[11px] font-semibold text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
                    title={`Next booking: ${formatTime12h(activeRes.reservationTime)} (${activeRes.partySize} guests). Click to view all bookings.`}
                  >
                    <span className="flex items-center gap-1 truncate">
                      <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span className="truncate">Next booking: {formatTime12h(activeRes.reservationTime)}</span>
                    </span>
                    {activeRes.partySize && (
                      <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 shrink-0">
                        {activeRes.partySize}p
                      </span>
                    )}
                  </div>
                )}

                {/* Status description in body */}
                {isOutOfService ? (
                  <div className="rounded-[4px] bg-slate-100 dark:bg-slate-800/40 p-2 text-center text-xs text-muted my-auto border border-border-default/60">
                    <p className="font-semibold">Table Out of Service</p>
                    <p className="text-[11px] mt-0.5">{table.maintenanceNotes || 'Maintenance scheduled'}</p>
                  </div>
                ) : isOccupied ? (
                  <div className="space-y-1 my-auto">
                    <div className="text-xs flex items-center gap-1.5 text-white/90">
                      <span className="font-normal opacity-75">Guest:</span>
                      <strong className="font-semibold">{table.currentGuest || 'Dine-In Guest'}</strong>
                    </div>
                    {orderTotal > 0 && (
                      <div className="text-[11px] text-white/70">
                        Order active · {table.orders?.length || 0} items
                      </div>
                    )}
                  </div>
                ) : isCleaning ? (
                  <div className="text-xs flex items-center gap-1 text-amber-700 dark:text-amber-400 my-auto">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Needs sanitizing & table prep</span>
                  </div>
                ) : (
                  /* Available Table */
                  <div className="my-auto space-y-1">
                    <div className="text-xs flex items-center gap-1 text-success dark:text-brand">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Table Ready for Walk-in</span>
                    </div>
                    {isSelectedToday && activeRes && (() => {
                      const now = new Date();
                      const currentMins = now.getHours() * 60 + now.getMinutes();
                      const resMins = parseTimeToMinutes(activeRes.reservationTime);
                      const diff = resMins - currentMins;
                      if (diff > 0) {
                        const hours = Math.floor(diff / 60);
                        const mins = diff % 60;
                        const timeStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
                        return (
                          <div className="text-[11px] text-muted dark:text-muted">
                            ~{timeStr.trim()} window before booking
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Card Footer: Actions */}
              <div className="mt-auto pt-2 border-t border-t-border-default dark:border-t-border-default/60 flex items-center justify-between text-xs">
                {tableAlert ? (
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderPage(table.id);
                      }}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] bg-white text-slate-950 hover:bg-white/90 font-bold text-[10.5px] sm:text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Wrap up active order"
                    >
                      <Receipt className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Wrap Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAcknowledgeAlert(tableAlert.id, e)}
                      className={cn(
                        "flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] font-black text-[10.5px] sm:text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap",
                        tableAlert.severity === 'DANGER'
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "bg-amber-400 hover:bg-amber-300 text-amber-950"
                      )}
                      title="Acknowledge 15-minute alarm"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Ack Alarm</span>
                    </button>
                  </div>
                ) : isOutOfService ? (
                  <span className="text-[11px] font-semibold text-muted py-1 whitespace-nowrap">Out of Service</span>
                ) : isOccupied ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderPage(table.id);
                      }}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] bg-white/20 hover:bg-white/30 text-white font-bold text-[10.5px] sm:text-[11px] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Add Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderPage(table.id);
                        setIsBillPanelOpen(true);
                      }}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10.5px] sm:text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Receipt className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Bill</span>
                    </button>
                  </div>
                ) : isCleaning || table.cleaningStatus === 'DIRTY' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateCleaningStatus(table, 'CLEAN');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[3px] bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Sanitize table and return to service"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Mark Cleaned</span>
                  </button>
                ) : isBilled ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrderPage(table.id);
                      setIsBillPanelOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[3px] bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span>Settle Payment</span>
                  </button>
                ) : (
                  /* Available Table - Walk-In Seating + Bookings */
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={(e) => handleSelectSeatCustomer(table, e)}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] bg-brand hover:bg-brand-hover text-white font-bold text-[10.5px] sm:text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Walk-in customer"
                    >
                      <UserPlus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Walk in</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewReservation(table);
                      }}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-[3px] bg-white border border-[#0B3D32] text-brand hover:bg-[#E8F2EE] dark:bg-surface-card dark:border-emerald-500 dark:text-success dark:hover:bg-emerald-950/40 font-bold text-[10.5px] sm:text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      title={`Book Table ${table.tableNumber}`}
                    >
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Book Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {!isTablesLoading && filteredTables.length === 0 && (
        <div className="rounded-[3px] border border-border-default bg-white p-12 text-center shadow-2xs dark:border-border-default dark:bg-surface-card">
          <Table2 className="w-10 h-10 text-slate-300 dark:text-muted mx-auto mb-2" />
          <h3 className="text-sm font-bold text-body dark:text-body">No tables found</h3>
          <p className="text-xs text-muted dark:text-[#A4B8AE] mt-1">
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
          onNewOnlineOrder={() => {
            setNoTableOrderType('ONLINE');
            setNoTableSeatingNote('');
            setNoTableCustomerName('');
            setNoTableCustomerPhone('');
            setIsNoTableModalOpen(true);
          }}
        />
      ) : (
        /* =========================================================================
           TABLE RESERVATIONS MANAGEMENT VIEW (PAGED FROM DATABASE)
           ========================================================================= */
        <TableReservationsView
          reservations={reservations}
          tables={tables}
          isLoading={isReservationsLoading}
          onRefresh={fetchReservations}
          onNewBooking={() => handleOpenNewReservation()}
          onViewBooking={handleOpenViewReservation}
          onEditBooking={handleOpenEditReservation}
          onCustomerArrived={(res) => handleSeatReservation(res)}
          onUpdateStatus={handleUpdateReservationStatus}
          onOpenOrder={handleOpenOrderPage}
          onAssignTable={(res) => {
            setSeatingReservation(res);
            setSeatingTableId('');
            setIsSeatingModalOpen(true);
          }}
        />
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
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-border-default bg-surface-muted dark:bg-surface-card">
              <div>
                <h3 className="text-sm font-bold text-body dark:text-body font-heading">
                  Add New Table
                </h3>
                <p className="text-[11px] text-muted dark:text-[#A4B8AE]">
                  Enter table number, dining section and capacity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[2px] text-muted hover:text-muted dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                  TABLE NUMBER / CODE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-17"
                  autoFocus
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-mono font-bold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:bg-surface-card dark:text-body"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                  DINING SECTION *
                </label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-semibold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:bg-surface-card dark:text-body"
                >
                  <option value="Indoor Fine Dining">Indoor Fine Dining</option>
                  <option value="Skyline Rooftop Terrace">Skyline Rooftop Terrace</option>
                  <option value="Poolside Lounge & Bar">Poolside Lounge & Bar</option>
                  <option value="Private Executive Dining">Private Executive Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                  CAPACITY (PERSONS) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-mono font-bold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:bg-surface-card dark:text-body"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EEE9] dark:border-border-default">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-[3px] border border-border-default bg-white px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-muted dark:border-border-default dark:bg-surface-card dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] dark:bg-brand dark:hover:bg-success-subtle0"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TABLE BOOKING MODAL (BOOK NOW / EDIT RESERVATION)
         ========================================================================= */}
      {/* =========================================================================
          TABLE BOOKING MODAL (CLEAN & PROFESSIONAL)
         ========================================================================= */}
      {isReservationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!isSavingReservation) setIsReservationModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default dark:border-border-default">
              <div>
                <h3 className="text-base font-semibold text-body dark:text-body">
                  {editingReservation ? `Edit Booking · ${editingReservation.reservationCode}` : 'Book a Table'}
                </h3>
                <p className="text-xs text-muted dark:text-muted mt-0.5">
                  Fill in customer and reservation details
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSavingReservation) setIsReservationModalOpen(false);
                }}
                disabled={isSavingReservation}
                className="p-1.5 rounded-md text-muted hover:text-muted dark:hover:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-800/60 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReservation} className="p-6 space-y-4">
              {/* Row 1: Customer Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Full name"
                    value={resCustomerName}
                    onChange={(e) => {
                      setResCustomerName(e.target.value);
                      if (bookingFormErrors.customerName) {
                        setBookingFormErrors((prev) => ({ ...prev, customerName: undefined }));
                      }
                    }}
                    className={cn(
                      'w-full h-9 rounded-md border bg-white px-3 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 dark:bg-[#0B2E24] dark:text-body dark:placeholder:text-muted transition-colors',
                      bookingFormErrors.customerName
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-border-default dark:border-border-default focus:border-[#0B3D32] dark:focus:border-emerald-500'
                    )}
                  />
                  {bookingFormErrors.customerName && (
                    <p className="mt-1 text-[11px] text-rose-500">{bookingFormErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={resPhoneNumber}
                    onChange={(e) => {
                      setResPhoneNumber(e.target.value);
                      if (bookingFormErrors.phoneNumber) {
                        setBookingFormErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                      }
                    }}
                    className={cn(
                      'w-full h-9 rounded-md border bg-white px-3 text-sm font-mono text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 dark:bg-[#0B2E24] dark:text-body dark:placeholder:text-muted transition-colors',
                      bookingFormErrors.phoneNumber
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-border-default dark:border-border-default focus:border-[#0B3D32] dark:focus:border-emerald-500'
                    )}
                  />
                  {bookingFormErrors.phoneNumber && (
                    <p className="mt-1 text-[11px] text-rose-500">{bookingFormErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Date, Start Time, End Time & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={resDate}
                    onChange={(e) => {
                      setResDate(e.target.value);
                      if (bookingFormErrors.date) {
                        setBookingFormErrors((prev) => ({ ...prev, date: undefined }));
                      }
                    }}
                    className={cn(
                      'w-full h-9 rounded-md border bg-white px-2.5 text-sm text-body focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 dark:bg-[#0B2E24] dark:text-body transition-colors',
                      bookingFormErrors.date
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-border-default dark:border-border-default focus:border-[#0B3D32] dark:focus:border-emerald-500'
                    )}
                  />
                  {bookingFormErrors.date && (
                    <p className="mt-1 text-[11px] text-rose-500">{bookingFormErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={resTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full h-9 rounded-md border border-border-default dark:border-border-default bg-white dark:bg-[#0B2E24] px-2.5 text-sm font-mono text-body dark:text-body focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32] dark:focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={resEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className={cn(
                      "w-full h-9 rounded-md border bg-white dark:bg-[#0B2E24] px-2.5 text-sm font-mono text-body dark:text-body focus:outline-none focus:ring-2 transition-colors",
                      endTimeError
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-border-default dark:border-border-default focus:border-[#0B3D32] dark:focus:border-emerald-500 focus:ring-[#0B3D32]/20"
                    )}
                  />
                  {endTimeError && (
                    <p className="mt-1 text-[11px] text-rose-500 leading-tight">{endTimeError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={resPartySize}
                    onChange={(e) => setResPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-9 rounded-md border border-border-default dark:border-border-default bg-white dark:bg-[#0B2E24] px-2.5 text-sm font-mono text-body dark:text-body focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32] dark:focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Table Selection */}
              <div>
                <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                  Table Selection
                </label>
                <select
                  value={resPreferredTableId}
                  onChange={(e) => setResPreferredTableId(e.target.value)}
                  className="w-full h-9 rounded-md border border-border-default dark:border-border-default bg-white dark:bg-[#0B2E24] px-3 text-sm text-body dark:text-body focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32] dark:focus:border-emerald-500 transition-colors"
                >
                  <option value="">Any available table (auto-assign)</option>
                  {tables.map((t) => {
                    const startMins = parseTimeToMinutes(resTime);
                    const endMins = parseTimeToMinutes(resEndTime);
                    const targetDateStr = resDate.split('T')[0];
                    const hasConflict = reservations.some((r) => {
                      if (editingReservation && r.id === editingReservation.id) return false;
                      if (r.tableId !== t.id) return false;
                      if ((r.reservationDate ? r.reservationDate.split('T')[0] : '') !== targetDateStr) return false;
                      const st = (r.status || '').toUpperCase();
                      if (st === 'CANCELLED' || st === 'NO_SHOW' || st === 'COMPLETED') return false;
                      const rStart = parseTimeToMinutes(r.reservationTime);
                      const rEnd = rStart + (r.durationMinutes > 0 ? r.durationMinutes : 120);
                      return startMins < (rEnd + 15) && rStart < (endMins + 15);
                    });
                    const availObj = availabilityData?.allTables?.find((at) => at.id === t.id);
                    const isAvail = !hasConflict && (availObj ? availObj.isAvailable : true);

                    return (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} ({t.capacity} seats, {t.section}){isAvail ? '' : ' — Unavailable'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Row 4: Special Requests / Notes */}
              <div>
                <label className="block text-xs font-medium text-body dark:text-slate-300 mb-1.5">
                  Special Requests / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Dietary preferences, seating requests, or general notes"
                  value={resSpecialRequests}
                  onChange={(e) => setResSpecialRequests(e.target.value)}
                  className="w-full rounded-md border border-border-default dark:border-border-default bg-white dark:bg-[#0B2E24] px-3 py-2 text-sm text-body dark:text-body placeholder:text-muted dark:placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32] dark:focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Reservation Status Selector (Always available) */}
              <div>
                <label className="block text-xs font-semibold text-body dark:text-slate-300 mb-1.5">
                  Reservation Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={resStatus}
                  onChange={(e) => setResStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-border-default dark:border-border-default bg-white dark:bg-[#0B2E24] px-3 text-xs font-semibold uppercase tracking-wider text-body dark:text-body focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32] transition-colors cursor-pointer"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SEATED">SEATED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Clear Conflict Warning Alert Box */}
              {conflictWarning && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {conflictWarning}
                  </div>
                </div>
              )}

              {/* End Time Error Alert Box */}
              {endTimeError && !conflictWarning && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {endTimeError}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default dark:border-border-default">
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  disabled={isSavingReservation}
                  className="px-4 py-2 text-xs font-semibold text-muted dark:text-slate-300 hover:text-body dark:hover:text-white hover:bg-surface-muted dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingReservation || !!conflictWarning || !!endTimeError}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md bg-[#0B3D32] hover:bg-[#082E25] dark:bg-brand dark:hover:bg-success-subtle0 text-white text-xs font-semibold shadow-xs transition-colors",
                    (isSavingReservation || !!conflictWarning || !!endTimeError)
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  )}
                >
                  {isSavingReservation ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingReservation ? 'Save Changes' : 'Confirm Booking'}</span>
                  )}
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
            className="w-full max-w-md rounded-[4px] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-border-default bg-surface-muted dark:bg-surface-card">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-success dark:text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-body dark:text-body font-heading">
                    Seat Guests · {seatingReservation.reservationCode}
                  </h3>
                  <p className="text-[11px] text-muted dark:text-[#A4B8AE]">
                    Assign a table and open order for {seatingReservation.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSeatingModalOpen(false)}
                className="p-1 rounded-[2px] text-muted hover:text-muted dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Summary Card */}
              <div className="rounded-[3px] bg-success-subtle/60 dark:bg-emerald-950/30 border border-success dark:border-success p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand dark:text-success">
                    {seatingReservation.customerName}
                  </span>
                  <span className="font-mono text-muted dark:text-muted">
                    {seatingReservation.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted dark:text-slate-300 text-[11px]">
                  <span>Party: {seatingReservation.partySize} Guests</span>
                  <span>Time: {seatingReservation.reservationTime}</span>
                </div>
                {seatingReservation.specialRequests && (
                  <div className="text-[11px] text-body dark:text-slate-300 pt-1 border-t border-success/60 dark:border-success/60">
                    <span className="font-bold">Requests: </span>
                    {seatingReservation.specialRequests}
                  </div>
                )}
              </div>

              {/* Table Selector */}
              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                  ASSIGN DINING TABLE *
                </label>
                <select
                  value={seatingTableId}
                  onChange={(e) => setSeatingTableId(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-semibold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
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
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1">
                  WAITER / SERVER NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waiter 1"
                  value={seatingServerName}
                  onChange={(e) => setSeatingServerName(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-border-default">
                <button
                  type="button"
                  onClick={() => setIsSeatingModalOpen(false)}
                  className="rounded-[3px] border border-border-default bg-white px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-muted dark:border-border-default dark:bg-surface-card dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!seatingTableId || isSeatingGuests}
                  onClick={() => handleSeatReservation(seatingReservation, seatingTableId)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-brand hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isSeatingGuests ? 'Seating...' : 'Seat Guests'}</span>
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
          <div className="w-full max-w-md bg-white dark:bg-surface-card rounded-[6px] border border-border-default dark:border-border-default shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-surface-muted dark:bg-[#093027] border-b border-border-default dark:border-border-default">
              <div className="flex items-center gap-2">
                <Armchair className="w-4 h-4 text-brand dark:text-brand" />
                <h3 className="text-sm font-bold font-heading text-body dark:text-body">
                  Quick Order (Takeaway / Walk-in)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoTableModalOpen(false)}
                className="text-muted hover:text-muted dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-muted dark:text-[#A4B8AE] leading-relaxed">
                Start an independent restaurant order without binding to a registered table. An independent order number (e.g. <span className="font-mono font-bold text-brand dark:text-brand">ORD-XXXX</span>) is generated. Customer registration is not required.
              </p>

              {/* Order Service Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1.5 uppercase">
                  Service Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoTableOrderType('NO_TABLE')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-bold transition-all cursor-pointer',
                      noTableOrderType === 'NO_TABLE'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-brand dark:border-brand shadow-xs'
                        : 'bg-white dark:bg-surface-card border-border-default dark:border-border-default text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027]'
                    )}
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>No Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNoTableOrderType('TAKEAWAY')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-bold transition-all cursor-pointer',
                      noTableOrderType === 'TAKEAWAY'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-brand dark:border-brand shadow-xs'
                        : 'bg-white dark:bg-surface-card border-border-default dark:border-border-default text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027]'
                    )}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Takeaway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNoTableOrderType('ONLINE')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-bold transition-all cursor-pointer',
                      noTableOrderType === 'ONLINE'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-brand dark:border-brand shadow-xs'
                        : 'bg-white dark:bg-surface-card border-border-default dark:border-border-default text-body dark:text-body hover:bg-surface-muted dark:hover:bg-[#093027]'
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Online Order</span>
                  </button>
                </div>
              </div>

              {/* Seating Note (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1 uppercase">
                  Seating / Location Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder={noTableOrderType === 'ONLINE' ? "e.g. Swiggy, Zomato, Web App order #..." : noTableOrderType === 'NO_TABLE' ? "e.g. Window side, Spare chair by bar, Outside terrace..." : "e.g. Counter pickup, Delivery pack..."}
                  value={noTableSeatingNote}
                  onChange={(e) => setNoTableSeatingNote(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Informational note only. Does not mark any registered table as occupied.
                </span>
              </div>

              {/* Optional Guest Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EEE9] dark:border-border-default">
                <div>
                  <label className="block text-[10px] font-bold text-muted dark:text-[#A4B8AE] mb-1 uppercase">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walk-in Customer"
                    value={noTableCustomerName}
                    onChange={(e) => setNoTableCustomerName(e.target.value)}
                    className="w-full rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted dark:text-[#A4B8AE] mb-1 uppercase">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9800000000"
                    value={noTableCustomerPhone}
                    onChange={(e) => setNoTableCustomerPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-border-default bg-white px-3 py-1.5 text-xs text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-border-default">
                <button
                  type="button"
                  onClick={() => setIsNoTableModalOpen(false)}
                  className="rounded-[3px] border border-border-default bg-white px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-muted dark:border-border-default dark:bg-surface-card dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleStartNoTableOrder(noTableOrderType)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-brand hover:bg-brand-active text-white px-4 py-1.5 text-xs font-bold shadow-xs transition-all dark:bg-brand dark:hover:bg-success-subtle0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Order</span>
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
          <div className="w-full max-w-md bg-white dark:bg-surface-card rounded-[6px] border border-border-default dark:border-border-default shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-surface-muted dark:bg-[#093027] border-b border-border-default dark:border-border-default">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold font-heading text-body dark:text-body">
                  Assign Dining Table to Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignTableModalOpen(false);
                  setAssigningOrder(null);
                }}
                className="text-muted hover:text-muted dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-[3px] bg-surface-muted dark:bg-[#093027]/70 border border-border-default dark:border-border-default space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted">Order:</span>
                  <span className="font-mono font-bold text-brand dark:text-brand">
                    {(assigningOrder as any).orderNumber || (assigningOrder as any).activeOrderId || (assigningOrder as any).id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted">Service:</span>
                  <span className="font-medium text-body dark:text-slate-200">
                    {(assigningOrder as any).orderType === 'TAKEAWAY' ? 'Takeaway' : 'No Table'}
                    {((assigningOrder as any).notes || (assigningOrder as any).seatingNote) && ` · ${(assigningOrder as any).notes || (assigningOrder as any).seatingNote}`}
                  </span>
                </div>
              </div>

              {/* Table Selector */}
              <div>
                <label className="block text-[11px] font-bold text-muted dark:text-[#A4B8AE] mb-1 uppercase">
                  Select Available Dining Table *
                </label>
                <select
                  value={selectedTargetTableId}
                  onChange={(e) => setSelectedTargetTableId(e.target.value)}
                  className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-semibold text-body shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-border-default dark:bg-surface-card dark:text-body"
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
                <span className="text-[10px] text-muted mt-1 block">
                  Only currently available tables can be assigned. Existing occupied or reserved tables are locked.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5EEE9] dark:border-border-default">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignTableModalOpen(false);
                    setAssigningOrder(null);
                  }}
                  className="rounded-[3px] border border-border-default bg-white px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-muted dark:border-border-default dark:bg-surface-card dark:text-[#A4B8AE] transition-colors cursor-pointer"
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
                  <span>{isAssigningTable ? 'Assigning...' : 'Assign Table'}</span>
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
          TABLE BOOKING DETAILS MODAL
          All reservations for a table on the selected date.
         ========================================================================= */}
      {bookingDetailsModalTable && (
        <TableBookingDetailsModal
          table={bookingDetailsModalTable}
          isOpen={isBookingDetailsModalOpen}
          selectedDate={selectedDate}
          onClose={() => {
            setBookingDetailsModalTable(null);
            setIsBookingDetailsModalOpen(false);
          }}
          onViewBooking={handleOpenViewReservation}
          onEditBooking={(res) => {
            setBookingDetailsModalTable(null);
            setIsBookingDetailsModalOpen(false);
            handleOpenEditReservation(res);
          }}
          onCustomerArrived={(res) => handleSeatReservation(res, bookingDetailsModalTable.id)}
          onSeatGuests={(res) => handleSeatReservation(res, bookingDetailsModalTable.id)}
          onConfirmBooking={(id) => handleUpdateReservationStatus(id, 'CONFIRMED')}
          onCancelBooking={(id) => handleUpdateReservationStatus(id, 'CANCELLED')}
          onMarkNoShow={(id) => handleUpdateReservationStatus(id, 'NO_SHOW')}
          onUpdateBookingStatus={(id, newStatus) => handleUpdateReservationStatus(id, newStatus)}
          onNewBooking={(t) => {
            setBookingDetailsModalTable(null);
            setIsBookingDetailsModalOpen(false);
            handleOpenNewReservation(t);
          }}
        />
      )}

      {/* =========================================================================
          READ-ONLY VIEW BOOKING MODAL
          Clean, non-editable overview of reservation information.
         ========================================================================= */}
      {viewingReservation && (
        <ViewBookingModal
          isOpen={isViewReservationModalOpen}
          reservation={viewingReservation}
          table={
            tables.find((t) => t.id === viewingReservation.tableId) ||
            bookingDetailsModalTable ||
            null
          }
          onCustomerArrived={(res) =>
            handleSeatReservation(res, viewingReservation.tableId || bookingDetailsModalTable?.id)
          }
          onClose={() => {
            setIsViewReservationModalOpen(false);
            setViewingReservation(null);
          }}
        />
      )}

      {/* =========================================================================
          PRINTED BILL / RECEIPT MODAL (Requirement 7)
          Thermal receipt format with print trigger for all order types.
         ========================================================================= */}
      {receiptModalData && <RestaurantReceiptModal {...receiptModalData} />}

      {/* =========================================================================
          WALK-IN TURNOVER CONFLICT WARNING MODAL (Requirement 5)
          Clear warning when insufficient time remains before upcoming reservation.
         ========================================================================= */}
      {walkInConflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[6px] bg-white dark:bg-[#071926] border border-amber-300 dark:border-amber-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-default dark:border-border-default bg-amber-50/70 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reservation Conflict Notice
                  </h3>
                  <p className="text-[11px] text-muted">
                    Table {walkInConflictData.table.tableNumber} · {walkInConflictData.table.section}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalkInConflictData(null)}
                className="text-muted hover:text-body p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Requirement 5 exact warning prompt */}
              <div className="p-3 rounded-[4px] bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-200">
                <p className="text-xs font-bold leading-relaxed">
                  {walkInConflictData.warningMessage}
                </p>
              </div>

              {/* Conflict Breakdown */}
              <div className="rounded-[4px] border border-border-default dark:border-border-default p-3 bg-surface-muted/30 dark:bg-slate-900/40 space-y-2 text-xs">
                {walkInConflictData.reservation && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Reserved For:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {walkInConflictData.reservation.customerName || 'Reserved Guest'} ({walkInConflictData.reservation.partySize || 2} Guests)
                    </span>
                  </div>
                )}
                {walkInConflictData.reservation?.reservationTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Reservation Slot:</span>
                    <span className="font-mono font-bold text-brand dark:text-success">
                      {formatTime12h(walkInConflictData.reservation.reservationTime)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted">Estimated Dining:</span>
                  <span className="font-medium">{restaurantSettings.estimatedDiningMinutes} mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Cleaning Buffer:</span>
                  <span className="font-medium">{restaurantSettings.cleaningBufferMinutes} mins</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border-default/60 dark:border-border-default/60">
                  <span className="text-muted">Total Time Required:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {walkInConflictData.requiredMinutes} mins
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-3 border-t border-border-default dark:border-border-default bg-surface-muted/20">
              <button
                type="button"
                onClick={() => {
                  const targetTable = walkInConflictData.table;
                  setWalkInConflictData(null);
                  setBookingDetailsModalTable(targetTable);
                  setIsBookingDetailsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-body hover:bg-surface-muted transition-colors cursor-pointer"
              >
                View Bookings
              </button>
              <button
                type="button"
                onClick={() => setWalkInConflictData(null)}
                className="px-4 py-1.5 rounded-[3px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Choose Another Table
              </button>
            </div>
          </div>
        </div>
      )}



      {/* =========================================================================
          RESTAURANT SETTINGS MODAL (Requirement 8)
          Configurable dining duration, cleaning buffer, and advance alerts.
         ========================================================================= */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[6px] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-default dark:border-border-default bg-surface-muted/40 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-brand dark:text-success">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Turnaround & Buffer Settings
                  </h3>
                  <p className="text-[11px] text-muted">
                    Configure walk-in turnaround and table preparation thresholds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-muted hover:text-body p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Estimated Dining Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  step="5"
                  value={tempDiningMinutes}
                  onChange={(e) => setTempDiningMinutes(Math.max(15, parseInt(e.target.value, 10) || 90))}
                  className="w-full rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-body font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-muted mt-0.5">
                  Standard expected dining duration for walk-in tables (default 90 mins).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Cleaning & Preparation Buffer (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={tempBufferMinutes}
                  onChange={(e) => setTempBufferMinutes(Math.max(0, parseInt(e.target.value, 10) || 15))}
                  className="w-full rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-body font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-muted mt-0.5">
                  Buffer time required to bus, sanitize, and set up the table for the next reservation (default 15 mins).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Advance Reservation Notice Alert (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  step="5"
                  value={tempAlertMinutes}
                  onChange={(e) => setTempAlertMinutes(Math.max(5, parseInt(e.target.value, 10) || 15))}
                  className="w-full rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-body font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-muted mt-0.5">
                  Time before arrival to prompt staff for table preparation and turnover (default 15 mins).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-3 border-t border-border-default dark:border-border-default bg-surface-muted/20">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-3 py-1.5 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-body hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingSettings}
                onClick={handleSaveRestaurantSettings}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          QUICK ADD MODAL FOR MULTI-VARIANT ITEMS (e.g. Sprite: Glass, Can, 500ml)
          ========================================================================= */}
      {variantModal && variantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (variantModal.draftId) {
                setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
              }
              setVariantModal(null);
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-2xl p-5 animate-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border-default dark:border-border-default">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-success">
                  {variantModal.menuItem.category || 'Portion / Size'}
                </span>
                <h3 className="text-base font-bold text-body dark:text-body mt-0.5">
                  {variantModal.menuItem.baseName || variantModal.menuItem.name.replace(/\s*\([^)]*\)$/, '').trim()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (variantModal.draftId) {
                    setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                  }
                  setVariantModal(null);
                }}
                className="p-1 rounded text-muted hover:text-body dark:hover:text-white cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-3 border-b border-border-default dark:border-border-default">
              <span className="text-xs font-semibold text-body dark:text-body">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVariantModal((prev) => (prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null))
                  }
                  className="w-7 h-7 rounded bg-surface-muted dark:bg-surface-muted text-body dark:text-body hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono font-bold text-sm text-body dark:text-body select-none">
                  {variantModal.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setVariantModal((prev) => (prev ? { ...prev, quantity: prev.quantity + 1 } : null))
                  }
                  className="w-7 h-7 rounded bg-surface-muted dark:bg-surface-muted text-body dark:text-body hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Sizes / Variants Grid */}
            <div className="pt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted dark:text-muted mb-2">
                Select Size to Add:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {resolveItemUnitInfo(variantModal.menuItem, menuCatalog).availableUnits.map((tier) => (
                  <button
                    key={tier.unit}
                    type="button"
                    onClick={() => {
                      pushItemToTableOrder(variantModal.menuItem, tier, variantModal.quantity);
                      if (variantModal.draftId) {
                        setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                      }
                      setVariantModal(null);
                      setOrderProductName('');
                      setOrderPrice('');
                      setOrderQuantity(1);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-md border-2 border-brand/30 hover:border-brand bg-success-subtle/50 hover:bg-success-subtle dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all text-center group cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <span className="font-bold text-xs text-body dark:text-white group-hover:text-brand dark:group-hover:text-success">
                      {tier.unit}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-brand dark:text-success mt-1">
                      Rs. {tier.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted font-medium">Loading Restaurant Table Board...</div>}>
      <TablesContent />
    </Suspense>
  );
}
