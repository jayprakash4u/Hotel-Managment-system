'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BedDouble, Calendar, User, ArrowRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { RoomWithDetails, ReservationData, GuestData } from '@/lib/types';
import { RoomStatusBadge, VipBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

export const QuickSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [rData, resData, gData] = await Promise.all([
          api.getRooms(),
          api.getReservations(),
          api.getGuests(),
        ]);
        setRooms(rData);
        setReservations(resData);
        setGuests(gData);
      } catch (e) {
        console.error('QuickSearch load error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRooms = query
    ? rooms.filter(
        (r) =>
          r.number.toLowerCase().includes(query.toLowerCase()) ||
          r.type.toLowerCase().includes(query.toLowerCase())
      )
    : rooms.slice(0, 4);

  const filteredReservations = query
    ? reservations.filter(
        (res) =>
          res.bookingCode.toLowerCase().includes(query.toLowerCase()) ||
          res.guest.firstName.toLowerCase().includes(query.toLowerCase()) ||
          res.guest.lastName.toLowerCase().includes(query.toLowerCase()) ||
          res.room.number.toLowerCase().includes(query.toLowerCase())
      )
    : reservations.slice(0, 3);

  const filteredGuests = query
    ? guests.filter(
        (g) =>
          g.firstName.toLowerCase().includes(query.toLowerCase()) ||
          g.lastName.toLowerCase().includes(query.toLowerCase()) ||
          g.email.toLowerCase().includes(query.toLowerCase()) ||
          g.phone.toLowerCase().includes(query.toLowerCase())
      )
    : guests.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-[#24352F]/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-[#DCE3DF] dark:bg-[#0d1e19] dark:border-[#1a332c] rounded-2xl shadow-modal overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-[#E4E9E5] dark:border-[#145447]/60">
          <Search className="w-5 h-5 text-[#0B3D32] dark:text-[#E5EEE9] shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search room # (e.g. 501), guest name, or booking reference (RES-...)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 bg-transparent text-[#24352F] dark:text-white placeholder-[#7A8982] text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#64736C] hover:text-[#24352F] dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-[#64736C] bg-[#F2F4F2] dark:bg-[#072D26] dark:text-[#B7CDC3] border border-[#CBD5D0] dark:border-[#145447] px-2 py-0.5 rounded-md ml-2 shrink-0">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Rooms Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              <BedDouble className="w-3.5 h-3.5" />
              <span>Rooms & Suites ({filteredRooms.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    onClose();
                    router.push(`/front-desk?room=${room.number}`);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F2F4F2] hover:bg-[#E8F2EE] border border-[#DCE3DF] dark:bg-[#071512]/60 dark:hover:bg-[#072D26] dark:border-[#145447] transition-all text-left group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-base text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-[#4ADE80] transition-colors">
                        Room {room.number}
                      </span>
                      <RoomStatusBadge status={room.status} />
                    </div>
                    <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-0.5">{room.type}</p>
                  </div>
                  <span className="text-xs font-bold text-[#0B3D32] dark:text-[#4ADE80]">{formatCurrency(room.pricePerNight)}/nt</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reservations Section */}
          {filteredReservations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#64736C] dark:text-[#94A3B8] mb-2">
                <Calendar className="w-3.5 h-3.5 text-[#0B3D32]" />
                <span>Reservations ({filteredReservations.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredReservations.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      onClose();
                      router.push(`/reservations?code=${res.bookingCode}`);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#F2F4F2] hover:bg-[#E8F2EE] border border-[#DCE3DF] dark:bg-[#071512]/60 dark:hover:bg-[#072D26] dark:border-[#145447] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] font-bold text-xs">
                        {res.room.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-[#4ADE80] transition-colors">
                            {res.guest.firstName} {res.guest.lastName}
                          </span>
                          <span className="text-[10px] text-[#64736C]">({res.bookingCode})</span>
                        </div>
                        <p className="text-[11px] text-[#64736C]">{res.room.type} • Status: {res.status}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#64736C] group-hover:text-[#0B3D32] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guests Section */}
          {filteredGuests.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#64736C] dark:text-[#94A3B8] mb-2">
                <User className="w-3.5 h-3.5 text-[#0B3D32]" />
                <span>Guests CRM ({filteredGuests.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredGuests.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onClose();
                      router.push(`/reports?search=${encodeURIComponent(g.lastName)}`);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F2F4F2] hover:bg-[#E8F2EE] border border-[#DCE3DF] dark:bg-[#071512]/60 dark:hover:bg-[#072D26] dark:border-[#145447] transition-all text-left group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-[#4ADE80] transition-colors">
                          {g.firstName} {g.lastName}
                        </span>
                        <VipBadge tier={g.vipTier} />
                      </div>
                      <p className="text-[11px] text-[#64736C] dark:text-[#94A3B8] mt-0.5">{g.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
