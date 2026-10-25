'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  MoreVertical,
  CalendarCheck,
  Percent,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
};

export default function TablesPage() {
  const toast = useToast();
  const [tables, setTables] = useState<TableItem[]>(DEFAULT_TABLES);

  // Active view: null = Grid View; string = Add Order Page for that table ID
  const [activeOrderTableId, setActiveOrderTableId] = useState<string | null>(null);

  // Currently active table for the Add Order page
  const activeTable = useMemo(() => {
    return tables.find((t) => t.id === activeOrderTableId) || null;
  }, [tables, activeOrderTableId]);

  // Search & Status filters (for Grid view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Quick Book Modal state (for Available tables)
  const [bookingTable, setBookingTable] = useState<TableItem | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');

  // 3-dots Option Menu open state (Matching Room Board Card logic)
  const [openOptionMenuId, setOpenOptionMenuId] = useState<string | null>(null);

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

  // Auto-open booking modal when navigated with ?action=book
  const hasAutoOpenedRef = React.useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasAutoOpenedRef.current) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'book') {
        const available = tables.find((t) => t.status === 'AVAILABLE');
        if (available) {
          hasAutoOpenedRef.current = true;
          setBookingTable(available);
          setBookingName('');
          setBookingPhone('');
        }
      }
    }
  }, [tables]);

  // Load from API if available
  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await (api as any).getTables?.();
        if (res && res.length > 0) {
          setTables(
            res.map((t: any) => ({
              id: t.id,
              tableNumber: t.tableNumber || `T-${t.id}`,
              section: t.section || 'Indoor Fine Dining',
              capacity: t.capacity || 4,
              status: (t.status === 'FREE' ? 'AVAILABLE' : t.status) as TableItem['status'],
              currentGuest: t.currentGuest,
              guestPhone: t.guestPhone,
              orders: [],
            }))
          );
        }
      } catch (err) {
        // Fallback to default clean tables list
      }
    }
    fetchTables();
  }, []);


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

  // Status counts
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  // ---------------------------------------------------------------------------
  // Quick Booking Modal Actions (Strictly Name & Mobile Number)
  // ---------------------------------------------------------------------------
  const handleOpenBookingModal = (table: TableItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookingTable(table);
    setBookingName('');
    setBookingPhone('');
  };

  const handleConfirmBooking = (openOrderPageImmediately = false) => {
    if (!bookingTable || !bookingName.trim() || !bookingPhone.trim()) return;

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

    toast.celebrate(`Table ${targetNumber} Booked!`, `Reserved for ${gName} (${gPhone}).`);
    setBookingTable(null);

    if (openOrderPageImmediately) {
      setActiveOrderTableId(targetId);
      setOrderProductName('');
      setOrderQuantity(1);
      setOrderPrice('');
    }
  };

  // ---------------------------------------------------------------------------
  // Add Order Page Actions
  // ---------------------------------------------------------------------------
  const handleOpenOrderPage = (tableId: string) => {
    setActiveOrderTableId(tableId);
    setOrderProductName('');
    setOrderQuantity(1);
    setOrderPrice('');
  };

  const handleBackToTables = () => {
    setActiveOrderTableId(null);
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

  // Clear / Vacate Table
  const handleClearTable = (tableId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: 'AVAILABLE', currentGuest: undefined, guestPhone: undefined, orders: [] }
          : t
      )
    );
    toast.info('Table Cleared', 'Table is now Available.');
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

  // Toggle reserved status
  const handleToggleStatus = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const nextStatus: TableItem['status'] =
          t.status === 'AVAILABLE' ? 'OCCUPIED' : t.status === 'OCCUPIED' ? 'RESERVED' : 'AVAILABLE';
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
        {/* Top Navigation Bar: Back Button, Table Title, and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToTables}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-bold text-[#24352F] hover:bg-[#FAFBF9] hover:border-[#0B3D32] shadow-2xs dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:hover:border-emerald-500 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tables</span>
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-heading text-[#24352F] dark:text-white tracking-tight">
                Table {activeTable.tableNumber} · Add Order
              </h1>
              <span className="rounded-[2px] bg-[#A51F36] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                Occupied
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleClearTable(activeTable.id, e)}
              className="inline-flex items-center gap-1 rounded-[3px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#A51F36] hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Table</span>
            </button>
          </div>
        </div>

        {/* Table Guest Information Strip: Strictly Guest Name and Phone Number only */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-3 rounded-[3px] bg-[#FAFBF9] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Guest:</span>
            <strong className="font-bold text-[#24352F] dark:text-white">
              {activeTable.currentGuest || 'Guest'}
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
        </div>

        {/* =========================================================================
            SEARCH / ADD ITEM WITH INSTANT AUTOCOMPLETE SUGGESTIONS
            Fetches directly from Setted Menu (hotel_menu_items)
           ========================================================================= */}
        <div className="space-y-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-[#24352F] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <span>Add Order to Table {activeTable.tableNumber}</span>
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
                      <td colSpan={8} className="py-10 text-center text-xs text-[#879B90] dark:text-[#64736C]">
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

              <div className="w-36">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mode
                </label>
                <select
                  value={billMode}
                  onChange={(e) => setBillMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Room Charge">Room Charge</option>
                  <option value="Due / Credit">Due / Credit</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={billRemarks}
                  onChange={(e) => setBillRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Action Buttons: Save & Save & Print */}
              <div className="ml-auto flex items-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveBill(false)}
                  className="px-5 py-1.5 rounded-[4px] border border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBill(true)}
                  className="px-5 py-1.5 rounded-[4px] bg-[#0B3D32] hover:bg-[#082e25] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save &amp; Print</span>
                </button>
              </div>
            </div>
          </div>
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

      {/* Clean Header Bar: Just "Tables" and "Add Table" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#24352F] dark:text-white tracking-tight">
            Tables
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Filter Strip: Status Pills + Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All', count: tables.length },
            { id: 'AVAILABLE', label: 'Available', count: availableCount },
            { id: 'OCCUPIED', label: 'Occupied', count: occupiedCount },
            { id: 'RESERVED', label: 'Reserved', count: reservedCount },
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
          const isOccupied = table.status === 'OCCUPIED';
          const isAvailable = table.status === 'AVAILABLE';
          const isReserved = table.status === 'RESERVED';
          const statusMeta = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
          const orderTotal = (table.orders || []).reduce(
            (sum, item) => sum + calculateOrderItemTotal(item).total,
            0
          );

          return (
            <div
              key={table.id}
              onClick={() => {
                if (isOccupied) {
                  // OCCUPIED CARD IS CLICKABLE -> OPENS ADD ORDER PAGE!
                  handleOpenOrderPage(table.id);
                } else if (isAvailable) {
                  handleOpenBookingModal(table);
                } else {
                  handleToggleStatus(table.id);
                }
              }}
              className={cn(
                'group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-[6px] border transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer select-none min-h-[185px]',
                openOptionMenuId === table.id
                  ? (isOccupied ? 'z-50 shadow-md ring-2 ring-white/60' : 'z-50 shadow-md ring-2 ring-[#0B3D32]')
                  : 'z-0',
                // 1. Occupied: THE ONLY SOLID DARK CARD (Signature Pine Emerald #0B3D32)
                isOccupied
                  ? 'bg-[#0B3D32] border-[#082C24] text-white hover:bg-[#093027] dark:bg-[#06241D] dark:border-[#0E3B31] shadow-sm'
                  : isReserved
                  ? 'bg-[#F8FBFF] dark:bg-[#081B26] border-sky-200 dark:border-sky-800/80 hover:border-sky-400 hover:shadow-xs text-[#24352F] dark:text-white'
                  : 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32] dark:hover:border-emerald-500 hover:shadow-xs text-[#24352F] dark:text-white'
              )}
              title={
                isOccupied
                  ? `Click to open Add Order page for Table ${table.tableNumber}`
                  : isReserved
                  ? `Click to view or seat guests for Table ${table.tableNumber}`
                  : `Click to Book Table ${table.tableNumber}`
              }
            >
              <div>
                {/* Top Row: Table Number & Status Badge */}
                <div
                  className={cn(
                    'flex items-center justify-between gap-1 pb-2.5 border-b',
                    isOccupied ? 'border-white/20' : 'border-[#EAEFEA] dark:border-[#145447]/60'
                  )}
                >
                  <div className="min-w-0 flex-1 pr-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          'font-mono text-xl sm:text-2xl font-black tracking-tight',
                          isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                        )}
                      >
                        {table.tableNumber}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider',
                          isOccupied ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {table.capacity} Seats
                      </span>
                    </div>
                  </div>

                  {/* Status Pill Badge AND 3-DOTS BUTTON */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isOccupied ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Occupied</span>
                      </span>
                    ) : isReserved ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        <span>Reserved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Available</span>
                      </span>
                    )}

                    {/* 3-DOTS OPTION TRIGGER BUTTON (Matching Room Board Card) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenOptionMenuId(openOptionMenuId === table.id ? null : table.id);
                      }}
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-[3px] border transition-colors cursor-pointer',
                        isOccupied
                          ? openOptionMenuId === table.id
                            ? 'border-white bg-white text-[#0B3D32]'
                            : 'border-white/30 bg-white/10 hover:bg-white/20 text-white'
                          : openOptionMenuId === table.id
                          ? 'border-[#0B3D32] bg-[#0B3D32] text-white dark:border-emerald-600 dark:bg-emerald-600'
                          : 'border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-slate-600 group-hover:text-[#0B3D32] group-hover:bg-[#F2F6F4] dark:text-slate-300 dark:group-hover:bg-[#093027]'
                      )}
                      title={`Table ${table.tableNumber} Options`}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Section, Context, Guest / Capacity info */}
                <div className="py-2.5 flex flex-col justify-center text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        'text-xs font-bold truncate',
                        isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                      )}
                    >
                      {table.section}
                    </p>
                    {orderTotal > 0 && (
                      <span
                        className={cn(
                          'font-mono font-bold text-[11px] shrink-0',
                          isOccupied ? 'text-white/90' : 'text-[#0B3D32] dark:text-emerald-400'
                        )}
                      >
                        Rs. {orderTotal.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {isOccupied && table.currentGuest ? (
                    <div className="text-[10px] space-y-0.5">
                      <p className="font-medium text-emerald-100 truncate flex items-center gap-1">
                        <span className="opacity-75 font-normal">Guest:</span>
                        <strong className="font-bold text-white">{table.currentGuest}</strong>
                      </p>
                      <p className="text-[10px] text-emerald-200/80 truncate flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>Seated · {table.guestPhone || 'Dine-In'}</span>
                      </p>
                    </div>
                  ) : isReserved && table.currentGuest ? (
                    <div className="text-[10px] space-y-0.5">
                      <p className="font-medium text-sky-800 dark:text-sky-300 truncate flex items-center gap-1">
                        <span className="opacity-75 font-normal">Reserved:</span>
                        <strong className="font-bold text-slate-900 dark:text-white">{table.currentGuest}</strong>
                      </p>
                      <p className="text-[10px] text-sky-700 dark:text-sky-400 truncate flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>Booking: {table.guestPhone || 'Reserved Table'}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-[10px] space-y-0.5">
                      <p className="font-medium text-[#64736C] dark:text-[#A4B8AE] truncate">
                        {table.capacity} Persons capacity
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Table Ready & Sanitized</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Capacity on Left, High-contrast Action on Right */}
              <div
                className={cn(
                  'flex items-center justify-between pt-2.5 border-t min-h-[34px] mt-auto',
                  isOccupied
                    ? 'border-white/20 text-emerald-100/90'
                    : isReserved
                    ? 'border-sky-100 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                    : 'border-[#E5EEE9] dark:border-[#145447]/60'
                )}
              >
                {/* Left side: Capacity Pill Badge */}
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold border shadow-2xs',
                      isOccupied
                        ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                        : isReserved
                        ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                        : 'bg-[#F2F6F4] text-[#0B3D32] border-[#DCE3DF] dark:bg-[#093027] dark:text-emerald-300 dark:border-[#145447]'
                    )}
                  >
                    <Users className="w-3 h-3" />
                    <span>{table.capacity} Seats</span>
                  </span>
                </div>

                {/* Right side: Clean Action Box Button */}
                <div>
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={(e) => handleOpenBookingModal(table, e)}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Book Now
                    </button>
                  ) : isOccupied ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderPage(table.id);
                      }}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-white text-[#0B3D32] hover:bg-emerald-50 font-bold text-[11px] shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {orderTotal > 0 ? `Rs. ${orderTotal.toFixed(0)}` : 'Add Order'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderPage(table.id);
                      }}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Seat Guest
                    </button>
                  )}
                </div>
              </div>

              {/* Floating Dropdown Menu (Anchored under 3-dots button, matching Room Board Card logic) */}
              {openOptionMenuId === table.id && (
                <>
                  {/* Transparent Backdrop to close on outside click */}
                  <div
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenOptionMenuId(null);
                    }}
                  />

                  {/* Floating Dropdown anchored right below 3-dots button */}
                  <div
                    className="absolute right-2.5 top-11 z-50 w-52 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl py-1 text-xs select-none animate-in fade-in-0 zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Active Guest Info Header when table has guest or orders */}
                    {(table.currentGuest || orderTotal > 0) && (
                      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {table.currentGuest || `Table ${table.tableNumber}`}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{isOccupied ? 'Seated Dine-In' : 'Reserved'}</span>
                          {orderTotal > 0 && (
                            <span className="font-bold text-[#0B3D32] dark:text-emerald-400 font-mono">
                              Rs. {orderTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Table Actions based on table state */}
                    {isAvailable && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            handleOpenBookingModal(table);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Book Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            setTables((prev) =>
                              prev.map((t) =>
                                t.id === table.id
                                  ? { ...t, status: 'OCCUPIED', currentGuest: 'Walk-in Guest', orders: [] }
                                  : t
                              )
                            );
                            handleOpenOrderPage(table.id);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Seat Walk-in & Order</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            setTables((prev) =>
                              prev.map((t) =>
                                t.id === table.id
                                  ? { ...t, status: 'RESERVED', currentGuest: 'Reserved Guest' }
                                  : t
                              )
                            );
                            toast.info(`Table ${table.tableNumber} Reserved`, 'Status set to Reserved.');
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Hold / Reserve</span>
                        </button>
                      </>
                    )}

                    {isOccupied && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            handleOpenOrderPage(table.id);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>View / Add Order</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            handleOpenOrderPage(table.id);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <Percent className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Discount</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            toast.info('Printing Bill', `Printing KOT/Bill for Table ${table.tableNumber}...`);
                            if (typeof window !== 'undefined') window.print();
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Print Bill / KOT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            handleClearTable(table.id);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-rose-500" />
                          <span>Settle & Vacate</span>
                        </button>
                      </>
                    )}

                    {isReserved && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            setTables((prev) =>
                              prev.map((t) => (t.id === table.id ? { ...t, status: 'OCCUPIED' } : t))
                            );
                            handleOpenOrderPage(table.id);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Seat Guests (Check-In)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenOptionMenuId(null);
                            setTables((prev) =>
                              prev.map((t) =>
                                t.id === table.id
                                  ? { ...t, status: 'AVAILABLE', currentGuest: undefined, guestPhone: undefined }
                                  : t
                              )
                            );
                            toast.info(`Table ${table.tableNumber} Released`, 'Reservation cancelled.');
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>Cancel Reservation</span>
                        </button>
                      </>
                    )}

                    {/* Divider */}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {/* Maintenance & Sanitation */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenOptionMenuId(null);
                        toast.celebrate('Table Sanitized', `Table ${table.tableNumber} sanitized and ready.`);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Mark Sanitized / Clean</span>
                    </button>
                  </div>
                </>
              )}
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
    </div>
  );
}
