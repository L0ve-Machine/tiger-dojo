import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { SocketServer } from './socket'

// Routes
import authRoutes from './routes/auth.routes'
import courseRoutes from './routes/course.routes'
import adminRoutes from './routes/admin.routes'
import inviteRoutes from './routes/invite.routes'
import lessonRoutes from './routes/lesson.routes'
import subscriptionRoutes from './routes/subscription.routes'
import userRoutes from './routes/user.routes'
import dashboardRoutes from './routes/dashboard.routes'
import vimeoRoutes from './routes/vimeo.routes'
import privateRoomRoutes from './routes/private-room.routes'
import dmRoutes from './routes/dm.routes'
import chatRoutes from './routes/chat.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5010

// Initialize Prisma Client
export const prisma = new PrismaClient()

// Middleware
app.set('trust proxy', true) // Enable trust proxy for nginx reverse proxy
app.use(helmet())
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(url => url.trim()),
  credentials: true,
}))
app.use(express.json({ 
  limit: '10mb',
  strict: false
}))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Rate limiting (disabled in development)
const limiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Increased to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    })
  : (req: any, res: any, next: any) => next() // No rate limiting in development

if (process.env.NODE_ENV === 'production') {
  app.use(limiter)
}

// Stricter rate limiting for auth routes (very relaxed limits)
const authLimiter = process.env.NODE_ENV === 'production' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100000, // Very high limit - 100000 attempts per 15 minutes
      message: {
        error: 'Too many authentication attempts, please try again later.'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skipSuccessfulRequests: true, // Don't count successful requests
    })
  : (req: any, res: any, next: any) => next() // No rate limiting in development

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/invites', inviteRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/progress', lessonRoutes) // Legacy route for progress endpoints
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/user', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/vimeo', vimeoRoutes)
app.use('/api/private-rooms', privateRoomRoutes)
app.use('/api/dm', dmRoutes)
app.use('/api/chat', chatRoutes)

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})


// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

// Create HTTP server and Socket.io server
const httpServer = createServer(app)
const socketServer = new SocketServer(httpServer)

// Export socket server for use in other modules
export const io = socketServer.getIO()

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`)
  console.log(`💬 Socket.io server is running`)
})
