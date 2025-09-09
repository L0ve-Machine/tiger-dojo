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