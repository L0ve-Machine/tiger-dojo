import { z } from 'zod'

// User registration validation schema
export const registerSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以下である必要があります'),
  
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(128, 'パスワードは128文字以下である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/, 
      'パスワードは大文字・小文字・数字・特殊文字をそれぞれ1文字以上含む必要があります'),
  
  passwordConfirmation: z.string(),
  
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(100, '名前は100文字以下である必要があります')
    .regex(/^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/, '名前に無効な文字が含まれています'),
  
  discordName: z
    .string()
    .max(50, 'Discord名は50文字以下である必要があります')
    .optional()
    .or(z.literal('')),
  
  age: z
    .number()
    .int('年齢は整数である必要があります')
    .min(18, '18歳以上である必要があります')
    .max(120, '有効な年齢を入力してください')
    .optional(),
  
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
      errorMap: () => ({ message: '有効な性別を選択してください' })
    })
    .optional(),
  
  tradingExperience: z
    .enum(['BEGINNER', 'UNDER_1_YEAR', 'ONE_TO_THREE', 'OVER_THREE'], {
      errorMap: () => ({ message: '有効なトレード経験を選択してください' })
    })
    .optional(),
  
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: '利用規約に同意する必要があります'
    })
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirmation']
})

// User login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください'),
  
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
})

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'リフレッシュトークンが必要です')
})

// Email validation
export const emailSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
})

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: any
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Email format validation (more lenient for existing users)
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Name sanitization
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // Remove special characters except Japanese
}

// Discord name validation
export function isValidDiscordName(discordName: string): boolean {
  // Discord usernames can contain alphanumeric characters, underscores, and periods
  // They must be 2-32 characters long
  const discordRegex = /^[a-zA-Z0-9._]{2,32}$/
  return discordRegex.test(discordName)
}