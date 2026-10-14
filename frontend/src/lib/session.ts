// Edge-safe session token (JWT) helpers — no bcrypt, no next/headers.
// Shared by src/lib/auth.ts (Route Handlers, Node runtime) and middleware.ts (Edge runtime).
import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) {
  throw new Error('SESSION_SECRET is not set. Add it to .env.local (see .env.example).');
}
const SECRET = new TextEncoder().encode(rawSecret);

export const HOTEL_SESSION_COOKIE = 'hms_hotel_session';
export const PLATFORM_SESSION_COOKIE = 'hms_platform_session';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface HotelSessionPayload {
  scope: 'HOTEL_ADMIN';
  userId: string;
  hotelId: string;
  username: string;
  name: string;
}

export interface PlatformSessionPayload {
  scope: 'PLATFORM_ADMIN';
  userId: string;
  username: string;
  name: string;
}

export type SessionPayload = HotelSessionPayload | PlatformSessionPayload;

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(SECRET);
}

export async function verifySession<T extends SessionPayload>(
  token: string,
  scope: T['scope']
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.scope !== scope) return null;
    return payload as unknown as T;
  } catch {
    return null;
  }
}
