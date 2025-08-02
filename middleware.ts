import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

// Simple in-memory rate limiter (IP-based, 60 req/min)
const rateLimitMap = new Map();
const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 1000;

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Add streaming headers for chat API routes
  if (pathname.startsWith('/api/chat')) {
    const response = NextResponse.next();
    response.headers.set('X-Accel-Buffering', 'no');
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate',
    );
    response.headers.set('Connection', 'keep-alive');
    return response;
  }

  // Allow all auth API routes to pass through (including OAuth callbacks)
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/status') ||
    pathname.startsWith('/api/admin/maintenance')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/profile') {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  // Rate limit only /api routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const now = Date.now();
    let entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > WINDOW_MS) {
      entry = { count: 1, start: now };
    } else {
      entry.count++;
    }
    rateLimitMap.set(ip, entry);
    if (entry.count > RATE_LIMIT) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Allow access to auth pages even without token
  if (pathname === '/auth' || pathname === '/register') {
    return NextResponse.next();
  }

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const isGuest = guestRegex.test(token?.email ?? '');
  
  // SIMPLE ADMIN LOGIC: Only sshssn@yahoo.com is admin
  const isAdmin = token?.email === 'sshssn@yahoo.com';

  // Debug logging for admin detection
  if (pathname === '/admin') {
    console.log('Admin access attempt:', {
      email: token?.email,
      isAdmin,
      pathname,
    });
  }

  // Check maintenance mode (except for admin users and admin page)
  if (!isAdmin && pathname !== '/maintenance' && pathname !== '/admin') {
    try {
      // Add timeout to prevent hanging requests - reduced for better TTFB
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      const maintenanceRes = await fetch(
        `${request.nextUrl.origin}/api/admin/maintenance`,
        {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      );

      clearTimeout(timeoutId);

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json();
        if (maintenanceData.maintenanceMode) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    } catch (error) {
      // Silently ignore maintenance check errors to prevent app crashes
      console.warn('Maintenance check failed, continuing normally:', error);
    }
  }

  // Only admin can access admin page
  if (pathname === '/admin') {
    if (isAdmin) {
      return NextResponse.next();
    } else {
      // Redirect non-admin users away from admin page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from auth pages (but allow guests to access auth)
  if (token && !isGuest && ['/auth', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow guests to access auth pages
  if (isGuest && ['/auth', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/admin',
    '/api/:path*',
    '/auth',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
