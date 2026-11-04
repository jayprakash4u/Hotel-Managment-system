'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  BedDouble,
  Bath,
  Tv,
  Wifi,
  Sparkles,
  Shield,
  Eye,
  Sliders,
  DollarSign,
  Maximize2,
  Upload,
  ArrowRight,
  Info,
  Calendar,
  Building2,
  Wind,
  Layers,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import {
  RoomRecord,
  PhotoItem,
  PhotoCategory,
  BedConfigItem,
  RoomPolicies,
  STANDARD_BED_TYPES,
  STANDARD_BATHROOM_FACILITIES,
  AMENITY_CATEGORIES,
} from '@/lib/hotelRoomsData';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export interface RoomSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomData: RoomRecord, andAddAnother?: boolean) => void;
  initialRoom?: RoomRecord | null;
  existingRoomTypes?: string[];
  existingFloors?: string[];
}

type SetupMode = 'quick' | 'detailed';
type DetailedSection =
  | 'basic'
  | 'photos'
  | 'beds'
  | 'bath'
  | 'amenities'
  | 'pricing'
  | 'policies'
  | 'preview';

const PHOTO_PRESETS: { label: string; url: string; category: PhotoCategory }[] = [
  {
    label: 'Modern Deluxe Bed',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&auto=format&fit=crop&q=80',
    category: 'COVER',
  },
  {
    label: 'Luxury Suite Interior',
    url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&auto=format&fit=crop&q=80',
    category: 'BEDROOM',
  },
  {
    label: 'Rain Shower Bath',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&auto=format&fit=crop&q=80',
    category: 'BATHROOM',
  },
  {
    label: 'Scenic Balcony',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80',
    category: 'BALCONY',
  },
  {
    label: 'Penthouse Panorama',
    url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=80',
    category: 'VIEW',
  },
];

export function RoomSetupModal({
  isOpen,
  onClose,
  onSave,
  initialRoom,
  existingRoomTypes = ['Deluxe Room', 'Standard Room', 'Executive Suite', 'Presidential Suite', 'Family Suite'],
  existingFloors = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'],
}: RoomSetupModalProps) {
  const { success, error } = useToast();

  // Mode: Default to 'quick' when creating new, or 'detailed' if editing an existing room with detailed data
  const [mode, setMode] = useState<SetupMode>('quick');
  const [activeSection, setActiveSection] = useState<DetailedSection>('basic');

  // Form State
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [floorLevel, setFloorLevel] = useState<string>('1st Floor');
  const [roomType, setRoomType] = useState<string>('Deluxe Room');
  const [customRoomType, setCustomRoomType] = useState<string>('');
  const [pricePerNight, setPricePerNight] = useState<number>(3500);
  const [capacity, setCapacity] = useState<number>(2);
  const [acType, setAcType] = useState<'AC' | 'Non-AC'>('AC');
  const [bedType, setBedType] = useState<string>('King Bed');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [roomSize, setRoomSize] = useState<string>('350 sq ft');
  const [roomView, setRoomView] = useState<string>('Garden View');

  // Detailed Form State
  const [maxAdults, setMaxAdults] = useState<number>(2);
  const [maxChildren, setMaxChildren] = useState<number>(1);
  const [smokingPolicy, setSmokingPolicy] = useState<'Non-Smoking' | 'Smoking Permitted'>('Non-Smoking');
  const [accessibility, setAccessibility] = useState<string>('');
  const [bedConfigs, setBedConfigs] = useState<BedConfigItem[]>([{ bedType: 'King Bed', count: 1 }]);
  const [selectedBathroomFacilities, setSelectedBathroomFacilities] = useState<string[]>([
    'Private Bathroom',
    'Rain Shower',
    'Hot and Cold Water',
    'Fresh Towels',
  ]);
  const [customBathroomFacility, setCustomBathroomFacility] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Air Conditioning',
    'Free High-Speed Wi-Fi',
    'Complimentary Drinking Water',
  ]);
  const [customAmenity, setCustomAmenity] = useState<string>('');
  const [amenitySearch, setAmenitySearch] = useState<string>('');

  // Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<PhotoCategory>('COVER');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Pricing
  const [extraAdultPrice, setExtraAdultPrice] = useState<number>(0);
  const [extraChildPrice, setExtraChildPrice] = useState<number>(0);
  const [weekendPrice, setWeekendPrice] = useState<number>(0);

  // Policies
  const [policies, setPolicies] = useState<RoomPolicies>({
    checkInTime: '02:00 PM',
    checkOutTime: '11:00 AM',
    cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in',
    childPolicy: 'Children under 6 stay free when using existing bedding',
    petPolicy: 'Pets not permitted',
    extraBedPolicy: 'Extra rollaway bed available on request for NPR 1,000 / night',
    customRules: 'Quiet hours between 10:00 PM and 07:00 AM. No parties or excessive noise.',
  });

  // Populate initial data on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialRoom) {
      setRoomNumber(initialRoom.number || '');
      setFloorLevel(
        initialRoom.floor ? `${initialRoom.floor}${initialRoom.floor === 1 ? 'st' : initialRoom.floor === 2 ? 'nd' : initialRoom.floor === 3 ? 'rd' : 'th'} Floor` : '1st Floor'
      );
      setRoomType(initialRoom.type || 'Deluxe Room');
      setPricePerNight(initialRoom.pricePerNight || 3500);
      setCapacity(initialRoom.capacity || 2);
      setAcType(initialRoom.acType?.includes('Non') ? 'Non-AC' : (initialRoom.acType === 'AC' ? 'AC' : 'AC'));
      setBedType(initialRoom.bedType || 'King Bed');
      setShortDescription(initialRoom.description || '');
      setRoomSize(initialRoom.roomSize || '350 sq ft');
      setRoomView(initialRoom.roomView || 'Garden View');

      setMaxAdults(initialRoom.maxAdults ?? initialRoom.capacity ?? 2);
      setMaxChildren(initialRoom.maxChildren ?? 1);
      setSmokingPolicy(initialRoom.smokingPolicy || 'Non-Smoking');
      setAccessibility(initialRoom.accessibility || '');
      setBedConfigs(
        initialRoom.bedConfiguration && initialRoom.bedConfiguration.length > 0
          ? initialRoom.bedConfiguration
          : [{ bedType: initialRoom.bedType || 'King Bed', count: 1 }]
      );
      setSelectedBathroomFacilities(
        initialRoom.bathroomFacilities && initialRoom.bathroomFacilities.length > 0
          ? initialRoom.bathroomFacilities
          : ['Private Bathroom', 'Rain Shower', 'Hot and Cold Water']
      );
      setSelectedAmenities(
        initialRoom.amenities && initialRoom.amenities.length > 0
          ? initialRoom.amenities
          : ['Air Conditioning', 'Free High-Speed Wi-Fi']
      );
      setPhotos(initialRoom.photos || []);
      setExtraAdultPrice(initialRoom.extraAdultPrice || 0);
      setExtraChildPrice(initialRoom.extraChildPrice || 0);
      setWeekendPrice(initialRoom.weekendPrice || 0);
      if (initialRoom.policies) {
        setPolicies(initialRoom.policies);
      }

      // Default to detailed if it has rich info, else quick
      setMode(initialRoom.photos && initialRoom.photos.length > 0 ? 'detailed' : 'quick');
    } else {
      // New room reset
      setRoomNumber('');
      setFloorLevel(existingFloors[0] || '1st Floor');
      setRoomType(existingRoomTypes[0] || 'Deluxe Room');
      setCustomRoomType('');
      setPricePerNight(3500);
      setCapacity(2);
      setAcType('AC');
      setBedType('King Bed');
      setShortDescription('');
      setRoomSize('350 sq ft');
      setRoomView('Garden View');
      setMaxAdults(2);
      setMaxChildren(1);
      setSmokingPolicy('Non-Smoking');
      setAccessibility('');
      setBedConfigs([{ bedType: 'King Bed', count: 1 }]);
      setSelectedBathroomFacilities(['Private Bathroom', 'Rain Shower', 'Hot and Cold Water', 'Fresh Towels']);
      setSelectedAmenities(['Air Conditioning', 'Free High-Speed Wi-Fi', 'Complimentary Drinking Water']);
      setPhotos([
        {
          id: `p-${Date.now()}`,
          url: PHOTO_PRESETS[0].url,
          caption: 'Deluxe Bedroom',
          category: 'COVER',
          isCover: true,
        },
      ]);
      setExtraAdultPrice(0);
      setExtraChildPrice(0);
      setWeekendPrice(0);
      setMode('quick');
      setActiveSection('basic');
    }
  }, [isOpen, initialRoom]);

  // Derived effective room type
  const effectiveRoomType = roomType === '__custom__' ? customRoomType.trim() || 'Custom Room' : roomType;

  // Toggle bathroom facility
  const toggleBathroomFacility = (fac: string) => {
    setSelectedBathroomFacilities((prev) =>
      prev.includes(fac) ? prev.filter((item) => item !== fac) : [...prev, fac]
    );
  };

  const handleAddCustomBathroomFacility = () => {
    if (!customBathroomFacility.trim()) return;
    const name = customBathroomFacility.trim();
    if (!selectedBathroomFacilities.includes(name)) {
      setSelectedBathroomFacilities((prev) => [...prev, name]);
    }
    setCustomBathroomFacility('');
  };

  // Toggle amenity
  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    const name = customAmenity.trim();
    if (!selectedAmenities.includes(name)) {
      setSelectedAmenities((prev) => [...prev, name]);
    }
    setCustomAmenity('');
  };

  // Bed configuration handlers
  const updateBedCount = (index: number, delta: number) => {
    setBedConfigs((prev) =>
      prev
        .map((b, i) => (i === index ? { ...b, count: Math.max(1, b.count + delta) } : b))
        .filter((b) => b.count > 0)
    );
  };

  const addBedType = (typeToAdd: string) => {
    if (bedConfigs.some((b) => b.bedType === typeToAdd)) {
      setBedConfigs((prev) =>
        prev.map((b) => (b.bedType === typeToAdd ? { ...b, count: b.count + 1 } : b))
      );
    } else {
      setBedConfigs((prev) => [...prev, { bedType: typeToAdd, count: 1 }]);
    }
  };

  const removeBedConfig = (index: number) => {
    setBedConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  // Photo handlers
  const handleAddPhotoFromUrl = () => {
    if (!newPhotoUrl.trim()) return;
    const isFirst = photos.length === 0;
    const newPhoto: PhotoItem = {
      id: `p-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || undefined,
      category: newPhotoCategory,
      isCover: isFirst || newPhotoCategory === 'COVER',
    };

    if (newPhoto.isCover) {
      setPhotos((prev) => [newPhoto, ...prev.map((p) => ({ ...p, isCover: false }))]);
    } else {
      setPhotos((prev) => [...prev, newPhoto]);
    }

    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  const handleSetCoverPhoto = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === photoId,
        category: p.id === photoId ? 'COVER' : p.category,
      }))
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== photoId);
      if (filtered.length > 0 && !filtered.some((p) => p.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        let uploadedUrl: string | null = null;
        try {
          const res = await fetch('/api/rooms/upload-photo', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data?.url) uploadedUrl = data.data.url;
          }
        } catch {
          // Fallback to local data URL if offline/sandboxed
        }

        if (!uploadedUrl) {
          uploadedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const isCover = photos.length === 0 && i === 0;
        const newPhoto: PhotoItem = {
          id: `p-${Date.now()}-${i}`,
          url: uploadedUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          category: isCover ? 'COVER' : 'BEDROOM',
          isCover,
        };

        setPhotos((prev) => (isCover ? [newPhoto, ...prev] : [...prev, newPhoto]));
      }
      success('Photos Uploaded', `${files.length} photo(s) added successfully.`);
    } catch {
      error('Upload Failed', 'Unable to process image file.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Build the complete RoomRecord
  const buildRoomData = (): RoomRecord => {
    const floorInt = parseInt(floorLevel.replace(/\D/g, ''), 10) || 1;
    const coverPhoto = photos.find((p) => p.isCover) || photos[0];

    return {
      id: initialRoom?.id || `rm-${Date.now()}`,
      number: roomNumber.trim(),
      floor: floorInt,
      type: effectiveRoomType,
      bedType,
      acType,
      pricePerNight: Number(pricePerNight) || 3500,
      capacity: Number(capacity) || 2,
      operationalStatus: initialRoom?.operationalStatus || 'AVAILABLE',
      cleaningStatus: initialRoom?.cleaningStatus || 'CLEAN',
      description: shortDescription.trim() || undefined,
      roomSize: roomSize.trim() || undefined,
      roomView: roomView.trim() || undefined,
      maxAdults: Number(maxAdults) || Number(capacity) || 2,
      maxChildren: Number(maxChildren) || 1,
      smokingPolicy,
      accessibility: accessibility.trim() || undefined,
      bedConfiguration: bedConfigs,
      bathroomFacilities: selectedBathroomFacilities,
      amenities: selectedAmenities,
      photos: photos.map((p, idx) => ({ ...p, isCover: coverPhoto ? p.id === coverPhoto.id : idx === 0 })),
      extraAdultPrice: Number(extraAdultPrice) || 0,
      extraChildPrice: Number(extraChildPrice) || 0,
      weekendPrice: Number(weekendPrice) || 0,
      policies,
    };
  };

  // Validate & Save
  const handleSave = (andAddAnother = false) => {
    if (!roomNumber.trim()) {
      error('Validation Error', 'Room Number is required.');
      return;
    }
    if (!effectiveRoomType.trim()) {
      error('Validation Error', 'Room Type Name is required.');
      return;
    }
    if (pricePerNight <= 0) {
      error('Validation Error', 'Room Price must be greater than 0.');
      return;
    }

    const roomData = buildRoomData();
    onSave(roomData, andAddAnother);

    if (andAddAnother) {
      // Keep type and floor, increment room number if numeric
      const currentNum = parseInt(roomNumber.trim(), 10);
      if (!isNaN(currentNum)) {
        setRoomNumber((currentNum + 1).toString());
      } else {
        setRoomNumber('');
      }
      success('Room Saved', `Room ${roomData.number} saved. Ready for next room.`);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] w-full max-w-4xl max-h-[92vh] rounded-md shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* HEADER */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-[#145447] flex items-center justify-between bg-slate-50 dark:bg-[#061814]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#A51F36]/10 text-[#A51F36] dark:text-rose-400 flex items-center justify-center">
              <BedDouble className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {initialRoom ? `Edit Room ${initialRoom.number}` : 'Room Setup & Inventory'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'quick'
                  ? 'Quick Setup: Essential parameters for instant room creation'
                  : 'Detailed Setup: Photos, facilities, bedding, pricing & customer portal presentation'}
              </p>
            </div>
          </div>

          {/* MODE TOGGLE PILL */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200 dark:bg-[#0B332A] p-0.5 rounded-sm border border-slate-300 dark:border-[#175C4F]">
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5',
                  mode === 'quick'
                    ? 'bg-white dark:bg-[#0E4237] text-[#A51F36] dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                )}
              >
                <span>Quick Setup</span>
                <span className="text-[9px] px-1 py-0.2 rounded-xs bg-[#A51F36]/10 text-[#A51F36] dark:bg-rose-950 dark:text-rose-300 font-bold">
                  Default
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('detailed')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5',
                  mode === 'detailed'
                    ? 'bg-white dark:bg-[#0E4237] text-[#A51F36] dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                )}
              >
                <Sliders className="w-3 h-3" />
                <span>Detailed Setup</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-sm hover:bg-slate-200/50 dark:hover:bg-[#145447]/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mode === 'quick' ? (
            /* =========================================================================
               QUICK SETUP (DEFAULT) - SHORT, MINIMAL, SENSIBLE DEFAULTS
               ========================================================================= */
            <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
              {/* Mandatory Fields Box */}
              <div className="space-y-4 bg-slate-50/70 dark:bg-[#061814]/40 p-4 rounded-md border border-slate-200 dark:border-[#145447]/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A51F36] dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A51F36]" />
                  Essential Information (Required)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Room Number */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Room Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 101, 204"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                      autoFocus
                    />
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Room Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                    >
                      {existingRoomTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Type...</option>
                    </select>
                    {roomType === '__custom__' && (
                      <input
                        type="text"
                        value={customRoomType}
                        onChange={(e) => setCustomRoomType(e.target.value)}
                        placeholder="Enter room type name"
                        className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                      />
                    )}
                  </div>

                  {/* Maximum Occupancy */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Maximum Occupancy <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                      />
                      <span className="text-xs text-slate-500 whitespace-nowrap">Guests</span>
                    </div>
                  </div>

                  {/* Room Price */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Room Price / Night <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        NPR
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                        className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Quick Fields */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Optional Room Specifications
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Bed Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Bed Type
                    </label>
                    <select
                      value={bedType}
                      onChange={(e) => setBedType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                    >
                      {STANDARD_BED_TYPES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Floor */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Floor
                    </label>
                    <select
                      value={floorLevel}
                      onChange={(e) => setFloorLevel(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                    >
                      {existingFloors.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AC Option */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Climate
                    </label>
                    <select
                      value={acType}
                      onChange={(e) => setAcType(e.target.value as 'AC' | 'Non-AC')}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                    >
                      <option value="AC">Air Conditioned (AC)</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                  </div>

                  {/* Room Size */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Room Size
                    </label>
                    <input
                      type="text"
                      value={roomSize}
                      onChange={(e) => setRoomSize(e.target.value)}
                      placeholder="e.g. 320 sq ft / 30 m²"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                    />
                  </div>

                  {/* Room View */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Room View
                    </label>
                    <input
                      type="text"
                      value={roomView}
                      onChange={(e) => setRoomView(e.target.value)}
                      placeholder="e.g. Mountain View, Garden View, City View"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Short Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief description for front desk and booking display..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                  />
                </div>
              </div>

              {/* Callout to switch to detailed */}
              <div className="flex items-center justify-between p-3 rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Need to add photos, bathroom amenities, or online booking policies?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('detailed')}
                  className="font-bold text-[#A51F36] hover:underline dark:text-rose-400 flex items-center gap-1 whitespace-nowrap ml-2"
                >
                  <span>Switch to Detailed Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               DETAILED SETUP - 8 SECTION PROGRESSIVE LAYOUT
               ========================================================================= */
            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left Sub-Navigation */}
              <div className="w-full md:w-56 shrink-0 bg-slate-50 dark:bg-[#061814] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#145447] p-2 space-y-0.5">
                {[
                  { id: 'basic', label: '1. Basic Information', icon: Info },
                  { id: 'photos', label: '2. Room Photos', icon: ImageIcon, count: photos.length },
                  { id: 'beds', label: '3. Bed Configuration', icon: BedDouble },
                  { id: 'bath', label: '4. Bathroom Facilities', icon: Bath, count: selectedBathroomFacilities.length },
                  { id: 'amenities', label: '5. Room Amenities', icon: Wifi, count: selectedAmenities.length },
                  { id: 'pricing', label: '6. Pricing & Charges', icon: DollarSign },
                  { id: 'policies', label: '7. Policies & Rules', icon: Shield },
                  { id: 'preview', label: '8. Customer Preview', icon: Eye, highlight: true },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSection(s.id as DetailedSection)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-sm transition-colors text-left',
                        isActive
                          ? 'bg-[#A51F36] text-white font-semibold shadow-xs dark:bg-rose-900'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#0E3E33]',
                        s.highlight && !isActive && 'text-[#A51F36] dark:text-rose-400 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </div>
                      {typeof s.count === 'number' && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-[#155447] text-slate-600 dark:text-slate-300'
                          )}
                        >
                          {s.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {/* 1. BASIC INFORMATION */}
                {activeSection === 'basic' && (
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#A51F36]" />
                      Basic Room Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Room Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="e.g. 101"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Floor Level
                        </label>
                        <select
                          value={floorLevel}
                          onChange={(e) => setFloorLevel(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        >
                          {existingFloors.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Room Type Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        >
                          {existingRoomTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                          <option value="__custom__">+ Enter Custom Type...</option>
                        </select>
                        {roomType === '__custom__' && (
                          <input
                            type="text"
                            value={customRoomType}
                            onChange={(e) => setCustomRoomType(e.target.value)}
                            placeholder="Enter custom room type"
                            className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Room Size (Area)
                        </label>
                        <input
                          type="text"
                          value={roomSize}
                          onChange={(e) => setRoomSize(e.target.value)}
                          placeholder="e.g. 350 sq ft or 32 m²"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Room View
                        </label>
                        <input
                          type="text"
                          value={roomView}
                          onChange={(e) => setRoomView(e.target.value)}
                          placeholder="e.g. Mountain View, Ocean, Garden"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Max Adults
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={maxAdults}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setMaxAdults(val);
                            setCapacity(val + maxChildren);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Max Children
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={maxChildren}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setMaxChildren(val);
                            setCapacity(maxAdults + val);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Smoking Policy
                        </label>
                        <select
                          value={smokingPolicy}
                          onChange={(e) =>
                            setSmokingPolicy(e.target.value as 'Non-Smoking' | 'Smoking Permitted')
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        >
                          <option value="Non-Smoking">Strictly Non-Smoking</option>
                          <option value="Smoking Permitted">Smoking Permitted</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Climate System
                        </label>
                        <select
                          value={acType}
                          onChange={(e) => setAcType(e.target.value as 'AC' | 'Non-AC')}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        >
                          <option value="AC">Air Conditioned (AC)</option>
                          <option value="Non-AC">Non-AC Room</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Accessibility Features
                        </label>
                        <input
                          type="text"
                          value={accessibility}
                          onChange={(e) => setAccessibility(e.target.value)}
                          placeholder="e.g. Wheelchair accessible, Elevator access, Step-free entrance"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Full Room Description
                        </label>
                        <textarea
                          rows={3}
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          placeholder="Elaborate guest room description highlighting ambiance, daylight, views and comfort..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PHOTOS & GALLERY */}
                {activeSection === 'photos' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#A51F36]" />
                        Room Photos & Gallery ({photos.length})
                      </h3>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photos'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Add Photo by URL or Presets */}
                    <div className="bg-slate-50 dark:bg-[#061814] p-3 rounded-md border border-slate-200 dark:border-[#145447] space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Add Photo by URL or Preset
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="https://... (Image link)"
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                        <select
                          value={newPhotoCategory}
                          onChange={(e) => setNewPhotoCategory(e.target.value as PhotoCategory)}
                          className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        >
                          <option value="COVER">Main / Cover</option>
                          <option value="BEDROOM">Bedroom</option>
                          <option value="BATHROOM">Bathroom</option>
                          <option value="BALCONY">Balcony</option>
                          <option value="VIEW">Room View</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <input
                          type="text"
                          value={newPhotoCaption}
                          onChange={(e) => setNewPhotoCaption(e.target.value)}
                          placeholder="Caption (optional)"
                          className="w-36 px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhotoFromUrl}
                          disabled={!newPhotoUrl.trim()}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-sm disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>

                      {/* Presets Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400">Presets:</span>
                        {PHOTO_PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              setNewPhotoUrl(p.url);
                              setNewPhotoCategory(p.category);
                              setNewPhotoCaption(p.label);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#0E3E33] hover:bg-[#A51F36]/10 text-slate-700 dark:text-slate-300"
                          >
                            + {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photos Grid */}
                    {photos.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-[#145447] rounded-md text-xs text-slate-400">
                        No photos added yet. Upload high quality images or paste a URL above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              'group relative rounded-md overflow-hidden border bg-slate-100 dark:bg-[#061814] flex flex-col',
                              p.isCover
                                ? 'border-[#A51F36] ring-2 ring-[#A51F36]/30 dark:border-rose-500'
                                : 'border-slate-200 dark:border-[#145447]'
                            )}
                          >
                            <div className="aspect-video w-full bg-slate-200 dark:bg-[#08241E] relative overflow-hidden">
                              <img
                                src={p.url}
                                alt={p.caption || 'Room photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500';
                                }}
                              />
                              {p.isCover && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-xs bg-[#A51F36] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                                  Cover Photo
                                </span>
                              )}
                              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-xs bg-black/60 text-white text-[9px] uppercase tracking-wider backdrop-blur-xs">
                                {p.category}
                              </span>
                            </div>

                            <div className="p-2 flex items-center justify-between gap-1 text-[11px] bg-white dark:bg-[#061F1A]">
                              <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                {p.caption || 'No caption'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {!p.isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetCoverPhoto(p.id)}
                                    title="Set as Main Cover"
                                    className="p-1 hover:text-[#A51F36] text-slate-400 hover:bg-slate-100 dark:hover:bg-[#145447] rounded-xs"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(p.id)}
                                  title="Delete photo"
                                  className="p-1 hover:text-red-500 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#145447] rounded-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. BED CONFIGURATION */}
                {activeSection === 'beds' && (
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-[#A51F36]" />
                      Bed Configuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Specify the bed types and quantities available in this room.
                    </p>

                    {/* Active Bed List */}
                    <div className="space-y-2">
                      {bedConfigs.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]"
                        >
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {b.bedType}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateBedCount(idx, -1)}
                              className="w-6 h-6 rounded-xs bg-slate-200 dark:bg-[#0F3F34] hover:bg-slate-300 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold">
                              {b.count}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateBedCount(idx, 1)}
                              className="w-6 h-6 rounded-xs bg-slate-200 dark:bg-[#0F3F34] hover:bg-slate-300 text-xs font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBedConfig(idx)}
                              className="ml-2 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Bed Options */}
                    <div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                        Add Bed Type:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {STANDARD_BED_TYPES.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => addBedType(b)}
                            className="px-2 py-1 text-xs rounded-xs border border-slate-300 dark:border-[#16584B] bg-white dark:bg-[#061F1A] hover:border-[#A51F36] hover:text-[#A51F36] transition-colors"
                          >
                            + {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. BATHROOM FACILITIES */}
                {activeSection === 'bath' && (
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bath className="w-4 h-4 text-[#A51F36]" />
                      Bathroom Facilities ({selectedBathroomFacilities.length} Selected)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Only selected facilities will be displayed on the customer booking portal.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {STANDARD_BATHROOM_FACILITIES.map((fac) => {
                        const isSelected = selectedBathroomFacilities.includes(fac);
                        return (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => toggleBathroomFacility(fac)}
                            className={cn(
                              'px-3 py-1.5 text-xs rounded-sm border transition-all flex items-center gap-1.5',
                              isSelected
                                ? 'bg-[#A51F36] text-white border-[#A51F36] shadow-xs'
                                : 'bg-white dark:bg-[#061F1A] border-slate-200 dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                            <span>{fac}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom bathroom facility */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={customBathroomFacility}
                        onChange={(e) => setCustomBathroomFacility(e.target.value)}
                        placeholder="Add custom facility (e.g. Jacuzzi, Dual Vanity)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBathroomFacility}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-sm hover:bg-slate-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. ROOM AMENITIES */}
                {activeSection === 'amenities' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-[#A51F36]" />
                        Room Amenities ({selectedAmenities.length} Selected)
                      </h3>
                      <input
                        type="text"
                        value={amenitySearch}
                        onChange={(e) => setAmenitySearch(e.target.value)}
                        placeholder="Filter amenities..."
                        className="w-48 px-2.5 py-1 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      {AMENITY_CATEGORIES.map((cat) => {
                        const filteredItems = cat.items.filter((item) =>
                          item.toLowerCase().includes(amenitySearch.toLowerCase().trim())
                        );
                        if (filteredItems.length === 0) return null;

                        return (
                          <div key={cat.category} className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {cat.category}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {filteredItems.map((item) => {
                                const isSelected = selectedAmenities.includes(item);
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => toggleAmenity(item)}
                                    className={cn(
                                      'px-2.5 py-1.5 text-xs rounded-sm border transition-all flex items-center gap-1.5',
                                      isSelected
                                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                        : 'bg-white dark:bg-[#061F1A] border-slate-200 dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                    )}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    <span>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Amenity */}
                    <div className="flex gap-2 pt-2 max-w-md">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        placeholder="Add custom amenity (e.g. Espresso Machine)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomAmenity}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-sm hover:bg-slate-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. PRICING & CHARGES */}
                {activeSection === 'pricing' && (
                  <div className="space-y-4 max-w-md">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#A51F36]" />
                      Room Pricing & Extra Charges
                    </h3>

                    <div className="space-y-3 bg-slate-50 dark:bg-[#061814] p-4 rounded-md border border-slate-200 dark:border-[#145447]">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Standard Room Price (Per Night) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={pricePerNight}
                            onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                            className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Extra Adult Charge (Per Adult / Night)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={extraAdultPrice}
                            onChange={(e) => setExtraAdultPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Extra Child Charge (Per Child / Night)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={extraChildPrice}
                            onChange={(e) => setExtraChildPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Weekend / Seasonal Rate (Optional override)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={weekendPrice}
                            onChange={(e) => setWeekendPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. POLICIES & RULES */}
                {activeSection === 'policies' && (
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#A51F36]" />
                      Room Policies & House Rules
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Standard Check-In Time
                        </label>
                        <input
                          type="text"
                          value={policies.checkInTime || '02:00 PM'}
                          onChange={(e) => setPolicies({ ...policies, checkInTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Standard Check-Out Time
                        </label>
                        <input
                          type="text"
                          value={policies.checkOutTime || '11:00 AM'}
                          onChange={(e) => setPolicies({ ...policies, checkOutTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Cancellation Policy
                        </label>
                        <input
                          type="text"
                          value={policies.cancellationPolicy || ''}
                          onChange={(e) =>
                            setPolicies({ ...policies, cancellationPolicy: e.target.value })
                          }
                          placeholder="e.g. Free cancellation up to 24 hours prior to check-in"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Child Policy
                        </label>
                        <input
                          type="text"
                          value={policies.childPolicy || ''}
                          onChange={(e) => setPolicies({ ...policies, childPolicy: e.target.value })}
                          placeholder="e.g. Children below 6 stay free of charge"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Pet Policy
                        </label>
                        <input
                          type="text"
                          value={policies.petPolicy || ''}
                          onChange={(e) => setPolicies({ ...policies, petPolicy: e.target.value })}
                          placeholder="e.g. Pets are strictly not allowed"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Custom Room Rules
                        </label>
                        <textarea
                          rows={2}
                          value={policies.customRules || ''}
                          onChange={(e) => setPolicies({ ...policies, customRules: e.target.value })}
                          placeholder="Quiet hours, visitor policies, etc."
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CUSTOMER PREVIEW */}
                {activeSection === 'preview' && (
                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#A51F36]" />
                        Live Customer Booking Preview
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        Exact appearance on public portal
                      </span>
                    </div>

                    {/* Preview Card */}
                    <div className="border border-slate-200 dark:border-[#145447] rounded-lg overflow-hidden bg-white dark:bg-[#061F1A] shadow-md">
                      {/* Cover Photo */}
                      <div className="aspect-video w-full bg-slate-100 dark:bg-[#092B23] relative">
                        <img
                          src={
                            (photos.find((p) => p.isCover) || photos[0])?.url ||
                            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900'
                          }
                          alt={effectiveRoomType}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A51F36] text-white">
                            {effectiveRoomType}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                            {acType}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {effectiveRoomType} - Room {roomNumber || '---'}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              {roomSize && <span>{roomSize}</span>}
                              {roomView && <span>• {roomView}</span>}
                              <span>• Up to {capacity} Guests</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400">From</span>
                            <div className="text-base font-bold text-[#A51F36] dark:text-rose-400">
                              NPR {pricePerNight.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-400">/ night</span>
                          </div>
                        </div>

                        {/* Description */}
                        {shortDescription && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {shortDescription}
                          </p>
                        )}

                        {/* Bedding & Bath badges */}
                        <div className="pt-2 border-t border-slate-100 dark:border-[#145447] space-y-2">
                          <div className="text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Bedding:{' '}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {bedConfigs.map((b) => `${b.count}x ${b.bedType}`).join(', ') ||
                                bedType}
                            </span>
                          </div>

                          {selectedBathroomFacilities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {selectedBathroomFacilities.slice(0, 5).map((fac) => (
                                <span
                                  key={fac}
                                  className="text-[10px] px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-[#0E3E33] text-slate-600 dark:text-slate-300"
                                >
                                  ✓ {fac}
                                </span>
                              ))}
                              {selectedBathroomFacilities.length > 5 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                                  +{selectedBathroomFacilities.length - 5} more
                                </span>
                              )}
                            </div>
                          )}

                          {selectedAmenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {selectedAmenities.slice(0, 6).map((a) => (
                                <span
                                  key={a}
                                  className="text-[10px] px-2 py-0.5 rounded-xs bg-emerald-50 dark:bg-[#07241E] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Booking Button Sample */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 bg-[#A51F36] text-white text-xs font-bold rounded-sm text-center shadow-xs cursor-default"
                          >
                            Reserve This Room (NPR {pricePerNight.toLocaleString()})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814] flex flex-wrap items-center justify-between gap-2">
          <div>
            {mode === 'quick' ? (
              <button
                type="button"
                onClick={() => setMode('detailed')}
                className="text-xs text-[#A51F36] dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Switch to Detailed Setup</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('quick')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              >
                ← Return to Quick Setup
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#145447] rounded-sm transition-colors"
            >
              Cancel
            </button>

            {!initialRoom && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-3.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-[#16584B] bg-white dark:bg-[#0B332A] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#0F3F34] rounded-sm transition-colors"
              >
                Save & Add Another
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-1.5 text-xs font-semibold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{initialRoom ? 'Save Changes' : 'Save Room'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
