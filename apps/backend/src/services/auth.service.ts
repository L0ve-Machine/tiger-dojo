import { PrismaClient, User } from '@prisma/client'
import { PasswordUtils } from '../utils/password.utils'
import { JWTUtils, TokenPair } from '../utils/jwt.utils'
import { prisma } from '../index'

export interface RegisterData {
  email: string
  password: string
  name: string
  discordName?: string
  age?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  tradingExperience?: 'BEGINNER' | 'UNDER_1_YEAR' | 'ONE_TO_THREE' | 'OVER_THREE'
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    isActive: boolean
    emailVerified: boolean
  }
  tokens: TokenPair
}

export class AuthService {
  static async register(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      })

      if (existingUser) {
        throw new Error('このメールアドレスは既に登録されています')
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validate(data.password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '))
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hash(data.password)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name.trim(),
          discordName: data.discordName?.trim() || null,
          age: data.age || null,
          gender: data.gender || null,
          tradingExperience: data.tradingExperience || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true
        }
      })

      // Generate tokens
      const tokens = JWTUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })

      // Create session record
      const expiresAt = new Date(Date.now() + JWTUtils.getRefreshTokenExpirationTime())
      
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt
        }
      })

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      return { user, tokens }

    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  static async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true
        }
      })

      if (!user) {
        throw new Error('メールアドレスまたはパスワードが間違っています')
      }

      if (!user.isActive) {
        throw new Error('アカウントが無効化されています')
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.compare(data.password, user.password)
      if (!isPasswordValid) {
        throw new Error('メールアドレスまたはパスワードが間違っています')
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })

      // Clean up old sessions (optional: keep only last 5 sessions)
      const existingSessions = await prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      if (existingSessions.length >= 5) {
        const sessionsToDelete = existingSessions.slice(4)
        await prisma.session.deleteMany({
          where: {
            id: { in: sessionsToDelete.map(s => s.id) }
          }
        })
      }

      // Create new session
      const expiresAt = new Date(Date.now() + JWTUtils.getRefreshTokenExpirationTime())
      
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt
        }
      })

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        },
        tokens
      }

    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  static async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const { userId } = JWTUtils.verifyRefreshToken(refreshToken)

      // Find session
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true }
      })

      if (!session) {
        throw new Error('Invalid refresh token')
      }

      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await prisma.session.delete({
          where: { id: session.id }
        })
        throw new Error('Refresh token expired')
      }

      if (!session.user.isActive) {
        throw new Error('Account is disabled')
      }

      // Generate new token pair
      const tokens = JWTUtils.generateTokenPair({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      })

      // Update session with new tokens
      const newExpiresAt = new Date(Date.now() + JWTUtils.getRefreshTokenExpirationTime())
      
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          ipAddress: ipAddress || session.ipAddress,
          userAgent: userAgent || session.userAgent,
          expiresAt: newExpiresAt
        }
      })

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          isActive: session.user.isActive,
          emailVerified: session.user.emailVerified
        },
        tokens
      }

    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    try {
      // Find and delete session
      const session = await prisma.session.findUnique({
        where: { refreshToken }
      })

      if (session) {
        await prisma.session.delete({
          where: { id: session.id }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error for logout - always succeed
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId }
      })
    } catch (error) {
      console.error('Logout all error:', error)
      throw error
    }
  }

  static async getCurrentUser(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          discordName: true,
          age: true,
          gender: true,
          tradingExperience: true,
          isActive: true,
          emailVerified: true,
          registeredAt: true,
          lastLoginAt: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  }
}