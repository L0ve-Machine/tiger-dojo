'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, UserPlus, X, Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface User {
  id: string
  name: string
  email: string
}

interface Lesson {
  id: string
  title: string
  course: {
    title: string
  }
}

interface AdhocAccess {
  id: string
  user: User
  lesson: Lesson
  granter: {
    id: string
    name: string
  }
  reason?: string
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
}

interface AdhocAccessManagerProps {
  lessonId?: string
  userId?: string
}

export function AdhocAccessManager({ lessonId, userId }: AdhocAccessManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [adhocAccesses, setAdhocAccesses] = useState<AdhocAccess[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedLesson, setSelectedLesson] = useState<string>(lessonId || '')
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [lessonId, userId])

  const fetchData = async () => {
    try {
      // Fetch users
      if (!userId) {
        const usersRes = await fetch('/api/admin/users?limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (usersRes.ok) {
          const data = await usersRes.json()
          setUsers(data.users)
        }
      }

      // Fetch lessons
      if (!lessonId) {
        const lessonsRes = await fetch('/api/admin/lessons', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (lessonsRes.ok) {
          const data = await lessonsRes.json()
          setLessons(data.lessons)
        }
      }

      // Fetch existing adhoc accesses
      let url = '/api/admin/adhoc-access'
      if (lessonId) {
        url = `/api/admin/adhoc-access/lesson/${lessonId}`
      } else if (userId) {
        url = `/api/admin/adhoc-access/user/${userId}`
      }

      const accessRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (accessRes.ok) {
        const data = await accessRes.json()
        setAdhocAccesses(data.users || data.accesses || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleGrantAccess = async () => {
    if (selectedUsers.length === 0 || !selectedLesson) {
      alert('ユーザーとレッスンを選択してください')
      return
    }

    setLoading(true)
    try {
      const endpoint = selectedUsers.length === 1 
        ? '/api/admin/adhoc-access/grant'
        : '/api/admin/adhoc-access/bulk-grant'

      const body = selectedUsers.length === 1
        ? {
            userId: selectedUsers[0],
            lessonId: selectedLesson,
            reason,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined
          }
        : {
            userIds: selectedUsers,
            lessonId: selectedLesson,
            reason,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        alert('アクセス権限を付与しました')
        setSelectedUsers([])
        setReason('')
        fetchData()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to grant access:', error)
      alert('アクセス権限の付与に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAccess = async (userId: string, lessonId: string) => {
    if (!confirm('このアクセス権限を取り消しますか？')) return

    try {
      const res = await fetch('/api/admin/adhoc-access/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, lessonId })
      })

      if (res.ok) {
        alert('アクセス権限を取り消しました')
        fetchData()
      } else {
        alert('アクセス権限の取り消しに失敗しました')
      }
    } catch (error) {
      console.error('Failed to revoke access:', error)
      alert('アクセス権限の取り消しに失敗しました')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <UserPlus className="w-5 h-5 mr-2" />
        アドホック配信管理
      </h2>

      {/* Grant Access Form */}
      <div className="space-y-4 mb-8">
        {/* User Selection */}
        {!userId && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ユーザー選択
            </label>
            <div className="relative">
              <div
                className="bg-dark-700 border border-dark-600 rounded-lg p-3 cursor-pointer flex items-center justify-between"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <span className="text-white">
                  {selectedUsers.length === 0
                    ? 'ユーザーを選択'
                    : `${selectedUsers.length}名選択中`}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>

              {showUserDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                  <div className="sticky top-0 bg-dark-700 p-2 border-b border-dark-600">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-dark-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="p-2">
                    {filteredUsers.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center p-2 hover:bg-dark-600 rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="mr-3 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-white text-sm">{user.name}</div>
                          <div className="text-gray-400 text-xs">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lesson Selection */}
        {!lessonId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              レッスン選択
            </label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">レッスンを選択</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.course.title} - {lesson.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            理由（オプション）
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例：特別対応、補講対応など"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              開始日
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              終了日（オプション）
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleGrantAccess}
          disabled={loading || selectedUsers.length === 0 || !selectedLesson}
          className="w-full bg-primary-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '処理中...' : 'アクセス権限を付与'}
        </button>
      </div>

      {/* Existing Accesses */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          現在のアドホック配信
        </h3>
        
        {adhocAccesses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            アドホック配信が設定されていません
          </p>
        ) : (
          <div className="space-y-3">
            {adhocAccesses.map(access => (
              <div
                key={access.id}
                className="bg-dark-700 border border-dark-600 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-white font-medium">
                        {access.user.name}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({access.user.email})
                      </span>
                    </div>
                    
                    {!lessonId && (
                      <div className="text-sm text-gray-300 mb-2">
                        {access.lesson.course.title} - {access.lesson.title}
                      </div>
                    )}

                    {access.reason && (
                      <div className="text-sm text-gray-400 mb-2">
                        理由: {access.reason}
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-400 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        開始: {format(new Date(access.startDate), 'yyyy/MM/dd', { locale: ja })}
                      </span>
                      {access.endDate && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          終了: {format(new Date(access.endDate), 'yyyy/MM/dd', { locale: ja })}
                        </span>
                      )}
                      <span>
                        付与者: {access.granter.name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeAccess(access.user.id, access.lesson.id)}
                    className="ml-4 p-2 text-red-400 hover:bg-dark-600 rounded-lg transition-colors"
                    title="アクセス権限を取り消す"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}