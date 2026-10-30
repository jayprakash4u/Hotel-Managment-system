'use client';

import React from 'react';
import { AddPurchaseModal, InventoryItemOption, SupplierOption } from './AddPurchaseModal';

export type { InventoryItemOption, SupplierOption };

export interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItemOption[];
  suppliers?: SupplierOption[];
  onStockAdded?: () => void;
  onPurchaseCompleted?: () => void;
  preselectedItemId?: string;
  defaultDepartment?: 'HOTEL' | 'RESTAURANT';
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  items,
  suppliers,
  onStockAdded,
  onPurchaseCompleted,
  preselectedItemId,
  defaultDepartment,
}) => {
  return (
    <AddPurchaseModal
      isOpen={isOpen}
      onClose={onClose}
      items={items}
      suppliers={suppliers}
      onPurchaseCompleted={onPurchaseCompleted || onStockAdded || (() => {})}
      preselectedItemId={preselectedItemId}
      defaultDepartment={defaultDepartment}
    />
  );
};
