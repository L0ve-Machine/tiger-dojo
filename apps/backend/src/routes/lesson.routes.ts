import express from 'express'
import { prisma } from '../index'
import { authenticateToken } from '../middleware/auth.middleware'

// Helper function to calculate months difference between two dates
function calculateMonthsDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let months = (end.getFullYear() - start.getFullYear()) * 12
  months += end.getMonth() - start.getMonth()
  
  // If the end date's day is before the start date's day, subtract one month
  if (end.getDate() < start.getDate()) {
    months--
  }
  
  return Math.max(0, months)
}

// Helper function to add months to a date
function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

const router = express.Router()

// Check lesson access for DRM protected content
router.get('/:lessonId/access', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Get lesson with course information
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId: user.id }
            }
          }
        },
        prerequisite: true
      }
    })

    if (!lesson) {
      return res.status(404).json({ 
        hasAccess: false, 
        reason: 'レッスンが見つかりません' 
      })
    }

    // Check if user is enrolled in the course
    const enrollment = lesson.course.enrollments[0]
    if (!enrollment) {
      return res.status(403).json({ 
        hasAccess: false, 
        reason: 'このコースに登録していません' 
      })
    }

    // Check if lesson is released based on release type
    const now = new Date()
    let isReleased = false
    let reason = ''

    switch (lesson.releaseType) {
      case 'IMMEDIATE':
        isReleased = true
        break
        
      case 'SCHEDULED':
        if (lesson.releaseDate && lesson.releaseDate <= now) {
          isReleased = true
        } else {
          reason = `このレッスンは ${lesson.releaseDate?.toLocaleDateString('ja-JP')} にリリース予定です`
        }
        break
        
      case 'DRIP':
        if (lesson.releaseDays) {
          const enrollmentDate = enrollment.enrolledAt
          const releaseDate = new Date(enrollmentDate.getTime() + (lesson.releaseDays * 24 * 60 * 60 * 1000))
          if (releaseDate <= now) {
            isReleased = true
          } else {
            reason = `このレッスンは登録から${lesson.releaseDays}日後（${releaseDate.toLocaleDateString('ja-JP')}）にリリースされます`
          }
        } else {
          // 月単位での動画開放ロジック
          const enrollmentDate = enrollment.enrolledAt
          const lessonIndex = lesson.orderIndex // 0-based index
          
          // 2本ずつ月単位で開放: 0,1→0ヶ月目、2,3→1ヶ月目、4,5→2ヶ月目...
          const requiredMonths = Math.floor(lessonIndex / 2)
          
          // 登録日から必要な月数が経過しているかチェック
          const monthsSinceEnrollment = calculateMonthsDifference(enrollmentDate, now)
          
          if (monthsSinceEnrollment >= requiredMonths) {
            isReleased = true
          } else {
            const remainingMonths = requiredMonths - monthsSinceEnrollment
            const nextReleaseDate = addMonthsToDate(enrollmentDate, requiredMonths)
            reason = `このレッスンは登録から${requiredMonths}ヶ月後（${nextReleaseDate.toLocaleDateString('ja-JP')}）にリリースされます（あと${remainingMonths}ヶ月）`
          }
        }
        break
        
      case 'PREREQUISITE':
        if (lesson.prerequisiteId) {
          // Check if prerequisite lesson is completed
          const prerequisiteProgress = await prisma.progress.findUnique({
            where: {
              userId_lessonId: {
                userId: user.id,
                lessonId: lesson.prerequisiteId
              }
            }
          })
          
          if (prerequisiteProgress?.completed) {
            isReleased = true
          } else {
            const prerequisiteLesson = lesson.prerequisite
            reason = `前提レッスン「${prerequisiteLesson?.title}」を完了してください`
          }
        } else {
          isReleased = true
        }
        break
        
      default:
        isReleased = true
    }

    // Admin users always have access
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
      isReleased = true
      reason = ''
    }

    res.json({
      hasAccess: isReleased,
      reason: isReleased ? null : reason,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        releaseType: lesson.releaseType,
        releaseDate: lesson.releaseDate,
        releaseDays: lesson.releaseDays
      }
    })

  } catch (error: any) {
    console.error('Lesson access check error:', error)
    res.status(500).json({ 
      hasAccess: false, 
      reason: 'アクセス権限の確認中にエラーが発生しました' 
    })
  }
})

// Track lesson progress with session verification
router.post('/:lessonId/progress', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params
    const { watchedSeconds, duration, completed, timestamp } = req.body
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Verify lesson exists and user has access
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId: user.id }
            }
          }
        }
      }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'レッスンが見つかりません' })
    }

    if (lesson.course.enrollments.length === 0) {
      return res.status(403).json({ error: 'このコースに登録していません' })
    }

    // Update or create progress record
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        watchedSeconds: Math.max(watchedSeconds, 0),
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        lastWatchedAt: new Date()
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        watchedSeconds: Math.max(watchedSeconds, 0),
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        lastWatchedAt: new Date()
      }
    })

    res.json({
      success: true,
      progress: {
        watchedSeconds: progress.watchedSeconds,
        completed: progress.completed,
        completedAt: progress.completedAt,
        lastWatchedAt: progress.lastWatchedAt
      }
    })

  } catch (error: any) {
    console.error('Progress tracking error:', error)
    res.status(500).json({ error: '進捗の保存に失敗しました' })
  }
})

// Mark lesson as completed
router.post('/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params
    const { completedAt } = req.body
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Verify lesson exists and user has access
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId: user.id }
            }
          }
        }
      }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'レッスンが見つかりません' })
    }

    if (lesson.course.enrollments.length === 0) {
      return res.status(403).json({ error: 'このコースに登録していません' })
    }

    // Mark as completed
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        completed: true,
        completedAt: completedAt ? new Date(completedAt) : new Date()
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        watchedSeconds: lesson.duration || 0,
        completed: true,
        completedAt: completedAt ? new Date(completedAt) : new Date()
      }
    })

    res.json({
      success: true,
      message: 'レッスンを完了しました',
      progress: {
        completed: progress.completed,
        completedAt: progress.completedAt
      }
    })

  } catch (error: any) {
    console.error('Lesson completion error:', error)
    res.status(500).json({ error: 'レッスン完了の保存に失敗しました' })
  }
})

// Get lesson progress
router.get('/:lessonId/progress', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const progress = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      }
    })

    res.json({
      success: true,
      progress: progress || {
        watchedSeconds: 0,
        completed: false,
        completedAt: null,
        lastWatchedAt: null
      }
    })

  } catch (error: any) {
    console.error('Get progress error:', error)
    res.status(500).json({ error: '進捗の取得に失敗しました' })
  }
})

export default router