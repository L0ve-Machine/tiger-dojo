import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎓 ユーザーを自動的にコースに登録しています...')

  try {
    // Get the main course
    const course = await prisma.course.findUnique({
      where: { slug: 'fx-trading-course' }
    })

    if (!course) {
      console.log('❌ メインコースが見つかりません')
      return
    }

    // Get all active users (not admin)
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: { not: 'ADMIN' }
      }
    })

    console.log(`📝 ${users.length}名のユーザーを対象にしています...`)

    // Enroll all users in the course if not already enrolled
    for (const user of users) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id
          }
        }
      })

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date()
          }
        })
        console.log(`✅ ${user.email} をコースに登録しました`)
      } else {
        console.log(`ℹ️  ${user.email} は既に登録済みです`)
      }
    }

    console.log('🎉 すべてのユーザーの登録処理が完了しました！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()