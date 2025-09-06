'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import Link from 'next/link'
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Video, 
  MessageSquare, 
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  Upload
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    
    if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
      router.push('/dashboard')
      return
    }
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-6 h-6 text-black" />
          </div>
          <p className="text-gray-400">管理画面を読み込み中...</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: BarChart3, label: 'ダッシュボード', href: '/admin', adminOnly: false },
    { icon: Users, label: 'ユーザー管理', href: '/admin/users', adminOnly: true },
    { icon: BookOpen, label: 'コース管理', href: '/admin/courses', adminOnly: false },
    { icon: Video, label: 'レッスン管理', href: '/admin/lessons', adminOnly: false },
    { icon: Upload, label: '動画アップロード', href: '/admin/upload', adminOnly: false },
    { icon: MessageSquare, label: 'チャット管理', href: '/admin/chat', adminOnly: true },
    { icon: Settings, label: 'システム設定', href: '/admin/settings', adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'ADMIN'
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h1 className="text-xl font-bold text-white">管理画面</h1>
              <p className="text-sm text-gray-400">
                {user?.role === 'ADMIN' ? '管理者' : '講師'}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="border-t border-gray-800 pt-4 mt-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>生徒画面に戻る</span>
              </Link>
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">管理画面</h1>
          <div className="w-6 h-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}