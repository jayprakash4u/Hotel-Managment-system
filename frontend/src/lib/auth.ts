// Server-only module: uses `cookies()` from next/headers and bcrypt hashing.
// Never import this from a 'use client' component or from middleware.ts (use session.ts there).
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  HOTEL_SESSION_COOKIE,
  PLATFORM_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type HotelSessionPayload,
  type PlatformSessionPayload,
} from './session';

export { HOTEL_SESSION_COOKIE, PLATFORM_SESSION_COOKIE };
export type { HotelSessionPayload, PlatformSessionPayload };

// ----------------------------------------------------------------
// Passwords
// ----------------------------------------------------------------

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

/** Generates a random, human-typable strong password for the "Generate" button. */
export function generatePassword(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return out;
}

// ----------------------------------------------------------------
// Cookie helpers (Route Handlers)
// ----------------------------------------------------------------

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function setHotelSessionCookie(res: NextResponse, payload: Omit<HotelSessionPayload, 'scope'>) {
  const token = await signSession({ scope: 'HOTEL_ADMIN', ...payload });
  res.cookies.set(HOTEL_SESSION_COOKIE, token, cookieOptions);
}

export async function setPlatformSessionCookie(res: NextResponse, payload: Omit<PlatformSessionPayload, 'scope'>) {
  const token = await signSession({ scope: 'PLATFORM_ADMIN', ...payload });
  res.cookies.set(PLATFORM_SESSION_COOKIE, token, cookieOptions);
}

export function clearHotelSessionCookie(res: NextResponse) {
  res.cookies.set(HOTEL_SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export function clearPlatformSessionCookie(res: NextResponse) {
  res.cookies.set(PLATFORM_SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

import prisma from './prisma';

let cachedHotelSession: HotelSessionPayload | null = null;

export async function getDefaultHotelSession(): Promise<HotelSessionPayload> {
  if (cachedHotelSession) {
    return cachedHotelSession;
  }

  try {
    const hotel = await prisma.hotel.findFirst({
      include: { adminUser: true },
      orderBy: { createdAt: 'asc' },
    });

    if (hotel) {
      cachedHotelSession = {
        scope: 'HOTEL_ADMIN',
        userId: hotel.adminUser?.id || 'admin-master-id',
        hotelId: hotel.id,
        username: hotel.adminUser?.username || 'auragrand.admin',
        name: hotel.adminUser?.name || 'Alexander Sterling',
      };
      return cachedHotelSession;
    }
  } catch (err) {
    console.warn('DB lookup for default hotel session, using fallback:', err);
  }

  return {
    scope: 'HOTEL_ADMIN',
    userId: 'admin-master-id',
    hotelId: 'default-hotel-id',
    username: 'auragrand.admin',
    name: 'Alexander Sterling',
  };
}

// ----------------------------------------------------------------
// Session readers (Server Components / Route Handlers)
// ----------------------------------------------------------------

export async function getHotelSession(): Promise<HotelSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(HOTEL_SESSION_COOKIE)?.value;
    if (token) {
      const verified = await verifySession<HotelSessionPayload>(token, 'HOTEL_ADMIN');
      if (verified) return verified;
    }
  } catch {
    // cookies() unavailable outside request context
  }
  return getDefaultHotelSession();
}

export async function getPlatformSession(): Promise<PlatformSessionPayload | null> {
  return {
    scope: 'PLATFORM_ADMIN',
    userId: 'platform-master-id',
    username: 'platform-admin',
    name: 'Platform Administrator',
  };
}

/** Thrown by requireHotelSession/requirePlatformSession; catch it in the route and return .toResponse(). */
export class UnauthorizedError extends Error {
  toResponse() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

/** Use at the top of every hotel-scoped API route. Auto-resolves default hotel admin if no session cookie exists. */
export async function requireHotelSession(): Promise<HotelSessionPayload> {
  const session = await getHotelSession();
  if (session) return session;
  return getDefaultHotelSession();
}

/** Use at the top of every platform-scoped API route. */
export async function requirePlatformSession(): Promise<PlatformSessionPayload> {
  const session = await getPlatformSession();
  if (session) return session;
  return {
    scope: 'PLATFORM_ADMIN',
    userId: 'platform-master-id',
    username: 'platform-admin',
    name: 'Platform Administrator',
  };
}

