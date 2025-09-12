import { Response } from 'express'
import { AuthenticatedRequest } from '../types/auth.types'
import { prisma } from '../index'

export class AdminController {
  // Dashboard Analytics
  static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const [
        totalUsers,
        totalCourses,
        totalLessons,
        activeUsers,
        courseCompletions,
        recentRegistrations
      ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.lesson.count(),
        prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
        prisma.progress.count({ where: { completed: true } }),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
      ])

      const recentMessages = await prisma.chatMessage.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          lesson: { select: { title: true } }
        }
      })

      res.json({
        dashboard: {
          totalUsers,
          totalCourses,
          totalLessons,
          activeUsers,
          courseCompletions,
          recentRegistrations,
          recentMessages
        }
      })
    } catch (error) {
      console.error('Dashboard error:', error)
      res.status(500).json({ error: 'Failed to load dashboard data' })
    }
  }

  static async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const { period = '30d' } = req.query
      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      const [
        userGrowth,
        completionRates,
        popularLessons,
        chatActivity
      ] = await Promise.all([
        prisma.user.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        prisma.progress.groupBy({
          by: ['lessonId'],
          where: { lastWatchedAt: { gte: startDate } },
          _count: { completed: true },
          _avg: { watchedSeconds: true }
        }),
        prisma.progress.groupBy({
          by: ['lessonId'],
          where: { lastWatchedAt: { gte: startDate } },
          _count: true,
          orderBy: { _count: { lessonId: 'desc' } },
          take: 10
        }),
        prisma.chatMessage.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: true
        })
      ])

      res.json({
        analytics: {
          userGrowth,
          completionRates,
          popularLessons,
          chatActivity
        }
      })
    } catch (error) {
      console.error('Analytics error:', error)
      res.status(500).json({ error: 'Failed to load analytics data' })
    }
  }

  // User Management
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 20, search, role } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { email: { contains: search as string } }
        ]
      }
      if (role) {
        where.role = role
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            _count: {
              select: {
                enrollments: true,
                progress: true,
                messages: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ])

      res.json({
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get users error:', error)
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: { course: true }
          },
          progress: {
            include: { lesson: true }
          },
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({ user })
    } catch (error) {
      console.error('Get user error:', error)
      res.status(500).json({ error: 'Failed to fetch user' })
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { name, email, role, isActive } = req.body

      const user = await prisma.user.update({
        where: { id },
        data: { name, email, role, isActive },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      })

      res.json({ user })
    } catch (error) {
      console.error('Update user error:', error)
      res.status(500).json({ error: 'Failed to update user' })
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params

      // First, check if user exists
      const userToDelete = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: true,
              progress: true,
              messages: true,
              sessions: true,
              payments: true,
              subscriptions: true,
              lessonAccess: true,
              grantedAccess: true
            }
          }
        }
      })

      if (!userToDelete) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' })
      }

      // Check if this is the only admin user
      if (userToDelete.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' }
        })
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            error: '最後の管理者アカウントは削除できません' 
          })
        }
      }

      console.log(`🗑️ Deleting user ${userToDelete.email} with related data:`, userToDelete._count)

      // Delete related data in proper order to avoid foreign key constraints
      await prisma.$transaction(async (tx) => {
        // Delete user's granted access records (if table exists)
        try {
          console.log('Deleting granted access records...')
          await tx.userLessonAccess.deleteMany({
            where: { grantedBy: id }
          })
        } catch (error) {
          console.log('UserLessonAccess table might not exist, skipping...')
        }

        // Delete lesson access records for this user (if table exists)
        try {
          console.log('Deleting user lesson access records...')
          await tx.userLessonAccess.deleteMany({
            where: { userId: id }
          })
        } catch (error) {
          console.log('UserLessonAccess table might not exist, skipping...')
        }

        // Delete progress records
        await tx.progress.deleteMany({
          where: { userId: id }
        })

        // Delete chat messages
        await tx.chatMessage.deleteMany({
          where: { userId: id }
        })

        // Delete sessions
        await tx.session.deleteMany({
          where: { userId: id }
        })

        // Delete payments
        await tx.payment.deleteMany({
          where: { userId: id }
        })

        // Delete subscriptions
        await tx.subscription.deleteMany({
          where: { userId: id }
        })

        // Delete enrollments
        await tx.enrollment.deleteMany({
          where: { userId: id }
        })

        // Delete invite links created by this user
        await tx.inviteLink.deleteMany({
          where: { createdBy: id }
        })

        // Delete user registrations
        await tx.registration.deleteMany({
          where: { userId: id }
        })

        // Finally, delete the user
        await tx.user.delete({
          where: { id }
        })
      })

      console.log(`✅ Successfully deleted user ${userToDelete.email}`)
      res.json({ 
        message: 'ユーザーとすべての関連データが削除されました',
        deletedUser: {
          id: userToDelete.id,
          email: userToDelete.email,
          name: userToDelete.name
        }
      })
    } catch (error: any) {
      console.error('Delete user error:', error)
      
      if (error.code === 'P2003') {
        res.status(400).json({ 
          error: '関連データが存在するため削除できません。管理者にお問い合わせください。' 
        })
      } else if (error.code === 'P2025') {
        res.status(404).json({ error: 'ユーザーが見つかりません' })
      } else {
        res.status(500).json({ 
          error: 'ユーザーの削除に失敗しました: ' + (error.message || '不明なエラー')
        })
      }
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { role } = req.body

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true }
      })

      res.json({ user })
    } catch (error) {
      console.error('Update user role error:', error)
      res.status(500).json({ error: 'Failed to update user role' })
    }
  }

  static async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { isActive } = req.body

      const user = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: { id: true, name: true, email: true, isActive: true }
      })

      res.json({ user })
    } catch (error) {
      console.error('Update user status error:', error)
      res.status(500).json({ error: 'Failed to update user status' })
    }
  }

  // Course Management
  static async getCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true
            }
          }
        }
      })

      res.json({ courses })
    } catch (error) {
      console.error('Get courses error:', error)
      res.status(500).json({ error: 'Failed to fetch courses' })
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, description, slug, thumbnail, price } = req.body

      const course = await prisma.course.create({
        data: {
          title,
          description,
          slug,
          thumbnail,
          price: price ? Number(price) : null
        }
      })

      res.status(201).json({ course })
    } catch (error) {
      console.error('Create course error:', error)
      res.status(500).json({ error: 'Failed to create course' })
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { title, description, slug, thumbnail, price } = req.body

      const course = await prisma.course.update({
        where: { id },
        data: {
          title,
          description,
          slug,
          thumbnail,
          price: price ? Number(price) : null
        }
      })

      res.json({ course })
    } catch (error) {
      console.error('Update course error:', error)
      res.status(500).json({ error: 'Failed to update course' })
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params

      await prisma.course.delete({
        where: { id }
      })

      res.json({ message: 'Course deleted successfully' })
    } catch (error) {
      console.error('Delete course error:', error)
      res.status(500).json({ error: 'Failed to delete course' })
    }
  }

  static async publishCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { isPublished } = req.body

      const course = await prisma.course.update({
        where: { id },
        data: { isPublished }
      })

      res.json({ course })
    } catch (error) {
      console.error('Publish course error:', error)
      res.status(500).json({ error: 'Failed to publish course' })
    }
  }

  // Lesson Management
  static async getLessons(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId } = req.query

      const where = courseId ? { courseId: courseId as string } : {}

      const lessons = await prisma.lesson.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
        include: {
          course: { select: { title: true } },
          _count: {
            select: {
              progress: true,
              resources: true
            }
          }
        }
      })

      res.json({ lessons })
    } catch (error) {
      console.error('Get lessons error:', error)
      res.status(500).json({ error: 'Failed to fetch lessons' })
    }
  }

  static async createLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        courseId,
        title,
        description,
        videoUrl,
        duration,
        orderIndex,
        releaseType,
        releaseDays,
        releaseDate,
        prerequisiteId
      } = req.body

      const lesson = await prisma.lesson.create({
        data: {
          courseId,
          title,
          description,
          videoUrl,
          duration: duration ? Number(duration) : null,
          orderIndex: Number(orderIndex),
          releaseType,
          releaseDays: releaseDays ? Number(releaseDays) : null,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          prerequisiteId
        }
      })

      res.status(201).json({ lesson })
    } catch (error) {
      console.error('Create lesson error:', error)
      res.status(500).json({ error: 'Failed to create lesson' })
    }
  }

  static async updateLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const updateData = { ...req.body }

      console.log('Updating lesson with ID:', id)
      console.log('Update data received:', updateData)

      // courseIdは更新できないので除去
      delete updateData.courseId
      
      // 無効なフィールドを除去（Prismaスキーマに存在しないフィールド）
      delete updateData.vimeoEmbedCode
      
      // 有効なLessonフィールドのみを許可
      const validFields = [
        'title', 'description', 'videoUrl', 'thumbnail', 'duration', 'orderIndex',
        'releaseType', 'releaseDays', 'releaseDate', 'prerequisiteId'
      ]
      
      // updateDataから有効なフィールドのみを抽出
      const filteredUpdateData: any = {}
      for (const field of validFields) {
        if (updateData.hasOwnProperty(field)) {
          filteredUpdateData[field] = updateData[field]
        }
      }

      // 型変換とバリデーション
      if (filteredUpdateData.duration) filteredUpdateData.duration = Number(filteredUpdateData.duration)
      if (filteredUpdateData.orderIndex) filteredUpdateData.orderIndex = Number(filteredUpdateData.orderIndex)
      if (filteredUpdateData.releaseDays !== null && filteredUpdateData.releaseDays !== undefined) {
        filteredUpdateData.releaseDays = filteredUpdateData.releaseDays === null ? null : Number(filteredUpdateData.releaseDays)
      }
      if (filteredUpdateData.releaseDate !== null && filteredUpdateData.releaseDate !== undefined) {
        filteredUpdateData.releaseDate = filteredUpdateData.releaseDate === null ? null : new Date(filteredUpdateData.releaseDate)
      }

      console.log('Filtered update data:', filteredUpdateData)

      const lesson = await prisma.lesson.update({
        where: { id },
        data: filteredUpdateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          _count: {
            select: {
              progress: true,
              resources: true
            }
          }
        }
      })

      console.log('Lesson updated successfully:', lesson.id)
      res.json({ lesson })
    } catch (error) {
      console.error('Update lesson error:', error)
      res.status(500).json({ 
        error: 'Failed to update lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  static async deleteLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params

      await prisma.lesson.delete({
        where: { id }
      })

      res.json({ message: 'Lesson deleted successfully' })
    } catch (error) {
      console.error('Delete lesson error:', error)
      res.status(500).json({ error: 'Failed to delete lesson' })
    }
  }

  // Video Upload (Placeholder for Vimeo integration)
  static async uploadVideo(req: AuthenticatedRequest, res: Response) {
    try {
      // Vimeo upload logic will be implemented later
      res.status(501).json({ 
        error: 'Video upload not implemented yet',
        message: 'Vimeo API integration coming soon'
      })
    } catch (error) {
      console.error('Upload video error:', error)
      res.status(500).json({ error: 'Failed to upload video' })
    }
  }

  static async getUploadStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      // Upload status check logic
      res.json({ 
        status: 'not_implemented',
        message: 'Upload status check not implemented yet'
      })
    } catch (error) {
      console.error('Get upload status error:', error)
      res.status(500).json({ error: 'Failed to get upload status' })
    }
  }

  // Chat Management
  static async getChatMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 50, lessonId } = req.query

      const where = lessonId ? { lessonId: lessonId as string } : {}

      const messages = await prisma.chatMessage.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } },
          lesson: { select: { title: true } }
        }
      })

      res.json({ messages })
    } catch (error) {
      console.error('Get chat messages error:', error)
      res.status(500).json({ error: 'Failed to fetch chat messages' })
    }
  }

  static async deleteChatMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params

      await prisma.chatMessage.delete({
        where: { id }
      })

      res.json({ message: 'Chat message deleted successfully' })
    } catch (error) {
      console.error('Delete chat message error:', error)
      res.status(500).json({ error: 'Failed to delete chat message' })
    }
  }

  static async moderateMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      const { content } = req.body

      const message = await prisma.chatMessage.update({
        where: { id },
        data: { 
          content,
          isEdited: true,
          editedAt: new Date()
        }
      })

      res.json({ message })
    } catch (error) {
      console.error('Moderate message error:', error)
      res.status(500).json({ error: 'Failed to moderate message' })
    }
  }

  // Adhoc Access Management
  static async grantLessonAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, lessonId, reason, startDate, endDate } = req.body
      
      if (!userId || !lessonId) {
        return res.status(400).json({ error: 'User ID and Lesson ID are required' })
      }

      // Import CourseService
      const { CourseService } = await import('../services/course.service')
      
      const access = await CourseService.grantUserLessonAccess({
        userId,
        lessonId,
        grantedBy: req.user!.id,
        reason,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      })

      res.json({ 
        message: 'Lesson access granted successfully',
        access 
      })
    } catch (error) {
      console.error('Grant lesson access error:', error)
      res.status(500).json({ error: 'Failed to grant lesson access' })
    }
  }

  static async revokeLessonAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, lessonId } = req.body
      
      if (!userId || !lessonId) {
        return res.status(400).json({ error: 'User ID and Lesson ID are required' })
      }

      // Import CourseService
      const { CourseService } = await import('../services/course.service')
      
      await CourseService.revokeUserLessonAccess(userId, lessonId)

      res.json({ message: 'Lesson access revoked successfully' })
    } catch (error) {
      console.error('Revoke lesson access error:', error)
      res.status(500).json({ error: 'Failed to revoke lesson access' })
    }
  }

  static async getUserAdhocAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      // Import CourseService
      const { CourseService } = await import('../services/course.service')
      
      const accesses = await CourseService.getUserAdhocAccess(userId)

      res.json({ accesses })
    } catch (error) {
      console.error('Get user adhoc access error:', error)
      res.status(500).json({ error: 'Failed to get user adhoc access' })
    }
  }

  static async getLessonAdhocUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { lessonId } = req.params
      
      if (!lessonId) {
        return res.status(400).json({ error: 'Lesson ID is required' })
      }

      // Import CourseService
      const { CourseService } = await import('../services/course.service')
      
      const users = await CourseService.getLessonAdhocUsers(lessonId)

      res.json({ users })
    } catch (error) {
      console.error('Get lesson adhoc users error:', error)
      res.status(500).json({ error: 'Failed to get lesson adhoc users' })
    }
  }

  static async bulkGrantLessonAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { userIds, lessonId, reason, startDate, endDate } = req.body
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !lessonId) {
        return res.status(400).json({ error: 'User IDs array and Lesson ID are required' })
      }

      // Import CourseService
      const { CourseService } = await import('../services/course.service')
      
      const results = await Promise.allSettled(
        userIds.map(userId =>
          CourseService.grantUserLessonAccess({
            userId,
            lessonId,
            grantedBy: req.user!.id,
            reason,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      res.json({ 
        message: `Bulk grant completed. Success: ${successful}, Failed: ${failed}`,
        successful,
        failed,
        details: results
      })
    } catch (error) {
      console.error('Bulk grant lesson access error:', error)
      res.status(500).json({ error: 'Failed to bulk grant lesson access' })
    }
  }

  // System Settings (Placeholder)
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      // In a real app, these would come from a settings table
      const settings = {
        siteName: 'FX Tiger Dojo',
        allowRegistration: true,
        requireEmailVerification: false,
        maxFileUploadSize: 10485760, // 10MB
        vimeoIntegrationEnabled: false
      }

      res.json({ settings })
    } catch (error) {
      console.error('Get settings error:', error)
      res.status(500).json({ error: 'Failed to fetch settings' })
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      // Settings update logic would go here
      res.json({ 
        message: 'Settings update not implemented yet',
        settings: req.body
      })
    } catch (error) {
      console.error('Update settings error:', error)
      res.status(500).json({ error: 'Failed to update settings' })
    }
  }
}