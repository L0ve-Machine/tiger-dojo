import express from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { authenticateToken } from '../middleware/auth.middleware'
import { validateRequest } from '../utils/validation.utils'
import { z } from 'zod'

const router = express.Router()

// Validation schemas
const createPlanSchema = z.object({
  name: z.string().min(1, 'プラン名が必要です'),
  description: z.string().optional(),
  price: z.number().int().positive('価格は正の整数である必要があります'),
  duration: z.number().int().positive('期間は正の整数である必要があります'),
  features: z.array(z.string()).min(1, '機能リストが必要です')
})

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'プランIDが必要です')
})

// 全てのアクティブなプランを取得
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionService.getActivePlans()
    res.json({
      success: true,
      plans
    })
  } catch (error: any) {
    console.error('Get plans error:', error)
    res.status(500).json({ error: 'プランの取得に失敗しました' })
  }
})

// プラン詳細取得
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params
    const plan = await SubscriptionService.getPlanById(id)

    if (!plan) {
      return res.status(404).json({ error: 'プランが見つかりません' })
    }

    res.json({
      success: true,
      plan
    })
  } catch (error: any) {
    console.error('Get plan error:', error)
    res.status(500).json({ error: 'プランの取得に失敗しました' })
  }
})

// プラン作成（管理者のみ）
router.post('/plans', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const validation = validateRequest(createPlanSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({ errors: validation.errors })
    }

    const plan = await SubscriptionService.createPlan(validation.data)

    res.status(201).json({
      success: true,
      message: 'プランが作成されました',
      plan
    })
  } catch (error: any) {
    console.error('Create plan error:', error)
    res.status(500).json({ error: 'プランの作成に失敗しました' })
  }
})

// サブスクリプション作成
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const validation = validateRequest(createSubscriptionSchema, req.body)
    
    if (!validation.success) {
      return res.status(400).json({ errors: validation.errors })
    }

    const { planId } = validation.data
    const subscription = await SubscriptionService.createSubscription(user.id, planId)

    res.status(201).json({
      success: true,
      message: 'サブスクリプションが作成されました',
      subscription
    })
  } catch (error: any) {
    console.error('Create subscription error:', error)
    res.status(400).json({ error: error.message })
  }
})

// 現在のサブスクリプション取得
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const subscription = await SubscriptionService.getCurrentSubscription(user.id)

    res.json({
      success: true,
      subscription
    })
  } catch (error: any) {
    console.error('Get current subscription error:', error)
    res.status(500).json({ error: 'サブスクリプションの取得に失敗しました' })
  }
})

// サブスクリプションキャンセル
router.post('/cancel/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const { subscriptionId } = req.params
    
    const subscription = await SubscriptionService.cancelSubscription(subscriptionId, user.id)

    res.json({
      success: true,
      message: 'サブスクリプションがキャンセルされました',
      subscription
    })
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    res.status(400).json({ error: error.message })
  }
})

// 支払い履歴取得
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await SubscriptionService.getPaymentHistory(user.id, page, limit)

    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Get payment history error:', error)
    res.status(500).json({ error: '支払い履歴の取得に失敗しました' })
  }
})

// サブスクリプション統計（管理者のみ）
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const stats = await SubscriptionService.getSubscriptionStats()

    res.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('Get subscription stats error:', error)
    res.status(500).json({ error: '統計情報の取得に失敗しました' })
  }
})

// 期限切れサブスクリプションチェック（管理者のみ）
router.post('/admin/check-expired', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '管理者権限が必要です' })
    }

    const expiredSubscriptions = await SubscriptionService.checkExpiredSubscriptions()

    res.json({
      success: true,
      message: `${expiredSubscriptions.length}件の期限切れサブスクリプションを処理しました`,
      expiredSubscriptions: expiredSubscriptions.length
    })
  } catch (error: any) {
    console.error('Check expired subscriptions error:', error)
    res.status(500).json({ error: '期限切れチェックに失敗しました' })
  }
})

// アクセス権限チェック用エンドポイント
router.get('/check-access', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const hasAccess = await SubscriptionService.hasActiveSubscription(user.id)

    res.json({
      success: true,
      hasAccess,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Check access error:', error)
    res.status(500).json({ error: 'アクセス権限の確認に失敗しました' })
  }
})

// Stripe Webhook（後で実装予定）
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Stripe webhookの処理をここに実装
    // 支払い完了、失敗、サブスクリプション更新等のイベント処理

    console.log('Stripe webhook received:', req.body)
    
    res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    res.status(400).json({ error: 'Webhook処理に失敗しました' })
  }
})

export default router