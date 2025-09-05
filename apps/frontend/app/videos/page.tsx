'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import { Play, Lock, Clock, Calendar, ChevronRight, ArrowLeft } from 'lucide-react'
import Script from 'next/script'

interface VimeoVideo {
  id: string
  embedId: string
  title: string
  description?: string
  monthIndex: number
  orderIndex: number
}

export default function VideosPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  
  const [availableMonths, setAvailableMonths] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Vimeo動画データ
  const vimeoVideos: VimeoVideo[] = [
    // 最初の2つの動画（登録直後）
    {
      id: '1',
      embedId: '1115276237',
      title: 'サンプル動画１',
      description: 'FXトレードの基礎を学びましょう',
      monthIndex: 0,
      orderIndex: 0
    },
    {
      id: '2',
      embedId: '1115277774',
      title: 'サンプル動画２',
      description: 'チャート分析の基本',
      monthIndex: 0,
      orderIndex: 1
    },
    // 1ヶ月後の動画
    {
      id: '3',
      embedId: '1115278244',
      title: 'サンプル動画３',
      description: 'リスク管理の重要性',
      monthIndex: 1,
      orderIndex: 2
    },
    {
      id: '4',
      embedId: '1115278388',
      title: 'サンプル動画４',
      description: 'エントリーポイントの見極め方',
      monthIndex: 1,
      orderIndex: 3
    }
  ]

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated && user) {
      calculateAvailableMonths()
    }
  }, [isAuthenticated, authLoading, router, user])

  const calculateAvailableMonths = () => {
    setIsLoading(true)
    
    // ユーザーの登録日からの経過月数を計算
    if (user?.createdAt) {
      const registrationDate = new Date(user.createdAt)
      const now = new Date()
      
      const monthsDiff = 
        (now.getFullYear() - registrationDate.getFullYear()) * 12 +
        (now.getMonth() - registrationDate.getMonth())
      
      // 最初の月（0）+ 経過月数
      setAvailableMonths(Math.min(monthsDiff, 1)) // 現在は最大1ヶ月分まで
    } else {
      setAvailableMonths(0) // デフォルトは最初の月のみ
    }
    
    setIsLoading(false)
  }

  const isVideoAvailable = (video: VimeoVideo): boolean => {
    return video.monthIndex <= availableMonths
  }

  const getDaysUntilAvailable = (video: VimeoVideo): number => {
    if (isVideoAvailable(video)) return 0
    
    const monthsToWait = video.monthIndex - availableMonths
    return monthsToWait * 30 // 簡略化のため1ヶ月=30日として計算
  }

  // 月ごとに動画をグループ化
  const videosByMonth = vimeoVideos.reduce((acc, video) => {
    if (!acc[video.monthIndex]) {
      acc[video.monthIndex] = []
    }
    acc[video.monthIndex].push(video)
    return acc
  }, {} as { [key: number]: VimeoVideo[] })

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
      <Script src="https://player.vimeo.com/api/player.js" />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🦁</span>
              </div>
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/dashboard" className="hover:text-white transition">
            ダッシュボード
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">動画一覧</span>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">学習コンテンツ</h2>
          <p className="text-gray-300 text-lg">
            月2本の厳選された動画でプロトレーダーへの道を歩みましょう
          </p>
        </div>

        {/* Videos by Month */}
        <div className="space-y-12">
          {Object.entries(videosByMonth).map(([monthIndex, monthVideos]) => {
            const month = parseInt(monthIndex)
            const isCurrentMonth = month <= availableMonths
            const monthLabel = month === 0 ? '登録直後' : `${month}ヶ月目`
            
            return (
              <div key={month} className="space-y-4">
                {/* Month Header */}
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                    isCurrentMonth 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {monthLabel}
                  </div>
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="text-sm text-gray-500">
                    {monthVideos.length}本の動画
                  </span>
                </div>

                {/* Month's Videos Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {monthVideos.map((video) => {
                    const isAvailable = isVideoAvailable(video)
                    const daysUntil = getDaysUntilAvailable(video)
                    
                    return (
                      <div key={video.id} className="space-y-4">
                        <div className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${
                          isAvailable ? 'hover:border-yellow-500/50' : 'opacity-60'
                        } transition-all duration-300`}>
                          
                          {isAvailable ? (
                            // Vimeo埋め込み
                            <div className="w-full h-full">
                              <iframe 
                                src={`https://player.vimeo.com/video/${video.embedId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                                frameBorder="0" 
                                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                                referrerPolicy="strict-origin-when-cross-origin"
                                className="absolute top-0 left-0 w-full h-full"
                                title={video.title}
                              />
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

                          {/* Countdown for locked videos */}
                          {!isAvailable && (
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-lg z-10">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                  {daysUntil}日後
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-gray-400 text-sm">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
            毎月2本の新しい動画を追加していきます。継続的な学習でプロトレーダーへの道を着実に歩んでいきましょう。
          </p>
        </div>
      </main>
    </div>
  )
}