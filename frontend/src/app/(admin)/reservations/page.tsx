'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Search,
  Plus,
  DoorOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  Coffee,
  Utensils,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Eye,
  Printer,
  History,
  DollarSign,
  Wallet,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  BedDouble,
  UserCheck,
  RefreshCw,
  User,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export interface CafeOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CafeOrder {
  id: string;
  orderNumber: string;
  timestamp: string;
  status: 'DELIVERED' | 'PREPARING' | 'BILLED';
  items: CafeOrderItem[];
  subtotal: number;
}

export interface PaymentEntry {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
  type: 'ADVANCE' | 'PARTIAL' | 'SETTLEMENT';
  notes?: string;
}

export interface PastBookingRecord {
  bookingCode: string;
  roomNumber: string;
  roomType: string;
  dates: string;
  amount: number;
  status: string;
}

export interface RoomBooking {
  id: string;
  bookingCode: string; // e.g. BK-1001
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED';
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    idType: string;
    idNumber: string;
    country: string;
    vipTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  };
  room: {
    id: string;
    number: string;
    type: string;
    acType: 'AC' | 'Non-AC';
    bedType: string;
    floorLevel: string;
    pricePerNight: number;
  };
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  roomCharges: number;
  cafeOrders: CafeOrder[];
  payments: PaymentEntry[];
  bookingHistory: PastBookingRecord[];
  notes?: string;
}

// Initial sample bookings matching user requirements exactly
const INITIAL_BOOKINGS: RoomBooking[] = [
  {
    id: 'bk-1001',
    bookingCode: 'BK-1001',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-1',
      firstName: 'Ram',
      lastName: 'Sharma',
      phone: '+977 9841234567',
      email: 'ram.sharma@gmail.com',
      address: 'New Baneshwor, Kathmandu',
      idType: 'Citizenship',
      idNumber: 'CT-27-01-72-0451',
      country: 'Nepal',
      vipTier: 'GOLD',
    },
    room: {
      id: 'rm-101',
      number: '101',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-15',
    checkOut: '2026-10-17',
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [
      {
        id: 'ord-101',
        orderNumber: 'CO-201',
        timestamp: '15 Oct 2026, 02:45 PM',
        status: 'DELIVERED',
        subtotal: 850,
        items: [
          { id: 'it-1', name: 'Chicken Steam Momo', quantity: 2, price: 250, total: 500 },
          { id: 'it-2', name: 'Fresh Masala Tea', quantity: 2, price: 80, total: 160 },
          { id: 'it-3', name: 'Crispy French Fries', quantity: 1, price: 190, total: 190 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-1',
        receiptNo: 'REC-1001-A',
        date: '15 Oct 2026, 11:30 AM',
        amount: 3000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Advance deposit paid at check-in counter',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0894',
        roomNumber: '104',
        roomType: 'Standard Room',
        dates: '12 Aug 2026 – 14 Aug 2026',
        amount: 4800,
        status: 'Completed',
      },
      {
        bookingCode: 'BK-0721',
        roomNumber: '102',
        roomType: 'Deluxe Room',
        dates: '02 Jan 2026 – 04 Jan 2026',
        amount: 7000,
        status: 'Completed',
      },
    ],
    notes: 'Airport pickup requested on arrival. Prefers quiet corner room.',
  },
  {
    id: 'bk-1002',
    bookingCode: 'BK-1002',
    status: 'RESERVED',
    guest: {
      id: 'gst-2',
      firstName: 'Sita',
      lastName: 'Rai',
      phone: '+977 9801987654',
      email: 'sita.rai@outlook.com',
      address: 'Dharan, Sunsari',
      idType: 'National ID',
      idNumber: 'NID-98213401',
      country: 'Nepal',
      vipTier: 'STANDARD',
    },
    room: {
      id: 'rm-103',
      number: '103',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-16',
    checkOut: '2026-10-18',
    nights: 2,
    roomCharges: 4000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-2',
        receiptNo: 'REC-1002-A',
        date: '14 Oct 2026, 04:15 PM',
        amount: 1500,
        method: 'ESEWA_KHALTI',
        type: 'ADVANCE',
        notes: 'Online booking advance reservation deposit',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0610',
        roomNumber: '103',
        roomType: 'Standard Room',
        dates: '10 May 2026 – 12 May 2026',
        amount: 4000,
        status: 'Completed',
      },
    ],
    notes: 'Late arrival expected around 7:00 PM. Twin bed arrangement requested.',
  },
  {
    id: 'bk-1003',
    bookingCode: 'BK-1003',
    status: 'CHECKED_OUT',
    guest: {
      id: 'gst-3',
      firstName: 'Hari',
      lastName: 'Thapa',
      phone: '+977 9813554433',
      email: 'hari.thapa@nepalmail.com',
      address: 'Lakeside, Pokhara',
      idType: 'Driving License',
      idNumber: 'DL-01-09-54321',
      country: 'Nepal',
      vipTier: 'STANDARD',
    },
    room: {
      id: 'rm-102',
      number: '102',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-14',
    checkOut: '2026-10-15',
    nights: 1,
    roomCharges: 3500,
    cafeOrders: [
      {
        id: 'ord-102',
        orderNumber: 'CO-198',
        timestamp: '14 Oct 2026, 08:30 PM',
        status: 'BILLED',
        subtotal: 420,
        items: [
          { id: 'it-4', name: 'Club Chicken Sandwich', quantity: 1, price: 300, total: 300 },
          { id: 'it-5', name: 'Americano Coffee', quantity: 1, price: 120, total: 120 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-3',
        receiptNo: 'REC-1003-A',
        date: '14 Oct 2026, 01:00 PM',
        amount: 2000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Deposit received during check-in',
      },
      {
        id: 'pay-4',
        receiptNo: 'REC-1003-F',
        date: '15 Oct 2026, 11:45 AM',
        amount: 1920,
        method: 'CARD',
        type: 'SETTLEMENT',
        notes: 'Final settlement paid during checkout',
      },
    ],
    bookingHistory: [],
    notes: 'Checked out cleanly at 11:45 AM. Key card returned.',
  },
  {
    id: 'bk-1004',
    bookingCode: 'BK-1004',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-4',
      firstName: 'Bikash',
      lastName: 'Gurung',
      phone: '+977 9856011223',
      email: 'bikash.gurung@gmail.com',
      address: 'Butwal, Rupandehi',
      idType: 'Citizenship',
      idNumber: 'CT-38-02-74-8899',
      country: 'Nepal',
      vipTier: 'SILVER',
    },
    room: {
      id: 'rm-104',
      number: '104',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-13',
    checkOut: '2026-10-16',
    nights: 3,
    roomCharges: 6000,
    cafeOrders: [
      {
        id: 'ord-103',
        orderNumber: 'CO-195',
        timestamp: '14 Oct 2026, 09:10 AM',
        status: 'DELIVERED',
        subtotal: 650,
        items: [
          { id: 'it-6', name: 'Continental Breakfast', quantity: 1, price: 450, total: 450 },
          { id: 'it-7', name: 'Fresh Orange Juice', quantity: 1, price: 200, total: 200 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-5',
        receiptNo: 'REC-1004-A',
        date: '13 Oct 2026, 02:00 PM',
        amount: 3000,
        method: 'UPI_QR',
        type: 'ADVANCE',
        notes: 'QR code advance payment',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0511',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '14 Feb 2026 – 16 Feb 2026',
        amount: 7500,
        status: 'Completed',
      },
    ],
    notes: 'Extended stay request possible for 1 more night.',
  },
  {
    id: 'bk-1005',
    bookingCode: 'BK-1005',
    status: 'RESERVED',
    guest: {
      id: 'gst-5',
      firstName: 'Anita',
      lastName: 'Shrestha',
      phone: '+977 9849988776',
      email: 'anita.shrestha@gmail.com',
      address: 'Patan, Lalitpur',
      idType: 'Passport',
      idNumber: 'PP-NP-1299384',
      country: 'Nepal',
      vipTier: 'PLATINUM',
    },
    room: {
      id: 'rm-101',
      number: '101',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-18',
    checkOut: '2026-10-20',
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-6',
        receiptNo: 'REC-1005-A',
        date: '15 Oct 2026, 09:30 AM',
        amount: 3500,
        method: 'BANK_TRANSFER',
        type: 'ADVANCE',
        notes: 'Bank transfer reservation deposit',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0775',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '20 Jun 2026 – 22 Jun 2026',
        amount: 7200,
        status: 'Completed',
      },
      {
        bookingCode: 'BK-0420',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '01 Jan 2026 – 03 Jan 2026',
        amount: 7500,
        status: 'Completed',
      },
    ],
    notes: 'VIP guest. Welcome drinks upon arrival.',
  },
];

// Available rooms for booking selection
const AVAILABLE_ROOMS_CATALOG = [
  { id: 'rm-101', number: '101', type: 'Deluxe Room', acType: 'AC' as const, bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500 },
  { id: 'rm-102', number: '102', type: 'Deluxe Room', acType: 'AC' as const, bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500 },
  { id: 'rm-103', number: '103', type: 'Standard Room', acType: 'Non-AC' as const, bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000 },
  { id: 'rm-104', number: '104', type: 'Standard Room', acType: 'Non-AC' as const, bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000 },
];

// Menu items for quick Café order addition
const CAFE_MENU_ITEMS = [
  { id: 'm-1', name: 'Chicken Steam Momo', price: 250 },
  { id: 'm-2', name: 'Veg Fried Momo', price: 200 },
  { id: 'm-3', name: 'Fresh Masala Tea', price: 80 },
  { id: 'm-4', name: 'Americano Coffee', price: 120 },
  { id: 'm-5', name: 'Club Chicken Sandwich', price: 300 },
  { id: 'm-6', name: 'Crispy French Fries', price: 190 },
  { id: 'm-7', name: 'Chicken Pizza 9"', price: 450 },
  { id: 'm-8', name: 'Fresh Lime Soda', price: 110 },
];

function RoomBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hotel_room_bookings_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {}
    }
    return INITIAL_BOOKINGS;
  });

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected Booking for Unified Details Modal
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [activeDetailSection, setActiveDetailSection] = useState<'guest' | 'stay' | 'cafe' | 'payments' | 'bill' | 'history'>('stay');

  // Modals
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // New Booking Form States
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestAddress, setNewGuestAddress] = useState('');
  const [newRoomId, setNewRoomId] = useState('rm-101');
  const [newCheckIn, setNewCheckIn] = useState('2026-10-15');
  const [newCheckOut, setNewCheckOut] = useState('2026-10-17');
  const [newInitialStatus, setNewInitialStatus] = useState<'RESERVED' | 'CHECKED_IN'>('RESERVED');
  const [newAdvancePaid, setNewAdvancePaid] = useState<string>('2000');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');

  // Add Cafe Order states
  const [selectedCafeDishId, setSelectedCafeDishId] = useState(CAFE_MENU_ITEMS[0].id);
  const [cafeOrderQuantity, setCafeOrderQuantity] = useState(1);

  // Add Payment states
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');

  // Persist bookings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hotel_room_bookings_list', JSON.stringify(bookings));
      } catch (err) {}
    }
  }, [bookings]);

  // Open booking details if code query parameter exists
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const found = bookings.find((b) => b.bookingCode.toLowerCase() === codeParam.toLowerCase());
      if (found) {
        setSelectedBooking(found);
      }
    }
  }, [searchParams, bookings]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      checkedIn: bookings.filter((b) => b.status === 'CHECKED_IN').length,
      reserved: bookings.filter((b) => b.status === 'RESERVED').length,
      checkedOut: bookings.filter((b) => b.status === 'CHECKED_OUT').length,
    };
  }, [bookings]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'CHECKED_IN' && b.status !== 'CHECKED_IN') return false;
      if (activeTab === 'RESERVED' && b.status !== 'RESERVED') return false;
      if (activeTab === 'CHECKED_OUT' && b.status !== 'CHECKED_OUT') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesName = fullName.includes(q);
        const matchesRoom = b.room.number.toLowerCase().includes(q);
        const matchesPhone = b.guest.phone.toLowerCase().includes(q);
        const matchesEmail = b.guest.email.toLowerCase().includes(q);

        if (!matchesCode && !matchesName && !matchesRoom && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  // Helper calculation for financial balance of any booking
  const getBookingFinancials = (booking: RoomBooking) => {
    const roomCharges = booking.roomCharges;
    const cafeTotal = booking.cafeOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const totalCharges = roomCharges + cafeTotal;
    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, totalCharges - totalPaid);

    return {
      roomCharges,
      cafeTotal,
      totalCharges,
      totalPaid,
      balanceDue,
      isSettled: balanceDue === 0,
    };
  };

  // Actions on Bookings
  const handleCheckInGuest = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'CHECKED_IN' };
        }
        return b;
      })
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'CHECKED_IN' } : null));
    }
    toast.celebrate('Guest Checked In!', 'Room status switched to Occupied.');
  };

  const handleCheckOutGuest = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const { balanceDue } = getBookingFinancials(booking);
    if (balanceDue > 0) {
      toast.error(
        'Outstanding Balance Due',
        `Please settle the remaining balance of Rs. ${balanceDue.toLocaleString()} before checkout.`
      );
      // Auto switch to payment tab in modal
      if (selectedBooking && selectedBooking.id === bookingId) {
        setActiveDetailSection('payments');
        setShowAddPaymentModal(true);
        setPaymentAmountInput(balanceDue.toString());
      }
      return;
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'CHECKED_OUT' };
        }
        return b;
      })
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'CHECKED_OUT' } : null));
    }
    toast.celebrate('Guest Checked Out!', 'Room vacated and queued for housekeeping.');
  };

  // Extend stay by 1 night
  const handleExtendStay = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const newNights = b.nights + 1;
          const newRoomCharges = newNights * b.room.pricePerNight;
          const currentOut = new Date(b.checkOut);
          currentOut.setDate(currentOut.getDate() + 1);
          const newOutStr = currentOut.toISOString().split('T')[0];

          return {
            ...b,
            nights: newNights,
            checkOut: newOutStr,
            roomCharges: newRoomCharges,
          };
        }
        return b;
      })
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      const newNights = selectedBooking.nights + 1;
      const newRoomCharges = newNights * selectedBooking.room.pricePerNight;
      const currentOut = new Date(selectedBooking.checkOut);
      currentOut.setDate(currentOut.getDate() + 1);
      const newOutStr = currentOut.toISOString().split('T')[0];

      setSelectedBooking({
        ...selectedBooking,
        nights: newNights,
        checkOut: newOutStr,
        roomCharges: newRoomCharges,
      });
    }
    toast.success('Stay Extended!', 'Added 1 night to stay duration and updated charges.');
  };

  // Add Café Order to current booking
  const handleAddCafeOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const dish = CAFE_MENU_ITEMS.find((d) => d.id === selectedCafeDishId);
    if (!dish) return;

    const itemTotal = dish.price * cafeOrderQuantity;
    const newOrder: CafeOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `CO-${Math.floor(200 + Math.random() * 800)}`,
      timestamp: 'Today, Just now',
      status: 'DELIVERED',
      subtotal: itemTotal,
      items: [
        {
          id: `item-${Date.now()}`,
          name: dish.name,
          quantity: cafeOrderQuantity,
          price: dish.price,
          total: itemTotal,
        },
      ],
    };

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === selectedBooking.id) {
          return {
            ...b,
            cafeOrders: [newOrder, ...b.cafeOrders],
          };
        }
        return b;
      })
    );

    setSelectedBooking((prev) =>
      prev
        ? {
            ...prev,
            cafeOrders: [newOrder, ...prev.cafeOrders],
          }
        : null
    );

    setShowAddCafeModal(false);
    setCafeOrderQuantity(1);
    toast.celebrate('Café Order Added!', `Charged Rs. ${itemTotal.toLocaleString()} to Room ${selectedBooking.room.number}.`);
  };

  // Record Payment to current booking
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const newPayment: PaymentEntry = {
      id: `pay-${Date.now()}`,
      receiptNo: `REC-${selectedBooking.bookingCode.replace('BK-', '')}-${Date.now().toString().slice(-4)}`,
      date: 'Today, Just now',
      amount,
      method: paymentMethodInput,
      type: 'PARTIAL',
      notes: paymentNotesInput.trim() || `Payment received via ${paymentMethodInput}`,
    };

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === selectedBooking.id) {
          return {
            ...b,
            payments: [...b.payments, newPayment],
          };
        }
        return b;
      })
    );

    setSelectedBooking((prev) =>
      prev
        ? {
            ...prev,
            payments: [...prev.payments, newPayment],
          }
        : null
    );

    setShowAddPaymentModal(false);
    setPaymentAmountInput('');
    setPaymentNotesInput('');
    toast.celebrate('Payment Recorded!', `Receipt issued for Rs. ${amount.toLocaleString()}.`);
  };

  // Create New Booking Submit
  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newGuestPhone.trim()) {
      toast.error('Required Fields Missing', 'Please enter customer name and phone number.');
      return;
    }

    const roomObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === newRoomId) || AVAILABLE_ROOMS_CATALOG[0];
    const nights = Math.max(
      1,
      Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24))
    );
    const roomCharges = roomObj.pricePerNight * nights;
    const advance = parseFloat(newAdvancePaid) || 0;

    const nextCodeNum = 1000 + bookings.length + 1;
    const newBookingCode = `BK-${nextCodeNum}`;

    const names = newGuestName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Guest';

    const newBooking: RoomBooking = {
      id: `bk-${Date.now()}`,
      bookingCode: newBookingCode,
      status: newInitialStatus,
      guest: {
        id: `gst-${Date.now()}`,
        firstName,
        lastName,
        phone: newGuestPhone.trim(),
        email: newGuestEmail.trim() || `${newGuestPhone.trim()}@guest.hotel`,
        address: newGuestAddress.trim() || 'Kathmandu, Nepal',
        idType: 'Citizenship',
        idNumber: 'Pending',
        country: 'Nepal',
        vipTier: 'STANDARD',
      },
      room: {
        id: roomObj.id,
        number: roomObj.number,
        type: roomObj.type,
        acType: roomObj.acType,
        bedType: roomObj.bedType,
        floorLevel: roomObj.floorLevel,
        pricePerNight: roomObj.pricePerNight,
      },
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights,
      roomCharges,
      cafeOrders: [],
      payments:
        advance > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                receiptNo: `REC-${nextCodeNum}-A`,
                date: 'Today, Advance',
                amount: advance,
                method: newPaymentMethod,
                type: 'ADVANCE',
                notes: 'Advance deposit at booking',
              },
            ]
          : [],
      bookingHistory: [],
    };

    setBookings((prev) => [newBooking, ...prev]);
    setShowNewBookingModal(false);
    // Reset form
    setNewGuestName('');
    setNewGuestPhone('');
    setNewGuestEmail('');
    setNewGuestAddress('');
    setNewAdvancePaid('2000');
    toast.celebrate('Booking Created!', `Assigned ${newBooking.room.number} (${newBookingCode}) to ${firstName} ${lastName}.`);
  };

  // Printable Folio trigger
  const handlePrintFolio = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean, Professional Page Title & Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#24352F] dark:text-white font-heading">
              Room Bookings
            </h1>
          </div>
          <p className="text-xs text-[#64736C] dark:text-[#8CA498] mt-0.5">
            Main list to find customers who booked rooms, manage stays, and view unified guest folios.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] p-0.5 dark:border-[#145447] dark:bg-[#061B16]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* New Booking Button */}
          <button
            type="button"
            onClick={() => setShowNewBookingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Booking</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STATUS FILTER TABS & SEARCH BAR
          Tabs: All Bookings, Checked In, Reserved, Checked Out
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'ALL'
                ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            All Bookings ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_IN')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'CHECKED_IN'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Checked In ({counts.checkedIn})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESERVED')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'RESERVED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Reserved ({counts.reserved})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_OUT')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'CHECKED_OUT'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>Checked Out ({counts.checkedOut})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, BK code, room #..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          ROOM BOOKING LIST: CARDS VIEW (Clean, matching user format)
          ----------------------------------------------------------------------- */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBookings.map((booking) => {
            const financials = getBookingFinancials(booking);
            const isCheckedIn = booking.status === 'CHECKED_IN';
            const isReserved = booking.status === 'RESERVED';
            const isCheckedOut = booking.status === 'CHECKED_OUT';

            return (
              <div
                key={booking.id}
                className="rounded-[3px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] p-4 shadow-2xs flex flex-col justify-between hover:border-[#0B3D32] dark:hover:border-emerald-500 transition-all group"
              >
                <div>
                  {/* Top Row: Customer Name, Booking ID & Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#24352F] dark:text-white truncate group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300 transition-colors">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400">
                          {booking.bookingCode}
                        </span>
                        {booking.guest.vipTier === 'GOLD' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCheckedIn && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300 dark:border-[#145447]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Checked In
                        </span>
                      )}
                      {isReserved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Reserved
                        </span>
                      )}
                      {isCheckedOut && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          Checked Out
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Room Details Row */}
                  <div className="pt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#24352F] dark:text-slate-200 font-semibold">
                        <DoorOpen className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                        <span>Room {booking.room.number}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium">
                          {booking.room.type} ({booking.room.acType})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#64736C] dark:text-slate-400">
                        {booking.room.floorLevel}
                      </span>
                    </div>

                    {/* Stay Dates */}
                    <div className="flex items-center gap-1.5 text-xs text-[#52685E] dark:text-[#A4B8AE]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="font-semibold text-[#0B3D32] dark:text-emerald-400 ml-auto">
                        ({booking.nights} {booking.nights === 1 ? 'night' : 'nights'})
                      </span>
                    </div>

                    {/* Charges & Balance Summary Strip */}
                    <div className="pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Total Charges</span>
                        <span className="font-mono font-bold text-[#24352F] dark:text-white">
                          Rs. {financials.totalCharges.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Balance</span>
                        {financials.balanceDue > 0 ? (
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            Rs. {financials.balanceDue.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Paid (Rs. 0)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action: View Booking Details */}
                <div className="pt-3 mt-3 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setActiveDetailSection('stay');
                    }}
                    className="flex-1 py-1.5 px-3 rounded-[3px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Booking Details</span>
                  </button>

                  {/* Fast Action button based on status */}
                  {isReserved && (
                    <button
                      type="button"
                      onClick={() => handleCheckInGuest(booking.id)}
                      className="py-1.5 px-2.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                      title="Quick Check-In"
                    >
                      Check In
                    </button>
                  )}
                  {isCheckedIn && (
                    <button
                      type="button"
                      onClick={() => handleCheckOutGuest(booking.id)}
                      className="py-1.5 px-2.5 rounded-[3px] bg-slate-800 hover:bg-black text-white text-xs font-bold transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
                      title="Quick Checkout & Settle"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
              No room bookings found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           ROOM BOOKINGS: TABLE VIEW
           ----------------------------------------------------------------------- */
        <div className="rounded-[3px] border border-[#DCE3DF] bg-white overflow-hidden shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                  <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">BOOKING ID</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">GUEST NAME</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">STAY DATES</th>
                  <th className="py-2.5 px-3 w-20 text-center border-r border-[#E5EEE9] dark:border-[#145447]">NIGHTS</th>
                  <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">CHARGES</th>
                  <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">BALANCE DUE</th>
                  <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">STATUS</th>
                  <th className="py-2.5 px-3 w-36 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                {filteredBookings.map((booking, idx) => {
                  const financials = getBookingFinancials(booking);

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                          {booking.bookingCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-bold text-[#24352F] dark:text-white">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{booking.guest.phone}</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-semibold text-[#24352F] dark:text-white">
                          Room {booking.room.number}
                        </div>
                        <div className="text-[10px] text-slate-400">{booking.room.type} ({booking.room.acType})</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#0B3D32] dark:text-emerald-300 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {booking.nights}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#24352F] dark:text-white border-r border-[#E5EEE9] dark:border-[#145447]">
                        Rs. {financials.totalCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold border-r border-[#E5EEE9] dark:border-[#145447]">
                        {financials.balanceDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            Rs. {financials.balanceDue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Paid</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        {booking.status === 'CHECKED_IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300">
                            Checked In
                          </span>
                        )}
                        {booking.status === 'RESERVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            Reserved
                          </span>
                        )}
                        {booking.status === 'CHECKED_OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                            Checked Out
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setActiveDetailSection('stay');
                          }}
                          className="px-2.5 py-1 rounded-[2px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          3. UNIFIED BOOKING DETAILS MODAL: "show everything together"
          Tabs: Guest Details, Room & Stay, Café Orders, Payments, Final Bill, Booking History
          ----------------------------------------------------------------------- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[#0B3D32] text-white">
                    {selectedBooking.bookingCode}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading">
                    {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
                  </h2>
                  <span className="text-xs text-[#64736C] dark:text-[#A4B8AE]">
                    (Room {selectedBooking.room.number} · {selectedBooking.room.type} · {selectedBooking.room.acType})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedBooking.status === 'CHECKED_IN' && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      ● Active Stay (Checked In)
                    </span>
                  )}
                  {selectedBooking.status === 'RESERVED' && (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      ● Upcoming Reservation
                    </span>
                  )}
                  {selectedBooking.status === 'CHECKED_OUT' && (
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      ● Completed Stay (Checked Out)
                    </span>
                  )}
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-xs text-[#52685E] dark:text-[#A4B8AE]">
                    {new Date(selectedBooking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                    {new Date(selectedBooking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                    ({selectedBooking.nights} nights)
                  </span>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'RESERVED' && (
                  <button
                    type="button"
                    onClick={() => handleCheckInGuest(selectedBooking.id)}
                    className="px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 cursor-pointer"
                  >
                    Check In Guest
                  </button>
                )}

                {selectedBooking.status === 'CHECKED_IN' && (
                  <button
                    type="button"
                    onClick={() => handleCheckOutGuest(selectedBooking.id)}
                    className="px-3 py-1.5 rounded-[3px] bg-slate-800 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs dark:bg-slate-700 cursor-pointer"
                  >
                    Check Out & Settle
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrintFolio}
                  className="p-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-slate-600 hover:text-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] cursor-pointer"
                  title="Print Bill / Folio"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-[3px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary Strip */}
            {(() => {
              const fin = getBookingFinancials(selectedBooking);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-[#E5EEE9] dark:divide-[#145447] border-b border-[#E5EEE9] dark:border-[#145447] bg-[#F7FAF8] dark:bg-[#082921]/60 text-xs">
                  <div className="p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Room Charges</span>
                    <span className="font-mono font-bold text-sm text-[#24352F] dark:text-white">
                      Rs. {fin.roomCharges.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Café Orders</span>
                    <span className="font-mono font-bold text-sm text-[#24352F] dark:text-white">
                      Rs. {fin.cafeTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Charges</span>
                    <span className="font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                      Rs. {fin.totalCharges.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Advance / Paid</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      Rs. {fin.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 col-span-2 sm:col-span-1 bg-[#EEF4F1]/60 dark:bg-[#071F1A]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance Due</span>
                    <span
                      className={cn(
                        'font-mono font-bold text-sm',
                        fin.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      Rs. {fin.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Section Tab Headers */}
            <div className="flex items-center gap-1 border-b border-[#E5EEE9] dark:border-[#145447] px-4 pt-2 overflow-x-auto custom-scrollbar bg-white dark:bg-[#07241E]">
              {[
                { id: 'stay' as const, label: 'Room & Stay' },
                { id: 'guest' as const, label: 'Guest Details' },
                { id: 'cafe' as const, label: `Café Orders (${selectedBooking.cafeOrders.length})` },
                { id: 'payments' as const, label: `Payments (${selectedBooking.payments.length})` },
                { id: 'bill' as const, label: 'Final Bill & Folio' },
                { id: 'history' as const, label: `Booking History (${selectedBooking.bookingHistory.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDetailSection(tab.id)}
                  className={cn(
                    'px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                    activeDetailSection === tab.id
                      ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-300'
                      : 'border-transparent text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
              {/* TAB 1: ROOM & STAY */}
              {activeDetailSection === 'stay' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#64736C] dark:text-[#8CA498]">
                        ASSIGNED ROOM
                      </span>
                      <h4 className="text-base font-bold text-[#24352F] dark:text-white flex items-center gap-2 mt-0.5">
                        <DoorOpen className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                        <span>Room {selectedBooking.room.number}</span>
                        <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#EEF4F1] text-[#0B3D32] dark:bg-[#0A2E26] dark:text-emerald-300 font-semibold">
                          {selectedBooking.room.type} ({selectedBooking.room.acType})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Floor: {selectedBooking.room.floorLevel} · Bed Configuration: {selectedBooking.room.bedType} · Rate: Rs. {selectedBooking.room.pricePerNight.toLocaleString()} / night
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExtendStay(selectedBooking.id)}
                      className="px-3 py-1.5 rounded-[3px] bg-white border border-[#DCE3DF] text-[#0B3D32] text-xs font-bold hover:bg-[#F2F6F4] transition-colors dark:bg-[#0A2E26] dark:border-[#145447] dark:text-emerald-300 cursor-pointer"
                    >
                      + Extend Stay (Add 1 Night)
                    </button>
                  </div>

                  {/* Dates & Timeline Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-In Date</span>
                      <span className="font-bold text-sm text-[#24352F] dark:text-white mt-1 block">
                        {new Date(selectedBooking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-400">Standard Check-In: 02:00 PM</span>
                    </div>

                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-Out Date</span>
                      <span className="font-bold text-sm text-[#24352F] dark:text-white mt-1 block">
                        {new Date(selectedBooking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-400">Standard Check-Out: 12:00 PM</span>
                    </div>

                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Duration</span>
                      <span className="font-bold text-sm text-[#0B3D32] dark:text-emerald-400 mt-1 block font-mono">
                        {selectedBooking.nights} {selectedBooking.nights === 1 ? 'Night' : 'Nights'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {selectedBooking.nights} × Rs. {selectedBooking.room.pricePerNight.toLocaleString()} = Rs. {selectedBooking.roomCharges.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Room Notes */}
                  {selectedBooking.notes && (
                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Stay Notes & Requests</span>
                      <p className="text-[#355245] dark:text-slate-300 mt-1">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GUEST DETAILS */}
              {activeDetailSection === 'guest' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                        Customer / Guest Information
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[2px] bg-[#EEF4F1] text-[#0B3D32] dark:bg-[#0A2E26] dark:text-emerald-300">
                        Tier: {selectedBooking.guest.vipTier}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Full Name</span>
                        <span className="font-bold text-[#24352F] dark:text-white">
                          {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Phone Number</span>
                        <span className="font-mono font-semibold text-[#24352F] dark:text-white flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedBooking.guest.phone}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                        <span className="font-semibold text-[#24352F] dark:text-white flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedBooking.guest.email}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Address</span>
                        <span className="font-semibold text-[#24352F] dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {selectedBooking.guest.address}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Identification Proof</span>
                        <span className="font-semibold text-[#24352F] dark:text-white">
                          {selectedBooking.guest.idType}: {selectedBooking.guest.idNumber}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Country / Nationality</span>
                        <span className="font-semibold text-[#24352F] dark:text-white">
                          {selectedBooking.guest.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAFÉ ORDERS */}
              {activeDetailSection === 'cafe' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#24352F] dark:text-white">
                      Room Dining & Café Orders Charged to Room {selectedBooking.room.number}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddCafeModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Café Order</span>
                    </button>
                  </div>

                  {selectedBooking.cafeOrders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBooking.cafeOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                {order.orderNumber}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">{order.timestamp}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#EEF4F1] text-[#0B3D32] dark:bg-[#0A2E26] dark:text-emerald-300">
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <span className="text-[#24352F] dark:text-slate-200">
                                  {item.quantity} × {item.name}
                                </span>
                                <span className="font-mono font-semibold text-[#24352F] dark:text-white">
                                  Rs. {item.total.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-1.5 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center justify-between text-xs font-bold">
                            <span>Order Total</span>
                            <span className="font-mono text-[#0B3D32] dark:text-emerald-400">
                              Rs. {order.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
                      No café or dining charges added to this room yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {activeDetailSection === 'payments' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#24352F] dark:text-white">
                      Payment Transactions & Advances
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Record Payment</span>
                    </button>
                  </div>

                  {selectedBooking.payments.length > 0 ? (
                    <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase">
                            <th className="py-2 px-3">RECEIPT #</th>
                            <th className="py-2 px-3">DATE</th>
                            <th className="py-2 px-3">TYPE</th>
                            <th className="py-2 px-3">METHOD</th>
                            <th className="py-2 px-3 text-right">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                          {selectedBooking.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                {p.receiptNo}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{p.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-[#24352F] dark:text-white">{p.type}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-[2px] bg-[#F0F4F2] text-[#4A6458] border border-[#DCE3DF] text-[10px] font-bold dark:bg-[#0A2E26] dark:text-emerald-300 dark:border-[#145447]">
                                  {p.method}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                Rs. {p.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
                      No payments or advances recorded for this booking yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FINAL BILL & FOLIO */}
              {activeDetailSection === 'bill' && (
                <div className="p-5 rounded-[3px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] space-y-4">
                  {/* Bill Header */}
                  <div className="flex items-start justify-between border-b border-[#E5EEE9] pb-4 dark:border-[#145447]">
                    <div>
                      <h3 className="text-base font-black text-[#0B3D32] dark:text-emerald-400 tracking-tight font-heading">
                        AURA GRAND HOSPITALITY RESORT
                      </h3>
                      <p className="text-[11px] text-slate-500">Official Guest Folio & Final Settlement</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#24352F] dark:text-white">
                        FOLIO: {selectedBooking.bookingCode}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Guest and Stay Line */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAFBF9] dark:bg-[#061B16] p-3 rounded-[3px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Billed To:</span>
                      <span className="font-bold text-[#24352F] dark:text-white">
                        {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
                      </span>
                      <p className="text-slate-500">{selectedBooking.guest.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Room & Stay:</span>
                      <span className="font-bold text-[#24352F] dark:text-white">
                        Room {selectedBooking.room.number} ({selectedBooking.room.type})
                      </span>
                      <p className="text-slate-500">
                        {selectedBooking.nights} Nights ({selectedBooking.checkIn} to {selectedBooking.checkOut})
                      </p>
                    </div>
                  </div>

                  {/* Charges Breakdown Table */}
                  {(() => {
                    const fin = getBookingFinancials(selectedBooking);
                    return (
                      <div className="space-y-2">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#DCE3DF] text-[10px] uppercase font-bold text-slate-500 dark:border-[#145447]">
                              <th className="py-2">Description</th>
                              <th className="py-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0F4F2] dark:divide-[#103D33]">
                            <tr>
                              <td className="py-2.5 text-[#24352F] dark:text-white">
                                Room {selectedBooking.room.number} × {selectedBooking.nights}{' '}
                                {selectedBooking.nights === 1 ? 'night' : 'nights'} (Rs. {selectedBooking.room.pricePerNight.toLocaleString()}/night)
                              </td>
                              <td className="py-2.5 text-right font-mono font-semibold">
                                Rs. {fin.roomCharges.toLocaleString()}
                              </td>
                            </tr>
                            {fin.cafeTotal > 0 && (
                              <tr>
                                <td className="py-2.5 text-[#24352F] dark:text-white">Café & Restaurant Dining Orders</td>
                                <td className="py-2.5 text-right font-mono font-semibold">
                                  Rs. {fin.cafeTotal.toLocaleString()}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Totals Calculation */}
                        <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#145447] space-y-1.5 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">Total Charges</span>
                            <span className="font-mono text-[#24352F] dark:text-white">
                              Rs. {fin.totalCharges.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>Advance & Payments Received</span>
                            <span className="font-mono">- Rs. {fin.totalPaid.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between pt-2 border-t border-[#DCE3DF] dark:border-[#145447] text-sm font-black">
                            <span className="text-[#24352F] dark:text-white">Balance Due</span>
                            <span
                              className={cn(
                                'font-mono text-base',
                                fin.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                              )}
                            >
                              Rs. {fin.balanceDue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-3 border-t border-[#E5EEE9] dark:border-[#145447] flex justify-end">
                    <button
                      type="button"
                      onClick={handlePrintFolio}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Official Folio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: BOOKING HISTORY */}
              {activeDetailSection === 'history' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-xs">
                    <span className="font-bold text-[#0B3D32] dark:text-emerald-400 block">
                      Lifetime Stay History for {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Guest and Booking are separate entities. Customer profile records all past and active stays.
                    </p>
                  </div>

                  {selectedBooking.bookingHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBooking.bookingHistory.map((past) => (
                        <div
                          key={past.bookingCode}
                          className="p-3 rounded-[3px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                {past.bookingCode}
                              </span>
                              <span className="font-semibold text-[#24352F] dark:text-white">
                                Room {past.roomNumber} ({past.roomType})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{past.dates}</p>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-[#24352F] dark:text-white block">
                              Rs. {past.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {past.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
                      This is the customer&rsquo;s first recorded stay at our property.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Aura Grand PMS · Room Booking #{selectedBooking.bookingCode}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-bold text-[#4A6458] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: ADD CAFÉ ORDER TO ROOM
          ----------------------------------------------------------------------- */}
      {showAddCafeModal && selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                Add Café Order to Room {selectedBooking.room.number}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCafeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCafeOrderSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Item from Menu
                </label>
                <select
                  value={selectedCafeDishId}
                  onChange={(e) => setSelectedCafeDishId(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  {CAFE_MENU_ITEMS.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} (Rs. {dish.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cafeOrderQuantity}
                  onChange={(e) => setCafeOrderQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              {(() => {
                const dish = CAFE_MENU_ITEMS.find((d) => d.id === selectedCafeDishId);
                const total = (dish?.price || 0) * cafeOrderQuantity;
                return (
                  <div className="pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] flex justify-between font-bold">
                    <span>Total Order Charge:</span>
                    <span className="font-mono text-[#0B3D32] dark:text-emerald-400">Rs. {total.toLocaleString()}</span>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCafeModal(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-slate-600 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold dark:bg-emerald-600 cursor-pointer"
                >
                  Confirm & Post to Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: RECORD PAYMENT
          ----------------------------------------------------------------------- */}
      {showAddPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                Record Payment for {selectedBooking.bookingCode}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  autoFocus
                  placeholder="0.00"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI_QR">Bank QR Code Scan</option>
                  <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transaction Ref #981293"
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-slate-600 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold dark:bg-emerald-600 cursor-pointer"
                >
                  Issue Receipt & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: + NEW BOOKING (Fast Front Desk Entry)
          ----------------------------------------------------------------------- */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white uppercase tracking-wider font-heading">
                  Create Room Booking
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#8CA498]">
                  Register a customer reservation or instant walk-in check-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Ramesh Karki"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 98XXXXXXXX"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Room *
                  </label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    {AVAILABLE_ROOMS_CATALOG.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} — {room.type} ({room.acType}, {room.bedType}) · Rs. {room.pricePerNight}/night
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newInitialStatus}
                    onChange={(e) => setNewInitialStatus(e.target.value as any)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="RESERVED">Reserved</option>
                    <option value="CHECKED_IN">Checked In Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Advance Deposit (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvancePaid}
                    onChange={(e) => setNewAdvancePaid(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5EEE9] dark:border-[#145447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-slate-600 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs dark:bg-emerald-600 cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Room Bookings...
        </div>
      }
    >
      <RoomBookingsContent />
    </Suspense>
  );
}
