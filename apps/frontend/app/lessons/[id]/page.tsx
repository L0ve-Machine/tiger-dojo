'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { courseApi, vimeoApi } from '@/lib/api'
import { ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Clock } from 'lucide-react'
import Image from 'next/image'
import AuthGuard from '@/components/auth/AuthGuard'

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
  // Fields from getLessonById API
  hasAccess?: boolean
  accessReason?: string
  availableIn?: number
  // Legacy fields from getUserAvailableLessons
  userAccess?: {
    isAvailable: boolean
    daysUntilAvailable: number
  }
}

interface Progress {
  id: string
  watchedSeconds: number
  completed: boolean
  completedAt?: string
  lastWatchedAt: string
}

function LessonPageContent() {
  const params = useParams()
  const { user } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [loadingVideoDuration, setLoadingVideoDuration] = useState(false)
  const [vimeoDescription, setVimeoDescription] = useState<string | null>(null)
  const [loadingVimeoDescription, setLoadingVimeoDescription] = useState(false)

  // Fetch lesson and related data
  const fetchLessonData = async (lessonId: string) => {
    try {
      setIsLoading(true)
      const [lessonResponse, lessonsResponse] = await Promise.all([
        courseApi.getLessonById(lessonId),
        courseApi.getUserAvailableLessons()
      ])
      
      // Backend returns { lesson: ... } format
      const lessonData = lessonResponse.data.lesson || lessonResponse.data
      setLesson(lessonData)
      
      // Fetch actual video data from Vimeo
      if (lessonData?.videoUrl) {
        await fetchVimeoData(lessonData.videoUrl)
      }
      
      // Handle the correct response format from getUserAvailableLessons
      const lessonsData = lessonsResponse.data?.lessons || lessonsResponse.data || []
      setRelatedLessons(lessonsData.filter((l: Lesson) => l.id !== lessonId))
      
      // Get progress if available
      if (lessonResponse.data) {
        const progressData = localStorage.getItem(`video-progress-${lessonId}`)
        if (progressData) {
          setProgress(JSON.parse(progressData))
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch lesson:', err)
      setError('レッスンの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && params.id) {
      fetchLessonData(params.id as string)
    }
  }, [user, params.id])

  // Format duration helper
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未設定'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Extract Vimeo ID from video URL
  const getVimeoId = (videoUrl: string): string | null => {
    const match = videoUrl.match(/vimeo\.com\/video\/(\d+)/i) || videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/i)
    return match ? match[1] : null
  }

  // Fetch video data from Vimeo API
  const fetchVimeoData = async (videoUrl: string) => {
    try {
      setLoadingVideoDuration(true)
      setLoadingVimeoDescription(true)
      const vimeoId = getVimeoId(videoUrl)
      if (!vimeoId) {
        console.warn('Could not extract Vimeo ID from URL:', videoUrl)
        return
      }

      console.log(`🎬 [DEBUG] Fetching Vimeo data for URL: ${videoUrl}`)
      const response = await vimeoApi.getVideoData(videoUrl)
      const data = response.data
      console.log('🎬 [DEBUG] Vimeo API response:', data)
      
      if (data.duration) {
        setVideoDuration(data.duration)
        console.log(`✅ [DEBUG] Fetched video duration from Vimeo: ${data.duration} seconds`)
      }
      
      if (data.description) {
        setVimeoDescription(data.description)
        console.log(`✅ [DEBUG] Fetched video description from Vimeo: ${data.description}`)
      } else {
        console.log(`⚠️ [DEBUG] No description found in Vimeo data`)
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to fetch Vimeo data:', error)
      // Fallback to database duration if Vimeo API fails
      setVideoDuration(lesson?.duration || null)
    } finally {
      setLoadingVideoDuration(false)
      setLoadingVimeoDescription(false)
    }
  }

  // Update progress function
  const updateProgress = async (currentTime: number, duration: number) => {
    if (!lesson) return
    
    const watchedSeconds = Math.round(currentTime)
    const percentage = Math.round((currentTime / duration) * 100)
    const completed = percentage >= 90
    
    const progressData = {
      id: lesson.id,
      watchedSeconds,
      completed,
      percentage,
      lastWatchedAt: new Date().toISOString(),
      completedAt: completed ? new Date().toISOString() : undefined
    }
    
    setProgress(progressData)
    localStorage.setItem(`video-progress-${lesson.id}`, JSON.stringify(progressData))
    
    try {
      // Update progress on server
      await courseApi.updateLessonProgress(lesson.id, {
        watchedSeconds,
        completed
      })
    } catch (error) {
      console.error('Failed to update progress on server:', error)
    }
  }

  // Get current video duration (prefer Vimeo duration over database)
  const getCurrentDuration = () => {
    return videoDuration || lesson?.duration || 0
  }

  const isLessonAvailable = (lessonToCheck: Lesson): boolean => {
    return lessonToCheck.userAccess?.isAvailable ?? false
  }

  if (isLoading) {
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">エラーが発生しました</h1>
          <p className="text-gray-400 mb-6">レッスンが見つかりません</p>
          <Link 
            href="/videos" 
            className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-500 transition-all"
          >
            講習一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  // Check access using the correct field from getLessonById response
  const hasAccess = lesson.hasAccess ?? lesson.userAccess?.isAvailable ?? false
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">このレッスンはまだ視聴できません</h1>
          <p className="text-gray-400 mb-6">
            {lesson.accessReason || (lesson.userAccess?.daysUntilAvailable && lesson.userAccess.daysUntilAvailable > 0)
              ? lesson.accessReason || `あと${lesson.userAccess?.daysUntilAvailable}日で視聴可能になります`
              : lesson.availableIn && lesson.availableIn > 0
              ? `あと${lesson.availableIn}日で視聴可能になります`
              : '時期が来たら視聴可能になります'
            }
          </p>
          <Link 
            href="/videos" 
            className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-500 transition-all"
          >
            講習一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/images/lion-tech.jpeg" 
                alt="Lion Logo" 
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                トレード道場
              </h1>
            </div>
            
            <nav className="flex items-center gap-6">
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/dashboard" className="hover:text-white transition">
            ダッシュボード
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/videos" className="hover:text-white transition">
            講習一覧
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{lesson.title}</span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/videos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            講習一覧に戻る
          </Link>
        </div>

        {/* Video Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
              <div className="aspect-video">
                <iframe
                  src={lesson.videoUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                  className="w-full h-full"
                  onLoad={(e) => {
                    // Mock progress tracking - in real implementation, use Vimeo Player API
                    const iframe = e.target as HTMLIFrameElement
                    if (iframe.contentWindow) {
                      setInterval(() => {
                        const currentProgress = progress?.watchedSeconds || 0
                        const currentTime = currentProgress + Math.random() * 30
                        const duration = getCurrentDuration()
                        if (duration && currentTime < duration) {
                          updateProgress(currentTime, duration)
                        }
                      }, 10000)
                    }
                  }}
                ></iframe>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {lesson.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                    視聴可能
                  </span>
                  <span>
                    {lesson.releaseType === 'IMMEDIATE' ? 'すぐに視聴可能' : 
                     lesson.releaseType === 'DRIP' ? `登録${lesson.releaseDays}日後` :
                     lesson.releaseType === 'SCHEDULED' ? '予定リリース' :
                     '前提条件付き'}
                  </span>
                  {(videoDuration || lesson.duration) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {loadingVideoDuration ? (
                        <span className="text-xs text-gray-400">読み込み中...</span>
                      ) : (
                        formatDuration(getCurrentDuration())
                      )}
                    </span>
                  )}
                  <span className="text-yellow-400">
                    #{lesson.orderIndex}
                  </span>
                </div>
                
                {/* Lesson Description - Show Vimeo description if available, otherwise show database description */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">レッスンの概要</h3>
                  {loadingVimeoDescription ? (
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      Vimeoから概要を読み込み中...
                    </div>
                  ) : vimeoDescription ? (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {vimeoDescription}
                    </p>
                  ) : lesson.description ? (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {lesson.description}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      概要情報がありません
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Videos */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">関連レッスン</h3>
              <div className="space-y-3">
                {relatedLessons.slice(0, 4).map((relatedLesson) => {
                  const isAvailable = isLessonAvailable(relatedLesson)
                  return (
                    <Link
                      key={relatedLesson.id}
                      href={isAvailable ? `/lessons/${relatedLesson.id}` : '#'}
                      className={`flex gap-3 p-3 rounded-lg transition-colors ${
                        isAvailable 
                          ? 'hover:bg-gray-700/50 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-16 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        {isAvailable ? (
                          <Play className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <span className="text-xs text-gray-500">🔒</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {relatedLesson.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          #{relatedLesson.orderIndex}
                        </p>
                      </div>
                    </Link>
                  )
                })}
                
                {relatedLessons.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    他のレッスンがまだありません
                  </p>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">学習進捗</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>進捗</span>
                    <span>{Math.round((progress?.watchedSeconds || 0) / (lesson?.duration || 1) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.round((progress?.watchedSeconds || 0) / (lesson?.duration || 1) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>視聴時間: {formatDuration(progress?.watchedSeconds || 0)}</p>
                  {getCurrentDuration() > 0 && (
                    <p>総時間: {loadingVideoDuration ? '読み込み中...' : formatDuration(getCurrentDuration())}</p>
                  )}
                  <p>状態: {progress?.completed ? '完了' : '視聴中'}</p>
                  {progress?.completedAt && (
                    <p className="text-green-400 text-xs">
                      完了日: {new Date(progress.completedAt).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                  {!progress?.completed && getCurrentDuration() > 0 && progress?.watchedSeconds && (
                    <p className="text-yellow-400 text-xs">
                      残り {formatDuration(getCurrentDuration() - progress.watchedSeconds)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* 学習統計 */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">学習統計</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">今回</div>
                    <div className="text-gray-300">{formatDuration(progress?.watchedSeconds || 0)}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">進捗率</div>
                    <div className="text-gray-300">{Math.round((progress?.watchedSeconds || 0) / (lesson?.duration || 1) * 100)}%</div>
                  </div>
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">順番</div>
                    <div className="text-gray-300">#{lesson.orderIndex}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">ステータス</div>
                    <div className="text-gray-300">{progress?.completed ? '完了' : '視聴中'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LessonPage() {
  return (
    <AuthGuard>
      <LessonPageContent />
    </AuthGuard>
  )
}