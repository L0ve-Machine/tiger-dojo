import { Router, Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { validateRequest, registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation.utils'
import { authenticateToken, validateRefreshToken } from '../middleware/auth.middleware'
import { InviteService } from '../services/invite.service'
import { prisma } from '../index'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { emailService } from '../services/email.service'

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
  
  inviteCode: z.string().min(1, '招待コードが必要です')
})

// POST /api/auth/register - Request user registration (pending approval)
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('Registration request body:', JSON.stringify(req.body, null, 2))
    
    // 招待コード不要の新しいスキーマを使用
    const simpleRegisterSchema = z.object({
      email: z.string().email('有効なメールアドレスを入力してください'),
      password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
      passwordConfirmation: z.string(),
      name: z.string().min(1, '名前を入力してください'),
      discordName: z.string().optional()
    }).refine(data => data.password === data.passwordConfirmation, {
      message: 'パスワードが一致しません',
      path: ['passwordConfirmation']
    })

    const validation = validateRequest(simpleRegisterSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    const { passwordConfirmation, ...userData } = validation.data

    // Check if email already exists in User or PendingUser
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    if (existingUser) {
      return res.status(400).json({
        error: 'このメールアドレスは既に登録されています'
      })
    }

    const existingPending = await prisma.pendingUser.findUnique({
      where: { email: userData.email }
    })
    if (existingPending && existingPending.status === 'PENDING') {
      return res.status(400).json({
        error: 'このメールアドレスは既に承認待ちです'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create pending user
    const pendingUser = await prisma.pendingUser.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        discordName: userData.discordName
      }
    })

    // Send approval request email to admin
    try {
      await emailService.sendApprovalRequest({
        id: pendingUser.id,
        email: pendingUser.email,
        name: pendingUser.name,
        approvalToken: pendingUser.approvalToken
      })
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Continue anyway - admin can still approve manually
    }

    res.status(201).json({
      message: 'アカウント登録申請を受け付けました。管理者の承認後、メールでお知らせします。',
      pending: true
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
      sameSite: 'lax' as const,
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
      sameSite: 'lax' as const,
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

// PUT /api/auth/update-profile - Update user profile
router.put('/update-profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      })
    }

    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: '名前は必須です'
      })
    }

    // Update user name in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    res.json({
      message: '名前を更新しました',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'プロフィールの更新に失敗しました'
    })
  }
})

// POST /api/auth/approve/:token - Approve pending user
router.post('/approve/:token', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: '管理者権限が必要です'
      })
    }

    const { token } = req.params
    const { approved, rejectionReason } = req.body

    // Find pending user by token
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { approvalToken: token }
    })

    if (!pendingUser) {
      return res.status(404).json({
        error: '承認待ちユーザーが見つかりません'
      })
    }

    if (pendingUser.status !== 'PENDING') {
      return res.status(400).json({
        error: 'このユーザーは既に処理されています'
      })
    }

    if (approved) {
      // Create actual user account
      const newUser = await prisma.user.create({
        data: {
          email: pendingUser.email,
          password: pendingUser.password,
          name: pendingUser.name,
          discordName: pendingUser.discordName,
          emailVerified: true
        }
      })

      // Update pending user status
      await prisma.pendingUser.update({
        where: { id: pendingUser.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: req.user.userId
        }
      })

      // Send approval notification email
      try {
        await emailService.sendApprovalNotification(pendingUser.email, true)
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError)
      }

      res.json({
        message: 'ユーザーを承認しました',
        user: newUser
      })
    } else {
      // Reject the pending user
      await prisma.pendingUser.update({
        where: { id: pendingUser.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || '管理者により拒否されました'
        }
      })

      // Send rejection notification email
      try {
        await emailService.sendApprovalNotification(pendingUser.email, false, rejectionReason)
      } catch (emailError) {
        console.error('Failed to send rejection notification:', emailError)
      }

      res.json({
        message: 'ユーザー登録を拒否しました'
      })
    }

  } catch (error: any) {
    console.error('Approval error:', error)
    res.status(500).json({
      error: '承認処理に失敗しました'
    })
  }
})

// GET /api/auth/pending-users - Get all pending users (admin only)
router.get('/pending-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: '管理者権限が必要です'
      })
    }

    const pendingUsers = await prisma.pendingUser.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        discordName: true,
        approvalToken: true,
        requestedAt: true
      }
    })

    res.json({
      pendingUsers
    })

  } catch (error: any) {
    console.error('Get pending users error:', error)
    res.status(500).json({
      error: '承認待ちユーザーの取得に失敗しました'
    })
  }
})

export default router