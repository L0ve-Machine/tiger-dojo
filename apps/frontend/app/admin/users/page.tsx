'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { 
  Search, 
  Filter, 
  Users as UsersIcon, 
  MoreVertical,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Activity,
  Ban,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Save,
  X,
  Pause,
  Play
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  isPaused?: boolean
  pausedAt?: string | null
  pausedDays?: number
  _count: {
    enrollments: number
    progress: number
    messages: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  })
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, debouncedSearchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(roleFilter && { role: roleFilter })
      }

      const response = await adminApi.getUsers(params)
      console.log('Fetched users:', response.data.users.slice(0, 2)) // Debug first 2 users
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (err: any) {
      console.error('Fetch users error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, isActive)
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ))
    } catch (err: any) {
      console.error('Update user status error:', err)
      alert('ユーザーステータスの更新に失敗しました')
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await adminApi.updateUserRole(userId, role)
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ))
    } catch (err: any) {
      console.error('Update user role error:', err)
      alert('ユーザー権限の更新に失敗しました')
    }
  }

  const updateUserRegistrationDate = async (userId: string, newDate: string) => {
    try {
      await adminApi.updateUser(userId, { createdAt: newDate })
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, createdAt: newDate } : user
      ))
      setEditingUserId(null)
      setEditingDate('')
      alert('登録日が更新されました')
    } catch (err: any) {
      console.error('Update registration date error:', err)
      alert('登録日の更新に失敗しました')
    }
  }

  const startEditingDate = (userId: string, currentDate: string) => {
    setEditingUserId(userId)
    // Convert ISO string to date input format (YYYY-MM-DD)
    const date = new Date(currentDate)
    const formattedDate = date.toISOString().split('T')[0]
    setEditingDate(formattedDate)
  }

  const cancelEditingDate = () => {
    setEditingUserId(null)
    setEditingDate('')
  }

  const saveRegistrationDate = (userId: string) => {
    if (!editingDate) return
    const isoDate = new Date(editingDate).toISOString()
    updateUserRegistrationDate(userId, isoDate)
  }

  const deleteUser = async (userId: string, userName: string, userEmail: string) => {
    if (!confirm(`⚠️ ユーザーを完全に削除しますか？\n\n名前: ${userName}\nメール: ${userEmail}\n\nこの操作は元に戻せません。ユーザーのすべてのデータ（進捗、メッセージ等）が削除されます。`)) {
      return
    }

    try {
      await adminApi.deleteUser(userId)
      // Remove from local state
      setUsers(users.filter(user => user.id !== userId))
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }))
      alert('ユーザーが削除されました')
    } catch (err: any) {
      console.error('Delete user error:', err)
      alert(err.response?.data?.error || 'ユーザーの削除に失敗しました')
    }
  }

  const pauseUser = async (userId: string, userName: string) => {
    if (!confirm(`ユーザー「${userName}」を休会状態にしますか？\n\n休会中は登録からの日数がカウントされず、動画の解放スケジュールも停止されます。`)) {
      return
    }

    try {
      const response = await adminApi.pauseUser(userId)
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...response.data.user } : user
      ))
      alert(response.data.message || 'ユーザーを休会状態にしました')
    } catch (err: any) {
      console.error('Pause user error:', err)
      alert(err.response?.data?.error || 'ユーザーの休会処理に失敗しました')
    }
  }

  const resumeUser = async (userId: string, userName: string) => {
    if (!confirm(`ユーザー「${userName}」の休会を解除しますか？\n\n解除後は登録からの日数カウントが再開されます。`)) {
      return
    }

    try {
      const response = await adminApi.resumeUser(userId)
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...response.data.user } : user
      ))
      alert(response.data.message || 'ユーザーの休会を解除しました')
    } catch (err: any) {
      console.error('Resume user error:', err)
      alert(err.response?.data?.error || 'ユーザーの休会解除に失敗しました')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'なし'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="w-4 h-4 text-red-400" />
      case 'INSTRUCTOR':
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '管理者'
      case 'INSTRUCTOR':
        return '講師'
      case 'STUDENT':
        return '生徒'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
          <p className="text-gray-400 mt-1">
            {pagination.total} 名の登録ユーザー
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          更新
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="名前・メールアドレスで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべての権限</option>
              <option value="ADMIN">管理者</option>
              <option value="INSTRUCTOR">講師</option>
              <option value="STUDENT">生徒</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {pagination.total} 件中 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 件
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">ユーザーが見つかりません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    休会状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    統計
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.name}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="STUDENT">生徒</option>
                          <option value="INSTRUCTOR">講師</option>
                          <option value="ADMIN">管理者</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateUserStatus(user.id, !user.isActive)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        } transition-colors`}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            有効
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            無効
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.isPaused ? (
                          <>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                              <Pause className="w-3 h-3" />
                              休会中
                            </div>
                            <button
                              onClick={() => resumeUser(user.id, user.name)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors"
                              title="休会を解除"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              <Play className="w-3 h-3" />
                              アクティブ
                            </div>
                            <button
                              onClick={() => pauseUser(user.id, user.name)}
                              className="p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded transition-colors"
                              title="休会状態にする"
                            >
                              <Pause className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      {user.pausedDays && user.pausedDays > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          累計休会: {user.pausedDays}日
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {formatDate(user.lastLoginAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="space-y-1">
                        <div>コース: {user._count.enrollments}</div>
                        <div>進捗: {user._count.progress}</div>
                        <div>メッセージ: {user._count.messages}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editingDate}
                              onChange={(e) => setEditingDate(e.target.value)}
                              className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => saveRegistrationDate(user.id)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors"
                              title="保存"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelEditingDate}
                              className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 rounded transition-colors"
                              title="キャンセル"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.createdAt)}
                            </div>
                            <button
                              onClick={() => startEditingDate(user.id, user.createdAt)}
                              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              title="登録日を編集"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => deleteUser(user.id, user.name, user.email)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="ユーザーを削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            前のページ
          </button>
          
          <span className="text-gray-400">
            ページ {pagination.page} / {pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
            disabled={currentPage === pagination.pages}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            次のページ
          </button>
        </div>
      )}
    </div>
  )
}