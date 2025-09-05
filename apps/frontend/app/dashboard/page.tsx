'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import { LogOut, User, Settings, Play, Lock, Clock, Calendar, Menu, X } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

interface DashboardData {
  stats: {
    completedLessons: number
    totalWatchHours: number
    totalLoginDays: number
  }
  recentActivities: Array<{
    type: string
    title: string
    timestamp: string
    icon: string
  }>
  latestLessons: Array<{
    id: string
    title: string
    description: string
    duration: number
    thumbnailUrl: string | null
    isLocked: boolean
    releaseDate: string | null
    courseTitle: string
    progress: {
      completed: boolean
      watchedSeconds: number
    } | null
    isAvailable: boolean
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  // 認証を無効化 - デフォルトユーザーを設定
  const mockUser = { 
    id: '1', 
    name: 'ゲストユーザー', 
    email: 'guest@fx-tiger-dojo.com' 
  }
  const user = mockUser
  const isAuthenticated = true
  const isLoading = false
  const logout = async () => {}
  const getCurrentUser = () => {}
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // 認証チェックを無効化
  useEffect(() => {
    // 認証チェックをスキップ
  }, [])

  useEffect(() => {
    // モックデータを設定
    const mockDashboardData: DashboardData = {
      stats: {
        completedLessons: 12,
        totalWatchHours: 24,
        totalLoginDays: 30
      },
      recentActivities: [
        {
          type: 'lesson',
          title: 'トレンドフォロー戦略の基礎を視聴しました',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          icon: 'play'
        },
        {
          type: 'login',
          title: 'ダッシュボードにログインしました',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          icon: 'user'
        },
        {
          type: 'lesson',
          title: 'リスク管理入門を完了しました',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          icon: 'calendar'
        }
      ],
      latestLessons: [
        {
          id: '1',
          title: 'プロトレーダーのマインドセット',
          description: 'プロトレーダーとして成功するための心理的側面を解説',
          duration: 1800,
          thumbnailUrl: null,
          isLocked: false,
          releaseDate: null,
          courseTitle: 'FX基礎コース',
          progress: {
            completed: false,
            watchedSeconds: 0
          },
          isAvailable: true
        },
        {
          id: '2',
          title: '移動平均線を使った取引戦略',
          description: '移動平均線の基本と実践的な使い方',
          duration: 2400,
          thumbnailUrl: null,
          isLocked: false,
          releaseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          courseTitle: 'テクニカル分析コース',
          progress: null,
          isAvailable: false
        }
      ]
    }
    
    setDashboardData(mockDashboardData)
    setDataLoading(false)
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 7) {
      return `${Math.floor(diffDays / 7)}週間前`
    } else if (diffDays > 0) {
      return `${diffDays}日前`
    } else if (diffHours > 0) {
      return `${diffHours}時間前`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分前`
    } else {
      return 'たった今'
    }
  }

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'play':
        return <Play className="w-5 h-5 text-green-400" />
      case 'user':
        return <User className="w-5 h-5 text-blue-400" />
      case 'calendar':
        return <Calendar className="w-5 h-5 text-yellow-400" />
      default:
        return <Play className="w-5 h-5 text-gray-400" />
    }
  }

  const getActivityBgColor = (icon: string) => {
    switch (icon) {
      case 'play':
        return 'bg-green-900/50'
      case 'user':
        return 'bg-blue-900/50'
      case 'calendar':
        return 'bg-yellow-900/50'
      default:
        return 'bg-gray-900/50'
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // ローディング状態を削除（常にユーザーが存在する状態）

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-lg md:text-xl">🦁</span>
              </div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                トレード道場
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/videos" className="text-gray-400 hover:text-white font-medium transition">
                動画
              </Link>
              <Link href="/chat" className="text-gray-400 hover:text-white font-medium transition">
                チャット
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white font-medium transition">
                料金プラン
              </Link>
              
              <div className="flex items-center gap-3 pl-6 border-l border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                  <span className="text-white text-sm font-medium">{user.name}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition"
                  title="ログアウト"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-700">
              <div className="space-y-4">
                <Link 
                  href="/videos" 
                  className="block text-gray-400 hover:text-white font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  動画
                </Link>
                <Link 
                  href="/chat" 
                  className="block text-gray-400 hover:text-white font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  チャット
                </Link>
                <Link 
                  href="/pricing" 
                  className="block text-gray-400 hover:text-white font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  料金プラン
                </Link>
                
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                    <span className="text-white text-sm font-medium">{user.name}</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                  >
                    <LogOut className="w-5 h-5" />
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-yellow-400/20 rounded-2xl p-4 md:p-8 shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
              おかえりなさい、{user.name}さん！
            </h2>
            <p className="text-sm md:text-base text-gray-300 mb-4 md:mb-6 leading-relaxed">
              FX Tiger Dojoへようこそ。今月の新しいレッスンをチェックして、
              プロトレーダーへの道を歩み続けましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-amber-700 transition shadow-md"
              >
                <Play className="w-5 h-5" />
                動画を見る
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-yellow-400 text-yellow-400 font-bold rounded-lg hover:bg-yellow-400/10 transition"
              >
                講師とチャット
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboardData?.stats.completedLessons || 0}</p>
                <p className="text-gray-300 text-sm">視聴済みレッスン</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboardData?.stats.totalWatchHours || 0}</p>
                <p className="text-gray-300 text-sm">総視聴時間（時間）</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboardData?.stats.totalLoginDays || 0}</p>
                <p className="text-gray-300 text-sm">総ログイン日数</p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Videos Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">今月のレッスン</h3>
            <Link
              href="/videos"
              className="text-yellow-400 hover:text-amber-600 transition text-sm font-medium"
            >
              すべて見る →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {dashboardData?.latestLessons.slice(0, 2).map((lesson) => (
              <Link 
                key={lesson.id} 
                href={lesson.isAvailable ? `/lessons/${lesson.id}` : '#'}
                className={`group cursor-pointer ${!lesson.isAvailable ? 'relative opacity-70' : ''}`}
              >
                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700 group-hover:border-yellow-400/50 transition-all duration-300 shadow-lg">
                  <img 
                    src={lesson.thumbnailUrl || '/api/placeholder/640/360'} 
                    alt={lesson.title}
                    className={`w-full h-full object-cover ${lesson.isAvailable ? 'group-hover:scale-105 transition-transform duration-300' : 'opacity-60'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {lesson.isAvailable ? (
                        <>
                          <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-500/30">
                            {lesson.progress?.completed ? '視聴済み' : '視聴可能'}
                          </span>
                          <span className="text-white text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {Math.floor(lesson.duration / 60)}分
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-600">
                            {lesson.releaseDate ? new Date(lesson.releaseDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) + '公開' : 'ロック中'}
                          </span>
                          <span className="text-white text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {Math.floor(lesson.duration / 60)}分
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      {lesson.title}
                    </h4>
                    <p className="text-slate-200 text-sm">
                      {lesson.description}
                    </p>
                  </div>
                  {lesson.isAvailable ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <div className="w-16 h-16 bg-yellow-400/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition shadow-lg">
                        <Play className="w-8 h-8 text-black" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
                {!lesson.isAvailable && lesson.releaseDate && (
                  <div className="absolute top-4 right-4 bg-yellow-400/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg">
                    <p className="text-black text-sm font-semibold">
                      あと{Math.ceil((new Date(lesson.releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日で公開
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h3 className="text-2xl font-bold text-white mb-6">最近のアクティビティ</h3>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
            <div className="p-6">
              {dataLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-gray-400">読み込み中...</div>
                </div>
              ) : !dashboardData?.recentActivities || dashboardData.recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-2">まだアクティビティがありません</p>
                  <p className="text-gray-500 text-sm">レッスンを視聴したり、講師とチャットすると、ここに表示されます</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-700 last:border-b-0">
                      <div className={`w-10 h-10 ${getActivityBgColor(activity.icon)} rounded-lg flex items-center justify-center`}>
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-gray-300 text-sm">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}