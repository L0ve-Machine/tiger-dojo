import { Router, Request, Response } from 'express'
import { CourseService } from '../services/course.service'
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.middleware'
import { validateRequest } from '../utils/validation.utils'
import { z } from 'zod'

const router = Router()

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(255, 'タイトルは255文字以下である必要があります'),
  description: z.string().min(1, '説明を入力してください'),
  thumbnail: z.string().url().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'スラグは英数字とハイフンのみ使用可能です'),
  isPublished: z.boolean().optional(),
  price: z.number().int().min(0).optional()
})

const updateCourseSchema = createCourseSchema.partial()

const createLessonSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(1, 'タイトルを入力してください').max(255),
  description: z.string().optional(),
  videoUrl: z.string().min(1, '動画URLを入力してください'),
  duration: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0),
  releaseType: z.enum(['IMMEDIATE', 'SCHEDULED', 'DRIP', 'PREREQUISITE']).optional(),
  releaseDays: z.number().int().min(0).optional(),
  releaseDate: z.string().datetime().optional(),
  prerequisiteId: z.string().cuid().optional()
})

const updateLessonSchema = createLessonSchema.partial().omit({ courseId: true })

const updateProgressSchema = z.object({
  lessonId: z.string().cuid(),
  watchedSeconds: z.number().int().min(0),
  completed: z.boolean().optional()
})

// Public routes
// GET /api/courses - Get all published courses
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const courses = await CourseService.getAllCourses(req.user?.userId)
    
    res.json({
      courses,
      total: courses.length
    })
  } catch (error: any) {
    console.error('Get courses error:', error)
    res.status(500).json({
      error: 'コース一覧の取得に失敗しました'
    })
  }
})

// GET /api/courses/:slug - Get course by slug
router.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const course = await CourseService.getCourseBySlug(slug, req.user?.userId)
    
    res.json({ course })
  } catch (error: any) {
    console.error('Get course error:', error)
    res.status(404).json({
      error: error.message || 'コースが見つかりません'
    })
  }
})

// Protected routes (require authentication)
// POST /api/courses/:id/enroll - Enroll in course
router.post('/:id/enroll', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { id: courseId } = req.params
    const enrollment = await CourseService.enrollCourse(req.user.userId, courseId)
    
    res.status(201).json({
      message: 'コースに登録しました',
      enrollment
    })
  } catch (error: any) {
    console.error('Enroll course error:', error)
    res.status(400).json({
      error: error.message || 'コース登録に失敗しました'
    })
  }
})

// GET /api/courses/lessons/:id - Get lesson details
router.get('/lessons/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { id } = req.params
    const lesson = await CourseService.getLessonById(id, req.user.userId)
    
    res.json({ lesson })
  } catch (error: any) {
    console.error('Get lesson error:', error)
    res.status(404).json({
      error: error.message || 'レッスンが見つかりません'
    })
  }
})

// POST /api/courses/lessons/:id/progress - Update lesson progress
router.post('/lessons/:id/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const validation = validateRequest(updateProgressSchema, {
      ...req.body,
      lessonId: req.params.id
    })
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    const progress = await CourseService.updateProgress(req.user.userId, validation.data)
    
    res.json({
      message: '進捗を更新しました',
      progress
    })
  } catch (error: any) {
    console.error('Update progress error:', error)
    res.status(400).json({
      error: error.message || '進捗更新に失敗しました'
    })
  }
})

// GET /api/courses/user/progress - Get user's progress
router.get('/user/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { courseId } = req.query
    const progress = await CourseService.getUserProgress(
      req.user.userId, 
      courseId as string
    )
    
    res.json({ progress })
  } catch (error: any) {
    console.error('Get user progress error:', error)
    res.status(500).json({
      error: '進捗取得に失敗しました'
    })
  }
})

// Admin routes (require admin/instructor role)
// POST /api/courses - Create new course
router.post('/', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(createCourseSchema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    const course = await CourseService.createCourse(validation.data)
    
    res.status(201).json({
      message: 'コースを作成しました',
      course
    })
  } catch (error: any) {
    console.error('Create course error:', error)
    res.status(400).json({
      error: error.message || 'コース作成に失敗しました'
    })
  }
})

// PUT /api/courses/:id - Update course
router.put('/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(updateCourseSchema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    const { id } = req.params
    const course = await CourseService.updateCourse(id, validation.data)
    
    res.json({
      message: 'コースを更新しました',
      course
    })
  } catch (error: any) {
    console.error('Update course error:', error)
    res.status(400).json({
      error: error.message || 'コース更新に失敗しました'
    })
  }
})

// DELETE /api/courses/:id - Delete course
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await CourseService.deleteCourse(id)
    
    res.json({
      message: 'コースを削除しました'
    })
  } catch (error: any) {
    console.error('Delete course error:', error)
    res.status(400).json({
      error: error.message || 'コース削除に失敗しました'
    })
  }
})

// POST /api/courses/lessons - Create new lesson
router.post('/lessons', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(createLessonSchema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    // Convert releaseDate string to Date object if provided
    if (validation.data.releaseDate) {
      validation.data.releaseDate = new Date(validation.data.releaseDate) as any
    }

    const lesson = await CourseService.createLesson(validation.data)
    
    res.status(201).json({
      message: 'レッスンを作成しました',
      lesson
    })
  } catch (error: any) {
    console.error('Create lesson error:', error)
    res.status(400).json({
      error: error.message || 'レッスン作成に失敗しました'
    })
  }
})

// PUT /api/courses/lessons/:id - Update lesson
router.put('/lessons/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(updateLessonSchema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      })
    }

    // Convert releaseDate string to Date object if provided
    if (validation.data.releaseDate) {
      validation.data.releaseDate = new Date(validation.data.releaseDate) as any
    }

    const { id } = req.params
    const lesson = await CourseService.updateLesson(id, validation.data)
    
    res.json({
      message: 'レッスンを更新しました',
      lesson
    })
  } catch (error: any) {
    console.error('Update lesson error:', error)
    res.status(400).json({
      error: error.message || 'レッスン更新に失敗しました'
    })
  }
})

// DELETE /api/courses/lessons/:id - Delete lesson
router.delete('/lessons/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await CourseService.deleteLesson(id)
    
    res.json({
      message: 'レッスンを削除しました'
    })
  } catch (error: any) {
    console.error('Delete lesson error:', error)
    res.status(400).json({
      error: error.message || 'レッスン削除に失敗しました'
    })
  }
})

// GET /api/courses/:id/stats - Get course statistics
router.get('/:id/stats', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const stats = await CourseService.getCourseStats(id)
    
    res.json({ stats })
  } catch (error: any) {
    console.error('Get course stats error:', error)
    res.status(500).json({
      error: '統計情報の取得に失敗しました'
    })
  }
})

export default router