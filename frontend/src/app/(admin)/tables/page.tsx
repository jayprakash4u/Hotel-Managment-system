'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface OrderItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface TableItem {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentGuest?: string;
  guestPhone?: string;
  orders?: OrderItem[];
}

const MENU_CATALOG = [
  // Starters
  { id: 'm-1', name: 'Winter Truffle & Burrata', category: 'Starters', price: 34 },
  { id: 'm-2', name: 'Royal Osetra Caviar & Blinis', category: 'Starters', price: 145 },
  { id: 'm-3', name: 'Heirloom Tomato Tartare', category: 'Starters', price: 22 },
  // Mains
  { id: 'm-4', name: 'Wagyu Smash Burger & Truffle Fries', category: 'Mains', price: 42 },
  { id: 'm-5', name: 'Chilean Sea Bass with Saffron Jus', category: 'Mains', price: 78 },
  { id: 'm-6', name: 'A5 Miyazaki Wagyu Tenderloin', category: 'Mains', price: 185 },
  { id: 'm-7', name: 'Wild Morel Mushroom Risotto', category: 'Mains', price: 48 },
  // Drinks
  { id: 'm-8', name: 'Aura Golden Hour (24k Cocktail)', category: 'Drinks', price: 38 },
  { id: 'm-9', name: 'Smoked Truffle Old Fashioned', category: 'Drinks', price: 32 },
  { id: 'm-10', name: 'Dom Pérignon Vintage 2013', category: 'Drinks', price: 450 },
  { id: 'm-11', name: 'Artisanal Double Espresso', category: 'Drinks', price: 8 },
  { id: 'm-12', name: 'San Pellegrino Sparkling (750ml)', category: 'Drinks', price: 9 },
  // Desserts
  { id: 'm-13', name: 'Valrhona Gold Leaf Chocolate Sphere', category: 'Desserts', price: 26 },
  { id: 'm-14', name: 'Tahitian Vanilla Bean Soufflé', category: 'Desserts', price: 24 },
];

// Default tables start with empty orders ([]) so the order table starts empty
const DEFAULT_TABLES: TableItem[] = [
  { id: 'tbl-1', tableNumber: 'T-01', section: 'Indoor Fine Dining', capacity: 4, status: 'OCCUPIED', currentGuest: 'Alexander Hayes', guestPhone: '+1 555-0192', orders: [] },
  { id: 'tbl-2', tableNumber: 'T-02', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-3', tableNumber: 'T-03', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-4', tableNumber: 'T-04', section: 'Indoor Fine Dining', capacity: 6, status: 'OCCUPIED', currentGuest: 'Sophia Loren', guestPhone: '+1 555-0144', orders: [] },
  { id: 'tbl-5', tableNumber: 'T-05', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-6', tableNumber: 'T-06', section: 'Indoor Fine Dining', capacity: 4, status: 'RESERVED', currentGuest: 'Marcus Sterling', guestPhone: '+1 555-0129', orders: [] },
  { id: 'tbl-7', tableNumber: 'T-07', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-8', tableNumber: 'T-08', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'OCCUPIED', currentGuest: 'David Miller', guestPhone: '+1 555-0188', orders: [] },
  { id: 'tbl-9', tableNumber: 'T-09', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-10', tableNumber: 'T-10', section: 'Skyline Rooftop Terrace', capacity: 6, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-11', tableNumber: 'T-11', section: 'Poolside Lounge & Bar', capacity: 4, status: 'OCCUPIED', currentGuest: 'Elena Rostova', guestPhone: '+1 555-0163', orders: [] },
  { id: 'tbl-12', tableNumber: 'T-12', section: 'Poolside Lounge & Bar', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-13', tableNumber: 'T-13', section: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-14', tableNumber: 'T-14', section: 'Private Executive Dining', capacity: 10, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-15', tableNumber: 'T-15', section: 'Private Executive Dining', capacity: 12, status: 'OCCUPIED', currentGuest: 'Lady Genevieve', guestPhone: '+1 555-0111', orders: [] },
  { id: 'tbl-16', tableNumber: 'T-16', section: 'Private Executive Dining', capacity: 8, status: 'AVAILABLE', orders: [] },
];

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
    bg: 'bg-[#FFF5F6] dark:bg-[#320810]',
    text: 'text-[#A51F36] dark:text-rose-200',
    border: 'border-[#FAD2D8] dark:border-rose-800',
    dot: 'bg-[#A51F36]',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
};

export default function TablesPage() {
  const toast = useToast();
  const [tables, setTables] = useState<TableItem[]>(DEFAULT_TABLES);

  // Active view: null = Grid View; string = Add Order Page for that table ID
  const [activeOrderTableId, setActiveOrderTableId] = useState<string | null>(null);

  // Search & Status filters (for Grid view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

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

  // Currently active table for the Add Order page
  const activeTable = useMemo(() => {
    return tables.find((t) => t.id === activeOrderTableId) || null;
  }, [tables, activeOrderTableId]);

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
    const catalogMatch = MENU_CATALOG.find((m) => m.name.toLowerCase() === val.toLowerCase());
    if (catalogMatch) {
      setOrderPrice(catalogMatch.price.toString());
    }
  };

  // Add item from the manual input row into the table
  const handleAddManualItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTable || !orderProductName.trim()) return;

    const tableId = activeTable.id;
    const name = orderProductName.trim();
    const price = parseFloat(orderPrice) || 0;
    const qty = Math.max(1, orderQuantity);

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
              price,
              quantity: qty,
            },
          ];
        }

        return { ...t, orders: updatedOrders };
      })
    );

    toast.celebrate(`Item Added`, `${qty}x ${name} added to Table ${activeTable.tableNumber}.`);
    setOrderProductName('');
    setOrderPrice('');
    setOrderQuantity(1);
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

  // Order totals for active table
  const activeTableOrders = activeTable?.orders || [];
  const activeTableOrderTotal = activeTableOrders.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeTableOrderCount = activeTableOrders.reduce((sum, item) => sum + item.quantity, 0);

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
            ORDER TABLE (FULL WIDTH, CLEAN DIVIDED LEDGER VIEW)
           ========================================================================= */}
        <div className="space-y-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-[#24352F] dark:text-white uppercase tracking-wider">
              Table Order Items
            </h2>
          </div>

          {/* Manual Add Item Input Bar */}
          <form
            onSubmit={handleAddManualItem}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-[#FAFBF9] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] rounded-[3px]"
          >
            <div className="flex-1 min-w-0">
              <label className="sr-only">Product Name</label>
              <input
                type="text"
                list="page-menu-options"
                placeholder="Product name (e.g. Wagyu Burger)..."
                value={orderProductName}
                onChange={(e) => handleProductInputChange(e.target.value)}
                className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs text-[#24352F] placeholder-[#879B90] dark:border-[#145447] dark:bg-[#061D18] dark:text-white focus:outline-none focus:border-[#0B3D32]"
              />
              <datalist id="page-menu-options">
                {MENU_CATALOG.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.category} · ${m.price}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-20">
                <label className="sr-only">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  title="Quantity"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-center rounded-[3px] border border-[#DCE3DF] bg-white px-2 py-1.5 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#061D18] dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="w-24">
                <label className="sr-only">Price</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#879B90] font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 text-right rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#061D18] dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!orderProductName.trim()}
                className="inline-flex items-center gap-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* ===================================================================
              THE STRUCTURED ORDER TABLE WITH PROPER TABLE HEADERS & LINE DIVISIONS:
              PRODUCT NAME | QUANTITY | PRICE | TOTAL | ACTION
             =================================================================== */}
          <div className="border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] overflow-hidden bg-white dark:bg-[#071F1A] shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3DF] dark:border-[#145447] text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] uppercase tracking-wider bg-[#F4F6F4] dark:bg-[#092B23]">
                  <th className="py-2.5 px-3.5 text-left border-r border-[#DCE3DF] dark:border-[#145447]">Product Name</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-[#DCE3DF] dark:border-[#145447]">Quantity</th>
                  <th className="py-2.5 px-3.5 text-right w-24 border-r border-[#DCE3DF] dark:border-[#145447]">Price</th>
                  <th className="py-2.5 px-3.5 text-right w-28 border-r border-[#DCE3DF] dark:border-[#145447]">Total</th>
                  <th className="py-2.5 px-2.5 text-center w-14">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeTableOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#879B90] dark:text-[#64736C]">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-sm text-[#24352F] dark:text-white">
                        No orders on Table {activeTable.tableNumber} yet
                      </p>
                      <p className="text-xs text-[#879B90] dark:text-[#64736C] mt-1 max-w-sm mx-auto">
                        Type a product name, quantity, and price above to add the first order to this table.
                      </p>
                    </td>
                  </tr>
                ) : (
                  activeTableOrders.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#DCE3DF] dark:border-[#145447]/70 hover:bg-[#FAFBF9] dark:hover:bg-[#07241E]/80 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-xs font-semibold text-[#24352F] dark:text-white border-r border-[#DCE3DF] dark:border-[#145447]/70">
                        {item.name}
                        {item.category && (
                          <span className="ml-1.5 text-[10px] font-normal text-[#64736C] dark:text-[#879B90]">
                            ({item.category})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-[#DCE3DF] dark:border-[#145447]/70">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, -1)}
                            className="w-5 h-5 rounded-[2px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-[#24352F] dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, 1)}
                            className="w-5 h-5 rounded-[2px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-xs font-mono text-[#64736C] dark:text-[#879B90] border-r border-[#DCE3DF] dark:border-[#145447]/70">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-xs font-mono font-bold text-[#24352F] dark:text-white border-r border-[#DCE3DF] dark:border-[#145447]/70">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-[2px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeTableOrders.length > 0 && (
                <tfoot>
                  <tr className="bg-[#FAFBF9] dark:bg-[#061D18] font-bold text-xs border-t-2 border-[#DCE3DF] dark:border-[#145447]">
                    <td className="py-3 px-3.5 text-left border-r border-[#DCE3DF] dark:border-[#145447]">
                      <div className="flex items-center gap-1.5 text-[#24352F] dark:text-white font-bold">
                        <Receipt className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                        <span>Total Bill Summary</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center border-r border-[#DCE3DF] dark:border-[#145447] font-mono text-[#24352F] dark:text-white">
                      {activeTableOrderCount} item{activeTableOrderCount !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-3.5 text-right border-r border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#879B90]">
                      —
                    </td>
                    <td className="py-3 px-3.5 text-right border-r border-[#DCE3DF] dark:border-[#145447] font-mono font-black text-sm text-[#0B3D32] dark:text-emerald-400">
                      ${activeTableOrderTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-2.5 text-center text-[#64736C] dark:text-[#879B90]">
                      —
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Action Buttons: Print Bill and Save & Exit */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handlePrintBill}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#24352F] hover:bg-slate-50 shadow-2xs dark:border-[#145447] dark:bg-[#07241E] dark:text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toast.celebrate(
                  `Order Saved · Table ${activeTable.tableNumber}`,
                  `${activeTableOrderCount} items saved.`
                );
                handleBackToTables();
              }}
              className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Save & Exit
            </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'OCCUPIED';
          const isAvailable = table.status === 'AVAILABLE';
          const statusMeta = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
          const orderTotal = (table.orders || []).reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                'group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[3px] border shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none',
                isOccupied
                  ? 'bg-[#A51F36] border-[#8E1B2F] text-white hover:bg-[#961B30] dark:bg-[#8E1B2F] dark:border-[#731526]'
                  : 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32] dark:hover:border-emerald-500'
              )}
              title={
                isOccupied
                  ? `Click to open Add Order page for Table ${table.tableNumber}`
                  : isAvailable
                  ? `Click to Book Table ${table.tableNumber}`
                  : `Table ${table.tableNumber} (${statusMeta.label})`
              }
            >
              {/* Top Row: Table Number & Status Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    'font-heading font-black text-xl sm:text-2xl tracking-tight',
                    isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {table.tableNumber}
                </span>

                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                    isOccupied
                      ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                      : cn(statusMeta.bg, statusMeta.text, statusMeta.border)
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isOccupied ? 'bg-white' : statusMeta.dot
                    )}
                  />
                  <span>{statusMeta.label}</span>
                </span>
              </div>

              {/* Middle Row: Dining Section & Guest info */}
              <div className="mb-3">
                <p
                  className={cn(
                    'text-xs font-bold truncate',
                    isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {table.section}
                </p>

                {isOccupied && table.currentGuest ? (
                  <p className="text-[10px] font-medium text-rose-100 truncate mt-0.5 flex items-center gap-1">
                    <span className="opacity-75 font-normal">Guest:</span>
                    <strong className="font-bold text-white">{table.currentGuest}</strong>
                  </p>
                ) : (
                  <p className="text-[10px] font-medium text-[#64736C] dark:text-[#A4B8AE] mt-0.5">
                    {table.capacity} Persons
                  </p>
                )}
              </div>

              {/* Bottom Row: Capacity on Left, Clean Action on Right */}
              <div
                className={cn(
                  'flex items-center justify-between pt-2 border-t min-h-[30px]',
                  isOccupied
                    ? 'border-white/20 text-rose-100/90'
                    : 'border-[#E5EEE9] dark:border-[#145447]/60'
                )}
              >
                {/* Left side: Seats */}
                <div className="flex items-center gap-1 text-[11px]">
                  <Users className={cn('w-3 h-3', isOccupied ? 'text-rose-100/70' : 'text-[#64736C] dark:text-[#879B90]')} />
                  <span
                    className={cn(
                      'font-medium',
                      isOccupied ? 'text-rose-100/90' : 'text-[#64736C] dark:text-[#879B90]'
                    )}
                  >
                    {table.capacity} Seats
                  </span>
                </div>

                {/* Right side: Clean Action */}
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={(e) => handleOpenBookingModal(table, e)}
                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all active:scale-95"
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
                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-white text-[#A51F36] hover:bg-rose-50 font-bold text-[11px] shadow-2xs transition-all active:scale-95"
                  >
                    {orderTotal > 0 ? `$${orderTotal.toFixed(2)}` : 'Add Order'}
                  </button>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    Reserved
                  </span>
                )}
              </div>
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
