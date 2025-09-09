'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Shield, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const returnUrl = searchParams.get('returnUrl') || '/admin'

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // 管理者パスワードを確認
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
        credentials: 'include',
      })

      if (response.ok) {
        // 管理者アクセス権限をセッションに保存
        sessionStorage.setItem('adminAccess', 'true')
        router.push(returnUrl)
      } else {
        setError('管理者パスワードが間違っています')
      }
    } catch (err) {
      setError('認証中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 管理者パスワード認証のみを行うため、ローディング表示は不要

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-400/20 p-4 rounded-xl">
              <Shield className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">管理者ログイン</h1>
          <p className="text-gray-400">FX Tiger Dojo 管理システム</p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8">
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-400" />
              <p className="text-yellow-400 text-sm">
                管理者パスワードを入力してください
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminAccess} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-gray-300">
                管理者パスワード
              </Label>
              <Input
                id="adminPassword"
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="管理者パスワードを入力"
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>

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
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold rounded-lg transition-all disabled:opacity-50" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '認証中...' : '管理者アクセス'}
            </Button>

            <div className="text-center text-sm text-gray-400 pt-4 border-t border-white/10">
              一般ユーザーは{' '}
              <a href="/auth/login" className="text-yellow-400 hover:text-yellow-300 transition font-medium">
                こちらからログイン
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}