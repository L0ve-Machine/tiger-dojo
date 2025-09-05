import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎥 サンプルコースと動画を作成しています...')
  
  try {
    // Create course
    const course = await prisma.course.create({
      data: {
        title: 'FXトレード実践講座',
        description: 'プロトレーダーへの道を歩むための実践的な講座です',
        slug: 'fx-trading-course',
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
        isPublished: true,
        price: 0, // 無料コース
        lessons: {
          create: [
            {
              title: '第1回：FXの基礎知識',
              description: 'FXトレードの基本的な概念と用語を学びます',
              content: '# FXの基礎知識\n\nこのレッスンではFXトレードの基本を学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 1800,
              orderIndex: 0,
              releaseType: 'IMMEDIATE',
              isPublished: true
            },
            {
              title: '第2回：チャート分析の基本',
              description: 'テクニカル分析の基礎とチャートの読み方',
              content: '# チャート分析\n\nローソク足チャートの読み方を学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 2400,
              orderIndex: 1,
              releaseType: 'IMMEDIATE',
              isPublished: true
            },
            {
              title: '第3回：リスク管理',
              description: 'トレードにおけるリスク管理の重要性',
              content: '# リスク管理\n\n資金管理とポジションサイジングを学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 2100,
              orderIndex: 2,
              releaseType: 'DRIP',
              releaseDays: 30,
              isPublished: true
            },
            {
              title: '第4回：エントリー戦略',
              description: '効果的なエントリーポイントの見つけ方',
              content: '# エントリー戦略\n\n最適なエントリータイミングを学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 2700,
              orderIndex: 3,
              releaseType: 'DRIP',
              releaseDays: 30,
              isPublished: true
            },
            {
              title: '第5回：利確と損切り',
              description: '適切な利確・損切りポイントの設定方法',
              content: '# 利確と損切り\n\n利益確定と損失限定の技術を学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 2500,
              orderIndex: 4,
              releaseType: 'DRIP',
              releaseDays: 60,
              isPublished: true
            },
            {
              title: '第6回：メンタル管理',
              description: 'トレーダーの心理とメンタルコントロール',
              content: '# メンタル管理\n\n感情をコントロールする方法を学びます。',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 2200,
              orderIndex: 5,
              releaseType: 'DRIP',
              releaseDays: 60,
              isPublished: true
            }
          ]
        }
      },
      include: {
        lessons: true
      }
    })

    console.log('✅ コースを作成しました:', course.title)
    console.log(`   - ${course.lessons.length}個のレッスンを含む`)
    
    // Create enrollments for existing users
    const users = await prisma.user.findMany()
    
    for (const user of users) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          status: 'ACTIVE',
          enrolledAt: new Date()
        }
      }).catch(() => {
        // Enrollment might already exist
      })
    }
    
    console.log(`✅ ${users.length}人のユーザーをコースに登録しました`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })