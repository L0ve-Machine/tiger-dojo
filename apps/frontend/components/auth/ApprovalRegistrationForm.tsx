'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function ApprovalRegistrationForm() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: '',
    name: '',
    discordName: ''
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)


  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.passwordConfirmation) {
      setErrors(['パスワードが一致しません'])
      return
    }

    if (formData.password.length < 8) {
      setErrors(['パスワードは8文字以上である必要があります'])
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const registrationData = {
        ...formData,
        discordName: formData.discordName || undefined
      }

      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
      console.log('Registration URL (direct):', `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`)
      console.log('Registration URL (proxy):', `/api/auth/register`)

      // Try proxy first, fallback to direct if needed
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: 'include',
        body: new URLSearchParams(registrationData as Record<string, string>).toString()
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setErrors(data.details)
        } else {
          setErrors([data.error || '登録に失敗しました'])
        }
        setIsSubmitting(false)
        return
      }

      setRegistrationSuccess(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors(['登録中にエラーが発生しました'])
      setIsSubmitting(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <CheckCircle className="h-20 w-20 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">登録申請完了！</h1>
            
            <div className="space-y-4 mb-8">
              <p className="text-yellow-400 font-semibold text-lg">
                🎉 トレード道場スタッフが認証次第ログイン頂けます！
              </p>
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  承認完了後、ご登録いただいたメールアドレスにお知らせします
                </p>
                <p className="text-yellow-300 text-xs mt-2">
                  ※ 通常1〜2営業日で承認いたします
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold rounded-lg transition-all"
            >
              ログインページへ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/lion-tech.jpeg" 
              alt="TRADE DOJO Logo" 
              className="w-16 h-16 rounded-xl object-cover shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">新規登録</h1>
          <p className="text-gray-300">FXトレード道場で"勝てる型"を身に付けましょう</p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8">
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-yellow-400" />
              <p className="text-yellow-400 text-sm">
                登録には管理者の承認が必要です。承認後、メールでお知らせします。
              </p>
            </div>
          </div>

          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  お名前 <span className="text-yellow-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="山田太郎"
                  className="bg-gray-800/50 border-gray-600 text-black placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  メールアドレス <span className="text-yellow-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your-email@example.com"
                  className="bg-gray-800/50 border-gray-600 text-black placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  パスワード <span className="text-yellow-400">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8文字以上"
                  className="bg-gray-800/50 border-gray-600 text-black placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation" className="text-gray-300">
                  パスワード（確認） <span className="text-yellow-400">*</span>
                </Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  required
                  value={formData.passwordConfirmation}
                  onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                  placeholder="パスワードを再入力"
                  className="bg-gray-800/50 border-gray-600 text-black placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordName" className="text-gray-300">Discord名（任意）</Label>
              <Input
                id="discordName"
                type="text"
                value={formData.discordName}
                onChange={(e) => setFormData({ ...formData, discordName: e.target.value })}
                placeholder="Discord#1234"
                className="bg-gray-800/50 border-gray-600 text-black placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>


            {errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <ul className="text-red-400 text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '登録中...' : '登録申請を送信'}
            </Button>

            <div className="text-center text-sm text-gray-400 pt-4 border-t border-white/10">
              既にアカウントをお持ちの方は{' '}
              <a href="/auth/login" className="text-yellow-400 hover:text-yellow-300 transition font-medium">
                ログイン
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}