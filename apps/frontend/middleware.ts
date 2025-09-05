import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 保護されたルート（有料会員のみアクセス可能）
const protectedRoutes = [
  '/courses',
  '/lessons',
  '/library',
  '/watch',
]

// 認証が必要なルート
const authRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
]

export function middleware(request: NextRequest) {
  // 認証チェックを無効化 - すべてのリクエストを通す
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}