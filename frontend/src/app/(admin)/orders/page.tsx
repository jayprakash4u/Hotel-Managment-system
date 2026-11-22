import React, { Suspense } from 'react';
import { OrdersManagementView } from '@/components/orders/OrdersManagementView';

export const metadata = {
  title: 'Orders | Hospitality Management System',
  description: 'View and manage all restaurant orders in one place.',
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading orders...</div>}>
      <OrdersManagementView />
    </Suspense>
  );
}
