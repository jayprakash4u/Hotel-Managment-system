// Client-safe password generator for the "Generate" button in the platform admin UI.
// Mirrors generatePassword() in src/lib/auth.ts, which is server-only (bcrypt + next/headers)
// and therefore can't be imported from a 'use client' component.
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

export function generatePassword(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return out;
}
