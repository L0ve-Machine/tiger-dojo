'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import { ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import Image from 'next/image'

interface VimeoVideo {
  id: string
  embedId: string
  title: string
  monthIndex: number
  orderIndex: number
  releaseDate?: Date
}

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [video, setVideo] = useState<VimeoVideo | null>(null)
  const [availableMonths, setAvailableMonths] = useState(0)
  const [vimeoMetadata, setVimeoMetadata] = useState<{
    title: string
    description: string
    duration: number
  } | null>(null)
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [progressPercentage, setProgressPercentage] = useState(0)

  // Vimeo動画データ (videos/page.tsxと同じデータ)
  const vimeoVideos: VimeoVideo[] = [
    {
      id: '1',
      embedId: '1115276237',
      title: 'サンプル動画１',
      monthIndex: 0,
      orderIndex: 0
    },
    {
      id: '2',
      embedId: '1115277774',
      title: 'サンプル動画２',
      monthIndex: 0,
      orderIndex: 1
    },
    {
      id: '3',
      embedId: '1115278244',
      title: 'サンプル動画３',
      monthIndex: 1,
      orderIndex: 2,
      releaseDate: user?.createdAt ? new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : undefined
    },
    {
      id: '4',
      embedId: '1115278388',
      title: 'サンプル動画４',
      monthIndex: 1,
      orderIndex: 3,
      releaseDate: user?.createdAt ? new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : undefined
    }
  ]

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated && user && params.id) {
      calculateAvailableMonths()
      findVideo(params.id as string)
    }
  }, [isAuthenticated, authLoading, router, user, params.id])

  const calculateAvailableMonths = () => {
    if (user?.createdAt) {
      const registrationDate = new Date(user.createdAt)
      const now = new Date()
      
      const monthsDiff = 
        (now.getFullYear() - registrationDate.getFullYear()) * 12 +
        (now.getMonth() - registrationDate.getMonth())
      
      setAvailableMonths(Math.min(monthsDiff, 1))
    } else {
      setAvailableMonths(0)
    }
  }

  const findVideo = (videoId: string) => {
    const foundVideo = vimeoVideos.find(v => v.id === videoId)
    if (foundVideo) {
      setVideo(foundVideo)
      // Vimeoメタデータを取得
      fetchVimeoMetadata(foundVideo.embedId)
      // ローカルストレージから進捗を取得
      const savedProgress = localStorage.getItem(`video-progress-${foundVideo.id}`)
      if (savedProgress) {
        const progress = JSON.parse(savedProgress)
        setWatchedSeconds(progress.watchedSeconds || 0)
        setProgressPercentage(progress.percentage || 0)
      }
    }
    setIsLoading(false)
  }

  const fetchVimeoMetadata = async (embedId: string) => {
    try {
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${embedId}`)
      const data = await response.json()
      setVimeoMetadata({
        title: data.title || '',
        description: data.description || '',
        duration: data.duration || 0
      })
    } catch (error) {
      console.error('Failed to fetch Vimeo metadata:', error)
    }
  }

  // 進捗を更新する関数
  const updateProgress = (currentTime: number, duration: number) => {
    const percentage = Math.round((currentTime / duration) * 100)
    setWatchedSeconds(Math.round(currentTime))
    setProgressPercentage(percentage)
    
    // ローカルストレージに保存
    if (video) {
      const progress = {
        watchedSeconds: Math.round(currentTime),
        percentage: percentage,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(`video-progress-${video.id}`, JSON.stringify(progress))
    }
  }

  const isVideoAvailable = (video: VimeoVideo): boolean => {
    return video.monthIndex <= availableMonths
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

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">エラーが発生しました</h1>
          <p className="text-gray-400 mb-6">レッスンが見つかりません</p>
          <Link 
            href="/videos" 
            className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-500 transition-all"
          >
            動画一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  if (!isVideoAvailable(video)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">このレッスンはまだ視聴できません</h1>
          <p className="text-gray-400 mb-6">時期が来たら視聴可能になります</p>
          <Link 
            href="/videos" 
            className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-500 transition-all"
          >
            動画一覧に戻る
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
                動画
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
            動画一覧
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{video.title}</span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/videos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            動画一覧に戻る
          </Link>
        </div>

        {/* Video Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
              <div className="aspect-video">
                <iframe
                  src={`https://player.vimeo.com/video/${video.embedId}?h=0&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                  className="w-full h-full"
                  onLoad={(e) => {
                    // Vimeoプレーヤーの進捗を監視
                    const iframe = e.target as HTMLIFrameElement
                    if (iframe.contentWindow) {
                      // Vimeo Player API を使用して進捗を追跡（実際の実装では Vimeo Player SDK が必要）
                      setInterval(() => {
                        // ダミーの進捗更新（実際の実装では Vimeo Player API を使用）
                        const currentTime = watchedSeconds + Math.random() * 30
                        const duration = vimeoMetadata?.duration || 1800 // デフォルト30分
                        if (currentTime < duration) {
                          updateProgress(currentTime, duration)
                        }
                      }, 10000) // 10秒ごとに更新
                    }
                  }}
                ></iframe>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {vimeoMetadata?.title || video.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                    視聴可能
                  </span>
                  <span>
                    {video.monthIndex === 0 ? '登録直後' : `${video.monthIndex}ヶ月目`}
                  </span>
                  {vimeoMetadata?.duration && (
                    <span>
                      {Math.floor(vimeoMetadata.duration / 60)}分{vimeoMetadata.duration % 60}秒
                    </span>
                  )}
                </div>
                
                {/* Video Description */}
                {vimeoMetadata?.description && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">動画の概要</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {vimeoMetadata.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Videos */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">関連動画</h3>
              <div className="space-y-3">
                {vimeoVideos
                  .filter(v => v.id !== video.id)
                  .slice(0, 4)
                  .map((relatedVideo) => {
                    const isAvailable = isVideoAvailable(relatedVideo)
                    return (
                      <Link
                        key={relatedVideo.id}
                        href={isAvailable ? `/lessons/${relatedVideo.id}` : '#'}
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
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {relatedVideo.monthIndex === 0 ? '登録直後' : `${relatedVideo.monthIndex}ヶ月目`}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">学習進捗</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>進捗</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>視聴時間: {Math.floor(watchedSeconds / 60)}分{watchedSeconds % 60}秒</p>
                  {vimeoMetadata?.duration && (
                    <p>総時間: {Math.floor(vimeoMetadata.duration / 60)}分{vimeoMetadata.duration % 60}秒</p>
                  )}
                  <p>完了: {progressPercentage >= 90 ? '完了' : '未完了'}</p>
                  {progressPercentage < 100 && (
                    <p className="text-yellow-400 text-xs">
                      残り {Math.floor(((vimeoMetadata?.duration || 0) - watchedSeconds) / 60)}分
                    </p>
                  )}
                </div>
              </div>
              
              {/* 学習統計 */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">学習統計</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">今日</div>
                    <div className="text-gray-300">{Math.floor(watchedSeconds / 60)}分</div>
                  </div>
                  <div className="bg-gray-700/30 rounded p-2">
                    <div className="text-yellow-400 font-semibold">完了率</div>
                    <div className="text-gray-300">{progressPercentage}%</div>
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