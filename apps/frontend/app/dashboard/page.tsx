'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { LogOut, User, Settings, Play, Lock, Clock, Calendar, Menu, X, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { dashboardApi, courseApi, authApi } from '@/lib/api'

interface DashboardStatistics {
  user: {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
    lastLoginAt: string | null
  }
  statistics: {
    completedLessons: number
    totalWatchedHours: number
    totalLoginDays: number
    weeklyWatchedHours: number
  }
  courseProgress: Array<{
    courseId: string
    courseName: string
    totalLessons: number
    completedLessons: number
    progressPercentage: number
  }>
  recentActivity: Array<{
    lessonId: string
    lessonTitle: string
    courseName: string
    watchedSeconds: number
    completed: boolean
    updatedAt: string
  }>
}

interface LatestLesson {
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
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout, getCurrentUser, updateUser } = useAuthStore()
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [latestLessons, setLatestLessons] = useState<LatestLesson[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saveNameLoading, setSaveNameLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (isAuthenticated && !user) {
      getCurrentUser()
    }
  }, [isAuthenticated, isLoading, user, router, getCurrentUser])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return
      
      setDataLoading(true)
      try {
        // 統計情報を取得
        const statsResponse = await dashboardApi.getStatistics()
        if (statsResponse.data.success && statsResponse.data.data) {
          setStatistics(statsResponse.data.data)
        }

        // 最新のレッスンを取得
        const coursesResponse = await courseApi.getAllCourses()
        if (coursesResponse.data.courses) {
          const allLessons: LatestLesson[] = []
          
          coursesResponse.data.courses.forEach((course: any) => {
            if (course.lessons) {
              course.lessons.forEach((lesson: any) => {
                allLessons.push({
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description || '',
                  duration: lesson.duration || 1800,
                  thumbnailUrl: lesson.thumbnailUrl,
                  isLocked: lesson.isLocked || false,
                  releaseDate: lesson.releaseDate,
                  courseTitle: course.title,
                  progress: lesson.userProgress?.[0] || null,
                  isAvailable: lesson.isAvailable !== false
                })
              })
            }
          })
          
          // 最新の2つを取得
          setLatestLessons(allLessons.slice(0, 2))
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

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

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleSaveName = async () => {
    if (!newName.trim() || saveNameLoading) return
    
    setSaveNameLoading(true)
    try {
      const response = await authApi.updateProfile({ name: newName.trim() })
      if (response.data.user) {
        updateUser(response.data.user)
      }
      setEditingName(false)
      setShowSettingsModal(false)
      setNewName('')
    } catch (error) {
      console.error('Error updating name:', error)
      // エラーメッセージを表示（必要に応じて）
    } finally {
      setSaveNameLoading(false)
    }
  }

  const openSettingsModal = () => {
    setNewName(user?.name || '')
    setShowSettingsModal(true)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-t-2 border-yellow-400 rounded-full animate-spin"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Image 
                  src="/images/lion-tech.jpeg" 
                  alt="Lion Logo" 
                  width={32}
                  height={32}
                  className="rounded object-cover"
                />
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
                  onClick={openSettingsModal}
                  className="p-2 text-gray-400 hover:text-white transition"
                  title="設定"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {dataLoading ? '...' : statistics?.statistics.completedLessons || 0}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {dataLoading ? '...' : statistics?.statistics.totalWatchedHours || 0}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {dataLoading ? '...' : statistics?.statistics.totalLoginDays || 0}
                </p>
                <p className="text-gray-300 text-sm">総ログイン日数</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {dataLoading ? '...' : statistics?.statistics.weeklyWatchedHours || 0}
                </p>
                <p className="text-gray-300 text-sm">今週の学習時間</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        {statistics?.courseProgress && statistics.courseProgress.length > 0 && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">コース進捗</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statistics.courseProgress.map((course) => (
                <div key={course.courseId} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-2">{course.courseName}</h4>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{course.completedLessons}/{course.totalLessons} レッスン完了</span>
                      <span>{course.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest Videos Section */}
        {latestLessons.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">最新のレッスン</h3>
              <Link
                href="/videos"
                className="text-yellow-400 hover:text-amber-600 transition text-sm font-medium"
              >
                すべて見る →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {latestLessons.map((lesson) => (
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <h3 className="text-2xl font-bold text-white mb-6">最近のアクティビティ</h3>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
            <div className="p-6">
              {dataLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-gray-400">読み込み中...</div>
                </div>
              ) : !statistics?.recentActivity || statistics.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-2">まだアクティビティがありません</p>
                  <p className="text-gray-500 text-sm">レッスンを視聴したり、講師とチャットすると、ここに表示されます</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-700 last:border-b-0">
                      <div className={`w-10 h-10 ${activity.completed ? 'bg-green-900/50' : 'bg-blue-900/50'} rounded-lg flex items-center justify-center`}>
                        {activity.completed ? (
                          <Trophy className="w-5 h-5 text-green-400" />
                        ) : (
                          <Play className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {activity.completed ? `${activity.lessonTitle}を完了しました` : `${activity.lessonTitle}を視聴しました`}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {activity.courseName} • {formatTimeAgo(activity.updatedAt)}
                        </p>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {Math.floor(activity.watchedSeconds / 60)}分視聴
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">設定</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  名前
                </label>
                {editingName ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      placeholder="新しい名前を入力"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveName}
                        disabled={saveNameLoading || !newName.trim()}
                        className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveNameLoading ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false)
                          setNewName(user.name || '')
                        }}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white">{user.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス
                </label>
                <span className="text-gray-400 text-sm">{user.email}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  役割
                </label>
                <span className="text-gray-400 text-sm">{user.role}</span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowSettingsModal(false)
                  setEditingName(false)
                  setNewName('')
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}