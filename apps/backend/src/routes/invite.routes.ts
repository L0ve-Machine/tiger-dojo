import express from 'express'
import { InviteService } from '../services/invite.service'
import { authenticateToken } from '../middleware/auth.middleware'
import { validateRequest } from '../utils/validation.utils'
import { z } from 'zod'

const router = express.Router()

// Validation schemas
const createInviteSchema = z.object({
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  description: z.string().max(500).optional()
})

const validateInviteSchema = z.object({
  code: z.string().min(1, '招待コードが必要です')
})

const useInviteSchema = z.object({
  code: z.string().min(1, '招待コードが必要です')
})

// 招待リンク作成 (管理者のみ)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const validation = validateRequest(createInviteSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({ errors: validation.errors })
    }

    const { maxUses, expiresAt, description } = validation.data
    
    const invite = await InviteService.createInviteLink(user.id, {
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      description
    })

    res.json({
      success: true,
      invite: {
        id: invite.id,
        code: invite.code,
        maxUses: invite.maxUses,
        usedCount: invite.usedCount,
        expiresAt: invite.expiresAt,
        description: invite.description,
        isActive: invite.isActive,
        createdAt: invite.createdAt
      }
    })
  } catch (error: any) {
    console.error('Create invite error:', error)
    res.status(500).json({ error: '招待リンクの作成に失敗しました' })
  }
})

// 招待コード検証 (公開API)
router.post('/validate', async (req, res) => {
  try {
    const validation = validateRequest(validateInviteSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({ errors: validation.errors })
    }

    const { code } = validation.data
    const result = await InviteService.validateInviteCode(code)

    if (!result.isValid) {
      return res.status(400).json({ error: result.reason })
    }

    res.json({
      success: true,
      isValid: true,
      remainingUses: result.remainingUses,
      invite: {
        description: result.invite?.description,
        creator: result.invite?.creator
      }
    })
  } catch (error: any) {
    console.error('Validate invite error:', error)
    res.status(500).json({ error: '招待コードの検証に失敗しました' })
  }
})

// 招待リンク使用 (会員登録時)
router.post('/use', authenticateToken, async (req, res) => {
  try {
    const validation = validateRequest(useInviteSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({ errors: validation.errors })
    }

    const { code } = validation.data
    const user = req.user

    const invite = await InviteService.useInviteLink(code, user.id)

    res.json({
      success: true,
      message: '招待リンクが正常に使用されました',
      invite: {
        description: invite.description,
        creator: invite.creator
      }
    })
  } catch (error: any) {
    console.error('Use invite error:', error)
    res.status(400).json({ error: error.message })
  }
})

// 全ての招待リンク取得 (管理者のみ)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await InviteService.getAllInviteLinks(page, limit)

    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Get invites error:', error)
    res.status(500).json({ error: '招待リンクの取得に失敗しました' })
  }
})

// 招待リンク詳細取得 (管理者のみ)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const { id } = req.params
    const invite = await InviteService.getInviteLinkById(id)

    if (!invite) {
      return res.status(404).json({ error: '招待リンクが見つかりません' })
    }

    res.json({
      success: true,
      invite
    })
  } catch (error: any) {
    console.error('Get invite error:', error)
    res.status(500).json({ error: '招待リンクの取得に失敗しました' })
  }
})

// 招待リンクの有効/無効切り替え (管理者のみ)
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const { id } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActiveは真偽値である必要があります' })
    }

    const invite = await InviteService.toggleInviteLink(id, isActive)

    res.json({
      success: true,
      message: `招待リンクを${isActive ? '有効' : '無効'}にしました`,
      invite
    })
  } catch (error: any) {
    console.error('Toggle invite error:', error)
    res.status(500).json({ error: '招待リンクの更新に失敗しました' })
  }
})

// 招待リンク削除 (管理者のみ)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const { id } = req.params
    await InviteService.deleteInviteLink(id)

    res.json({
      success: true,
      message: '招待リンクが削除されました'
    })
  } catch (error: any) {
    console.error('Delete invite error:', error)
    res.status(500).json({ error: '招待リンクの削除に失敗しました' })
  }
})

// 招待統計情報取得 (管理者のみ)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const stats = await InviteService.getInviteStats()

    res.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('Get invite stats error:', error)
    res.status(500).json({ error: '統計情報の取得に失敗しました' })
  }
})

// ユーザーが使用した招待リンク取得
router.get('/user/registration', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const registration = await InviteService.getUserInvite(user.id)

    res.json({
      success: true,
      registration
    })
  } catch (error: any) {
    console.error('Get user invite error:', error)
    res.status(500).json({ error: '登録情報の取得に失敗しました' })
  }
})

export default router