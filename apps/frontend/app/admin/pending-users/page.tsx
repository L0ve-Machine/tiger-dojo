'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Mail, Calendar, ExternalLink, RefreshCw } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  name: string
  discordName?: string
  approvalToken: string
  requestedAt: string
}

export default function PendingUsersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchPendingUsers()
  }, [user])

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending-users`, {
        credentials: 'include'
      })

      if (!response.ok) {
        setError('承認待ちユーザー情報の取得に失敗しました')
        return
      }

      const data = await response.json()
      setPendingUsers(data.pendingUsers)
    } catch (error) {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }


  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">承認待ちユーザー</h1>
              <p className="text-gray-600 mt-1">新規登録申請の管理</p>
            </div>
            <Button onClick={fetchPendingUsers} variant="outline" className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              更新
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">承認待ちユーザーはいません</h3>
              <p className="text-gray-500">新規登録申請があるとここに表示されます</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{pendingUser.name}</CardTitle>
                    <Badge variant="secondary">承認待ち</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">メール:</span>
                      <span className="font-medium">{pendingUser.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">申請日時:</span>
                      <span className="font-medium">{formatDate(pendingUser.requestedAt)}</span>
                    </div>
                    
                    {pendingUser.discordName && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Discord:</span>
                        <span className="font-medium">{pendingUser.discordName}</span>
                      </div>
                    )}
                    
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={() => router.push(`/admin/approve/${pendingUser.approvalToken}`)}
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      承認・拒否画面へ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}