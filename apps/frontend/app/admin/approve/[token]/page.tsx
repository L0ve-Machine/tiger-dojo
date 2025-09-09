'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle, User, Mail, Calendar, AlertCircle } from 'lucide-react'

interface PendingUserInfo {
  id: string
  email: string
  name: string
  discordName?: string
  requestedAt: string
}

export default function ApprovalPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [pendingUser, setPendingUser] = useState<PendingUserInfo | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchPendingUserInfo()
  }, [user])

  const fetchPendingUserInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending-users`, {
        credentials: 'include'
      })

      if (!response.ok) {
        setError('承認待ちユーザー情報の取得に失敗しました')
        return
      }

      const data = await response.json()
      const foundUser = data.pendingUsers.find((u: any) => u.approvalToken === params.token)
      
      if (foundUser) {
        setPendingUser(foundUser)
      } else {
        setError('承認待ちユーザーが見つかりません')
      }
    } catch (error) {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!approved && !rejectionReason.trim()) {
      setError('拒否理由を入力してください')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/approve/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          approved,
          rejectionReason: approved ? undefined : rejectionReason
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || '処理に失敗しました')
        return
      }

      setProcessResult(approved ? 'approved' : 'rejected')
    } catch (error) {
      setError('処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">エラー</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin/pending-users')} variant="outline" className="w-full">
              承認待ちユーザー一覧へ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (processResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {processResult === 'approved' ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle>
              {processResult === 'approved' ? 'ユーザーを承認しました' : 'ユーザー登録を拒否しました'}
            </CardTitle>
            <CardDescription>
              {processResult === 'approved' 
                ? 'ユーザーに承認通知メールが送信されました'
                : '申請者に拒否通知メールが送信されました'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin/pending-users')} className="w-full">
              承認待ちユーザー一覧へ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー登録承認</CardTitle>
            <CardDescription>新規ユーザーの登録申請を確認して承認または拒否してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingUser && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">申請者情報</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">名前:</span>
                    <span className="font-medium">{pendingUser.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">メール:</span>
                    <span className="font-medium">{pendingUser.email}</span>
                  </div>
                  
                  {pendingUser.discordName && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Discord:</span>
                      <span className="font-medium">{pendingUser.discordName}</span>
                    </div>
                  )}
                  
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">申請日時:</span>
                    <span className="font-medium">
                      {new Date(pendingUser.requestedAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">拒否理由（拒否する場合は必須）</Label>
              <Textarea
                id="rejectionReason"
                placeholder="拒否する場合は理由を入力してください"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => handleApproval(true)}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                承認
              </Button>
              
              <Button
                onClick={() => handleApproval(false)}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" />
                拒否
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}