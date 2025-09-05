import { prisma } from '../index'

export class InviteService {
  // 招待リンク作成（管理者のみ）
  static async createInviteLink(createdBy: string, data: {
    maxUses?: number
    expiresAt?: Date
    description?: string
  }) {
    const invite = await prisma.inviteLink.create({
      data: {
        createdBy,
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt || null,
        description: data.description || null,
        isActive: true,
        usedCount: 0
      }
    })

    return invite
  }

  // 招待リンク検証
  static async validateInviteCode(code: string) {
    const invite = await prisma.inviteLink.findUnique({
      where: { code },
      include: { creator: { select: { name: true, role: true } } }
    })

    if (!invite) {
      return { isValid: false, reason: '無効な招待コードです' }
    }

    if (!invite.isActive) {
      return { isValid: false, reason: 'この招待リンクは無効化されています' }
    }

    // 期限チェック
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return { isValid: false, reason: 'この招待リンクは期限切れです' }
    }

    // 使用回数チェック
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      return { isValid: false, reason: 'この招待リンクは使用回数上限に達しています' }
    }

    return { 
      isValid: true, 
      invite,
      remainingUses: invite.maxUses ? invite.maxUses - invite.usedCount : null
    }
  }

  // 招待リンクを使用して登録
  static async useInviteLink(code: string, userId: string) {
    const validation = await this.validateInviteCode(code)
    
    if (!validation.isValid) {
      throw new Error(validation.reason)
    }

    // 既に使用済みかチェック
    const existingRegistration = await prisma.registration.findFirst({
      where: { userId, inviteId: validation.invite!.id }
    })

    if (existingRegistration) {
      throw new Error('このユーザーは既にこの招待リンクを使用しています')
    }

    // 登録記録を作成し、使用回数を増加
    await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId,
          inviteId: validation.invite!.id
        }
      }),
      prisma.inviteLink.update({
        where: { id: validation.invite!.id },
        data: { usedCount: { increment: 1 } }
      })
    ])

    return validation.invite
  }

  // 全ての招待リンク取得（管理者用）
  static async getAllInviteLinks(page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [invites, total] = await Promise.all([
      prisma.inviteLink.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { 
            select: { 
              name: true, 
              role: true, 
              email: true 
            } 
          },
          registrations: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  createdAt: true
                }
              }
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.inviteLink.count()
    ])

    return {
      invites,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 招待リンク詳細取得
  static async getInviteLinkById(id: string) {
    const invite = await prisma.inviteLink.findUnique({
      where: { id },
      include: {
        creator: { 
          select: { 
            name: true, 
            role: true, 
            email: true 
          } 
        },
        registrations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                createdAt: true
              }
            }
          },
          orderBy: { registeredAt: 'desc' }
        }
      }
    })

    return invite
  }

  // 招待リンクの有効/無効切り替え
  static async toggleInviteLink(id: string, isActive: boolean) {
    const invite = await prisma.inviteLink.update({
      where: { id },
      data: { isActive }
    })

    return invite
  }

  // 招待リンク削除
  static async deleteInviteLink(id: string) {
    // 関連する登録記録も削除
    await prisma.$transaction([
      prisma.registration.deleteMany({
        where: { inviteId: id }
      }),
      prisma.inviteLink.delete({
        where: { id }
      })
    ])

    return true
  }

  // 招待リンクの統計情報
  static async getInviteStats() {
    const stats = await prisma.inviteLink.aggregate({
      _count: true,
      where: { isActive: true }
    })

    const totalRegistrations = await prisma.registration.count()
    
    const recentRegistrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30日以内
        }
      },
      include: {
        user: { select: { name: true, email: true } },
        invite: { select: { description: true } }
      },
      orderBy: { registeredAt: 'desc' },
      take: 10
    })

    return {
      totalActiveInvites: stats._count,
      totalRegistrations,
      recentRegistrations
    }
  }

  // ユーザーが使用した招待リンク取得
  static async getUserInvite(userId: string) {
    const registration = await prisma.registration.findFirst({
      where: { userId },
      include: {
        invite: {
          include: {
            creator: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    return registration
  }
}