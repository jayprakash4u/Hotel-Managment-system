'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { UserProfileView } from '@/components/profile/UserProfileView';

export default function UserProfilePage() {
  return (
    <div className="w-full min-w-0 py-2">
      <UserProfileView />
    </div>
  );
}
