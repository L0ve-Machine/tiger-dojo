import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/auth.types'

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This action requires administrator privileges'
    })
  }

  next()
}

export const requireInstructorOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
    return res.status(403).json({ 
      error: 'Instructor or admin access required',
      message: 'This action requires instructor or administrator privileges'
    })
  }

  next()
}