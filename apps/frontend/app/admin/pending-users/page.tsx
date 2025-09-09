'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, User, Mail, Calendar, Check, X, RefreshCw } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  name: string
  discordName?: string
  approvalToken: string
  requestedAt: string
}

export default function PendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingUser, setProcessingUser] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true)
      const response = await adminApi.getPendingUsers()
      setPendingUsers(response.data.pendingUsers)
    } catch (error: any) {
      console.error('承認待ちユーザー取得エラー:', error)
      setError(error.response?.data?.error || '承認待ちユーザー情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  const handleApproveUser = async (user: PendingUser) => {
    if (!confirm(`${user.name} (${user.email}) を承認しますか？`)) {
      return
    }

    try {
      setProcessingUser(user.id)
      await adminApi.approveUser(user.approvalToken)
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== user.id))
      alert('ユーザーが承認されました')
    } catch (error: any) {
      console.error('承認エラー:', error)
      alert(error.response?.data?.error || 'ユーザーの承認に失敗しました')
    } finally {
      setProcessingUser(null)
    }
  }

  const handleRejectUser = async (user: PendingUser) => {
    if (!confirm(`${user.name} (${user.email}) を拒否しますか？\n\nこの操作は元に戻せません。`)) {
      return
    }

    try {
      setProcessingUser(user.id)
      await adminApi.rejectUser(user.approvalToken)
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== user.id))
      alert('ユーザーが拒否されました')
    } catch (error: any) {
      console.error('拒否エラー:', error)
      alert(error.response?.data?.error || 'ユーザーの拒否に失敗しました')
    } finally {
      setProcessingUser(null)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">承認待ちユーザー</h1>
            <p className="text-gray-400 mt-1">新規登録申請の管理</p>
          </div>
          <Button 
            onClick={fetchPendingUsers} 
            className="bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <User className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-400">承認待ちユーザーを読み込み中...</p>
          </div>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">承認待ちユーザーはいません</h3>
            <p className="text-gray-400">新規登録申請があるとここに表示されます</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{pendingUser.name}</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">承認待ち</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">メール:</span>
                    <span className="font-medium text-white">{pendingUser.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">申請日時:</span>
                    <span className="font-medium text-white">{formatDate(pendingUser.requestedAt)}</span>
                  </div>
                  
                  {pendingUser.discordName && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Discord:</span>
                      <span className="font-medium text-white">{pendingUser.discordName}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => handleRejectUser(pendingUser)}
                    disabled={processingUser === pendingUser.id}
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingUser === pendingUser.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    拒否
                  </Button>
                  <Button
                    onClick={() => handleApproveUser(pendingUser)}
                    disabled={processingUser === pendingUser.id}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                  >
                    {processingUser === pendingUser.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    承認
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}