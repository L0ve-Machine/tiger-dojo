import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export class JWTUtils {
  private static ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret'
  private static REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
  private static ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '8760h'
  private static REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '8760h'

  static generateTokenPair(payload: JWTPayload): TokenPair {
    // Add unique identifier to prevent token collision
    const uniqueId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    const accessToken = jwt.sign(
      { ...payload, jti: uniqueId },
      this.ACCESS_SECRET,
      { 
        expiresIn: this.ACCESS_EXPIRES,
        algorithm: 'HS256'
      }
    )

    const refreshToken = jwt.sign(
      { 
        userId: payload.userId,
        jti: uniqueId + '_refresh'
      },
      this.REFRESH_SECRET,
      { 
        expiresIn: this.REFRESH_EXPIRES,
        algorithm: 'HS256'
      }
    )

    return { accessToken, refreshToken }
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.ACCESS_SECRET) as JWTPayload
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.REFRESH_SECRET) as { userId: string }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  static getTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.slice(7) // Remove 'Bearer ' prefix
  }

  static getAccessTokenExpirationTime(): number {
    // Convert string format to milliseconds
    const timeStr = this.ACCESS_EXPIRES
    const timeValue = parseInt(timeStr)
    
    if (timeStr.includes('m')) {
      return timeValue * 60 * 1000 // minutes to milliseconds
    } else if (timeStr.includes('h')) {
      return timeValue * 60 * 60 * 1000 // hours to milliseconds
    } else if (timeStr.includes('d')) {
      return timeValue * 24 * 60 * 60 * 1000 // days to milliseconds
    }
    
    return 15 * 60 * 1000 // Default 15 minutes
  }

  static getRefreshTokenExpirationTime(): number {
    // Convert string format to milliseconds
    const timeStr = this.REFRESH_EXPIRES
    const timeValue = parseInt(timeStr)
    
    if (timeStr.includes('d')) {
      return timeValue * 24 * 60 * 60 * 1000 // days to milliseconds
    } else if (timeStr.includes('h')) {
      return timeValue * 60 * 60 * 1000 // hours to milliseconds
    }
    
    return 7 * 24 * 60 * 60 * 1000 // Default 7 days
  }
}

// Export standalone function for backward compatibility
export const generateTokens = (payload: JWTPayload): TokenPair => {
  return JWTUtils.generateTokenPair(payload)
}