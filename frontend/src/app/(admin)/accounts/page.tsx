'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { AccountsNavBoxes } from '@/components/common/AccountsNavBoxes';
import CustomerLedgerAccountsTab from '@/components/accounts/CustomerLedgerAccountsTab';
import ChartOfAccountsTab from '@/components/accounts/ChartOfAccountsTab';
import JournalEntriesTab from '@/components/accounts/JournalEntriesTab';
import GeneralLedgerTab from '@/components/accounts/GeneralLedgerTab';
import TrialBalanceTab from '@/components/accounts/TrialBalanceTab';
import SalesTransactionsTab from '@/components/accounts/SalesTransactionsTab';
import PurchaseTransactionsTab from '@/components/accounts/PurchaseTransactionsTab';
import SupplierLedgerAccountsTab from '@/components/accounts/SupplierLedgerAccountsTab';
import CashAccountsTab from '@/components/accounts/CashAccountsTab';
import BankAndWalletAccountsTab from '@/components/accounts/BankAndWalletAccountsTab';
import BankReconciliationTab from '@/components/accounts/BankReconciliationTab';
import IncomeTab from '@/components/accounts/IncomeTab';
import ExpensesTab from '@/components/accounts/ExpensesTab';
import FixedAssetsTab from '@/components/accounts/FixedAssetsTab';
import LiabilitiesTab from '@/components/accounts/LiabilitiesTab';

function AccountsContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  if (currentTab === 'chart-of-accounts') {
    return <ChartOfAccountsTab />;
  }

  if (currentTab === 'journal-entries') {
    return <JournalEntriesTab />;
  }

  if (currentTab === 'general-ledger') {
    return <GeneralLedgerTab />;
  }

  if (currentTab === 'trial-balance') {
    return <TrialBalanceTab />;
  }

  if (currentTab === 'sales-transactions') {
    return <SalesTransactionsTab />;
  }

  if (currentTab === 'purchase-transactions') {
    return <PurchaseTransactionsTab />;
  }

  if (currentTab === 'supplier-ledger') {
    return <SupplierLedgerAccountsTab />;
  }

  if (currentTab === 'cash-accounts') {
    return <CashAccountsTab />;
  }

  if (currentTab === 'bank-accounts' || currentTab === 'bank-wallet-accounts' || currentTab === 'digital-wallets') {
    return <BankAndWalletAccountsTab />;
  }

  if (currentTab === 'bank-reconciliation') {
    return <BankReconciliationTab />;
  }

  if (currentTab === 'income') {
    return <IncomeTab />;
  }

  if (currentTab === 'expenses') {
    return <ExpensesTab />;
  }

  if (currentTab === 'fixed-assets') {
    return <FixedAssetsTab />;
  }

  if (currentTab === 'liabilities') {
    return <LiabilitiesTab />;
  }

  if (currentTab === 'customer-ledger') {
    return <CustomerLedgerAccountsTab />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Accounts &amp; Financial Management Hub
          </span>
        </div>
        <AccountsNavBoxes activeId={currentTab || ''} />
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}
