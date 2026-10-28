'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, RefreshCw, Menu, Sun, Moon, LogIn, Bell, AlertTriangle, AlertCircle, CheckCircle2, Clock, UtensilsCrossed, ChevronRight, X } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { QuickSearchModal } from './QuickSearchModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';
import { useRole } from '@/context/RoleContext';
import { api } from '@/lib/api';
import { ReservationAlertData } from '@/lib/types';
import { cn } from '@/lib/utils';

export const Header: React.FC<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenProfile?: () => void;
}> = ({ isSidebarOpen = true, onToggleSidebar, onOpenProfile }) => {
  const toast = useToast();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useRole();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Reservation Alerts Notification State
  const [alerts, setAlerts] = useState<ReservationAlertData[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const data = await api.getReservationAlerts({ activeOnly: true, role: user.role });
      setAlerts(data || []);
    } catch {
      // Background poll failure is non-blocking
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 25000); // 25s background polling
    return () => clearInterval(interval);
  }, [user.role]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    if (isAlertsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAlertsOpen]);

  const handleAcknowledgeAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.acknowledgeReservationAlert(alertId, user.name);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('Alert Acknowledged', 'Table preparation status marked as acknowledged.');
    } catch (err: any) {
      toast.error('Failed to acknowledge alert', err.message);
    }
  };

  const handleDismissAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.dismissReservationAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.info('Alert Dismissed');
    } catch (err: any) {
      toast.error('Failed to dismiss alert', err.message);
    }
  };

  const handleOpenProfile = () => {
    onOpenProfile?.();
  };

  const handleResetData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      toast.celebrate('Database Refreshed!', 'Sample rooms, reservations, and active stays restored.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error('Reset Failed', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const userInitials = (user.name || user.email || 'Admin')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 sm:px-6 backdrop-blur-md transition-all bg-[var(--surface-card)]/90 border-[var(--border-default)] text-[var(--text-body)] dark:bg-[var(--surface-card)]/90 dark:border-[var(--border-default)] dark:text-[var(--text-body)] shadow-2xs">
      {/* Left side: Mobile menu toggle (< lg) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex lg:hidden items-center justify-center h-8.5 w-8.5 rounded-[3px] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-input)] text-[var(--brand-primary)] dark:bg-[var(--surface-muted)] dark:border-[var(--border-input)] dark:text-[var(--brand-primary)] transition-all shadow-2xs cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: Search, Theme Toggle & Profile Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-input)] text-[var(--text-muted)] hover:text-[var(--text-body)] hover:border-[var(--brand-primary)] dark:bg-[var(--surface-muted)] dark:border-[var(--border-input)] dark:text-[var(--text-muted)] dark:hover:text-[var(--text-body)] transition-all text-xs group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[var(--brand-primary)] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium">Quick Search (Rooms, Guests...)</span>
          <kbd className="hidden md:inline-flex items-center rounded bg-[var(--surface-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] border border-[var(--border-input)] dark:bg-[var(--surface-card)] dark:text-[var(--text-muted)] dark:border-[var(--border-input)] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Reservation & Table Alerts Notification Bell */}
        <div className="relative" ref={alertsDropdownRef}>
          <button
            onClick={() => setIsAlertsOpen((prev) => !prev)}
            title="Table Reservation Alerts (15-min preparation & overdue warnings)"
            className={cn(
              "relative p-2 rounded-lg border transition-all shadow-2xs cursor-pointer",
              alerts.length > 0
                ? alerts.some((a) => a.severity === 'DANGER')
                  ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                  : "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                : "bg-[var(--surface-card)] border-[var(--border-input)] text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] dark:bg-[var(--surface-card)] dark:border-[var(--border-input)] dark:text-[var(--text-muted)] dark:hover:text-[var(--brand-primary)]"
            )}
            aria-label="Reservation alerts"
          >
            <Bell className={cn("w-4 h-4", alerts.length > 0 && "animate-bounce")} />
            {alerts.length > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white shadow-xs",
                alerts.some((a) => a.severity === 'DANGER') ? "bg-rose-600 animate-pulse" : "bg-amber-500"
              )}>
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Popover */}
          {isAlertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-muted)]/50">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg text-white",
                    alerts.length > 0 ? (alerts.some(a => a.severity === 'DANGER') ? "bg-rose-600" : "bg-amber-500") : "bg-emerald-600"
                  )}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-body)]">Table Reservation Alerts</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">15-min preparation & turnover notices</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={fetchAlerts}
                    title="Refresh alerts"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsAlertsOpen(false)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alerts List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-default)]">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[var(--text-body)]">All Tables Ready</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      No tables need immediate turnover or preparation alerts right now.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isDanger = alert.severity === 'DANGER';
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-3.5 transition-colors border-l-4",
                          isDanger
                            ? "border-l-rose-500 bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                            : "border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--brand-primary)]">
                              {alert.tableNumber ? `Table ${alert.tableNumber}` : 'Table Alert'}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">
                              {alert.reservationTime}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                              isDanger
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            )}>
                              {isDanger ? 'Overdue Occupied' : alert.alertType === 'TABLE_DIRTY' ? 'Clean & Prep' : '15m Turnover'}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleDismissAlert(alert.id, e)}
                            title="Dismiss notification"
                            className="text-[var(--text-muted)] hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-xs font-bold text-[var(--text-body)] mt-1.5 leading-snug">
                          {alert.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        {alert.customerName && (
                          <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] bg-[var(--surface-card)]/80 px-2 py-1 rounded border border-[var(--border-default)]">
                            <span className="truncate max-w-[170px]">
                              Guest: <strong>{alert.customerName}</strong> ({alert.partySize}p)
                            </span>
                            {alert.phoneNumber && (
                              <span className="font-mono">{alert.phoneNumber}</span>
                            )}
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleAcknowledgeAlert(alert.id, e)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover-calc)] transition-colors shadow-2xs cursor-pointer"
                          >
                            Acknowledge
                          </button>
                          <Link
                            href="/tables"
                            onClick={() => setIsAlertsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[var(--surface-muted)] text-[var(--text-body)] hover:bg-[var(--surface-hover)] border border-[var(--border-input)] transition-colors"
                          >
                            <span>Table Board</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-[var(--border-default)] bg-[var(--surface-muted)]/30 text-center">
                <Link
                  href="/tables"
                  onClick={() => setIsAlertsOpen(false)}
                  className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>Open Full Restaurant Table Board</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-input)] text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] dark:bg-[var(--surface-card)] dark:border-[var(--border-input)] dark:text-[var(--text-muted)] dark:hover:text-[var(--brand-primary)] transition-all shadow-2xs cursor-pointer"
          aria-label="Toggle light or dark theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#F59E0B]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--brand-primary)]" />
          )}
        </button>

        {/* Reset / Demo Data Button (Secondary Action) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetData}
          isLoading={isSeeding}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />}
          className="hidden sm:inline-flex text-xs px-3 py-1.5 h-9 font-semibold"
        >
          Reset Demo
        </Button>

        {/* Check-In Desk Shortcut (Primary Action using active Theme Color) */}
        <Link href="/front-desk">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<LogIn className="w-4 h-4" />}
            className="text-xs px-3.5 py-1.5 h-9 font-bold shadow-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover-calc)] text-white"
          >
            Check-in Desk
          </Button>
        </Link>

        {/* User Profile Trigger -> Opens Right-Side Profile & Appearance Drawer */}
        <button
          type="button"
          onClick={handleOpenProfile}
          title="Open Profile, Workspace & Appearance (Click to customize)"
          className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-[var(--border-default)] dark:border-[var(--border-default)] text-left cursor-pointer group hover:opacity-90 transition-opacity"
          aria-label="Open Profile & Appearance Drawer"
        >
          <div className="hidden md:block text-right leading-tight">
            <div className="flex items-center justify-end gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-success)] animate-pulse" />
              <p className="text-xs font-bold text-[var(--text-body)] dark:text-[var(--text-inverse)] truncate max-w-[150px] group-hover:text-[var(--brand-primary)] transition-colors">
                {user.name}
              </p>
            </div>
            <p className="text-[10px] text-[var(--brand-primary)] font-semibold truncate max-w-[150px]">
              {user.department || 'Aura Grand Resort'}
            </p>
          </div>

          <div
            className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs font-bold text-xs select-none group-hover:scale-105 transition-transform"
          >
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent-success)] ring-2 ring-white dark:ring-[var(--surface-card)]" />
          </div>
        </button>
      </div>

      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};
