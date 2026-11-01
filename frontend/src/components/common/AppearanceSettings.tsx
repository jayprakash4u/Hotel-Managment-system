'use client';

import React, { useRef } from 'react';
import { Sun, Moon, Palette, Check, Plus, X } from 'lucide-react';
import { useTheme, ThemeColorId } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface AppearanceSettingsProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  className,
  onClose,
  showCloseButton = false,
}) => {
  const {
    theme,
    setTheme,
    themeColor,
    setThemeColor,
    customHex,
    setCustomHex,
    presetColors,
  } = useTheme();

  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomHex(e.target.value);
  };

  return (
    <div className={cn('select-none space-y-2', className)}>
      {/* Category Heading matching screenshot */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
          APPEARANCE
        </span>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            aria-label="Close appearance popover"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Appearance Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/95 transition-all">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            Mode
          </label>
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 gap-1 border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Sun
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  theme === 'light' ? 'text-amber-500' : 'text-slate-400'
                )}
              />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                theme === 'dark'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Moon
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'
                )}
              />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Theme Color Selector */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs sm:text-sm font-semibold">Theme color</span>
          </div>

          {/* Color Circles */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap pt-0.5">
            {presetColors.map((color) => {
              const isSelected = themeColor === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setThemeColor(color.id)}
                  title={`${color.name} · ${color.label}`}
                  aria-label={`Select ${color.name} theme`}
                  className={cn(
                    'relative h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all cursor-pointer',
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 shadow-xs'
                      : 'hover:scale-110 opacity-90 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: color.swatch,
                    boxShadow: isSelected ? `0 0 0 2px ${color.swatch}` : undefined,
                  }}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-white stroke-[2.5] drop-shadow-sm" />
                  )}
                </button>
              );
            })}

            {/* Custom + Color Swatch */}
            <div className="relative">
              <button
                type="button"
                title={
                  themeColor === 'custom'
                    ? `Custom Hex (${customHex}) - Click to change`
                    : 'Add custom brand color (+)'
                }
                onClick={() => colorInputRef.current?.click()}
                className={cn(
                  'relative h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all cursor-pointer',
                  themeColor === 'custom'
                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 shadow-xs text-white'
                    : 'border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
                style={
                  themeColor === 'custom'
                    ? {
                        backgroundColor: customHex,
                        boxShadow: `0 0 0 2px ${customHex}`,
                      }
                    : undefined
                }
              >
                {themeColor === 'custom' ? (
                  <Check className="w-4 h-4 text-white stroke-[2.5] drop-shadow-sm" />
                ) : (
                  <Plus className="w-4 h-4 stroke-[2]" />
                )}
              </button>

              <input
                ref={colorInputRef}
                type="color"
                value={customHex}
                onChange={handleCustomColorChange}
                className="sr-only"
                aria-label="Pick custom theme color"
              />
            </div>
          </div>

          {/* Subtitle Caption */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-normal">
            Used for the header, sidebar and highlights.
          </p>
        </div>
      </div>
    </div>
  );
};
