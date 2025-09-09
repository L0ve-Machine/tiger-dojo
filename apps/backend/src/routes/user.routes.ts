import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router = express.Router()

// GET /api/user/dashboard - Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Get user's progress data
    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            duration: true
          }
        }
      }
    })

    // Calculate stats
    const completedLessons = progress.filter(p => p.completed).length
    const totalWatchTime = progress.reduce((acc, p) => acc + (p.watchedSeconds || 0), 0)
    const totalWatchHours = Math.round((totalWatchTime / 3600) * 10) / 10

    // Get unique login days from sessions
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate unique login days
    const uniqueLoginDays = new Set(
      sessions.map(s => s.createdAt.toISOString().split('T')[0])
    ).size

    // Get recent activities
    const recentActivities = []

    // Add completed lessons to activities
    const completedProgress = progress
      .filter(p => p.completed && p.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(0, 5)

    for (const p of completedProgress) {
      recentActivities.push({
        type: 'lesson_completed',
        title: `「${p.lesson.title}」を完了しました`,
        timestamp: p.completedAt,
        icon: 'play'
      })
    }

    // Add recent messages from chat
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Also check for instructor messages in courses
    const instructorMessages = await prisma.chatMessage.findMany({
      where: {
        user: {
          role: 'INSTRUCTOR'
        },
        courseId: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    for (const message of instructorMessages) {
      recentActivities.push({
        type: 'message_received',
        title: '講師からメッセージが届きました',
        timestamp: message.createdAt,
        icon: 'user'
      })
    }

    // Add enrollment date
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId },
      orderBy: {
        enrolledAt: 'asc'
      }
    })

    if (enrollment) {
      recentActivities.push({
        type: 'enrollment',
        title: 'FX Tiger Dojoに登録しました',
        timestamp: enrollment.enrolledAt,
        icon: 'calendar'
      })
    }

    // Sort activities by timestamp
    recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Get latest lessons
    const lessons = await prisma.lesson.findMany({
      include: {
        course: {
          select: {
            title: true
          }
        },
        progress: {
          where: { userId },
          select: {
            completed: true,
            watchedSeconds: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    })

    const formattedLessons = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      thumbnailUrl: lesson.thumbnailUrl,
      isLocked: lesson.isLocked,
      releaseDate: lesson.releaseDate,
      courseTitle: lesson.course.title,
      progress: lesson.progress[0] || null,
      isAvailable: !lesson.isLocked && (!lesson.releaseDate || new Date(lesson.releaseDate) <= new Date())
    }))

    res.json({
      stats: {
        completedLessons,
        totalWatchHours,
        totalLoginDays: uniqueLoginDays
      },
      recentActivities: recentActivities.slice(0, 10),
      latestLessons: formattedLessons
    })
  } catch (error) {
    console.error('Get dashboard data error:', error)
    res.status(500).json({ 
      message: 'ダッシュボードデータの取得に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

// GET /api/user/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        discordName: true,
        createdAt: true,
        isActive: true,
        emailVerified: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ 
      message: 'プロフィールの取得に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, discordName } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name && { name }),
        ...(discordName !== undefined && { discordName })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        discordName: true
      }
    })

    res.json({ 
      message: 'プロフィールを更新しました',
      user: updatedUser 
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ 
      message: 'プロフィールの更新に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

export default router