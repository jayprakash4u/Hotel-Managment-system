import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Direct access: redirect legacy login pages and separate panels straight to the unified admin dashboard
  if (
    pathname === '/login' ||
    pathname.startsWith('/platform') ||
    pathname.startsWith('/portal')
  ) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image (static assets)
     * - files with an extension (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
};

