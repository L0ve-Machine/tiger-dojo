'use client'

import { useState } from 'react'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Key, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminSettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await adminApi.changePassword(passwordForm)
      setMessage(response.data.message)
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワード変更に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">システム設定</h1>
        <p className="text-gray-400 mt-1">管理者パスワードとシステム設定の管理</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              管理者パスワード変更
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-300">
                  現在のパスワード
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="bg-gray-800/50 border-gray-600 text-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">
                  新しいパスワード
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={4}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="bg-gray-800/50 border-gray-600 text-black"
                />
              </div>

              {message && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-green-400 text-sm">{message}</p>
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                パスワード変更
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">システム情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-400">現在の管理者パスワード</h3>
                <p className="text-white">設定済み</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400">アクセス制御</h3>
                <p className="text-white">有効</p>
              </div>
            </div>
            
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 text-sm">
                📝 パスワード変更後は、管理者ページに再アクセスする際に新しいパスワードが必要になります。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}