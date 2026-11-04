'use client';

import React, { useState } from 'react';
import {
  X,
  Edit3,
  Check,
  BedDouble,
  Bath,
  Wifi,
  Sparkles,
  Info,
  CalendarCheck,
  ShieldCheck,
  Users,
  Maximize2,
  Wind,
  Layers,
} from 'lucide-react';
import { RoomRecord } from '@/lib/hotelRoomsData';
import { cn } from '@/lib/utils';

export interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomRecord | null;
  onEdit?: (room: RoomRecord) => void;
}

export function RoomDetailsModal({
  isOpen,
  onClose,
  room,
  onEdit,
}: RoomDetailsModalProps) {
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);

  if (!isOpen || !room) return null;

  const photos = room.photos && room.photos.length > 0 ? room.photos : [];
  const currentPhoto = photos[selectedPhotoIdx] || photos[0];

  const statusColors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    OCCUPIED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#A51F36]/10 text-[#A51F36] dark:bg-rose-950/60 dark:text-rose-300">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Room {room.number}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-xs bg-[#A51F36]/10 text-[#A51F36] dark:bg-rose-950/60 dark:text-rose-300">
                  {room.type}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    statusColors[room.operationalStatus] || statusColors.AVAILABLE
                  )}
                >
                  {room.operationalStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Floor {room.floor} • {room.bedType} • {room.acType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(room);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-sm bg-[#A51F36] hover:bg-[#8B1A2D] text-white shadow-2xs transition-colors"
                title="Edit this room"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* 1. PHOTO GALLERY (IF PHOTOS EXIST) */}
          {photos.length > 0 && currentPhoto ? (
            <div className="space-y-2.5">
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-slate-900 border border-slate-200 dark:border-[#145447]">
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || `Room ${room.number}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {currentPhoto.isCover && (
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#A51F36] text-white shadow-xs">
                      MAIN COVER
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                    {currentPhoto.category}
                  </span>
                </div>
                {currentPhoto.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-medium">
                    {currentPhoto.caption}
                  </div>
                )}
              </div>

              {/* Thumbnails strip */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {photos.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPhotoIdx(idx)}
                      className={cn(
                        'relative w-20 aspect-video rounded-xs overflow-hidden border shrink-0 transition-all',
                        selectedPhotoIdx === idx
                          ? 'border-[#A51F36] ring-2 ring-[#A51F36]/40 scale-105'
                          : 'border-slate-300 dark:border-[#16584B] opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={p.url} alt={p.caption || 'Thumbnail'} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* 2. KEY STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Room Fare / Night
              </span>
              <div className="text-sm font-bold text-[#A51F36] dark:text-rose-400 font-mono">
                NPR {room.pricePerNight.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Max Occupancy
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{room.capacity} Guests</span>
                {room.maxAdults && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({room.maxAdults}A {room.maxChildren ? `/ ${room.maxChildren}C` : ''})
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Climate System
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{room.acType}</span>
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Bed Type
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{room.bedType}</span>
              </div>
            </div>
          </div>

          {/* 3. ADDITIONAL SPECIFICATIONS */}
          {(room.roomSize || room.roomView || room.smokingPolicy || room.accessibility) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {room.roomSize && (
                <div className="p-2.5 rounded-sm bg-slate-50/70 dark:bg-[#061814] border border-slate-200 dark:border-[#145447]">
                  <span className="text-[10px] text-slate-400 block">Room Size</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{room.roomSize}</span>
                </div>
              )}
              {room.roomView && (
                <div className="p-2.5 rounded-sm bg-slate-50/70 dark:bg-[#061814] border border-slate-200 dark:border-[#145447]">
                  <span className="text-[10px] text-slate-400 block">Room View</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{room.roomView}</span>
                </div>
              )}
              {room.smokingPolicy && (
                <div className="p-2.5 rounded-sm bg-slate-50/70 dark:bg-[#061814] border border-slate-200 dark:border-[#145447]">
                  <span className="text-[10px] text-slate-400 block">Smoking Policy</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{room.smokingPolicy}</span>
                </div>
              )}
              {room.accessibility && (
                <div className="p-2.5 rounded-sm bg-slate-50/70 dark:bg-[#061814] border border-slate-200 dark:border-[#145447]">
                  <span className="text-[10px] text-slate-400 block">Accessibility</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{room.accessibility}</span>
                </div>
              )}
            </div>
          )}

          {/* 4. DESCRIPTION */}
          {room.description && (
            <div className="p-3.5 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50/50 dark:bg-[#061814] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Room Description
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {room.description}
              </p>
            </div>
          )}

          {/* 5. BED CONFIGURATION */}
          {room.bedConfiguration && room.bedConfiguration.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#A51F36]" />
                Bed Configuration
              </span>
              <div className="flex flex-wrap gap-2">
                {room.bedConfiguration.map((b, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-sm border border-slate-200 dark:border-[#145447] bg-white dark:bg-[#071F1A] text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span className="font-bold text-[#A51F36] dark:text-rose-400 mr-1.5">{b.count}x</span>
                    <span>{b.bedType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. BATHROOM FACILITIES */}
          {room.bathroomFacilities && room.bathroomFacilities.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-[#A51F36]" />
                Bathroom Facilities ({room.bathroomFacilities.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {room.bathroomFacilities.map((fac, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs bg-slate-100 dark:bg-[#082820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#145447]"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 7. ROOM AMENITIES */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-[#A51F36]" />
                Room Amenities ({room.amenities.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((am, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs bg-slate-100 dark:bg-[#082820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#145447]"
                  >
                    <Check className="w-3 h-3 text-[#A51F36] dark:text-rose-400" />
                    <span>{am}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 8. ROOM POLICIES */}
          {room.policies && (
            <div className="p-4 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50/70 dark:bg-[#061814] space-y-2.5 text-xs">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#A51F36]" />
                Room Policies & Rules
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                {room.policies.checkInTime && (
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Check-In: </span>
                    <span>{room.policies.checkInTime}</span>
                  </div>
                )}
                {room.policies.checkOutTime && (
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Check-Out: </span>
                    <span>{room.policies.checkOutTime}</span>
                  </div>
                )}
                {room.policies.cancellationPolicy && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cancellation: </span>
                    <span>{room.policies.cancellationPolicy}</span>
                  </div>
                )}
                {room.policies.childPolicy && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Child Policy: </span>
                    <span>{room.policies.childPolicy}</span>
                  </div>
                )}
                {room.policies.petPolicy && (
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Pets: </span>
                    <span>{room.policies.petPolicy}</span>
                  </div>
                )}
                {room.policies.customRules && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Rules: </span>
                    <span>{room.policies.customRules}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Room ID: {room.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-sm border border-slate-300 dark:border-[#16584B] bg-white dark:bg-[#071F1A] text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(room);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-sm bg-[#A51F36] hover:bg-[#8B1A2D] text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Room</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

