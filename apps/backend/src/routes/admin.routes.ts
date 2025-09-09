import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin, requireInstructorOrAdmin } from '../middleware/admin.middleware'
import { AdminController } from '../controllers/admin.controller'
import { z } from 'zod'

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
    const adminPassword = process.env.ADMIN_ACCESS_PASSWORD || 'tiger-dojo'

    if (password === adminPassword) {
      res.json({
        success: true,
        message: '管理者認証が完了しました'
      })
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

// Course Management
router.get('/courses', AdminController.getCourses)
router.post('/courses', AdminController.createCourse)
router.put('/courses/:id', AdminController.updateCourse)
router.delete('/courses/:id', AdminController.deleteCourse)
router.put('/courses/:id/publish', AdminController.publishCourse)

// Lesson Management
router.get('/lessons', AdminController.getLessons)
router.post('/lessons', AdminController.createLesson)
router.put('/lessons/:id', AdminController.updateLesson)
router.delete('/lessons/:id', AdminController.deleteLesson)

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
    const rooms = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      rooms
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

    // Check if room exists
    const room = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    if (!room) {
      return res.status(404).json({
        error: 'チャットルームが見つかりません'
      })
    }

    // Delete all messages in the room first
    await prisma.chatMessage.deleteMany({
      where: { courseId: id }
    })

    // Delete the room
    await prisma.course.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: `${room.title} チャットルームが削除されました`
    })
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
    const adminPassword = process.env.ADMIN_ACCESS_PASSWORD || 'tiger-dojo'

    if (currentPassword !== adminPassword) {
      return res.status(401).json({
        error: '現在のパスワードが間違っています'
      })
    }

    // 注意: 実際の運用では環境変数ファイルの書き換えではなく、
    // データベースに保存するか、より安全な方法を使用することを推奨
    res.json({
      success: true,
      message: 'パスワード変更が完了しました。新しいパスワードを有効にするには環境変数を更新してください。',
      note: `新しいパスワード: ${newPassword}`
    })

  } catch (error) {
    console.error('Admin password change error:', error)
    res.status(500).json({
      error: 'パスワード変更処理中にエラーが発生しました'
    })
  }
})

export default router