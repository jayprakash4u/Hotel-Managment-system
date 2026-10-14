'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Receipt, Plus, Minus, Trash2, ChefHat, BedDouble, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { POSProductData, RoomWithDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

const TABS: Array<{ id: 'order' | 'orders'; label: string; icon: any }> = [
  { id: 'order', label: 'New Order', icon: ShoppingCart },
  { id: 'orders', label: 'Order History', icon: Receipt },
];

export default function CafePage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'order' | 'orders'>('order');
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<POSProductData[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);

  const [selectedOutlet, setSelectedOutlet] = useState('RESTAURANT');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<Array<{ product: POSProductData; quantity: number }>>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, orderRes, roomData] = await Promise.all([
        api.getPOSProducts({ outlet: selectedOutlet }),
        fetch('/api/restaurant/orders').then((r) => r.json()),
        api.getRooms({ status: 'OCCUPIED' }),
      ]);

      setProducts(prodData);
      if (orderRes.success) setOrders(orderRes.data);
      setRooms(roomData);
      if (roomData.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomData[0].id);
      }
    } catch (e: any) {
      toast.error('Failed to load cafe data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOutlet]);

  const addToCart = (product: POSProductData) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartTax = cartSubtotal * 0.10;
  const cartService = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartTax + cartService;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('No items added', 'Tap a menu item to add it to the order.');
      return;
    }
    if (!selectedRoomId) {
      toast.error('Select a Room', 'Please pick which guest room to bill this order to.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        outlet: selectedOutlet,
        roomId: selectedRoomId,
        orderType: 'ROOM_SERVICE',
        serverName: 'Front Desk',
        paymentMethod: 'ROOM_FOLIO',
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          unitPrice: i.product.price,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const room = rooms.find((r) => r.id === selectedRoomId);
      toast.celebrate('Order Added to Room!', `${formatCurrency(cartTotal)} charged to Room ${room?.number || ''}.`);
      clearCart();
      loadData();
    } catch (e: any) {
      toast.error('Order failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Cafe & Room Orders"
        subtitle="Guest orders at the counter or by phone — add them straight to the guest's room bill"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Outlet:</span>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="RESTAURANT">Le Ciel Fine Dining</option>
                <option value="ROOFTOP_BAR">Skyline 360 Lounge</option>
                <option value="ZENITH_SPA">Zenith Spa Cafe</option>
                <option value="ROOM_SERVICE">In-Room Dining</option>
              </select>
            </div>
          </>
        }
      />

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'order' ? cart.reduce((s, i) => s + i.quantity, 0) : orders.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-900/60 text-current">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: NEW ORDER */}
      {activeTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Menu Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products
                .filter((p) => selectedCategory === 'ALL' || p.category === selectedCategory)
                .map((prod) => {
                  const cartItem = cart.find((i) => i.product.id === prod.id);
                  const qtyInCart = cartItem?.quantity || 0;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`relative p-4 rounded-lg border text-left flex flex-col justify-between transition-all active:scale-95 group h-28 select-none ${
                        qtyInCart > 0
                          ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {qtyInCart > 0 && (
                        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-amber-500 text-slate-950 font-semibold text-[11px] flex items-center justify-center">
                          {qtyInCart}
                        </div>
                      )}

                      <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {prod.name}
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white font-heading">{formatCurrency(prod.price)}</span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Add
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right 4 Cols: Order Ticket */}
          <div className={`lg:col-span-4 p-5 ${cardClass} space-y-4 sticky top-24`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-900 dark:text-white font-heading">Order for Room</span>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <Select label="Guest Room" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>
              {rooms.length === 0 && <option value="">No occupied rooms</option>}
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number} — {r.activeReservation?.guestName || 'In-House'}
                </option>
              ))}
            </Select>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  Tap menu items on the left to add them to this order
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatCurrency(item.product.price)} each</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-slate-900 dark:text-white w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="font-medium text-slate-900 dark:text-slate-100 w-14 text-right">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>VAT (10%) & Service (5%)</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(cartTax + cartService)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total to Room</span>
                <span className="text-amber-700 dark:text-amber-400 text-lg font-heading">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full text-sm font-semibold py-4"
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
              leftIcon={<BedDouble className="w-5 h-5" />}
            >
              Add Order to Room
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS HISTORY */}
      {activeTab === 'orders' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{ord.orderNumber}</TableCell>
                <TableCell className="text-xs font-medium text-slate-900 dark:text-white">
                  {ord.room ? `Room ${ord.room.number}` : ord.table ? `Table ${ord.table.tableNumber}` : '—'}
                </TableCell>
                <TableCell className="text-xs">{ord.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}</TableCell>
                <TableCell>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ord.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(ord.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
