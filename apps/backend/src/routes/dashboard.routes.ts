import { Router, Request, Response } from 'express'
import { DashboardService } from '../services/dashboard.service'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// GET /api/dashboard/statistics - Get user dashboard statistics
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      })
    }

    const statistics = await DashboardService.getUserStatistics(userId)

    res.json({
      success: true,
      data: statistics
    })

  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error)
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    })
  }
})

// GET /api/dashboard/leaderboard - Get leaderboard
router.get('/leaderboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const leaderboard = await DashboardService.getLeaderboard()

    res.json({
      success: true,
      data: leaderboard
    })

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    })
  }
})

export default router