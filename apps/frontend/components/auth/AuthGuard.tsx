'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if auth is required, not loading, and user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [requireAuth, isLoading, isAuthenticated, router, redirectTo])

  // Show loading state while checking authentication
  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🦁</span>
          </div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Don't render protected content if auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated && !isLoading) {
    return null // Router will handle redirect
  }

  return <>{children}</>
}