'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore, RegisterData } from '@/lib/auth'
import { FormField } from '@/components/forms/FormField'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  
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
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const validatePassword = (password: string) => {
    const strength = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
    setPasswordStrength(strength)
    return strength
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    // Email validation
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください'
    }

    // Name validation
    if (!formData.name) {
      errors.name = '名前を入力してください'
    } else if (formData.name.length > 100) {
      errors.name = '名前は100文字以下である必要があります'
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'パスワードを入力してください'
    } else {
      const strength = validatePassword(formData.password)
      if (!Object.values(strength).every(Boolean)) {
        errors.password = 'パスワードの要件を満たしてください'
      }
    }

    // Password confirmation
    if (!formData.passwordConfirmation) {
      errors.passwordConfirmation = 'パスワード確認を入力してください'
    } else if (formData.password !== formData.passwordConfirmation) {
      errors.passwordConfirmation = 'パスワードが一致しません'
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = '利用規約に同意する必要があります'
    }

    // Optional field validations
    if (formData.discordName && formData.discordName.length > 50) {
      errors.discordName = 'Discord名は50文字以下である必要があります'
    }

    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 120)) {
      errors.age = '年齢は18歳以上120歳以下である必要があります'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string) => (value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Special handling for password field
    if (field === 'password' && typeof value === 'string') {
      validatePassword(value)
    }
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
    
    // Clear general error
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
        name: formData.name,
        discordName: formData.discordName || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender as any || undefined,
        tradingExperience: formData.tradingExperience as any || undefined,
        agreeToTerms: formData.agreeToTerms
      }

      await register(registerData)
      router.push('/dashboard')
    } catch (err) {
      // Error is handled by the store
    }
  }

  const genderOptions = [
    { value: 'MALE', label: '男性' },
    { value: 'FEMALE', label: '女性' },
    { value: 'OTHER', label: 'その他' },
    { value: 'PREFER_NOT_TO_SAY', label: '回答しない' }
  ]

  const experienceOptions = [
    { value: 'BEGINNER', label: '初心者' },
    { value: 'UNDER_1_YEAR', label: '1年未満' },
    { value: 'ONE_TO_THREE', label: '1-3年' },
    { value: 'OVER_THREE', label: '3年以上' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Back to home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/lion-tech.jpeg" 
              alt="TRADE DOJO Logo" 
              className="w-20 h-20 rounded-xl object-cover shadow-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">新規登録</h2>
          <p className="text-gray-300">アカウントを作成してFXサロン「トレード道場」で"勝てる型"を身に付けましょう</p>
        </div>

        {/* Register Form */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                基本情報 <span className="text-red-400">*</span>
              </h3>

              <FormField
                label="メールアドレス"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={formErrors.email}
                required
              />

              <FormField
                label="お名前"
                name="name"
                type="text"
                placeholder="山田太郎"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={formErrors.name}
                required
              />

              <FormField
                label="パスワード"
                name="password"
                type="password"
                placeholder="12文字以上の強力なパスワード"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={formErrors.password}
                required
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-300">パスワード強度:</p>
                  <div className="space-y-1 text-xs">
                    {[
                      { key: 'length', label: '12文字以上' },
                      { key: 'uppercase', label: '大文字を含む' },
                      { key: 'lowercase', label: '小文字を含む' },
                      { key: 'number', label: '数字を含む' },
                      { key: 'special', label: '特殊文字を含む' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Check className={`w-3 h-3 ${
                          passwordStrength[key as keyof typeof passwordStrength] 
                            ? 'text-green-400' 
                            : 'text-gray-500'
                        }`} />
                        <span className={
                          passwordStrength[key as keyof typeof passwordStrength]
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                label="パスワード確認"
                name="passwordConfirmation"
                type="password"
                placeholder="パスワードを再入力"
                value={formData.passwordConfirmation}
                onChange={handleInputChange('passwordConfirmation')}
                error={formErrors.passwordConfirmation}
                required
              />
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                追加情報 <span className="text-sm text-gray-400 font-normal">(任意)</span>
              </h3>

              <FormField
                label="Discord名"
                name="discordName"
                type="text"
                placeholder="discord_username"
                value={formData.discordName}
                onChange={handleInputChange('discordName')}
                error={formErrors.discordName}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="年齢"
                  name="age"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={handleInputChange('age')}
                  error={formErrors.age}
                />

                <FormField
                  label="性別"
                  name="gender"
                  type="select"
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  options={genderOptions}
                  error={formErrors.gender}
                />
              </div>

              <FormField
                label="トレード経験"
                name="tradingExperience"
                type="select"
                value={formData.tradingExperience}
                onChange={handleInputChange('tradingExperience')}
                options={experienceOptions}
                error={formErrors.tradingExperience}
              />
            </div>

            {/* Terms Agreement */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms')(e.target.checked)}
                  className="mt-1 w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-300">
                  <Link href="/terms" className="text-yellow-400 hover:text-amber-600 transition">利用規約</Link>
                  および
                  <Link href="/privacy" className="text-yellow-400 hover:text-amber-600 transition">プライバシーポリシー</Link>
                  に同意します <span className="text-red-400">*</span>
                </label>
              </div>
              {formErrors.agreeToTerms && (
                <p className="text-sm text-red-400">{formErrors.agreeToTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登録中...
                </>
              ) : (
                'アカウントを作成'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                既にアカウントをお持ちの方は{' '}
                <Link 
                  href="/auth/login" 
                  className="text-yellow-400 hover:text-amber-600 transition font-medium"
                >
                  ログイン
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}