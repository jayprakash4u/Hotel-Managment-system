'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BedDouble,
  Bath,
  Wifi,
  Sparkles,
  Shield,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Maximize2,
  X,
  CreditCard,
  Building,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  RoomRecord,
  loadHotelRoomsFromStorage,
  DEFAULT_HOTEL_ROOMS,
} from '@/lib/hotelRoomsData';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function PublicBookingPortalPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'grand-himalayan';
  const router = useRouter();
  const { success, error } = useToast();

  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Dates
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedAcFilter, setSelectedAcFilter] = useState<string>('all');
  const [selectedPhotoRoom, setSelectedPhotoRoom] = useState<RoomRecord | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Booking Modal State
  const [bookingRoom, setBookingRoom] = useState<RoomRecord | null>(null);
  const [guestFirstName, setGuestFirstName] = useState<string>('');
  const [guestLastName, setGuestLastName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  // Load rooms from API with storage fallback
  useEffect(() => {
    let isMounted = true;
    async function fetchRooms() {
      try {
        const res = await fetch(`/api/public/hotels/${slug}/rooms`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            // Map API rooms to RoomRecord
            const mapped: RoomRecord[] = json.data.map((r: any) => ({
              id: r.id,
              number: r.number,
              floor: r.floor,
              type: r.type || r.roomType?.name || 'Deluxe Room',
              bedType: r.bedType || 'King Bed',
              acType: r.hasAC ? 'AC' : 'Non-AC',
              pricePerNight: r.pricePerNight || r.roomType?.basePrice || 3500,
              capacity: r.capacity || r.roomType?.maxCapacity || 2,
              operationalStatus: 'AVAILABLE',
              cleaningStatus: 'CLEAN',
              description: r.description || r.roomType?.description,
              roomSize: r.roomSize || r.roomType?.roomSize,
              roomView: r.roomView || r.roomType?.roomView,
              maxAdults: r.maxAdults || r.roomType?.maxAdults || 2,
              maxChildren: r.maxChildren || r.roomType?.maxChildren || 1,
              smokingPolicy: r.smokingPolicy || r.roomType?.smokingPolicy || 'Non-Smoking',
              accessibility: r.accessibility || r.roomType?.accessibility,
              bedConfiguration: r.bedConfiguration
                ? typeof r.bedConfiguration === 'string'
                  ? JSON.parse(r.bedConfiguration)
                  : r.bedConfiguration
                : [],
              bathroomFacilities: r.bathroomFacilities
                ? typeof r.bathroomFacilities === 'string'
                  ? JSON.parse(r.bathroomFacilities)
                  : r.bathroomFacilities
                : [],
              amenities: r.amenities
                ? typeof r.amenities === 'string'
                  ? JSON.parse(r.amenities)
                  : r.amenities
                : [],
              photos: r.galleryImages
                ? typeof r.galleryImages === 'string'
                  ? JSON.parse(r.galleryImages)
                  : r.galleryImages
                : r.imageUrl
                  ? [{ id: 'cov', url: r.imageUrl, isCover: true, category: 'COVER' }]
                  : [],
              policies: r.policies
                ? typeof r.policies === 'string'
                  ? JSON.parse(r.policies)
                  : r.policies
                : undefined,
            }));
            if (isMounted) {
              setRooms(mapped);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch { }

      // Fallback to local storage setup
      if (isMounted) {
        const local = loadHotelRoomsFromStorage();
        setRooms(local.filter((r) => r.operationalStatus === 'AVAILABLE'));
        setIsLoading(false);
      }
    }

    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Available room types for filter
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      if (r.type) set.add(r.type);
    });
    return Array.from(set);
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedTypeFilter !== 'all' && r.type !== selectedTypeFilter) return false;
      if (selectedAcFilter !== 'all' && r.acType !== selectedAcFilter) return false;
      if (r.capacity < guestCount) return false;
      return true;
    });
  }, [rooms, selectedTypeFilter, selectedAcFilter, guestCount]);

  // Calculate nights
  const nights = useMemo(() => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  // Handle direct booking confirmation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom) return;

    if (!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      error('Missing Details', 'Please fill in all guest contact information.');
      return;
    }

    setIsSubmitting(true);
    const bookingCode = `WEB-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = bookingRoom.pricePerNight * nights;

    const bookingPayload = {
      bookingCode,
      roomId: bookingRoom.id,
      roomNumber: bookingRoom.number,
      roomType: bookingRoom.type,
      guestName: `${guestFirstName.trim()} ${guestLastName.trim()}`,
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guestsCount: guestCount,
      totalAmount,
      status: 'CONFIRMED',
      specialRequests: specialRequests.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Try public API
      await fetch(`/api/public/hotels/${slug}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: bookingRoom.id,
          firstName: guestFirstName.trim(),
          lastName: guestLastName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults: Math.min(guestCount, bookingRoom.maxAdults || guestCount),
          children: Math.max(0, guestCount - (bookingRoom.maxAdults || guestCount)),
          specialRequests: specialRequests.trim(),
        }),
      });
    } catch { }

    // 2. Sync to local storage reservations for immediate front desk reflection
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_room_bookings_list');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          id: `bk-${Date.now()}`,
          bookingId: bookingCode,
          guest: {
            id: `g-${Date.now()}`,
            name: `${guestFirstName.trim()} ${guestLastName.trim()}`,
            phone: guestPhone.trim(),
            email: guestEmail.trim(),
            vipTier: 'REGULAR',
          },
          room: {
            id: bookingRoom.id,
            number: bookingRoom.number,
            type: bookingRoom.type,
            floor: bookingRoom.floor ? `${bookingRoom.floor}th Floor` : '1st Floor',
            rate: bookingRoom.pricePerNight,
          },
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          occupancy: { adults: guestCount, children: 0 },
          status: 'CONFIRMED',
          source: 'DIRECT_WEB',
          billing: {
            roomTotal: totalAmount,
            taxes: Math.round(totalAmount * 0.13),
            grandTotal: Math.round(totalAmount * 1.13),
            paidAmount: 0,
            balanceDue: Math.round(totalAmount * 1.13),
            paymentStatus: 'UNPAID',
          },
        });
        localStorage.setItem('hotel_room_bookings_list', JSON.stringify(list));
      } catch { }
    }

    setIsSubmitting(false);
    setBookingConfirmed(bookingPayload);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#041411] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HOTEL BRANDING BAR */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#071F1A]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#145447] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#A51F36] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            H
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Himalayan Grand Hotel & Suites</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                ★ 5-Star Luxury
              </span>
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#A51F36]" />
                Lakeside Boulevard, Pokhara / Kathmandu
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#A51F36]" />
                +977 1-4421100
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/front-desk')}
            className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-[#0B332A] dark:hover:bg-[#0F3F34] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#16584B] transition-colors"
          >
            Staff Login
          </button>
        </div>
      </header>

      {/* 2. HERO SEARCH & DATES BAR */}
      <section className="bg-gradient-to-b from-[#0B3D32] to-[#07251E] text-white py-8 px-4 sm:px-8 shadow-inner">
        <div className="max-w-6xl mx-auto space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Direct Online Booking Guarantee
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Select Your Sanctuary & Rooms
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Enjoy verified real-time room availability, complimentary high-speed Wi-Fi, artisan
              breakfast, and flexible cancellation policies.
            </p>
          </div>

          {/* DATES & GUEST BAR */}
          <div className="bg-white dark:bg-[#061F1A] text-slate-800 dark:text-slate-100 p-3 rounded-md shadow-lg border border-slate-200 dark:border-[#145447] grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check-In Date
              </label>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-[#092B23] border border-slate-300 dark:border-[#175C4F] rounded-sm text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#A51F36]" />
                <input
                  type="date"
                  value={checkInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="bg-transparent focus:outline-hidden w-full font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check-Out Date
              </label>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-[#092B23] border border-slate-300 dark:border-[#175C4F] rounded-sm text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#A51F36]" />
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="bg-transparent focus:outline-hidden w-full font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Guests Count
              </label>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-[#092B23] border border-slate-300 dark:border-[#175C4F] rounded-sm text-xs">
                <Users className="w-3.5 h-3.5 text-[#A51F36]" />
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
                  className="bg-transparent focus:outline-hidden w-full font-medium"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6 Guests (Family)</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <div className="w-full text-center py-2 px-3 bg-emerald-50 dark:bg-[#0A3329] border border-emerald-200 dark:border-emerald-800/60 rounded-sm text-xs font-semibold text-[#0B3D32] dark:text-emerald-300">
                {nights} Night{nights > 1 ? 's' : ''} Stay
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ROOM CATALOG & FILTERS */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#145447]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Room Type:</span>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-all',
                selectedTypeFilter === 'all'
                  ? 'bg-[#A51F36] text-white border-[#A51F36]'
                  : 'bg-white dark:bg-[#071F1A] border-slate-300 dark:border-[#145447] text-slate-700 dark:text-slate-300'
              )}
            >
              All Types ({rooms.length})
            </button>
            {roomTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTypeFilter(t)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full border transition-all',
                  selectedTypeFilter === t
                    ? 'bg-[#A51F36] text-white border-[#A51F36]'
                    : 'bg-white dark:bg-[#071F1A] border-slate-300 dark:border-[#145447] text-slate-700 dark:text-slate-300'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Climate:</span>
            <select
              value={selectedAcFilter}
              onChange={(e) => setSelectedAcFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-[#145447] rounded-sm"
            >
              <option value="all">All Climate Options</option>
              <option value="AC">Air Conditioned (AC)</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
        </div>

        {/* ROOM CARDS LIST */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading hotel suites & rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-[#145447] rounded-lg space-y-2">
            <BedDouble className="w-8 h-8 mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No rooms match your filter criteria
            </h3>
            <p className="text-xs text-slate-500">
              Try adjusting the dates, guest count, or room type filter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRooms.map((room) => {
              const coverPhoto =
                (room.photos && room.photos.find((p) => p.isCover)) ||
                (room.photos && room.photos[0]) || {
                  url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900',
                  caption: 'Room Preview',
                };
              const hasPhotos = room.photos && room.photos.length > 0;
              const totalPrice = room.pricePerNight * nights;

              return (
                <div
                  key={room.id}
                  className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row"
                >
                  {/* Photo Section */}
                  <div className="md:w-80 shrink-0 relative bg-slate-100 dark:bg-[#092B23] overflow-hidden group">
                    <img
                      src={coverPhoto.url}
                      alt={room.type}
                      className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A51F36] text-white shadow-xs">
                        {room.type}
                      </span>
                      {room.acType && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                          {room.acType}
                        </span>
                      )}
                    </div>

                    {hasPhotos && room.photos!.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhotoRoom(room);
                          setActivePhotoIndex(0);
                        }}
                        className="absolute bottom-2 right-2 px-2 py-1 text-[10px] font-bold bg-black/70 hover:bg-black/90 text-white rounded-sm backdrop-blur-xs flex items-center gap-1 shadow-xs"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>View Gallery ({room.photos!.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Room Details & Pricing Section */}
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Title & Specs */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {room.type}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {room.roomSize && (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                📐 {room.roomSize}
                              </span>
                            )}
                            {room.roomView && (
                              <span>• 🏞️ {room.roomView}</span>
                            )}
                            <span>• 👥 Sleeps up to {room.capacity} Guests</span>
                            {room.smokingPolicy && (
                              <span>• 🚭 {room.smokingPolicy}</span>
                            )}
                          </div>
                        </div>

                        {/* Rate Box */}
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[11px] text-slate-400">Nightly Rate</span>
                          <div className="text-lg font-extrabold text-[#A51F36] dark:text-rose-400 font-mono">
                            NPR {room.pricePerNight.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {nights > 1 ? `Total: NPR ${totalPrice.toLocaleString()} (${nights} nights)` : 'Taxes included at checkout'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {room.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      {/* Bedding Configuration */}
                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#A51F36]" />
                        <span className="font-semibold">Bedding:</span>
                        <span>
                          {room.bedConfiguration && room.bedConfiguration.length > 0
                            ? room.bedConfiguration.map((b) => `${b.count}x ${b.bedType}`).join(', ')
                            : room.bedType}
                        </span>
                      </div>

                      {/* Bathroom Facilities (Only configured) */}
                      {room.bathroomFacilities && room.bathroomFacilities.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Bathroom & Toiletries:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {room.bathroomFacilities.map((fac) => (
                              <span
                                key={fac}
                                className="text-[10px] px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-[#0B332A] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#175C4F]"
                              >
                                ✓ {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities (Only configured) */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Room Amenities:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.map((a) => (
                              <span
                                key={a}
                                className="text-[10px] px-2 py-0.5 rounded-xs bg-emerald-50 dark:bg-[#06241E] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#145447] flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {room.policies?.cancellationPolicy ||
                            'Free cancellation up to 24h prior to check-in'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingRoom(room);
                          setBookingConfirmed(null);
                        }}
                        className="px-5 py-2 text-xs font-bold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>Reserve Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. MODAL: PHOTO GALLERY LIGHTBOX */}
      {selectedPhotoRoom && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold">{selectedPhotoRoom.type} Gallery</h3>
              <p className="text-xs text-white/60">
                Photo {activePhotoIndex + 1} of {selectedPhotoRoom.photos?.length || 1}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhotoRoom(null)}
              className="p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden py-4">
            {selectedPhotoRoom.photos && selectedPhotoRoom.photos[activePhotoIndex] && (
              <img
                src={selectedPhotoRoom.photos[activePhotoIndex].url}
                alt="Room detail"
                className="max-h-[70vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
              />
            )}

            {selectedPhotoRoom.photos && selectedPhotoRoom.photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? selectedPhotoRoom.photos!.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-xs"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === selectedPhotoRoom.photos!.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-xs"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Strip */}
          <div className="flex justify-center gap-2 overflow-x-auto py-2">
            {selectedPhotoRoom.photos?.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={cn(
                  'w-16 h-12 rounded-sm overflow-hidden border-2 transition-all shrink-0',
                  activePhotoIndex === idx ? 'border-[#A51F36] scale-105' : 'border-transparent opacity-60'
                )}
              >
                <img src={p.url} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. MODAL: INSTANT BOOKING DIALOG */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] w-full max-w-lg rounded-md shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Reservation: {bookingRoom.type}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {checkInDate} to {checkOutDate} ({nights} night{nights > 1 ? 's' : ''}) •{' '}
                  {guestCount} Guest{guestCount > 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingRoom(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingConfirmed ? (
              /* BOOKING CONFIRMATION VOUCHER */
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Reservation Confirmed!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Booking Reference:{' '}
                    <span className="font-mono font-bold text-[#A51F36] dark:text-rose-400">
                      {bookingConfirmed.bookingCode}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-[#061814] p-3 rounded-md border border-slate-200 dark:border-[#145447] text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guest:</span>
                    <span className="font-semibold">{bookingConfirmed.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suite:</span>
                    <span className="font-semibold">{bookingConfirmed.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Due at Check-In:</span>
                    <span className="font-bold text-[#0B3D32] dark:text-emerald-400">
                      NPR {bookingConfirmed.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBookingRoom(null);
                    setBookingConfirmed(null);
                  }}
                  className="w-full py-2 bg-[#A51F36] text-white text-xs font-bold rounded-sm shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              /* GUEST DETAILS FORM */
              <form onSubmit={handleConfirmBooking} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestFirstName}
                      onChange={(e) => setGuestFirstName(e.target.value)}
                      placeholder="e.g. Aarav"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestLastName}
                      onChange={(e) => setGuestLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="aarav@example.com"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+977 9800000000"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="High floor, quiet room, late check-in, etc."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                  />
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-slate-50 dark:bg-[#061814] rounded-md border border-slate-200 dark:border-[#145447] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">
                      Total ({nights} night{nights > 1 ? 's' : ''}):
                    </span>
                    <div className="text-sm font-extrabold text-[#A51F36] dark:text-rose-400">
                      NPR {(bookingRoom.pricePerNight * nights).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Pay at Hotel or Upon Arrival
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#145447] rounded-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-bold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isSubmitting ? 'Confirming...' : 'Confirm Reservation'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
