import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  // Если это production и домен НЕ makemeaphoto.com - редиректим
  if (
    process.env.NODE_ENV === 'production' &&
    host.includes('vercel.app') &&
    !host.includes('localhost')
  ) {
    const productionUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.makemeaphoto.com';
    const newUrl = `${productionUrl}${request.nextUrl.pathname}${request.nextUrl.search}`;
    
    return NextResponse.redirect(newUrl, 308); // Permanent redirect
  }

  return NextResponse.next();
}

// Применяем middleware ко всем путям
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
