'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import { VimeoPlayer } from '@/components/video/VimeoPlayer'
import { VimeoProgressData, VimeoService } from '@/lib/vimeo'
import { LessonChat } from '@/components/chat/LessonChat'
import { courseApi } from '@/lib/api'
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  FileText,
  MessageCircle
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description?: string
  videoUrl: string
  duration?: number
  orderIndex: number
  hasAccess: boolean
  accessReason?: string
  availableIn?: number
  course: {
    id: string
    title: string
    slug: string
  }
  resources: Resource[]
  progress: Progress | null
}

interface Resource {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize?: number
}

interface Progress {
  id: string
  watchedSeconds: number
  completed: boolean
  completedAt?: string
  lastWatchedAt: string
}

interface LessonPageProps {
  params: { id: string }
}

export default function LessonPage({ params }: LessonPageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedProgress, setLastSavedProgress] = useState(0)
  const [vimeoMetadata, setVimeoMetadata] = useState<{
    title: string
    description: string
    duration: number
  } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated) {
      fetchLesson()
    }
  }, [isAuthenticated, authLoading, router, params.id])

  const fetchLesson = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await courseApi.getLessonById(params.id)
      setLesson(response.data.lesson)
      
      // Set last saved progress for tracking
      if (response.data.lesson.progress) {
        setLastSavedProgress(response.data.lesson.progress.watchedSeconds)
      }
      
    } catch (err: any) {
      console.error('Failed to fetch lesson:', err)
      if (err.response?.status === 404) {
        setError('レッスンが見つかりません')
      } else if (err.response?.status === 403) {
        setError('このレッスンにアクセスする権限がありません')
      } else {
        setError('レッスンの読み込みに失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgress = async (data: VimeoProgressData) => {
    if (!lesson) return

    try {
      // Only save if significant progress has been made (avoid excessive API calls)
      const progressDiff = Math.abs(data.seconds - lastSavedProgress)
      if (progressDiff < 10) return // Save every 10 seconds minimum

      const isCompleted = data.percent >= 90 // Consider 90% as completed
      
      await courseApi.updateLessonProgress(lesson.id, {
        watchedSeconds: Math.round(data.seconds),
        completed: isCompleted
      })

      setLastSavedProgress(data.seconds)

      // Update local progress state
      setLesson(prev => {
        if (!prev) return prev
        return {
          ...prev,
          progress: {
            ...prev.progress,
            id: prev.progress?.id || '',
            watchedSeconds: Math.round(data.seconds),
            completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : prev.progress?.completedAt,
            lastWatchedAt: new Date().toISOString()
          }
        }
      })

    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const handleVideoComplete = async () => {
    if (!lesson) return

    try {
      await courseApi.updateLessonProgress(lesson.id, {
        watchedSeconds: lesson.duration || 0,
        completed: true
      })

      // Update local state
      setLesson(prev => {
        if (!prev) return prev
        return {
          ...prev,
          progress: {
            ...prev.progress,
            id: prev.progress?.id || '',
            watchedSeconds: lesson.duration || 0,
            completed: true,
            completedAt: new Date().toISOString(),
            lastWatchedAt: new Date().toISOString()
          }
        }
      })

    } catch (err) {
      console.error('Failed to mark as completed:', err)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '未設定'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <PlayCircle className="w-6 h-6 text-black" />
          </div>
          <p className="text-gray-400">レッスンを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">エラーが発生しました</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={fetchLesson}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-600 hover:to-amber-700 transition"
              >
                再試行
              </button>
              <Link
                href="/videos"
                className="px-6 py-3 border border-gray-600 text-gray-300 font-bold rounded-lg hover:bg-gray-800 transition"
              >
                動画一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  // Check if user has access to this lesson
  if (!lesson.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">アクセスが制限されています</h1>
            <p className="text-gray-400 mb-8">
              {lesson.accessReason === 'NOT_YET_AVAILABLE' && lesson.availableIn !== undefined
                ? `このレッスンは${lesson.availableIn}日後に公開されます`
                : 'このレッスンにアクセスする権限がありません'
              }
            </p>
            <Link
              href="/videos"
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-600 hover:to-amber-700 transition"
            >
              動画一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const videoId = VimeoService.extractVideoId(lesson.videoUrl)
  const startTime = lesson.progress?.watchedSeconds || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/videos">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-black" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
                <p className="text-sm text-gray-400">{lesson.course.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lesson.progress?.completed && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">完了</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(lesson.duration)}</span>
              </div>
            </div>
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
            動画一覧
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{lesson.title}</span>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Video Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            {videoId ? (
              <VimeoPlayer
                videoId={videoId}
                startTime={startTime}
                onProgress={handleProgress}
                onComplete={handleVideoComplete}
                onMetadataLoaded={setVimeoMetadata}
                className="w-full"
                autoplay={false}
                controls={true}
              />
            ) : (
              <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
                <div className="text-center text-gray-400">
                  <PlayCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>動画を読み込めませんでした</p>
                </div>
              </div>
            )}

            {/* Lesson Info */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {vimeoMetadata?.title || lesson.title}
                  </h1>
                  <p className="text-gray-400">第{lesson.orderIndex + 1}回</p>
                  {vimeoMetadata?.title && lesson.title !== vimeoMetadata.title && (
                    <p className="text-sm text-gray-500 mt-1">
                      レッスン名: {lesson.title}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">進捗</p>
                  <div className="text-lg font-bold text-yellow-400">
                    {lesson.progress 
                      ? `${Math.round((lesson.progress.watchedSeconds / (vimeoMetadata?.duration || lesson.duration || 1)) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>

              {(vimeoMetadata?.description || lesson.description) && (
                <div className="border-t border-gray-800 pt-4 space-y-4">
                  {vimeoMetadata?.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">動画の説明</h3>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {vimeoMetadata.description}
                      </p>
                    </div>
                  )}
                  
                  {lesson.description && (!vimeoMetadata?.description || lesson.description !== vimeoMetadata.description) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">レッスン情報</h3>
                      <p className="text-gray-300 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition">
                <ChevronLeft className="w-5 h-5" />
                前のレッスン
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition">
                次のレッスン
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources */}
            {lesson.resources.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  ダウンロード資料
                </h3>
                
                <div className="space-y-3">
                  {lesson.resources.map((resource) => (
                    <div key={resource.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{resource.title}</h4>
                        <Download className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      </div>
                      
                      {resource.description && (
                        <p className="text-gray-400 text-xs mb-2">{resource.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="uppercase">{resource.fileType}</span>
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </div>
                      
                      <a
                        href={resource.fileUrl}
                        download
                        className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-sm font-bold rounded hover:from-yellow-600 hover:to-amber-700 transition"
                      >
                        <Download className="w-4 h-4" />
                        ダウンロード
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Link */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                質問・サポート
              </h3>
              
              <p className="text-gray-400 text-sm mb-4">
                このレッスンについて質問がありますか？講師に直接チャットで相談できます。
              </p>
              
              <Link
                href="/chat"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-yellow-500 text-yellow-400 font-bold rounded-lg hover:bg-yellow-500/10 transition"
              >
                <MessageCircle className="w-4 h-4" />
                チャットを開く
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Lesson Chat */}
      <LessonChat lessonId={lesson.id} lessonTitle={lesson.title} />
    </div>
  )
}