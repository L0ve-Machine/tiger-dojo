'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading } = useAuthStore()
  const pathname = usePathname()
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/login', 
    '/auth/register',
    '/admin-login',
    '/privacy',
    '/terms'
  ]
  
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/admin-login')

  useEffect(() => {
    // Always check auth status on app load
    checkAuth()
  }, [checkAuth])

  // Show loading spinner only on non-public paths when auth is loading
  if (!isPublicPath && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🦁</span>
          </div>
          <p className="text-gray-400">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}