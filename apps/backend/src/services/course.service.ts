import { PrismaClient } from '@prisma/client'
import { prisma } from '../index'

export interface CourseData {
  title: string
  description: string
  thumbnail?: string
  slug: string
  isPublished?: boolean
  price?: number
}

export interface LessonData {
  courseId: string
  title: string
  description?: string
  videoUrl: string
  thumbnail?: string
  duration?: number
  orderIndex: number
  releaseType?: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE' | 'HIDDEN'
  releaseDays?: number
  releaseDate?: Date
  prerequisiteId?: string
}

export interface UpdateProgressData {
  lessonId: string
  watchedSeconds: number
  completed?: boolean
}

export class CourseService {
  // Helper method to calculate months difference between two dates
  private static calculateMonthsDifference(startDate: Date, endDate: Date): number {
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

  // Helper method to add months to a date
  private static addMonthsToDate(date: Date, months: number): Date {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
  }

  // Helper method to get Vimeo thumbnail
  private static async getVimeoThumbnail(videoId: string): Promise<string | null> {
    try {
      // Vimeo oEmbed APIを使用してサムネイルを取得
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`)
      
      if (!response.ok) {
        throw new Error(`Vimeo API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.thumbnail_url || null
    } catch (error) {
      console.error('Failed to fetch Vimeo thumbnail:', error)
      return null
    }
  }
  // コース関連
  static async getAllCourses(userId?: string) {
    try {
      const courses = await prisma.course.findMany({
        where: { isPublished: true },
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              title: true,
              thumbnail: true,
              duration: true,
              orderIndex: true,
              releaseType: true,
              releaseDays: true,
              releaseDate: true,
              prerequisiteId: true
            }
          },
          enrollments: userId ? {
            where: { userId }
          } : false,
          _count: {
            select: { lessons: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Process lessons to check access for each course
      const processedCourses = await Promise.all(
        courses.map(async course => {
          const enrollment = course.enrollments?.[0]
          const lessonsWithAccess = await Promise.all(
            course.lessons.map(async lesson => {
              if (userId) {
                const accessCheck = await this.checkLessonAccess(userId, lesson.id)
                return {
                  ...lesson,
                  hasAccess: accessCheck.hasAccess,
                  accessReason: accessCheck.reason,
                  availableIn: accessCheck.availableIn
                }
              }
              return {
                ...lesson,
                hasAccess: false,
                accessReason: 'NOT_AUTHENTICATED'
              }
            })
          )

          return {
            ...course,
            isEnrolled: !!enrollment,
            lessonCount: course._count.lessons,
            lessons: lessonsWithAccess,
            enrollments: undefined,
            _count: undefined
          }
        })
      )

      return processedCourses
    } catch (error) {
      console.error('Get courses error:', error)
      throw error
    }
  }

  static async getCourseBySlug(slug: string, userId?: string) {
    try {
      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
            include: {
              progress: userId ? {
                where: { userId }
              } : false,
              resources: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  fileUrl: true,
                  fileType: true,
                  fileSize: true
                }
              }
            }
          },
          enrollments: userId ? {
            where: { userId }
          } : false
        }
      })

      if (!course) {
        throw new Error('Course not found')
      }

      const enrollment = course.enrollments?.[0]
      const lessonsWithAccess = await Promise.all(
        course.lessons.map(async (lesson) => {
          const hasAccess = await this.checkLessonAccess(userId || '', lesson.id)
          return {
            ...lesson,
            hasAccess: hasAccess.hasAccess,
            accessReason: hasAccess.reason,
            availableIn: hasAccess.availableIn,
            progress: lesson.progress?.[0] || null
          }
        })
      )

      return {
        ...course,
        isEnrolled: !!enrollment,
        enrolledAt: enrollment?.enrolledAt,
        lessons: lessonsWithAccess,
        enrollments: undefined
      }
    } catch (error) {
      console.error('Get course by slug error:', error)
      throw error
    }
  }

  static async createCourse(data: CourseData) {
    try {
      // Check if slug is unique
      const existingCourse = await prisma.course.findUnique({
        where: { slug: data.slug }
      })

      if (existingCourse) {
        throw new Error('このスラグは既に使用されています')
      }

      const course = await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          slug: data.slug,
          isPublished: data.isPublished ?? false,
          price: data.price
        }
      })

      return course
    } catch (error) {
      console.error('Create course error:', error)
      throw error
    }
  }

  static async updateCourse(id: string, data: Partial<CourseData>) {
    try {
      const course = await prisma.course.update({
        where: { id },
        data
      })

      return course
    } catch (error) {
      console.error('Update course error:', error)
      throw error
    }
  }

  static async deleteCourse(id: string) {
    try {
      // Check if course has enrollments
      const enrollmentCount = await prisma.enrollment.count({
        where: { courseId: id }
      })

      if (enrollmentCount > 0) {
        throw new Error('受講者がいるコースは削除できません')
      }

      await prisma.course.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Delete course error:', error)
      throw error
    }
  }

  // レッスン関連
  static async getLessonById(id: string, userId?: string) {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          resources: true,
          progress: userId ? {
            where: { userId }
          } : false
        }
      })

      if (!lesson) {
        throw new Error('Lesson not found')
      }

      // Check access
      const accessCheck = await this.checkLessonAccess(userId || '', id)

      return {
        ...lesson,
        hasAccess: accessCheck.hasAccess,
        accessReason: accessCheck.reason,
        availableIn: accessCheck.availableIn,
        progress: lesson.progress?.[0] || null
      }
    } catch (error) {
      console.error('Get lesson error:', error)
      throw error
    }
  }

  static async createLesson(data: LessonData) {
    try {
      // Vimeoサムネイルを自動取得
      let thumbnail = data.thumbnail
      if (!thumbnail && data.videoUrl) {
        try {
          thumbnail = await this.getVimeoThumbnail(data.videoUrl)
        } catch (error) {
          console.warn('Failed to fetch Vimeo thumbnail:', error)
        }
      }

      const lesson = await prisma.lesson.create({
        data: {
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          thumbnail,
          duration: data.duration,
          orderIndex: data.orderIndex,
          releaseType: data.releaseType || 'IMMEDIATE',
          releaseDays: data.releaseDays,
          releaseDate: data.releaseDate,
          prerequisiteId: data.prerequisiteId
        }
      })

      return lesson
    } catch (error) {
      console.error('Create lesson error:', error)
      throw error
    }
  }

  static async updateLesson(id: string, data: Partial<LessonData>) {
    try {
      const lesson = await prisma.lesson.update({
        where: { id },
        data
      })

      return lesson
    } catch (error) {
      console.error('Update lesson error:', error)
      throw error
    }
  }

  static async deleteLesson(id: string) {
    try {
      await prisma.lesson.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Delete lesson error:', error)
      throw error
    }
  }

  // 受講・進捗管理
  static async enrollCourse(userId: string, courseId: string) {
    try {
      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      })

      if (existingEnrollment) {
        throw new Error('既に受講登録済みです')
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId
        }
      })

      return enrollment
    } catch (error) {
      console.error('Enroll course error:', error)
      throw error
    }
  }

  static async updateProgress(userId: string, data: UpdateProgressData) {
    try {
      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: data.lessonId
          }
        },
        update: {
          watchedSeconds: data.watchedSeconds,
          completed: data.completed,
          completedAt: data.completed ? new Date() : null,
          lastWatchedAt: new Date()
        },
        create: {
          userId,
          lessonId: data.lessonId,
          watchedSeconds: data.watchedSeconds,
          completed: data.completed || false,
          completedAt: data.completed ? new Date() : null
        }
      })

      return progress
    } catch (error) {
      console.error('Update progress error:', error)
      throw error
    }
  }

  static async getUserProgress(userId: string, courseId?: string) {
    try {
      const where = courseId ? {
        userId,
        lesson: { courseId }
      } : { userId }

      const progress = await prisma.progress.findMany({
        where,
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          lastWatchedAt: 'desc'
        }
      })

      return progress
    } catch (error) {
      console.error('Get user progress error:', error)
      throw error
    }
  }

  // アクセス制御
  static async checkLessonAccess(userId: string, lessonId: string): Promise<{
    hasAccess: boolean
    reason?: string
    availableIn?: number
    requiresCompletion?: string
  }> {
    try {
      if (!userId) {
        return { hasAccess: false, reason: 'NOT_AUTHENTICATED' }
      }

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      })

      if (!lesson) {
        return { hasAccess: false, reason: 'LESSON_NOT_FOUND' }
      }

      // Check for adhoc access first (アドホック配信の確認を最優先)
      const adhocAccess = await prisma.userLessonAccess.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      })

      if (adhocAccess && adhocAccess.isActive) {
        // Check if access is still valid
        const now = new Date()
        if (adhocAccess.endDate && adhocAccess.endDate < now) {
          // Access has expired, deactivate it
          await prisma.userLessonAccess.update({
            where: { id: adhocAccess.id },
            data: { isActive: false }
          })
        } else if (now >= adhocAccess.startDate) {
          // Valid adhoc access
          return { hasAccess: true, reason: 'ADHOC_ACCESS' }
        }
      }

      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.courseId
          }
        }
      })

      if (!enrollment) {
        return { hasAccess: false, reason: 'NOT_ENROLLED' }
      }

      // Check release conditions
      switch (lesson.releaseType) {
        case 'IMMEDIATE':
          return { hasAccess: true }

        case 'SCHEDULED':
          if (lesson.releaseDate && lesson.releaseDate > new Date()) {
            return {
              hasAccess: false,
              reason: 'NOT_YET_SCHEDULED',
              availableIn: Math.ceil((lesson.releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            }
          }
          return { hasAccess: true }

        case 'DRIP':
          if (lesson.releaseDays) {
            const daysSinceEnrollment = Math.floor(
              (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
            )
            
            if (daysSinceEnrollment < lesson.releaseDays) {
              return {
                hasAccess: false,
                reason: 'NOT_YET_AVAILABLE',
                availableIn: lesson.releaseDays - daysSinceEnrollment
              }
            }
          } else {
            // 月単位での動画開放ロジック（orderIndexベース）
            const enrollmentDate = enrollment.enrolledAt
            const now = new Date()
            
            // 2本ずつ月単位で開放: orderIndex 0,1→0ヶ月目、2,3→1ヶ月目、4,5→2ヶ月目...
            const requiredMonths = Math.floor(lesson.orderIndex / 2)
            
            // 登録日から必要な月数が経過しているかチェック
            const monthsSinceEnrollment = this.calculateMonthsDifference(enrollmentDate, now)
            
            if (monthsSinceEnrollment < requiredMonths) {
              const remainingMonths = requiredMonths - monthsSinceEnrollment
              const nextReleaseDate = this.addMonthsToDate(enrollmentDate, requiredMonths)
              const daysUntilRelease = Math.ceil((nextReleaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              
              return {
                hasAccess: false,
                reason: 'NOT_YET_AVAILABLE',
                availableIn: daysUntilRelease
              }
            }
          }
          return { hasAccess: true }

        case 'PREREQUISITE':
          if (lesson.prerequisiteId) {
            const prerequisiteProgress = await prisma.progress.findUnique({
              where: {
                userId_lessonId: {
                  userId,
                  lessonId: lesson.prerequisiteId
                }
              }
            })

            if (!prerequisiteProgress || !prerequisiteProgress.completed) {
              return {
                hasAccess: false,
                reason: 'PREREQUISITE_NOT_COMPLETED',
                requiresCompletion: lesson.prerequisiteId
              }
            }
          }
          return { hasAccess: true }

        default:
          return { hasAccess: true }
      }
    } catch (error) {
      console.error('Check lesson access error:', error)
      return { hasAccess: false, reason: 'ACCESS_CHECK_ERROR' }
    }
  }

  // アドホック配信管理
  static async grantUserLessonAccess(data: {
    userId: string
    lessonId: string
    grantedBy: string
    reason?: string
    startDate?: Date
    endDate?: Date
  }) {
    try {
      // Check if access already exists
      const existingAccess = await prisma.userLessonAccess.findUnique({
        where: {
          userId_lessonId: {
            userId: data.userId,
            lessonId: data.lessonId
          }
        }
      })

      if (existingAccess) {
        // Update existing access
        return await prisma.userLessonAccess.update({
          where: { id: existingAccess.id },
          data: {
            grantedBy: data.grantedBy,
            reason: data.reason,
            startDate: data.startDate || new Date(),
            endDate: data.endDate,
            isActive: true
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            lesson: {
              select: { id: true, title: true, course: { select: { title: true } } }
            },
            granter: {
              select: { id: true, name: true }
            }
          }
        })
      }

      // Create new access
      return await prisma.userLessonAccess.create({
        data: {
          userId: data.userId,
          lessonId: data.lessonId,
          grantedBy: data.grantedBy,
          reason: data.reason,
          startDate: data.startDate || new Date(),
          endDate: data.endDate,
          isActive: true
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          lesson: {
            select: { id: true, title: true, course: { select: { title: true } } }
          },
          granter: {
            select: { id: true, name: true }
          }
        }
      })
    } catch (error) {
      console.error('Grant user lesson access error:', error)
      throw error
    }
  }

  static async revokeUserLessonAccess(userId: string, lessonId: string) {
    try {
      const access = await prisma.userLessonAccess.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      })

      if (!access) {
        throw new Error('Access not found')
      }

      return await prisma.userLessonAccess.update({
        where: { id: access.id },
        data: { isActive: false }
      })
    } catch (error) {
      console.error('Revoke user lesson access error:', error)
      throw error
    }
  }

  static async getUserAdhocAccess(userId: string) {
    try {
      const accesses = await prisma.userLessonAccess.findMany({
        where: { 
          userId,
          isActive: true
        },
        include: {
          lesson: {
            include: {
              course: {
                select: { id: true, title: true, slug: true }
              }
            }
          },
          granter: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Filter out expired accesses
      const now = new Date()
      const validAccesses = accesses.filter(access => {
        if (access.endDate && access.endDate < now) {
          // Mark as inactive (this will be done on next access check)
          return false
        }
        return true
      })

      return validAccesses
    } catch (error) {
      console.error('Get user adhoc access error:', error)
      throw error
    }
  }

  static async getLessonAdhocUsers(lessonId: string) {
    try {
      const accesses = await prisma.userLessonAccess.findMany({
        where: {
          lessonId,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          granter: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return accesses
    } catch (error) {
      console.error('Get lesson adhoc users error:', error)
      throw error
    }
  }

  // Get user's lessons (basic list without access control)
  static async getUserLessons(userId: string, courseId?: string) {
    try {
      // First, get courses the user is enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: true }
      })

      if (enrollments.length === 0) {
        return []
      }

      const courseIds = enrollments.map(e => e.course.id)
      const where = courseId ? 
        { courseId, course: { id: { in: courseIds } } } :
        { course: { id: { in: courseIds } } }

      const lessons = await prisma.lesson.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          progress: {
            where: { userId }
          }
        },
        orderBy: [
          { course: { title: 'asc' } },
          { orderIndex: 'asc' }
        ]
      })

      return lessons.map(lesson => ({
        ...lesson,
        progress: lesson.progress[0] || null
      }))
    } catch (error) {
      console.error('Get user lessons error:', error)
      throw error
    }
  }

  // Get user's available lessons with access control
  static async getUserAvailableLessons(userId: string, courseId?: string) {
    try {
      console.log('🔍 [DEBUG] getUserAvailableLessons called:', { userId, courseId })
      
      // Check if user is admin/instructor first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      console.log('🔍 [DEBUG] User found:', user)

      // All users now follow the same access control rules (no special admin privileges)

      // For regular users, get all available lessons (no enrollment required)
      console.log('🔍 [DEBUG] Getting all lessons for user:', userId)
      
      // First let's check if the user exists
      const userCheck = await prisma.user.findUnique({
        where: { id: userId }
      })
      console.log('🔍 [DEBUG] User exists in DB:', userCheck ? 'YES' : 'NO')
      
      // Get all published lessons without enrollment requirement
      const where = courseId ? 
        { courseId } :
        { course: { isPublished: true } }

      console.log('🔍 [DEBUG] Fetching lessons with where clause:', where)
      
      const lessons = await prisma.lesson.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          progress: {
            where: { userId }
          },
          prerequisite: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: [
          { course: { title: 'asc' } },
          { orderIndex: 'asc' }
        ]
      })
      
      console.log('🔍 [DEBUG] Found lessons:', lessons.length)

      // Check access for each lesson
      const lessonsWithAccess = await Promise.all(
        lessons.map(async (lesson) => {
          const accessCheck = await this.checkLessonAccess(userId, lesson.id)
          
          return {
            ...lesson,
            progress: lesson.progress[0] || null,
            userAccess: {
              isAvailable: accessCheck.hasAccess,
              daysUntilAvailable: accessCheck.daysUntilAvailable || 0,
              reason: accessCheck.reason
            }
          }
        })
      )

      console.log('🔍 [DEBUG] Returning lessons with access:', lessonsWithAccess.length)
      return lessonsWithAccess
    } catch (error) {
      console.error('❌ [DEBUG] Get available lessons error:', error)
      throw error
    }
  }

  // Check lesson access for a specific user and lesson
  static async checkLessonAccess(userId: string, lessonId: string) {
    try {
      console.log(`🔍 [DEBUG] Checking lesson access: userId=${userId}, lessonId=${lessonId}`)
      
      const [lesson, adhocAccess] = await Promise.all([
        prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                isPublished: true
              }
            },
            prerequisite: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        prisma.userLessonAccess.findUnique({
          where: {
            userId_lessonId: {
              userId,
              lessonId
            }
          }
        })
      ])

      if (!lesson) {
        return {
          hasAccess: false,
          reason: 'レッスンが見つかりません',
          daysUntilAvailable: null
        }
      }

      // Check for adhoc access first (overrides all other restrictions)
      if (adhocAccess && adhocAccess.isActive) {
        const now = new Date()
        
        // Check date range
        if (adhocAccess.startDate <= now && (!adhocAccess.endDate || adhocAccess.endDate >= now)) {
          return {
            hasAccess: true,
            reason: null,
            daysUntilAvailable: 0
          }
        }
        
        // If adhoc access is not yet active
        if (adhocAccess.startDate > now) {
          const timeDiff = adhocAccess.startDate.getTime() - now.getTime()
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24))
          return {
            hasAccess: false,
            reason: `特別アクセス権は${adhocAccess.startDate.toLocaleDateString('ja-JP')}から有効です`,
            daysUntilAvailable: daysUntil
          }
        }
        
        // If adhoc access has expired
        if (adhocAccess.endDate && adhocAccess.endDate < now) {
          return {
            hasAccess: false,
            reason: '特別アクセス権の有効期限が切れています',
            daysUntilAvailable: null
          }
        }
      }

      // Check if course is published
      if (!lesson.course.isPublished) {
        return {
          hasAccess: false,
          reason: 'このコースは現在公開されていません',
          daysUntilAvailable: null
        }
      }

      // Check release conditions
      const now = new Date()
      let isReleased = false
      let reason = ''
      let daysUntilAvailable: number | null = null

      switch (lesson.releaseType) {
        case 'IMMEDIATE':
          isReleased = true
          break

        case 'HIDDEN':
          isReleased = false
          reason = 'このレッスンは現在非公開です'
          daysUntilAvailable = null
          break

        case 'SCHEDULED':
          if (lesson.releaseDate && lesson.releaseDate <= now) {
            isReleased = true
          } else if (lesson.releaseDate) {
            const timeDiff = lesson.releaseDate.getTime() - now.getTime()
            daysUntilAvailable = Math.ceil(timeDiff / (1000 * 3600 * 24))
            reason = `このレッスンは ${lesson.releaseDate.toLocaleDateString('ja-JP')} にリリース予定です`
          }
          break

        case 'DRIP':
          // Get user registration date
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true }
          })
          
          if (lesson.releaseDays && user) {
            const userRegistrationDate = user.createdAt
            const releaseDate = new Date(userRegistrationDate.getTime() + (lesson.releaseDays * 24 * 60 * 60 * 1000))
            console.log(`🔍 [DEBUG] DRIP access check:`, {
              userId,
              lessonTitle: lesson.title,
              userRegistrationDate: userRegistrationDate.toISOString(),
              releaseDays: lesson.releaseDays,
              releaseDate: releaseDate.toISOString(),
              now: now.toISOString(),
              isAfterReleaseDate: releaseDate <= now
            })
            
            if (releaseDate <= now) {
              isReleased = true
            } else {
              const timeDiff = releaseDate.getTime() - now.getTime()
              daysUntilAvailable = Math.ceil(timeDiff / (1000 * 3600 * 24))
              reason = `このレッスンはユーザー登録から${lesson.releaseDays}日後（${releaseDate.toLocaleDateString('ja-JP')}）にリリースされます`
            }
          } else if (user) {
            // Legacy: month-based release using user registration date
            const userRegistrationDate = user.createdAt
            const lessonIndex = lesson.orderIndex
            const requiredMonths = Math.floor(lessonIndex / 2)
            const monthsSinceRegistration = this.calculateMonthsDifference(userRegistrationDate, now)
            
            if (monthsSinceRegistration >= requiredMonths) {
              isReleased = true
            } else {
              const nextReleaseDate = this.addMonthsToDate(userRegistrationDate, requiredMonths)
              const timeDiff = nextReleaseDate.getTime() - now.getTime()
              daysUntilAvailable = Math.ceil(timeDiff / (1000 * 3600 * 24))
              reason = `このレッスンはユーザー登録から${requiredMonths}ヶ月後（${nextReleaseDate.toLocaleDateString('ja-JP')}）にリリースされます`
            }
          } else {
            // User not found, deny access
            isReleased = false
            reason = 'ユーザー情報が見つかりません'
          }
          break

        case 'PREREQUISITE':
          if (lesson.prerequisiteId) {
            const prerequisiteProgress = await prisma.progress.findUnique({
              where: {
                userId_lessonId: {
                  userId: userId,
                  lessonId: lesson.prerequisiteId
                }
              }
            })
            
            if (prerequisiteProgress?.completed) {
              isReleased = true
            } else {
              reason = `前提レッスン「${lesson.prerequisite?.title}」を完了してください`
              daysUntilAvailable = null
            }
          } else {
            isReleased = true
          }
          break

        default:
          isReleased = true
      }

      // Admin users do NOT bypass access control anymore
      // All users follow the same rules

      const result = {
        hasAccess: isReleased,
        reason: isReleased ? null : reason,
        daysUntilAvailable: daysUntilAvailable
      }
      
      console.log(`✅ [DEBUG] Lesson access result for ${lesson?.title}:`, {
        userId,
        lessonId,
        releaseType: lesson?.releaseType,
        coursePublished: lesson?.course?.isPublished,
        result
      })
      
      return result
    } catch (error) {
      console.error('Check lesson access error:', error)
      return {
        hasAccess: false,
        reason: 'アクセス権限の確認中にエラーが発生しました',
        daysUntilAvailable: null
      }
    }
  }

  // Adhoc Access Management
  static async grantUserLessonAccess(data: {
    userId: string
    lessonId: string
    grantedBy: string
    reason?: string
    startDate?: Date
    endDate?: Date
  }) {
    try {
      // Check if access already exists
      const existingAccess = await prisma.userLessonAccess.findUnique({
        where: {
          userId_lessonId: {
            userId: data.userId,
            lessonId: data.lessonId
          }
        }
      })

      if (existingAccess) {
        // Update existing access
        const updatedAccess = await prisma.userLessonAccess.update({
          where: {
            userId_lessonId: {
              userId: data.userId,
              lessonId: data.lessonId
            }
          },
          data: {
            grantedBy: data.grantedBy,
            reason: data.reason,
            startDate: data.startDate || new Date(),
            endDate: data.endDate,
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            lesson: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    title: true
                  }
                }
              }
            },
            granter: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
        
        return updatedAccess
      } else {
        // Create new access
        const newAccess = await prisma.userLessonAccess.create({
          data: {
            userId: data.userId,
            lessonId: data.lessonId,
            grantedBy: data.grantedBy,
            reason: data.reason,
            startDate: data.startDate || new Date(),
            endDate: data.endDate,
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            lesson: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    title: true
                  }
                }
              }
            },
            granter: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
        
        return newAccess
      }
    } catch (error) {
      console.error('Grant user lesson access error:', error)
      throw error
    }
  }

  static async revokeUserLessonAccess(userId: string, lessonId: string) {
    try {
      await prisma.userLessonAccess.delete({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      })
    } catch (error) {
      console.error('Revoke user lesson access error:', error)
      throw error
    }
  }

  static async bulkGrantLessonAccess(data: {
    userIds: string[]
    lessonId: string
    grantedBy: string
    reason?: string
    startDate?: Date
    endDate?: Date
  }) {
    try {
      const results = []
      
      for (const userId of data.userIds) {
        const access = await this.grantUserLessonAccess({
          userId,
          lessonId: data.lessonId,
          grantedBy: data.grantedBy,
          reason: data.reason,
          startDate: data.startDate,
          endDate: data.endDate
        })
        results.push(access)
      }
      
      return results
    } catch (error) {
      console.error('Bulk grant lesson access error:', error)
      throw error
    }
  }

  static async getUserAdhocAccess(userId: string) {
    try {
      const accesses = await prisma.userLessonAccess.findMany({
        where: { 
          userId,
          isActive: true
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  title: true
                }
              }
            }
          },
          granter: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      return accesses
    } catch (error) {
      console.error('Get user adhoc access error:', error)
      throw error
    }
  }

  static async getLessonAdhocUsers(lessonId: string) {
    try {
      const accesses = await prisma.userLessonAccess.findMany({
        where: { 
          lessonId,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          granter: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      return accesses
    } catch (error) {
      console.error('Get lesson adhoc users error:', error)
      throw error
    }
  }

  // 統計情報
  static async getCourseStats(courseId: string) {
    try {
      const [
        enrollmentCount,
        completionCount,
        averageProgress,
        totalWatchTime
      ] = await Promise.all([
        prisma.enrollment.count({ where: { courseId } }),
        
        prisma.enrollment.count({
          where: { 
            courseId,
            completedAt: { not: null }
          }
        }),

        prisma.progress.aggregate({
          where: {
            lesson: { courseId }
          },
          _avg: {
            watchedSeconds: true
          }
        }),

        prisma.progress.aggregate({
          where: {
            lesson: { courseId }
          },
          _sum: {
            watchedSeconds: true
          }
        })
      ])

      return {
        enrollmentCount,
        completionCount,
        completionRate: enrollmentCount > 0 ? (completionCount / enrollmentCount) * 100 : 0,
        averageProgress: averageProgress._avg.watchedSeconds || 0,
        totalWatchTime: totalWatchTime._sum.watchedSeconds || 0
      }
    } catch (error) {
      console.error('Get course stats error:', error)
      throw error
    }
  }
}