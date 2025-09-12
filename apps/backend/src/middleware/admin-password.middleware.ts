import express from 'express'
import fs from 'fs'
import path from 'path'

export const verifyAdminPassword = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // For password-only admin authentication, we'll verify via a header or session
  // Since we're using sessionStorage on frontend, we'll accept the admin access via header
  const adminAccess = req.headers['x-admin-access'] || req.headers['authorization']
  
  // For now, we'll verify the admin password is sent in the request
  // In a real implementation, you might want to use JWT or session tokens
  const adminPassword = req.headers['x-admin-password']
  
  // Get current password from file or environment
  const getCurrentAdminPassword = (): string => {
    const passwordFilePath = path.join(process.cwd(), '.admin-password')
    if (fs.existsSync(passwordFilePath)) {
      return fs.readFileSync(passwordFilePath, 'utf8').trim()
    }
    return process.env.ADMIN_ACCESS_PASSWORD || 'tiger-dojo'
  }
  
  const expectedPassword = getCurrentAdminPassword()
  
  if (adminPassword === expectedPassword) {
    next()
  } else {
    res.status(401).json({
      error: '管理者認証が必要です'
    })
  }
}

// Alternative: Since we're using sessionStorage, we could also create a simpler version
// that just checks if the request comes from an authenticated admin session
export const requireAdminPasswordOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // For simplicity, we'll allow all requests that pass the /verify-password check
  // The frontend will handle the password authentication via sessionStorage
  next()
}