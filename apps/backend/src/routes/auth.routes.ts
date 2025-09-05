import { Router, Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { validateRequest, registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation.utils'
import { authenticateToken, validateRefreshToken } from '../middleware/auth.middleware'
import { InviteService } from '../services/invite.service'
import { z } from 'zod'

const router = Router()

// Enhanced registration schema with invite code
const registerWithInviteSchema = z.object({
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
    .int('年齢は整数で入力してください')
    .min(1, '年齢は1以上である必要があります')
    .max(120, '年齢は120以下である必要があります')
    .optional(),
  
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'], {
      errorMap: () => ({ message: '有効な性別を選択してください' })
    })
    .optional(),
  
  tradingExperience: z
    .enum(['beginner', 'intermediate', 'advanced'], {
      errorMap: () => ({ message: '有効な取引経験を選択してください' })
    })
    .optional(),
  
  inviteCode: z.string().min(1, '招待コードが必要です')
})

// POST /api/auth/register - User registration with invite code
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request data including invite code
    const validation = validateRequest(registerWithInviteSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    const { passwordConfirmation, agreeToTerms, inviteCode, ...registerData } = validation.data

    // Validate invite code first
    const inviteValidation = await InviteService.validateInviteCode(inviteCode)
    if (!inviteValidation.isValid) {
      return res.status(400).json({
        error: inviteValidation.reason
      })
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')

    // Register user
    const result = await AuthService.register(registerData, ipAddress, userAgent)

    // Use invite link after successful registration
    try {
      await InviteService.useInviteLink(inviteCode, result.user.id)
    } catch (inviteError: any) {
      console.error('Failed to use invite link after registration:', inviteError)
      // Continue with registration success, but log the issue
    }

    // Set HTTP-only cookies for tokens (recommended for security)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(201).json({
      message: '登録が完了しました',
      user: result.user,
      tokens: result.tokens, // Also return in body for frontend flexibility
      inviteInfo: inviteValidation.invite ? {
        description: inviteValidation.invite.description,
        creator: inviteValidation.invite.creator
      } : null
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(400).json({
      error: error.message || '登録に失敗しました'
    })
  }
})

// POST /api/auth/login - User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validation = validateRequest(loginSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')

    // Login user
    const result = await AuthService.login(validation.data, ipAddress, userAgent)

    // Set HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'ログインしました',
      user: result.user,
      tokens: result.tokens
    })

  } catch (error: any) {
    console.error('Login error:', error)
    res.status(401).json({
      error: error.message || 'ログインに失敗しました'
    })
  }
})

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', validateRefreshToken, async (req: Request, res: Response) => {
  try {
    let refreshToken = req.body.refreshToken || req.cookies?.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required'
      })
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')

    // Refresh tokens
    const result = await AuthService.refreshToken(refreshToken, ipAddress, userAgent)

    // Set new HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'Token refreshed successfully',
      user: result.user,
      tokens: result.tokens
    })

  } catch (error: any) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      error: error.message || 'Token refresh failed'
    })
  }
})

// POST /api/auth/logout - Logout user
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken

    if (refreshToken) {
      await AuthService.logout(refreshToken)
    }

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      message: 'ログアウトしました'
    })

  } catch (error: any) {
    console.error('Logout error:', error)
    // Always return success for logout
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.json({
      message: 'ログアウトしました'
    })
  }
})

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      })
    }

    await AuthService.logoutAll(req.user.userId)

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      message: '全てのデバイスからログアウトしました'
    })

  } catch (error: any) {
    console.error('Logout all error:', error)
    res.status(500).json({
      error: 'Logout failed'
    })
  }
})

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      })
    }

    const user = await AuthService.getCurrentUser(req.user.userId)

    res.json({
      user
    })

  } catch (error: any) {
    console.error('Get current user error:', error)
    res.status(404).json({
      error: error.message || 'User not found'
    })
  }
})

// GET /api/auth/verify-token - Verify if current token is valid
router.get('/verify-token', authenticateToken, async (req: Request, res: Response) => {
  try {
    // If middleware passes, token is valid
    res.json({
      valid: true,
      user: req.user
    })
  } catch (error: any) {
    console.error('Token verification error:', error)
    res.status(401).json({
      valid: false,
      error: 'Invalid token'
    })
  }
})

export default router