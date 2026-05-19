import { NextResponse, type NextRequest } from 'next/server'

// Minimal middleware - just pass through
// Auth is handled client-side via AuthProvider to avoid SSR/cookie loop issues
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
