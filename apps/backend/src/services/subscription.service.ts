import { prisma } from '../index'

export class SubscriptionService {
  // サブスクリプションプラン作成（管理者のみ）
  static async createPlan(data: {
    name: string
    description?: string
    price: number
    duration: number // 日数
    features: string[] // 機能リスト
  }) {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        duration: data.duration,
        features: JSON.stringify(data.features),
        isActive: true
      }
    })

    return {
      ...plan,
      features: JSON.parse(plan.features)
    }
  }

  // 全てのアクティブなプランを取得
  static async getActivePlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    return plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features)
    }))
  }

  // プラン詳細取得
  static async getPlanById(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    if (!plan) return null

    return {
      ...plan,
      features: JSON.parse(plan.features)
    }
  }

  // ユーザーのサブスクリプション作成
  static async createSubscription(userId: string, planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan || !plan.isActive) {
      throw new Error('無効なプランが指定されました')
    }

    // 既存のアクティブなサブスクリプションをチェック
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    })

    if (existingSubscription) {
      throw new Error('既にアクティブなサブスクリプションが存在します')
    }

    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000))

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'PENDING', // 支払い完了まで保留
        startDate,
        endDate,
        autoRenew: true
      },
      include: {
        plan: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return subscription
  }

  // サブスクリプション決済完了処理
  static async activateSubscription(subscriptionId: string, paymentData: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    stripePaymentIntentId?: string
    stripeChargeId?: string
  }) {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        stripeCustomerId: paymentData.stripeCustomerId,
        stripeSubscriptionId: paymentData.stripeSubscriptionId
      },
      include: {
        plan: true,
        user: true
      }
    })

    // 支払い記録を作成
    await prisma.payment.create({
      data: {
        subscriptionId,
        userId: subscription.userId,
        amount: subscription.plan.price,
        currency: 'JPY',
        status: 'COMPLETED',
        method: 'STRIPE',
        stripePaymentIntentId: paymentData.stripePaymentIntentId,
        stripeChargeId: paymentData.stripeChargeId,
        paidAt: new Date()
      }
    })

    return subscription
  }

  // ユーザーの現在のサブスクリプション取得
  static async getCurrentSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) return null

    return {
      ...subscription,
      plan: {
        ...subscription.plan,
        features: JSON.parse(subscription.plan.features)
      }
    }
  }

  // サブスクリプション自動更新処理
  static async renewSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    })

    if (!subscription || !subscription.autoRenew) {
      throw new Error('サブスクリプションが見つからないか、自動更新が無効です')
    }

    const newEndDate = new Date(subscription.endDate.getTime() + (subscription.plan.duration * 24 * 60 * 60 * 1000))

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        user: true
      }
    })

    return updatedSubscription
  }

  // サブスクリプションキャンセル
  static async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId
      }
    })

    if (!subscription) {
      throw new Error('サブスクリプションが見つかりません')
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        autoRenew: false
      },
      include: {
        plan: true
      }
    })

    return updatedSubscription
  }

  // 期限切れサブスクリプションをチェック・更新
  static async checkExpiredSubscriptions() {
    const now = new Date()
    
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      include: {
        plan: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    for (const subscription of expiredSubscriptions) {
      if (subscription.autoRenew) {
        // 自動更新の場合は、支払い処理を開始
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PENDING' }
        })
      } else {
        // 自動更新無効の場合は期限切れにする
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        })
      }
    }

    return expiredSubscriptions
  }

  // ユーザーがアクティブなサブスクリプションを持っているかチェック
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    })

    return !!subscription
  }

  // サブスクリプション統計
  static async getSubscriptionStats() {
    const [
      totalActiveSubscriptions,
      totalRevenue,
      planStats,
      recentSubscriptions
    ] = await Promise.all([
      // アクティブなサブスクリプション数
      prisma.subscription.count({
        where: { status: 'ACTIVE' }
      }),
      
      // 総売上
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // プラン別統計
      prisma.subscriptionPlan.findMany({
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE' }
              }
            }
          }
        }
      }),
      
      // 最近のサブスクリプション
      prisma.subscription.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ])

    return {
      totalActiveSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      planStats: planStats.map(plan => ({
        ...plan,
        features: JSON.parse(plan.features),
        activeSubscriptions: plan._count.subscriptions
      })),
      recentSubscriptions
    }
  }

  // 支払い履歴取得
  static async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
        }
      }),
      prisma.payment.count({
        where: { userId }
      })
    ])

    return {
      payments: payments.map(payment => ({
        ...payment,
        subscription: {
          ...payment.subscription,
          plan: {
            ...payment.subscription.plan,
            features: JSON.parse(payment.subscription.plan.features)
          }
        }
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }
}