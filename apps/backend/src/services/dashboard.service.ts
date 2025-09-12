import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class DashboardService {
  static async getUserStatistics(userId: string) {
    try {
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          sessions: {
            orderBy: { createdAt: 'desc' }
          },
          progress: {
            include: {
              lesson: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 視聴済みレッスン数を計算
      const completedLessons = user.progress.filter(
        progress => progress.completed
      ).length

      // 総視聴時間を計算（秒から時間に変換）
      const totalWatchedSeconds = user.progress.reduce(
        (total, progress) => total + (progress.watchedSeconds || 0),
        0
      )
      const totalWatchedHours = Math.round(totalWatchedSeconds / 60 * 10) / 10 // 分単位に変更、小数点1位まで

      // ログイン日数を計算（ユニークな日付をカウント）
      const loginDates = new Set<string>()
      
      // 現在のログイン
      if (user.lastLoginAt) {
        loginDates.add(user.lastLoginAt.toISOString().split('T')[0])
      }
      
      // セッション履歴から日付を取得
      user.sessions.forEach(session => {
        const date = session.createdAt.toISOString().split('T')[0]
        loginDates.add(date)
      })

      // 初回登録日も含める
      if (user.createdAt) {
        loginDates.add(user.createdAt.toISOString().split('T')[0])
      }

      const totalLoginDays = loginDates.size

      // 最近の進捗を取得
      const recentProgress = await prisma.progress.findMany({
        where: { userId },
        orderBy: { lastWatchedAt: 'desc' },
        take: 5,
        include: {
          lesson: {
            include: {
              course: true
            }
          }
        }
      })

      // コース別の進捗を取得
      const courseProgress = await prisma.course.findMany({
        include: {
          lessons: {
            include: {
              progress: {
                where: { userId }
              }
            }
          }
        }
      })

      const courseStats = courseProgress.map(course => {
        const totalLessons = course.lessons.length
        const completedLessons = course.lessons.filter(
          lesson => lesson.progress.some(p => p.completed)
        ).length
        const progressPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0

        return {
          courseId: course.id,
          courseName: course.title,
          totalLessons,
          completedLessons,
          progressPercentage
        }
      })

      // 今週の学習時間を計算
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const weeklyProgress = await prisma.progress.findMany({
        where: {
          userId,
          lastWatchedAt: {
            gte: oneWeekAgo
          }
        }
      })

      const weeklyWatchedSeconds = weeklyProgress.reduce(
        (total, progress) => total + (progress.watchedSeconds || 0),
        0
      )
      const weeklyWatchedHours = Math.round(weeklyWatchedSeconds / 60 * 10) / 10 // 分単位に変更

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        statistics: {
          completedLessons,
          totalWatchedHours,
          totalLoginDays,
          weeklyWatchedHours
        },
        courseProgress: courseStats,
        recentActivity: recentProgress.map(progress => ({
          lessonId: progress.lessonId,
          lessonTitle: progress.lesson.title,
          courseName: progress.lesson.course?.title,
          watchedSeconds: progress.watchedSeconds,
          completed: progress.completed,
          updatedAt: progress.lastWatchedAt
        }))
      }

    } catch (error) {
      console.error('Error fetching user statistics:', error)
      throw error
    }
  }

  static async getLeaderboard() {
    try {
      // 総視聴時間でランキングを作成
      const users = await prisma.user.findMany({
        where: {
          role: 'USER' // 管理者を除外
        },
        include: {
          progress: true
        }
      })

      const leaderboard = users.map(user => {
        const totalWatchedSeconds = user.progress.reduce(
          (total, progress) => total + (progress.watchedSeconds || 0),
          0
        )
        const totalWatchedHours = Math.round(totalWatchedSeconds / 60 * 10) / 10 // 分単位に変更
        const completedLessons = user.progress.filter(p => p.completed).length

        return {
          userId: user.id,
          name: user.name,
          totalWatchedHours,
          completedLessons
        }
      })

      // 視聴時間でソート
      leaderboard.sort((a, b) => b.totalWatchedHours - a.totalWatchedHours)

      return leaderboard.slice(0, 10) // トップ10を返す

    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }
  }
}