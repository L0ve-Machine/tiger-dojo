import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin, requireInstructorOrAdmin } from '../middleware/admin.middleware'
import { AdminController } from '../controllers/admin.controller'

const router = express.Router()

// All admin routes require authentication
router.use(authenticateToken)

// Dashboard & Analytics
router.get('/dashboard', requireAdmin, AdminController.getDashboard)
router.get('/analytics', requireAdmin, AdminController.getAnalytics)

// User Management
router.get('/users', requireAdmin, AdminController.getUsers)
router.get('/users/:id', requireAdmin, AdminController.getUserById)
router.put('/users/:id', requireAdmin, AdminController.updateUser)
router.delete('/users/:id', requireAdmin, AdminController.deleteUser)
router.put('/users/:id/role', requireAdmin, AdminController.updateUserRole)
router.put('/users/:id/status', requireAdmin, AdminController.updateUserStatus)

// Course Management
router.get('/courses', requireInstructorOrAdmin, AdminController.getCourses)
router.post('/courses', requireInstructorOrAdmin, AdminController.createCourse)
router.put('/courses/:id', requireInstructorOrAdmin, AdminController.updateCourse)
router.delete('/courses/:id', requireAdmin, AdminController.deleteCourse)
router.put('/courses/:id/publish', requireAdmin, AdminController.publishCourse)

// Lesson Management
router.get('/lessons', requireInstructorOrAdmin, AdminController.getLessons)
router.post('/lessons', requireInstructorOrAdmin, AdminController.createLesson)
router.put('/lessons/:id', requireInstructorOrAdmin, AdminController.updateLesson)
router.delete('/lessons/:id', requireInstructorOrAdmin, AdminController.deleteLesson)

// Video Upload (Vimeo integration)
router.post('/upload/video', requireInstructorOrAdmin, AdminController.uploadVideo)
router.get('/upload/video/:id/status', requireInstructorOrAdmin, AdminController.getUploadStatus)

// Chat Management
router.get('/chat/messages', requireAdmin, AdminController.getChatMessages)
router.delete('/chat/messages/:id', requireAdmin, AdminController.deleteChatMessage)
router.put('/chat/messages/:id/moderate', requireAdmin, AdminController.moderateMessage)

// Adhoc Access Management
router.post('/adhoc-access/grant', requireAdmin, AdminController.grantLessonAccess)
router.post('/adhoc-access/revoke', requireAdmin, AdminController.revokeLessonAccess)
router.post('/adhoc-access/bulk-grant', requireAdmin, AdminController.bulkGrantLessonAccess)
router.get('/adhoc-access/user/:userId', requireAdmin, AdminController.getUserAdhocAccess)
router.get('/adhoc-access/lesson/:lessonId', requireAdmin, AdminController.getLessonAdhocUsers)

// System Settings
router.get('/settings', requireAdmin, AdminController.getSettings)
router.put('/settings', requireAdmin, AdminController.updateSettings)

export default router