'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface InviteInfo {
  isValid: boolean
  description?: string
  creator?: {
    name: string
    role: string
  }
  remainingUses?: number | null
}

export default function InviteRegistrationForm() {
  const router = useRouter()
  const { login } = useAuthStore()
  
  const [step, setStep] = useState<'invite' | 'registration'>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isValidatingInvite, setIsValidatingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: '',
    name: '',
    discordName: '',
    age: '',
    gender: '',
    tradingExperience: '',
    agreeToTerms: false
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateInviteCode = async () => {
    if (!inviteCode.trim()) {
      setInviteError('招待コードを入力してください')
      return
    }

    setIsValidatingInvite(true)
    setInviteError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invites/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: inviteCode })
      })

      const data = await response.json()

      if (!response.ok) {
        setInviteError(data.error || '招待コードの検証に失敗しました')
        return
      }

      if (data.isValid) {
        setInviteInfo({
          isValid: true,
          description: data.invite?.description,
          creator: data.invite?.creator,
          remainingUses: data.remainingUses
        })
        setStep('registration')
      } else {
        setInviteError('無効な招待コードです')
      }
    } catch (error) {
      setInviteError('招待コードの検証中にエラーが発生しました')
    } finally {
      setIsValidatingInvite(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms) {
      setErrors(['利用規約に同意してください'])
      return
    }

    if (formData.password !== formData.passwordConfirmation) {
      setErrors(['パスワードが一致しません'])
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const registrationData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        discordName: formData.discordName || undefined,
        gender: formData.gender || undefined,
        tradingExperience: formData.tradingExperience || undefined,
        inviteCode
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(registrationData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setErrors(data.details)
        } else {
          setErrors([data.error || '登録に失敗しました'])
        }
        return
      }

      // Auto login after successful registration
      login(data.user, data.tokens)
      
      router.push('/dashboard')
    } catch (error) {
      setErrors(['登録中にエラーが発生しました'])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'invite') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">招待コード入力</CardTitle>
            <CardDescription>
              FX Tiger Dojoへの参加には招待コードが必要です
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">招待コード</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="招待コードを入力してください"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && validateInviteCode()}
              />
            </div>

            {inviteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={validateInviteCode}
              disabled={isValidatingInvite || !inviteCode.trim()}
              className="w-full"
            >
              {isValidatingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              招待コードを確認
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-green-600">招待コード確認済み</span>
          </div>
          <CardTitle className="text-2xl font-bold">会員登録</CardTitle>
          {inviteInfo?.description && (
            <CardDescription>{inviteInfo.description}</CardDescription>
          )}
          {inviteInfo?.creator && (
            <CardDescription className="text-sm">
              招待者: {inviteInfo.creator.name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegistration} className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">名前 *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">パスワード *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  8文字以上、大文字・小文字・数字・記号を含む
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">パスワード確認 *</Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  required
                  value={formData.passwordConfirmation}
                  onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discordName">Discord名</Label>
                <Input
                  id="discordName"
                  type="text"
                  placeholder="例: username#1234"
                  value={formData.discordName}
                  onChange={(e) => setFormData({ ...formData, discordName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">年齢</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">男性</SelectItem>
                    <SelectItem value="FEMALE">女性</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">回答しない</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradingExperience">トレード経験</Label>
                <Select value={formData.tradingExperience} onValueChange={(value) => setFormData({ ...formData, tradingExperience: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">初心者</SelectItem>
                    <SelectItem value="UNDER_1_YEAR">1年未満</SelectItem>
                    <SelectItem value="ONE_TO_THREE">1-3年</SelectItem>
                    <SelectItem value="OVER_THREE">3年以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: !!checked })}
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                利用規約とプライバシーポリシーに同意します *
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登録する
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setStep('invite')}
              className="text-sm"
            >
              ← 招待コード入力に戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}