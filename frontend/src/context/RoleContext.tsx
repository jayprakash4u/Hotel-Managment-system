'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { checkPermission } from '@/lib/permissions';
import { api } from '@/lib/api';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  roleTitle: string;
  department: string;
}

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  ADMIN: {
    name: 'Alexander Sterling',
    email: 'alexander@auragrand.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'General Manager (Super Admin)',
    department: 'Executive Office',
  },
  FRONT_DESK: {
    name: 'Elena Rostova',
    email: 'elena.frontdesk@auragrand.com',
    role: 'FRONT_DESK',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Chief Receptionist',
    department: 'Front Office',
  },
  HOUSEKEEPING: {
    name: 'Maria Santos',
    email: 'maria.housekeeping@auragrand.com',
    role: 'HOUSEKEEPING',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Housekeeping Lead',
    department: 'Housekeeping & Facilities',
  },
  POS_CASHIER: {
    name: 'David Kim',
    email: 'david.cashier@auragrand.com',
    role: 'POS_CASHIER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Outlets POS Captain',
    department: 'Food & Beverage',
  },
  CHEF: {
    name: 'Chef Jean-Pierre Laurent',
    email: 'jeanpierre@auragrand.com',
    role: 'CHEF',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Executive Head Chef',
    department: 'Kitchen & Culinary',
  },
  FINANCE_OFFICER: {
    name: 'Marcus Vance',
    email: 'marcus.finance@auragrand.com',
    role: 'FINANCE_OFFICER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Director of Finance',
    department: 'Accounting & Auditing',
  },
  GUEST: {
    name: 'Eleanor Roosevelt',
    email: 'eleanor.vip@luxurystays.com',
    role: 'GUEST',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Diamond VIP In-House Guest',
    department: 'Guest In-Stay Concierge',
  },
};

interface RoleContextType {
  role: UserRole;
  user: UserProfile;
  setRole: (role: UserRole) => void;
  hasPermission: (permissionKey: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('ADMIN');
  // Real identity of the logged-in hotel admin, overlaid onto the ADMIN persona below.
  // The FRONT_DESK/HOUSEKEEPING/etc. personas stay as an internal demo/QA role-switcher.
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string; hotelName: string } | null>(null);

  useEffect(() => {
    // Single unified admin: Always maintain full ADMIN privileges
    setRoleState('ADMIN');

    api
      .getMe()
      .then((me) => setSessionUser({ name: me.name, email: me.username, hotelName: me.hotelName }))
      .catch(() => setSessionUser(null));
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState('ADMIN');
  };

  const hasPermission = (_permissionKey: string): boolean => {
    // Full Super Admin permission across all modules
    return true;
  };

  const baseProfile = ROLE_PROFILES[role] || ROLE_PROFILES.ADMIN;
  const user: UserProfile =
    role === 'ADMIN' && sessionUser
      ? {
          ...baseProfile,
          name: sessionUser.name,
          email: sessionUser.email,
          department: sessionUser.hotelName || baseProfile.department,
        }
      : baseProfile;

  return (
    <RoleContext.Provider value={{ role, user, setRole, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    return {
      role: 'ADMIN',
      user: ROLE_PROFILES.ADMIN,
      setRole: () => {},
      hasPermission: () => true,
    };
  }
  return context;
};

export const PermissionGate: React.FC<{
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = useRole();
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
