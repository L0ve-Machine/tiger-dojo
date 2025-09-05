import { Request, Response, NextFunction } from 'express'
import { JWTUtils, JWTPayload } from '../utils/jwt.utils'
import { prisma } from '../index'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header
    let token = JWTUtils.getTokenFromHeader(req.headers.authorization)
    
    // If not found in header, try cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required' 
      })
    }

    // Verify the token
    const payload = JWTUtils.verifyAccessToken(token)
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found' 
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account is disabled' 
      })
    }

    // Add user info to request object
    req.user = payload
    next()

  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    })
  }
}

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      })
    }

    next()
  }
}

// Middleware to validate refresh token and get user info
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let refreshToken = req.body.refreshToken
    
    // If not in body, try cookie
    if (!refreshToken && req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken
    }

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required' 
      })
    }

    // Verify refresh token
    const { userId } = JWTUtils.verifyRefreshToken(refreshToken)
    
    // Check if session exists in database
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    })

    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid refresh token' 
      })
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({
        where: { id: session.id }
      })
      
      return res.status(401).json({ 
        error: 'Refresh token expired' 
      })
    }

    if (!session.user.isActive) {
      return res.status(403).json({ 
        error: 'Account is disabled' 
      })
    }

    // Add session and user to request
    req.user = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    }
    
    req.session = session
    next()

  } catch (error) {
    console.error('Refresh token validation error:', error)
    return res.status(401).json({ 
      error: 'Invalid refresh token' 
    })
  }
}

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = JWTUtils.getTokenFromHeader(req.headers.authorization)
    
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (token) {
      try {
        const payload = JWTUtils.verifyAccessToken(token)
        
        // Check if user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        })

        if (user && user.isActive) {
          req.user = payload
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
        console.log('Optional auth failed, continuing without auth')
      }
    }

    next()
  } catch (error) {
    // Continue without authentication on any error
    next()
  }
}