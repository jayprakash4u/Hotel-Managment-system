'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
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
  DoorOpen,
  LayoutGrid,
  LayoutList,
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

export interface RoomSetupViewProps {
  onBack: () => void;
  onSave: (roomData: RoomRecord, andAddAnother?: boolean) => void;
  initialRoom?: RoomRecord | null;
  existingRoomTypes?: string[];
  existingFloors?: string[];
  existingACTypes?: string[];
  existingBedTypes?: string[];
  existingFacilities?: Array<{ name: string; category?: string }>;
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

export function RoomSetupView({
  onBack,
  onSave,
  initialRoom,
  existingRoomTypes = ['Deluxe Room', 'Standard Room', 'Executive Suite', 'Presidential Suite', 'Family Suite'],
  existingFloors = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'],
  existingACTypes = ['Air Conditioned (AC)', 'Non-Air Conditioned (Non-AC)'],
  existingBedTypes = ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Twin Beds'],
  existingFacilities = [],
}: RoomSetupViewProps) {
  const { success, error } = useToast();

  // Mode: Default to 'quick' when creating new, or 'detailed' if editing room with rich profile
  const [mode, setMode] = useState<SetupMode>('quick');
  const [activeSection, setActiveSection] = useState<DetailedSection>('basic');

  const fallbackACType = existingACTypes[0] || 'Air Conditioned (AC)';
  const fallbackBedType = existingBedTypes[0] || 'King Bed';
  const fallbackFloor = existingFloors[0] || '1st Floor';
  const fallbackRoomType = existingRoomTypes[0] || 'Deluxe Room';

  // Form State
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [floorLevel, setFloorLevel] = useState<string>(fallbackFloor);
  const [roomType, setRoomType] = useState<string>(fallbackRoomType);
  const [customRoomType, setCustomRoomType] = useState<string>('');
  const [pricePerNight, setPricePerNight] = useState<number>(3500);
  const [capacity, setCapacity] = useState<number>(2);
  const [acType, setAcType] = useState<string>(fallbackACType);
  const [bedType, setBedType] = useState<string>(fallbackBedType);
  const [shortDescription, setShortDescription] = useState<string>('');
  const [roomSize, setRoomSize] = useState<string>('350 sq ft');
  const [roomView, setRoomView] = useState<string>('Garden View');

  // Detailed Form State
  const [maxAdults, setMaxAdults] = useState<number>(2);
  const [maxChildren, setMaxChildren] = useState<number>(1);
  const [smokingPolicy, setSmokingPolicy] = useState<'Non-Smoking' | 'Smoking Permitted'>('Non-Smoking');
  const [accessibility, setAccessibility] = useState<string>('');
  const [bedConfigs, setBedConfigs] = useState<BedConfigItem[]>([{ bedType: fallbackBedType, count: 1 }]);
  const [customBedInput, setCustomBedInput] = useState<string>('');
  const [selectedBedToAdd, setSelectedBedToAdd] = useState<string>('');
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
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<File[]>([]);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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

  // Populate data on mount or edit change
  // Dynamic merge of master facilities from Hotel Setup into Amenities
  const allAmenityCategories: Array<{ category: string; items: string[] }> = useMemo(() => {
    if (!existingFacilities || existingFacilities.length === 0) {
      return AMENITY_CATEGORIES;
    }
    const categories: Array<{ category: string; items: string[] }> = AMENITY_CATEGORIES.map((cat) => ({
      category: cat.category,
      items: [...cat.items],
    }));

    const extraByCat = new Map<string, string[]>();
    existingFacilities.forEach((fac) => {
      const catName = fac.category || 'Hotel Facilities';
      if (!extraByCat.has(catName)) {
        extraByCat.set(catName, []);
      }
      extraByCat.get(catName)!.push(fac.name);
    });

    extraByCat.forEach((items, catName) => {
      const match = categories.find((c) => c.category.toLowerCase() === catName.toLowerCase());
      if (match) {
        items.forEach((it) => {
          if (!match.items.includes(it)) {
            match.items.push(it);
          }
        });
      } else {
        categories.push({
          category: catName,
          items,
        });
      }
    });

    return categories;
  }, [existingFacilities]);

  useEffect(() => {
    if (initialRoom) {
      setRoomNumber(initialRoom.number || '');
      setFloorLevel(
        initialRoom.floor
          ? `${initialRoom.floor}${initialRoom.floor === 1 ? 'st' : initialRoom.floor === 2 ? 'nd' : initialRoom.floor === 3 ? 'rd' : 'th'} Floor`
          : '1st Floor'
      );
      setRoomType(initialRoom.type || 'Deluxe Room');
      setPricePerNight(initialRoom.pricePerNight || 3500);
      setCapacity(initialRoom.capacity || 2);
      setAcType(initialRoom.acType || fallbackACType);
      setBedType(initialRoom.bedType || fallbackBedType);
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
      setMode(initialRoom.photos && initialRoom.photos.length > 0 ? 'detailed' : 'quick');
    } else {
      setRoomNumber('');
      setFloorLevel(fallbackFloor);
      setRoomType(fallbackRoomType);
      setCustomRoomType('');
      setPricePerNight(3500);
      setCapacity(2);
      setAcType(fallbackACType);
      setBedType(fallbackBedType);
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
      setPhotos([]);
      setExtraAdultPrice(0);
      setExtraChildPrice(0);
      setWeekendPrice(0);
      setMode('quick');
      setActiveSection('basic');
    }
  }, [initialRoom]);

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

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      error('Invalid File', 'Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
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
        } catch {}

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
      success('Photos Uploaded', `${validFiles.length} photo(s) uploaded successfully from device.`);
    } catch {
      error('Upload Failed', 'Unable to process image file.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUploadSelectedFiles = async () => {
    if (selectedLocalFiles.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < selectedLocalFiles.length; i++) {
        const file = selectedLocalFiles[i];
        let uploadedUrl = null;
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/rooms/upload-photo', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data?.url) uploadedUrl = data.data.url;
          }
        } catch {}

        if (!uploadedUrl) {
          uploadedUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }

        const isCover = (photos.length === 0 && i === 0) || newPhotoCategory === 'COVER';
        const newPhoto = {
          id: 'p-' + Date.now() + '-' + i,
          url: uploadedUrl,
          caption: newPhotoCaption.trim() || file.name.replace(/\.[^/.]+$/, ''),
          category: newPhotoCategory,
          isCover,
        };

        setPhotos((prev) => (isCover ? [newPhoto, ...prev.map((p) => ({ ...p, isCover: false }))] : [...prev, newPhoto]));
      }
      setSelectedLocalFiles([]);
      setNewPhotoCaption('');
      success('Photo Added', 'Photo(s) added successfully.');
    } catch {
      error('Upload Failed', 'Unable to process image file.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
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
      const currentNum = parseInt(roomNumber.trim(), 10);
      if (!isNaN(currentNum)) {
        setRoomNumber((currentNum + 1).toString());
      } else {
        setRoomNumber('');
      }
      success('Room Saved', `Room ${roomData.number} saved. Ready for next room.`);
    } else {
      success('Room Saved', `Room ${roomData.number} ${initialRoom ? 'updated' : 'saved'} successfully.`);
      onBack();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-[#071F1A] rounded-md border border-slate-200 dark:border-[#145447] shadow-sm overflow-hidden select-none">
      {/* 1. TOP FULL-PAGE HEADER BAR */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#0B3D32] bg-[#0B3D32] text-white hover:bg-[#093027] dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-all text-xs font-bold shadow-2xs cursor-pointer"
            title="View Hotel Room Inventory List"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Room List</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-[#16584B] hidden sm:block" />

          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{initialRoom ? `Edit Room ${initialRoom.number}` : 'Add New Room'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#A51F36]/10 text-[#A51F36] dark:bg-rose-950/60 dark:text-rose-300 font-bold uppercase">
                {mode === 'quick' ? 'Quick Setup' : 'Detailed Setup'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {mode === 'quick'
                ? 'Minimal required fields for immediate inventory & front desk availability'
                : 'Complete room profile: Photos gallery, bed configs, bathroom facilities, amenities & customer portal display'}
            </p>
          </div>
        </div>

        {/* MODE TOGGLE & PRIMARY ACTION BUTTONS */}
        <div className="flex items-center gap-2.5">
          {/* Mode Pill */}
          <div className="flex items-center bg-slate-200 dark:bg-[#0B332A] p-0.5 rounded-sm border border-slate-300 dark:border-[#175C4F]">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5',
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
                'px-3 py-1 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5',
                mode === 'detailed'
                  ? 'bg-white dark:bg-[#0E4237] text-[#A51F36] dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              )}
            >
              <Sliders className="w-3 h-3" />
              <span>Detailed Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT (SCROLLABLE FULL PAGE) */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-100/50 dark:bg-[#041411]">
        {mode === 'quick' ? (
          /* =========================================================================
             A. QUICK SETUP FULL PAGE (MINIMAL, CENTERED, INTUITIVE)
             ========================================================================= */
          <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
            {/* Essential Card */}
            <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#145447]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#A51F36] dark:text-rose-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A51F36]" />
                  Essential Information (Required)
                </div>
                <span className="text-[11px] text-slate-400">All 4 fields are mandatory</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 101, 204, 305"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36] font-mono font-medium text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Room Type Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36] text-slate-800 dark:text-slate-100"
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
                      placeholder="Enter custom room type name"
                      className="mt-2 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36] text-slate-800 dark:text-slate-100"
                    />
                  )}
                </div>

                {/* Maximum Occupancy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Maximum Occupancy <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36] text-slate-800 dark:text-slate-100"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">Guests</span>
                  </div>
                </div>

                {/* Room Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Room Price / Night <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                      NPR
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={pricePerNight}
                      onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                      className="w-full pl-14 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm focus:outline-hidden focus:ring-1 focus:ring-[#A51F36] font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Specifications Card */}
            <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#145447]">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Optional Room Specifications
                </div>
                <span className="text-[11px] text-slate-400">Can be updated or overridden anytime</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bed Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Bed Type
                  </label>
                  <select
                    value={bedType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBedType(val);
                      setBedConfigs([{ bedType: val, count: 1 }]);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                  >
                    {!existingBedTypes.includes(bedType) && bedType && (
                      <option value={bedType}>{bedType}</option>
                    )}
                    {existingBedTypes.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Floor Level
                  </label>
                  <select
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Climate Option
                  </label>
                  <select
                    value={acType}
                    onChange={(e) => setAcType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                  >
                    {!existingACTypes.includes(acType) && acType && (
                      <option value={acType}>{acType}</option>
                    )}
                    {existingACTypes.map((ac) => (
                      <option key={ac} value={ac}>
                        {ac}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Size */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Room Size
                  </label>
                  <input
                    type="text"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                    placeholder="e.g. 350 sq ft / 32 m²"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Room View */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Room View
                  </label>
                  <input
                    type="text"
                    value={roomView}
                    onChange={(e) => setRoomView(e.target.value)}
                    placeholder="e.g. Mountain View, Botanical Garden View, City Skyline"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief room description for front desk display and reservation notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Switch Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs gap-3">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Want to configure gallery photos, bathroom amenities, or online booking policies?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMode('detailed')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-sm border border-amber-400 bg-white dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap shadow-2xs shrink-0 cursor-pointer"
              >
                Switch to Detailed Setup
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             B. DETAILED SETUP FULL PAGE (8 SECTIONS WITH SPATIOUS SIDEBAR)
             ========================================================================= */
          <div className="flex flex-col md:flex-row min-h-full">
            {/* Left Section Navigation Bar */}
            <div className="w-full md:w-64 shrink-0 bg-white dark:bg-[#061814] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#145447] p-3 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Setup Sections
              </div>
              {[
                { id: 'basic', label: '1. Basic Information', icon: Info },
                { id: 'photos', label: '2. Room Photos & Gallery', icon: ImageIcon, count: photos.length },
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
                      'w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-sm transition-all text-left',
                      isActive
                        ? 'bg-[#A51F36] text-white font-bold shadow-xs dark:bg-rose-900'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0E3E33]',
                      s.highlight && !isActive && 'text-[#A51F36] dark:text-rose-400 font-semibold'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </div>
                    {typeof s.count === 'number' && (
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.2 rounded-full font-mono font-bold',
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

            {/* Right Detailed Section Form Panel */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              <div className="max-w-3xl">
                {/* 1. BASIC INFORMATION */}
                {activeSection === 'basic' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <Info className="w-4 h-4 text-[#A51F36]" />
                      Basic Room Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Room Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="e.g. 101"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Floor Level
                        </label>
                        <select
                          value={floorLevel}
                          onChange={(e) => setFloorLevel(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                            className="mt-2 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          placeholder="e.g. Mountain View, Botanical Garden View"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          onChange={(e) => setAcType(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                        >
                          {!existingACTypes.includes(acType) && acType && (
                            <option value={acType}>{acType}</option>
                          )}
                          {existingACTypes.map((ac) => (
                            <option key={ac} value={ac}>
                              {ac}
                            </option>
                          ))}
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PHOTOS & GALLERY */}
                {activeSection === 'photos' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#145447] pb-2">
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

                    {/* Small horizontal row: Device photo input + Category + Optional text box at right + Add */}
                    <div className="bg-slate-50 dark:bg-[#061814] p-3.5 rounded-md border border-slate-200 dark:border-[#145447] space-y-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Upload Photo from Device
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {/* Device File Picker */}
                        <div className="flex-1 w-full relative">
                          <input
                            type="file"
                            id="devicePhotoInputRow"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setSelectedLocalFiles(Array.from(files));
                                if (!newPhotoCaption && files[0]) {
                                  setNewPhotoCaption(files[0].name.replace(/\.[^/.]+$/, ''));
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="devicePhotoInputRow"
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm cursor-pointer hover:border-[#A51F36] text-slate-700 dark:text-slate-200"
                          >
                            <span className="truncate">
                              {selectedLocalFiles.length > 0
                                ? selectedLocalFiles.length + ' file(s) selected: ' + selectedLocalFiles[0].name
                                : 'Choose photo from device...'}
                            </span>
                            <span className="ml-2 px-2.5 py-0.5 text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xs font-semibold shrink-0 flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              Browse
                            </span>
                          </label>
                        </div>

                        {/* Category Dropdown */}
                        <select
                          value={newPhotoCategory}
                          onChange={(e) => setNewPhotoCategory(e.target.value as PhotoCategory)}
                          className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                        >
                          <option value="COVER">Main / Cover</option>
                          <option value="BEDROOM">Bedroom</option>
                          <option value="BATHROOM">Bathroom</option>
                          <option value="BALCONY">Balcony</option>
                          <option value="VIEW">Room View</option>
                          <option value="OTHER">Other</option>
                        </select>

                        {/* Right side Optional Text Box */}
                        <input
                          type="text"
                          value={newPhotoCaption}
                          onChange={(e) => setNewPhotoCaption(e.target.value)}
                          placeholder="Caption (optional)"
                          className="w-full sm:w-44 px-3 py-1.5 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100"
                        />

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={handleUploadSelectedFiles}
                          disabled={selectedLocalFiles.length === 0 || isUploadingPhoto}
                          className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm disabled:opacity-50 transition-colors shrink-0"
                        >
                          {isUploadingPhoto ? 'Uploading...' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Photos Grid */}
                    {photos.length === 0 ? (
                      <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-[#145447] rounded-md text-xs text-slate-400">
                        No photos added yet. Select photos from your device above to showcase this room.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
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
                                alt={p.caption || 'Room Photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {p.isCover && (
                                <div className="absolute top-2 left-2 bg-[#A51F36] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs">
                                  COVER PHOTO
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex items-center justify-between gap-1.5 bg-white dark:bg-[#071F1A]">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                                  {p.caption || p.category}
                                </div>
                                <div className="text-[10px] text-slate-400 capitalize">
                                  {p.category.toLowerCase()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!p.isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetCoverPhoto(p.id)}
                                    className="px-2 py-1 text-[10px] font-medium rounded-xs border border-slate-300 dark:border-[#16584B] hover:bg-[#A51F36] hover:text-white hover:border-[#A51F36] transition-colors"
                                    title="Set as Cover Photo"
                                  >
                                    Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(p.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Delete Photo"
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

                {activeSection === 'beds' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <BedDouble className="w-4 h-4 text-[#A51F36]" />
                      Bed Configuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Specify the bed types and quantities available in this room.
                    </p>

                    {/* Active Bed List */}
                    <div className="space-y-2.5">
                      {bedConfigs.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#061814]"
                        >
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {b.bedType}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateBedCount(idx, -1)}
                              className="w-7 h-7 rounded-xs bg-slate-200 dark:bg-[#0F3F34] hover:bg-slate-300 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold">
                              {b.count}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateBedCount(idx, 1)}
                              className="w-7 h-7 rounded-xs bg-slate-200 dark:bg-[#0F3F34] hover:bg-slate-300 text-xs font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBedConfig(idx)}
                              className="ml-3 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Bed Type Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Add Bed Type
                      </label>
                      <div className="flex items-center gap-2 max-w-md">
                        <select
                          value={selectedBedToAdd}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && val !== '__custom__') {
                              addBedType(val);
                              setSelectedBedToAdd('');
                            } else {
                              setSelectedBedToAdd(val);
                            }
                          }}
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#A51F36]"
                        >
                          <option value="">-- Select Bed Type to Add --</option>
                          {existingBedTypes.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                          <option value="__custom__">+ Enter Custom Bed Type...</option>
                        </select>
                      </div>

                      {/* Custom Bed Type Input (when __custom__ is chosen) */}
                      {selectedBedToAdd === '__custom__' && (
                        <div className="flex items-center gap-2 mt-2 max-w-md">
                          <input
                            type="text"
                            value={customBedInput}
                            onChange={(e) => setCustomBedInput(e.target.value)}
                            placeholder="Enter custom bed name (e.g. Sofa Bed, Cot)..."
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#A51F36]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customBedInput.trim()) {
                                addBedType(customBedInput.trim());
                                setCustomBedInput('');
                                setSelectedBedToAdd('');
                              }
                            }}
                            disabled={!customBedInput.trim()}
                            className="px-4 py-2 text-xs font-semibold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            + Add Bed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. BATHROOM FACILITIES */}
                {activeSection === 'bath' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <Bath className="w-4 h-4 text-[#A51F36]" />
                      Bathroom Facilities ({selectedBathroomFacilities.length} Selected)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Only selected facilities will be displayed on the customer booking portal.
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {STANDARD_BATHROOM_FACILITIES.map((fac) => {
                        const isSelected = selectedBathroomFacilities.includes(fac);
                        return (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => toggleBathroomFacility(fac)}
                            className={cn(
                              'px-3.5 py-2 text-xs rounded-sm border transition-all flex items-center gap-2',
                              isSelected
                                ? 'bg-[#A51F36] text-white border-[#A51F36] shadow-xs'
                                : 'bg-white dark:bg-[#061F1A] border-slate-200 dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            <span>{fac}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom bathroom facility */}
                    <div className="flex gap-2 pt-3 max-w-md">
                      <input
                        type="text"
                        value={customBathroomFacility}
                        onChange={(e) => setCustomBathroomFacility(e.target.value)}
                        placeholder="Add custom facility (e.g. Jacuzzi, Dual Vanity)"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBathroomFacility}
                        className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-sm hover:bg-slate-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. ROOM AMENITIES */}
                {activeSection === 'amenities' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-[#A51F36]" />
                        Room Amenities ({selectedAmenities.length} Selected)
                      </h3>
                      <input
                        type="text"
                        value={amenitySearch}
                        onChange={(e) => setAmenitySearch(e.target.value)}
                        placeholder="Filter amenities..."
                        className="w-56 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      {allAmenityCategories.map((cat) => {
                        const filteredItems = cat.items.filter((item) =>
                          item.toLowerCase().includes(amenitySearch.toLowerCase().trim())
                        );
                        if (filteredItems.length === 0) return null;

                        return (
                          <div key={cat.category} className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                      'px-3 py-1.5 text-xs rounded-sm border transition-all flex items-center gap-1.5',
                                      isSelected
                                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                        : 'bg-white dark:bg-[#061F1A] border-slate-200 dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                    )}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
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
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomAmenity}
                        className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-sm hover:bg-slate-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. PRICING & CHARGES */}
                {activeSection === 'pricing' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <DollarSign className="w-4 h-4 text-[#A51F36]" />
                      Room Pricing & Extra Charges
                    </h3>

                    <div className="space-y-4 bg-slate-50 dark:bg-[#061814] p-5 rounded-md border border-slate-200 dark:border-[#145447]">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Standard Room Price (Per Night) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={pricePerNight}
                            onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
                            className="w-full pl-14 pr-3 py-2 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Extra Adult Charge (Per Adult / Night)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={extraAdultPrice}
                            onChange={(e) => setExtraAdultPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-14 pr-3 py-2 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Extra Child Charge (Per Child / Night)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={extraChildPrice}
                            onChange={(e) => setExtraChildPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-14 pr-3 py-2 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Weekend / Seasonal Rate (Optional override)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">
                            NPR
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={weekendPrice}
                            onChange={(e) => setWeekendPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-14 pr-3 py-2 text-xs bg-white dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. POLICIES & RULES */}
                {activeSection === 'policies' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#145447] pb-2">
                      <Shield className="w-4 h-4 text-[#A51F36]" />
                      Room Policies & House Rules
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Standard Check-In Time
                        </label>
                        <input
                          type="text"
                          value={policies.checkInTime || '02:00 PM'}
                          onChange={(e) => setPolicies({ ...policies, checkInTime: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Standard Check-Out Time
                        </label>
                        <input
                          type="text"
                          value={policies.checkOutTime || '11:00 AM'}
                          onChange={(e) => setPolicies({ ...policies, checkOutTime: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Cancellation Policy
                        </label>
                        <input
                          type="text"
                          value={policies.cancellationPolicy || ''}
                          onChange={(e) =>
                            setPolicies({ ...policies, cancellationPolicy: e.target.value })
                          }
                          placeholder="e.g. Free cancellation up to 24 hours prior to check-in"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Child Policy
                        </label>
                        <input
                          type="text"
                          value={policies.childPolicy || ''}
                          onChange={(e) => setPolicies({ ...policies, childPolicy: e.target.value })}
                          placeholder="e.g. Children below 6 stay free of charge when using existing beds"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Pet Policy
                        </label>
                        <input
                          type="text"
                          value={policies.petPolicy || ''}
                          onChange={(e) => setPolicies({ ...policies, petPolicy: e.target.value })}
                          placeholder="e.g. Pets are strictly not allowed"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Custom Room Rules
                        </label>
                        <textarea
                          rows={2}
                          value={policies.customRules || ''}
                          onChange={(e) => setPolicies({ ...policies, customRules: e.target.value })}
                          placeholder="Quiet hours, visitor rules, no smoking restrictions..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061F1A] border border-slate-300 dark:border-[#16584B] rounded-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CUSTOMER PREVIEW */}
                {activeSection === 'preview' && (
                  <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] rounded-md shadow-xs p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#145447] pb-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#A51F36]" />
                        Live Customer Booking Preview
                      </h3>
                      <span className="text-xs text-slate-400">
                        Matches customer portal display exactly
                      </span>
                    </div>

                    {/* Preview Card */}
                    <div className="border border-slate-200 dark:border-[#145447] rounded-lg overflow-hidden bg-white dark:bg-[#061F1A] shadow-md max-w-xl mx-auto">
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
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
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
                              {selectedBathroomFacilities.slice(0, 6).map((fac) => (
                                <span
                                  key={fac}
                                  className="text-[10px] px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-[#0E3E33] text-slate-600 dark:text-slate-300"
                                >
                                  ✓ {fac}
                                </span>
                              ))}
                              {selectedBathroomFacilities.length > 6 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                                  +{selectedBathroomFacilities.length - 6} more
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
          </div>
        )}
      </div>

      {/* 3. BOTTOM STICKY ACTION BAR */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-[#145447] bg-white dark:bg-[#061814] flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"
          >
            Cancel
          </button>

          {!initialRoom && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-[#16584B] bg-white dark:bg-[#0B332A] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#0F3F34] rounded-sm transition-colors shadow-2xs"
            >
              Save & Add Another
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-5 py-2 text-xs font-bold bg-[#A51F36] hover:bg-[#8B1A2D] text-white rounded-sm shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{initialRoom ? 'Save Changes' : 'Save Room'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

