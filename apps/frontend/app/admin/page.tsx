'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { 
  Users, 
  BookOpen, 
  Video, 
  TrendingUp, 
  Calendar,
  MessageCircle,
  Clock,
  UserCheck
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalLessons: number
  activeUsers: number
  courseCompletions: number
  recentRegistrations: number
  recentMessages: Array<{
    id: string
    content: string
    user: { name: string; email: string }
    lesson?: { title: string }
    createdAt: string
    type: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getDashboard()
      setStats(response.data.dashboard)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
          <p className="text-gray-400">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">データの読み込みに失敗しました</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-lg hover:from-gold-600 hover:to-gold-700 transition"
        >
          再試行
        </button>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: '総ユーザー数',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: '登録済みユーザー'
    },
    {
      title: 'アクティブユーザー',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      description: '30日以内のログイン'
    },
    {
      title: 'レッスン数',
      value: stats.totalLessons,
      icon: Video,
      color: 'from-gold-500 to-gold-600',
      description: '動画レッスン'
    },
    {
      title: '新規登録',
      value: stats.recentRegistrations,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      description: '7日以内の登録'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
          <p className="text-gray-400 mt-1">
            システム全体の状況を確認できます
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          更新
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.description}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white">{stat.title}</h3>
          </div>
        ))}
      </div>

      {/* Recent Messages */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-gold-400" />
          <h2 className="text-xl font-bold text-white">最近のチャットメッセージ</h2>
        </div>
        
        <div className="space-y-4">
          {stats.recentMessages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">メッセージがありません</p>
          ) : (
            stats.recentMessages.map((message) => (
              <div key={message.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold">
                        {message.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{message.user.name}</p>
                      <p className="text-xs text-gray-400">{message.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(message.createdAt)}
                    </p>
                    {message.type === 'QUESTION' && (
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        質問
                      </span>
                    )}
                    {message.type === 'ANSWER' && (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        回答
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  {message.content.length > 100 
                    ? message.content.substring(0, 100) + '...' 
                    : message.content
                  }
                </p>
                {message.lesson && (
                  <p className="text-xs text-gray-500">
                    📚 {message.lesson.title}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          href="/admin/users"
          className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:bg-gray-900/70 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <div>
              <p className="font-medium text-white">ユーザー管理</p>
              <p className="text-sm text-gray-400">登録者を管理</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/upload"
          className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:bg-gray-900/70 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-gold-400 group-hover:text-gold-300 transition-colors" />
            <div>
              <p className="font-medium text-white">動画アップロード</p>
              <p className="text-sm text-gray-400">新しい動画</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/chat"
          className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:bg-gray-900/70 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />
            <div>
              <p className="font-medium text-white">チャット管理</p>
              <p className="text-sm text-gray-400">メッセージ確認</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}