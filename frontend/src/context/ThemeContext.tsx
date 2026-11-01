'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeColorId = 'emerald' | 'blue' | 'purple' | 'amber' | 'teal' | 'custom';

export interface ThemeColorPreset {
  id: ThemeColorId;
  name: string;
  label: string;
  swatch: string;
  light: {
    primary: string;
    hover: string;
    active: string;
    subtle: string;
    subtleBorder: string;
    ring: string;
  };
  dark: {
    primary: string;
    hover: string;
    active: string;
    subtle: string;
    subtleBorder: string;
    ring: string;
  };
}

export const PRESET_THEME_COLORS: ThemeColorPreset[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    label: 'Resort & Sanctuary',
    swatch: '#10B981',
    light: {
      primary: '#0B3D32',
      hover: '#082F27',
      active: '#05221C',
      subtle: '#E8F2EE',
      subtleBorder: '#C2D9CF',
      ring: '#0B3D32',
    },
    dark: {
      primary: '#10B981',
      hover: '#059669',
      active: '#047857',
      subtle: 'rgba(16, 185, 129, 0.16)',
      subtleBorder: 'rgba(16, 185, 129, 0.35)',
      ring: '#10B981',
    },
  },
  {
    id: 'blue',
    name: 'Sapphire',
    label: 'Executive & Marina',
    swatch: '#2563EB',
    light: {
      primary: '#1D4ED8',
      hover: '#1E40AF',
      active: '#1E3A8A',
      subtle: '#EFF6FF',
      subtleBorder: '#BFDBFE',
      ring: '#2563EB',
    },
    dark: {
      primary: '#3B82F6',
      hover: '#2563EB',
      active: '#1D4ED8',
      subtle: 'rgba(59, 130, 246, 0.16)',
      subtleBorder: 'rgba(59, 130, 246, 0.35)',
      ring: '#3B82F6',
    },
  },
  {
    id: 'purple',
    name: 'Amethyst',
    label: 'Boutique Luxury & Spa',
    swatch: '#9333EA',
    light: {
      primary: '#7E22CE',
      hover: '#6B21A8',
      active: '#581C87',
      subtle: '#FAF5FF',
      subtleBorder: '#E9D5FF',
      ring: '#9333EA',
    },
    dark: {
      primary: '#A855F7',
      hover: '#9333EA',
      active: '#7E22CE',
      subtle: 'rgba(168, 85, 247, 0.16)',
      subtleBorder: 'rgba(168, 85, 247, 0.35)',
      ring: '#A855F7',
    },
  },
  {
    id: 'amber',
    name: 'Terracotta',
    label: 'Warm Bistro & Heritage Lodge',
    swatch: '#EA580C',
    light: {
      primary: '#C2410C',
      hover: '#9A3412',
      active: '#7C2D12',
      subtle: '#FFF7ED',
      subtleBorder: '#FED7AA',
      ring: '#EA580C',
    },
    dark: {
      primary: '#F97316',
      hover: '#EA580C',
      active: '#C2410C',
      subtle: 'rgba(249, 115, 22, 0.16)',
      subtleBorder: 'rgba(249, 115, 22, 0.35)',
      ring: '#F97316',
    },
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    label: 'Coastal Retreat & Island Cabana',
    swatch: '#0D9488',
    light: {
      primary: '#0F766E',
      hover: '#115E59',
      active: '#134E4A',
      subtle: '#F0FDFA',
      subtleBorder: '#99F6E4',
      ring: '#0D9488',
    },
    dark: {
      primary: '#14B8A6',
      hover: '#0D9488',
      active: '#0F766E',
      subtle: 'rgba(20, 184, 166, 0.16)',
      subtleBorder: 'rgba(20, 184, 166, 0.35)',
      ring: '#14B8A6',
    },
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyTheme(mode: Theme, colorId: ThemeColorId, customHex?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Toggle dark / light class for Tailwind dark: prefix
  if (mode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // 2. Data attributes for custom CSS targets
  root.setAttribute('data-theme-mode', mode);
  root.setAttribute('data-theme-color', colorId);

  // 3. Resolve color values
  let cfg;
  if (colorId === 'custom' && customHex) {
    const isDark = mode === 'dark';
    cfg = {
      primary: customHex,
      hover: customHex,
      active: customHex,
      subtle: hexToRgba(customHex, isDark ? 0.2 : 0.12),
      subtleBorder: hexToRgba(customHex, isDark ? 0.4 : 0.25),
      ring: customHex,
    };
  } else {
    const preset = PRESET_THEME_COLORS.find((p) => p.id === colorId) || PRESET_THEME_COLORS[0];
    cfg = mode === 'dark' ? preset.dark : preset.light;
  }

  // 4. Update CSS custom properties dynamically
  root.style.setProperty('--brand-primary', cfg.primary);
  root.style.setProperty('--brand-primary-hover', cfg.hover);
  root.style.setProperty('--brand-primary-active', cfg.active);
  root.style.setProperty('--brand-primary-subtle', cfg.subtle);
  root.style.setProperty('--brand-primary-border', cfg.subtleBorder);
  root.style.setProperty('--brand-ring', cfg.ring);
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themeColor: ThemeColorId;
  setThemeColor: (color: ThemeColorId, customHex?: string) => void;
  customHex: string;
  setCustomHex: (hex: string) => void;
  presetColors: ThemeColorPreset[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [themeColor, setThemeColorState] = useState<ThemeColorId>('emerald');
  const [customHex, setCustomHexState] = useState<string>('#059669');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('hotel_theme_mode') || localStorage.getItem('hotel_theme') || 'light') as Theme;
    const savedColor = (localStorage.getItem('hotel_theme_color') || 'emerald') as ThemeColorId;
    const savedCustomHex = localStorage.getItem('hotel_theme_custom_hex') || '#059669';

    const validTheme = savedTheme === 'dark' ? 'dark' : 'light';
    const validColor = ['emerald', 'blue', 'purple', 'amber', 'teal', 'custom'].includes(savedColor)
      ? savedColor
      : 'emerald';

    setThemeState(validTheme);
    setThemeColorState(validColor);
    setCustomHexState(savedCustomHex);
    applyTheme(validTheme, validColor, savedCustomHex);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('hotel_theme_mode', newTheme);
    localStorage.setItem('hotel_theme', newTheme);
    applyTheme(newTheme, themeColor, customHex);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setThemeColor = (newColor: ThemeColorId, customHexOverride?: string) => {
    setThemeColorState(newColor);
    localStorage.setItem('hotel_theme_color', newColor);

    const activeCustom = customHexOverride || customHex;
    if (customHexOverride) {
      setCustomHexState(customHexOverride);
      localStorage.setItem('hotel_theme_custom_hex', customHexOverride);
    }

    applyTheme(theme, newColor, activeCustom);
  };

  const setCustomHex = (hex: string) => {
    setCustomHexState(hex);
    localStorage.setItem('hotel_theme_custom_hex', hex);
    setThemeColor('custom', hex);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        themeColor,
        setThemeColor,
        customHex,
        setCustomHex,
        presetColors: PRESET_THEME_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
      themeColor: 'emerald',
      setThemeColor: () => {},
      customHex: '#059669',
      setCustomHex: () => {},
      presetColors: PRESET_THEME_COLORS,
    };
  }
  return context;
};
