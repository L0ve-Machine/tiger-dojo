import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createInvite() {
  try {
    console.log('🔗 招待コードを作成しています...')
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('❌ 管理者ユーザーが見つかりません')
      return
    }
    
    // Create invite code
    const invite = await prisma.inviteLink.create({
      data: {
        code: 'TESTCODE2024',
        createdBy: adminUser.id,
        maxUses: 100,
        description: 'テスト用招待コード',
        isActive: true,
        usedCount: 0
      }
    })
    
    console.log('✅ 招待コードを作成しました:')
    console.log(`コード: ${invite.code}`)
    console.log(`最大使用回数: ${invite.maxUses}`)
    console.log(`説明: ${invite.description}`)
    
  } catch (error) {
    console.error('❌ 招待コード作成エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createInvite()