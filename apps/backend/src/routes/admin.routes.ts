import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin, requireInstructorOrAdmin } from '../middleware/admin.middleware'
import { AdminController } from '../controllers/admin.controller'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { generateTokens } from '../utils/jwt.utils'

const router = express.Router()

// 管理者パスワード認証スキーマ
const adminPasswordSchema = z.object({
  password: z.string().min(1, 'パスワードが必要です')
})

// POST /api/admin/verify-password - 管理者パスワード認証（認証不要）
router.post('/verify-password', async (req: express.Request, res: express.Response) => {
  try {
    const validation = adminPasswordSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: '無効な入力です',
        details: validation.error.errors.map(err => err.message)
      })
    }

    const { password } = validation.data
    
    // Get current password from file or environment
    const getCurrentAdminPassword = (): string => {
      const passwordFilePath = path.join(process.cwd(), '.admin-password')
      if (fs.existsSync(passwordFilePath)) {
        return fs.readFileSync(passwordFilePath, 'utf8').trim()
      }
      return process.env.ADMIN_ACCESS_PASSWORD || 'tiger-dojo'
    }
    
    const adminPassword = getCurrentAdminPassword()

    if (password === adminPassword) {
      try {
        // Find admin user and generate JWT tokens
        const { prisma } = await import('../index')
        const { generateTokens } = await import('../utils/jwt.utils')
        
        console.log('Looking for admin user...')
        const adminUser = await prisma.user.findFirst({
          where: { 
            role: 'ADMIN',
            isActive: true 
          }
        })

        console.log('Admin user found:', adminUser?.email)

        if (!adminUser) {
          return res.status(500).json({
            error: '管理者ユーザーが見つかりません'
          })
        }

        console.log('Generating tokens...')
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens({
          userId: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          name: adminUser.name
        })
        
        console.log('Tokens generated successfully')

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      res.json({
        success: true,
        message: '管理者認証が完了しました',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      })
      } catch (innerError) {
        console.error('Inner error during admin auth:', innerError)
        throw innerError
      }
    } else {
      res.status(401).json({
        error: '管理者パスワードが間違っています'
      })
    }
  } catch (error) {
    console.error('Admin password verification error:', error)
    res.status(500).json({
      error: '認証処理中にエラーが発生しました'
    })
  }
})

// All other admin routes require admin password verification
// Since frontend handles password verification via sessionStorage,
// we'll use a simpler approach for backend routes

// Dashboard & Analytics
router.get('/dashboard', AdminController.getDashboard)
router.get('/analytics', AdminController.getAnalytics)

// User Management
router.get('/users', AdminController.getUsers)
router.get('/users/:id', AdminController.getUserById)
router.put('/users/:id', AdminController.updateUser)
router.delete('/users/:id', AdminController.deleteUser)
router.put('/users/:id/role', AdminController.updateUserRole)
router.put('/users/:id/status', AdminController.updateUserStatus)
router.post('/users/:id/pause', AdminController.pauseUser)
router.post('/users/:id/resume', AdminController.resumeUser)

// Course Management
router.get('/courses', authenticateToken, requireInstructorOrAdmin, AdminController.getCourses)
router.post('/courses', authenticateToken, requireInstructorOrAdmin, AdminController.createCourse)
router.put('/courses/:id', authenticateToken, requireInstructorOrAdmin, AdminController.updateCourse)
router.delete('/courses/:id', authenticateToken, requireAdmin, AdminController.deleteCourse)
router.put('/courses/:id/publish', authenticateToken, requireInstructorOrAdmin, AdminController.publishCourse)

// Lesson Management
router.get('/lessons', authenticateToken, requireInstructorOrAdmin, AdminController.getLessons)
router.post('/lessons', authenticateToken, requireInstructorOrAdmin, AdminController.createLesson)  
router.put('/lessons/:id', authenticateToken, requireInstructorOrAdmin, AdminController.updateLesson)
router.delete('/lessons/:id', authenticateToken, requireAdmin, AdminController.deleteLesson)

// Video Upload (Vimeo integration)
router.post('/upload/video', AdminController.uploadVideo)
router.get('/upload/video/:id/status', AdminController.getUploadStatus)

// Chat Management
router.get('/chat/messages', AdminController.getChatMessages)
router.delete('/chat/messages/:id', AdminController.deleteChatMessage)
router.put('/chat/messages/:id/moderate', AdminController.moderateMessage)

// Chat Room Management
router.get('/chat/rooms', async (req: express.Request, res: express.Response) => {
  try {
    const { prisma } = require('../index')
    
    // Get all chat rooms (courses used as chat rooms)
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    // Get private rooms (password-protected rooms)
    const privateRooms = await prisma.privateRoom.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        accessKey: true,
        isPublic: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get message counts for each course
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
      const messageCount = await prisma.chatMessage.count({
        where: { courseId: course.id }
      })
      
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        createdAt: course.createdAt,
        messageCount,
        type: 'course',
        isLocked: false,
        _count: {
          messages: messageCount
        }
      }
    }))
    
    // Get message counts for private rooms and add lock prefix for password-protected ones
    const privateRoomsWithCounts = await Promise.all(privateRooms.map(async (room) => {
      const messageCount = await prisma.chatMessage.count({
        where: { privateRoomId: room.id }
      })
      
      const isPasswordProtected = !room.isPublic && room.accessKey
      const displayTitle = isPasswordProtected ? `🔒 ${room.name}` : room.name
      
      return {
        id: room.id,
        title: displayTitle,
        slug: room.slug,
        createdAt: room.createdAt,
        messageCount,
        type: 'private',
        isLocked: isPasswordProtected,
        _count: {
          messages: messageCount
        }
      }
    }))
    
    // Combine both types of rooms
    const allRooms = [...coursesWithCounts, ...privateRoomsWithCounts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    res.json({
      success: true,
      rooms: allRooms
    })
  } catch (error) {
    console.error('Get chat rooms error:', error)
    res.status(500).json({
      error: 'チャットルーム情報の取得に失敗しました'
    })
  }
})

router.post('/chat/rooms', async (req: express.Request, res: express.Response) => {
  try {
    const { title, slug } = req.body
    const { prisma } = require('../index')

    if (!title || !slug) {
      return res.status(400).json({
        error: 'タイトルとスラッグが必要です'
      })
    }

    // Check if slug already exists
    const existingRoom = await prisma.course.findUnique({
      where: { slug }
    })

    if (existingRoom) {
      return res.status(400).json({
        error: 'このスラッグは既に使用されています'
      })
    }

    const room = await prisma.course.create({
      data: {
        title,
        slug,
        description: `${title}のチャットルーム`,
        isPublished: true
      }
    })

    res.json({
      success: true,
      message: 'チャットルームが作成されました',
      room: {
        id: room.id,
        title: room.title,
        slug: room.slug,
        createdAt: room.createdAt
      }
    })
  } catch (error) {
    console.error('Create chat room error:', error)
    res.status(500).json({
      error: 'チャットルームの作成に失敗しました'
    })
  }
})

router.delete('/chat/rooms/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { prisma } = require('../index')

    // Check if room exists in Course table (course-based chat rooms)
    const courseRoom = await prisma.course.findUnique({
      where: { id }
    })

    // Check if room exists in PrivateRoom table (password-protected rooms)
    const privateRoom = await prisma.privateRoom.findUnique({
      where: { id }
    })

    if (!courseRoom && !privateRoom) {
      return res.status(404).json({
        error: 'チャットルームが見つかりません'
      })
    }

    if (privateRoom) {
      // Delete private room and its associated data
      console.log('Deleting private room:', privateRoom.name)
      
      // Delete all messages in the private room
      await prisma.chatMessage.deleteMany({
        where: { privateRoomId: id }
      })
      
      // Delete all room memberships
      await prisma.privateRoomMember.deleteMany({
        where: { roomId: id }
      })
      
      // Delete the private room
      await prisma.privateRoom.delete({
        where: { id }
      })
      
      res.json({
        success: true,
        message: `${privateRoom.name} プライベートルームが削除されました`
      })
    } else if (courseRoom) {
      // Delete course-based room and its associated data
      console.log('Deleting course room:', courseRoom.title)
      
      // Delete all messages in the room first
      await prisma.chatMessage.deleteMany({
        where: { courseId: id }
      })

      // Delete all enrollments for this course
      await prisma.enrollment.deleteMany({
        where: { courseId: id }
      })

      // Delete all lessons for this course
      const lessons = await prisma.lesson.findMany({
        where: { courseId: id }
      })

      for (const lesson of lessons) {
        // Delete progress records for each lesson
        await prisma.progress.deleteMany({
          where: { lessonId: lesson.id }
        })
        
        // Delete user lesson access records
        await prisma.userLessonAccess.deleteMany({
          where: { lessonId: lesson.id }
        })

        // Delete resources for each lesson
        await prisma.resource.deleteMany({
          where: { lessonId: lesson.id }
        })
        
        // Delete chat messages for each lesson
        await prisma.chatMessage.deleteMany({
          where: { lessonId: lesson.id }
        })
      }

      // Delete all lessons
      await prisma.lesson.deleteMany({
        where: { courseId: id }
      })

      // Finally delete the room/course
      await prisma.course.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: `${courseRoom.title} チャットルームが削除されました`
      })
    }
  } catch (error) {
    console.error('Delete chat room error:', error)
    res.status(500).json({
      error: 'チャットルームの削除に失敗しました'
    })
  }
})

// Pending Users Management  
router.get('/pending-users', async (req: express.Request, res: express.Response) => {
  try {
    const { prisma } = require('../index')
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
      success: true,
      pendingUsers
    })
  } catch (error) {
    console.error('Get pending users error:', error)
    res.status(500).json({
      error: '承認待ちユーザー情報の取得に失敗しました'
    })
  }
})

// User Approval Management
router.post('/approve-user/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params
    const { prisma } = require('../index')
    
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { approvalToken: token, status: 'PENDING' }
    })

    if (!pendingUser) {
      return res.status(404).json({
        error: '承認待ちユーザーが見つからないか、既に処理されています'
      })
    }

    // Create approved user
    const approvedUser = await prisma.user.create({
      data: {
        email: pendingUser.email,
        name: pendingUser.name,
        password: pendingUser.password,
        role: 'USER',
        isActive: true,
        emailVerified: true
      }
    })

    // Update pending user status
    await prisma.pendingUser.update({
      where: { id: pendingUser.id },
      data: { status: 'APPROVED' }
    })

    res.json({
      success: true,
      message: 'ユーザーが承認されました',
      user: { id: approvedUser.id, email: approvedUser.email, name: approvedUser.name }
    })
  } catch (error) {
    console.error('User approval error:', error)
    res.status(500).json({
      error: 'ユーザー承認処理中にエラーが発生しました'
    })
  }
})

router.post('/reject-user/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params
    const { prisma } = require('../index')
    
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { approvalToken: token, status: 'PENDING' }
    })

    if (!pendingUser) {
      return res.status(404).json({
        error: '承認待ちユーザーが見つからないか、既に処理されています'
      })
    }

    // Update pending user status
    await prisma.pendingUser.update({
      where: { id: pendingUser.id },
      data: { status: 'REJECTED' }
    })

    res.json({
      success: true,
      message: 'ユーザーが拒否されました'
    })
  } catch (error) {
    console.error('User rejection error:', error)
    res.status(500).json({
      error: 'ユーザー拒否処理中にエラーが発生しました'
    })
  }
})

// Adhoc Access Management
router.post('/adhoc-access/grant', AdminController.grantLessonAccess)
router.post('/adhoc-access/revoke', AdminController.revokeLessonAccess)
router.post('/adhoc-access/bulk-grant', AdminController.bulkGrantLessonAccess)
router.get('/adhoc-access/user/:userId', AdminController.getUserAdhocAccess)
router.get('/adhoc-access/lesson/:lessonId', AdminController.getLessonAdhocUsers)

// System Settings
router.get('/settings', AdminController.getSettings)
router.put('/settings', AdminController.updateSettings)

// POST /api/admin/change-password - 管理者パスワード変更
router.post('/change-password', async (req: express.Request, res: express.Response) => {
  try {
    const changePasswordSchema = z.object({
      currentPassword: z.string().min(1, '現在のパスワードが必要です'),
      newPassword: z.string().min(4, '新しいパスワードは4文字以上である必要があります')
    })

    const validation = changePasswordSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: '無効な入力です',
        details: validation.error.errors.map(err => err.message)
      })
    }

    const { currentPassword, newPassword } = validation.data
    
    // Get current password from file or environment
    const getCurrentAdminPassword = (): string => {
      const passwordFilePath = path.join(process.cwd(), '.admin-password')
      if (fs.existsSync(passwordFilePath)) {
        return fs.readFileSync(passwordFilePath, 'utf8').trim()
      }
      return process.env.ADMIN_ACCESS_PASSWORD || 'tiger-dojo'
    }
    
    const currentAdminPassword = getCurrentAdminPassword()

    if (currentPassword !== currentAdminPassword) {
      return res.status(401).json({
        error: '現在のパスワードが間違っています'
      })
    }

    // Save new password to file
    try {
      const passwordFilePath = path.join(process.cwd(), '.admin-password')
      fs.writeFileSync(passwordFilePath, newPassword, 'utf8')
      console.log('✅ Admin password updated successfully')
      
      res.json({
        success: true,
        message: 'パスワード変更が完了しました。すぐに新しいパスワードが有効になります。'
      })
    } catch (fileError) {
      console.error('❌ Failed to save new password:', fileError)
      res.status(500).json({
        error: 'パスワード保存中にエラーが発生しました'
      })
    }

  } catch (error) {
    console.error('Admin password change error:', error)
    res.status(500).json({
      error: 'パスワード変更処理中にエラーが発生しました'
    })
  }
})

export default router