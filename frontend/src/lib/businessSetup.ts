'use client';

import { useState, useEffect, useCallback } from 'react';

export type BusinessModuleType = 'HOTEL_AND_RESTAURANT' | 'HOTEL_ONLY' | 'RESTAURANT_ONLY';

export const BUSINESS_MODULE_KEY = 'aura_business_module_setup';
export const BUSINESS_MODULE_EVENT = 'aura_business_module_updated';

export function getBusinessModuleSetup(): BusinessModuleType {
  if (typeof window === 'undefined') return 'HOTEL_AND_RESTAURANT';
  try {
    const stored = localStorage.getItem(BUSINESS_MODULE_KEY);
    if (stored === 'HOTEL_ONLY' || stored === 'RESTAURANT_ONLY' || stored === 'HOTEL_AND_RESTAURANT') {
      return stored;
    }
  } catch {
    // fallback
  }
  return 'HOTEL_AND_RESTAURANT';
}

export function setBusinessModuleSetup(module: BusinessModuleType) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BUSINESS_MODULE_KEY, module);
      window.dispatchEvent(new CustomEvent(BUSINESS_MODULE_EVENT, { detail: module }));
    } catch (e) {
      console.error('Failed to save business module setup', e);
    }
  }
}

export interface BusinessModuleState {
  moduleType: BusinessModuleType;
  isHotelEnabled: boolean;
  isRestaurantEnabled: boolean;
  isTransfersEnabled: boolean;
  setModuleType: (type: BusinessModuleType) => void;
}

export function useBusinessModules(): BusinessModuleState {
  const [moduleType, setModuleTypeState] = useState<BusinessModuleType>('HOTEL_AND_RESTAURANT');

  useEffect(() => {
    setModuleTypeState(getBusinessModuleSetup());

    const handleUpdate = () => {
      setModuleTypeState(getBusinessModuleSetup());
    };

    window.addEventListener(BUSINESS_MODULE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(BUSINESS_MODULE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const setModuleType = useCallback((type: BusinessModuleType) => {
    setBusinessModuleSetup(type);
    setModuleTypeState(type);
  }, []);

  const isHotelEnabled = moduleType === 'HOTEL_AND_RESTAURANT' || moduleType === 'HOTEL_ONLY';
  const isRestaurantEnabled = moduleType === 'HOTEL_AND_RESTAURANT' || moduleType === 'RESTAURANT_ONLY';
  const isTransfersEnabled = isHotelEnabled && isRestaurantEnabled;

  return {
    moduleType,
    isHotelEnabled,
    isRestaurantEnabled,
    isTransfersEnabled,
    setModuleType,
  };
}
