'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { courseApi } from '@/lib/api'
import { Play, Lock, Clock, Calendar, ChevronRight, Menu, X } from 'lucide-react'
import Image from 'next/image'

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string
  duration?: number
  orderIndex: number
  releaseType: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE'
  releaseDays?: number
  releaseDate?: string
  prerequisiteId?: string
  course: {
    id: string
    title: string
    slug: string
  }
  userAccess?: {
    isAvailable: boolean
    daysUntilAvailable: number
  }
}

export default function VideosPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch lessons from API
  const fetchLessons = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 [DEBUG] API Base URL:', process.env.NEXT_PUBLIC_API_URL)
      console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV)
      console.log('🔍 [DEBUG] User info:', user)
      console.log('🔍 [DEBUG] Fetching lessons...')
      
      const response = await courseApi.getUserAvailableLessons()
      console.log('✅ [DEBUG] Lessons API response:', response.data)
      console.log('✅ [DEBUG] Lessons count:', response.data?.lessons?.length)
      
      // Debug each lesson's access status
      response.data?.lessons?.forEach((lesson: Lesson, index: number) => {
        console.log(`🎬 [DEBUG] Lesson ${index + 1}:`, {
          title: lesson.title,
          releaseType: lesson.releaseType,
          releaseDays: lesson.releaseDays,
          releaseDate: lesson.releaseDate,
          userAccess: lesson.userAccess,
          orderIndex: lesson.orderIndex,
          isAvailable: lesson.userAccess?.isAvailable,
          daysUntilAvailable: lesson.userAccess?.daysUntilAvailable
        })
      })
      
      setLessons(response.data?.lessons || [])
    } catch (err: any) {
      console.error('❌ [DEBUG] Failed to fetch lessons:', err)
      console.error('❌ [DEBUG] Error config:', err?.config)
      console.error('❌ [DEBUG] Error response:', err?.response?.data)
      console.error('❌ [DEBUG] Error status:', err?.response?.status)
      setError(`講習の取得に失敗しました: ${err?.response?.data?.error || err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated && user) {
      fetchLessons()
    }
  }, [isAuthenticated, authLoading, router, user])

  // Group lessons by availability (available vs unavailable)
  const groupedLessons = React.useMemo(() => {
    // All lessons sorted by order index
    const sortedLessons = lessons.sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Available lessons (can be watched)
    const available = sortedLessons.filter(lesson => lesson.userAccess?.isAvailable === true)
    
    // Unavailable lessons (cannot be watched) - limit to max 2
    const unavailable = sortedLessons
      .filter(lesson => lesson.userAccess?.isAvailable !== true)
      .slice(0, 2) // 最大2つまで表示
    
    return {
      available,
      unavailable
    }
  }, [lessons])

  const isLessonAvailable = (lesson: Lesson): boolean => {
    // より安全なアクセス判定
    if (!lesson.userAccess) return false
    return lesson.userAccess.isAvailable === true
  }

  const getDaysUntilAvailable = (lesson: Lesson): number => {
    return lesson.userAccess?.daysUntilAvailable ?? 0
  }

  // Extract Vimeo ID from video URL for thumbnail
  const getVimeoId = (videoUrl: string): string | null => {
    const match = videoUrl.match(/vimeo\.com\/video\/(\d+)/i) || videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/i)
    return match ? match[1] : null
  }

  const getVimeoThumbnail = (videoUrl: string): string => {
    const vimeoId = getVimeoId(videoUrl)
    return vimeoId ? `https://vumbnail.com/${vimeoId}.jpg` : '/api/placeholder/640/360'
  }

  // Format duration in minutes:seconds
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未設定'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (authLoading || isLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl overflow-hidden shadow-lg">
                <Image 
                  src="/images/lion-tech.jpeg" 
                  alt="Lion Logo" 
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                トレード道場
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/videos" className="text-yellow-400 font-medium">
                講習
              </Link>
              <Link href="/chat" className="text-gray-400 hover:text-white transition">
                チャット
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                ダッシュボード
              </Link>
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
                  className="block text-yellow-400 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  講習
                </Link>
                <Link 
                  href="/chat" 
                  className="block text-gray-400 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  チャット
                </Link>
                <Link 
                  href="/dashboard" 
                  className="block text-gray-400 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ダッシュボード
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/dashboard" className="hover:text-white transition">
            ダッシュボード
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">講習一覧</span>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">学習コンテンツ</h2>
          <p className="text-gray-300 text-lg">
            月2本の厳選された講習でプロトレーダーへの道を歩みましょう
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Lessons by Category */}
        <div className="space-y-12">
          {/* Available Lessons */}
          {groupedLessons.available.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  視聴可能
                </div>
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="text-sm text-gray-500">
                  {groupedLessons.available.length}本の講習
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {groupedLessons.available.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          )}

          {/* Unavailable Lessons (max 2) */}
          {groupedLessons.unavailable.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                  視聴不可
                </div>
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="text-sm text-gray-500">
                  {groupedLessons.unavailable.length}本の講習
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {groupedLessons.unavailable.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          )}

          {/* No Lessons Message */}
          {lessons.length === 0 && !isLoading && !error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">講習がまだありません</h3>
              <p className="text-gray-400">新しいコンテンツが追加されるまでお待ちください。</p>
            </div>
          )}
        </div>

        {/* 今後追加予定のコンテンツ案内 */}
        <div className="mt-16 p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">今後のコンテンツ</h3>
          </div>
          <p className="text-gray-300">
            毎月2本の新しい講習を追加していきます。継続的な学習でプロトレーダーへの道を着実に歩んでいきましょう。
          </p>
        </div>
      </main>
    </div>
  )
}

// Lesson Card Component
function LessonCard({ lesson }: { lesson: Lesson }) {
  const isAvailable = lesson.userAccess?.isAvailable ?? false
  const daysUntil = lesson.userAccess?.daysUntilAvailable ?? 0
  
  // Debug logging for each lesson card render
  console.log(`🎬 [DEBUG] Rendering LessonCard for "${lesson.title}":`, {
    releaseType: lesson.releaseType,
    isAvailable,
    daysUntil,
    userAccess: lesson.userAccess,
    releaseDays: lesson.releaseDays,
    releaseDate: lesson.releaseDate
  })
  
  const getVimeoId = (videoUrl: string): string | null => {
    const match = videoUrl.match(/vimeo\.com\/video\/(\d+)/i) || videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/i)
    return match ? match[1] : null
  }

  const getVimeoThumbnail = (videoUrl: string): string => {
    const vimeoId = getVimeoId(videoUrl)
    return vimeoId ? `https://vumbnail.com/${vimeoId}.jpg` : '/api/placeholder/640/360'
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未設定'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getReleaseInfo = () => {
    if (!isAvailable) {
      if (lesson.releaseType === 'DRIP' && lesson.releaseDays) {
        const daysUntil = lesson.userAccess?.daysUntilAvailable ?? 0
        if (daysUntil > 0) {
          return `あと${daysUntil}日で視聴可能`
        }
      }
      return '視聴不可'
    }
    
    switch (lesson.releaseType) {
      case 'IMMEDIATE':
        return '視聴可能'
      case 'DRIP':
        return `登録${lesson.releaseDays}日後`
      case 'SCHEDULED':
        return lesson.releaseDate ? new Date(lesson.releaseDate).toLocaleDateString('ja-JP') : '日付未設定'
      case 'PREREQUISITE':
        return '前提条件あり'
      case 'HIDDEN':
        return '非公開'
      default:
        return '視聴可能'
    }
  }

  return (
    <div className="space-y-4">
      <Link 
        href={isAvailable ? `/lessons/${lesson.id}` : '#'}
        className={`block group ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      >
        <div className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${
          isAvailable ? 'hover:border-yellow-500/50 group-hover:scale-[1.02]' : 'opacity-60'
        } transition-all duration-300`}>
          
          {isAvailable ? (
            // サムネイル画像
            <div className="w-full h-full relative">
              <img 
                src={getVimeoThumbnail(lesson.videoUrl)}
                alt={lesson.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder/640/360'
                }}
              />
              {/* プレイオーバーレイ */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <div className="w-16 h-16 bg-yellow-400/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </div>
            </div>
          ) : (
            // ロック状態
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  あと{daysUntil}日で公開
                </p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className={`px-3 py-1 text-xs rounded-full border backdrop-blur-sm ${
              isAvailable 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            }`}>
              {isAvailable ? '視聴可能' : 'ロック中'}
            </div>
          </div>

          {/* Duration Badge */}
          {lesson.duration && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-lg z-10">
              <div className="flex items-center gap-1 text-white">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {formatDuration(lesson.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Countdown for locked videos */}
          {!isAvailable && daysUntil > 0 && (
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-lg z-10">
              <div className="flex items-center gap-1 text-yellow-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {daysUntil}日後
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Video Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">
          {lesson.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{getReleaseInfo()}</span>
        </div>
      </div>
    </div>
  )
}