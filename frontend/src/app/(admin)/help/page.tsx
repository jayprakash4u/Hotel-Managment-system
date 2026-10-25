'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Headphones,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Sparkles,
  PhoneCall,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    category: 'Reservations & Stays',
    q: 'How do I check in a walk-in guest without a prior booking?',
    a: 'Navigate to Hotel Management > Check-In, or use Quick Book on the dashboard. Select an available clean room, enter guest ID details, and click "Confirm Check-In". An itemized folio invoice will be automatically generated.',
  },
  {
    category: 'Restaurant & POS',
    q: 'How are restaurant and room service charges billed to guest rooms?',
    a: 'Open Restaurant Management > Orders. When creating or settling a POS ticket, choose "Post to Room" as the payment method. Select the guest\'s occupied room, and the balance will automatically post to their active hotel folio.',
  },
  {
    category: 'Finance & Payments',
    q: 'How do I open and close the cashier shift float?',
    a: 'Under Finance, click "Open Shift Float" in the top action bar. Enter the starting cash drawer balance (e.g. $500). At the end of the shift, click "Close Register Shift" to enter physical cash tally and print shift reconciliation.',
  },
  {
    category: 'Kitchen Display (KDS)',
    q: 'How does the kitchen update ticket preparation stages?',
    a: 'On Restaurant Management > Kitchen, order tickets display in real time with cook counters. Chefs click "Start Cooking" when prep begins, then "Mark Ready" to alert floor runners for dispatch.',
  },
  {
    category: 'Security & Access',
    q: 'Can receptionist accounts modify tax rates or property configuration?',
    a: 'No. System Settings, tax rates, and database seed resets are strictly protected by Role-Based Access Control (RBAC) and restricted to General Manager / Super Admin accounts.',
  },
];

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const filteredFaqs = FAQ_LIST.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================================
          HEADER SECTION
          ===================================================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shrink-0">
              <HelpCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Help & Support Center
                </h1>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Support 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Operator user manuals, keyboard shortcuts, frequently asked questions, and front-desk escalation lines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block font-bold">System Status</span>
              All Outlets Operational
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          QUICK HELP TOP CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Manual */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F2EE] dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400 border border-[#CBD5D0] dark:border-emerald-800 mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              User Documentation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Complete workflows for Front Desk, Dining POS, Housekeeping, and Night Audits.
            </p>
          </div>
          <Link
            href="/hotel-management"
            className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            Explore Workflows <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 border border-purple-200 dark:border-purple-900 mb-3">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Keyboard Hotkeys
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Fast navigation shortcuts for quick billing, check-in search, and table booking.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border">K</kbd> to search
          </span>
        </div>

        {/* Support Escalation */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-900 mb-3">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              IT Support Line
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Dedicated hospitality system engineer for high-priority outages & POS glitches.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            Ext: 104 · it-help@auragrand.com
          </div>
        </div>

        {/* Security & Audit */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-900 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Security Compliance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Full PCI-DSS compliance, encrypted folios, and tamper-proof shift tally registers.
            </p>
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
            Status: Fully Encrypted
          </div>
        </div>
      </div>

      {/* =====================================================================
          FREQUENTLY ASKED QUESTIONS (FAQ)
          ===================================================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions (FAQ)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Standard operating procedures for Front Desk, POS, and Housekeeping staff.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;

            return (
              <div key={idx} className="p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {faq.category}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 pl-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-[#0B3D32] dark:border-emerald-500 bg-slate-50/60 dark:bg-slate-900/40 p-2.5 rounded-r">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
