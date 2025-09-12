import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎥 サンプルコースと動画を作成しています...')

  try {
    // Find or create course
    let course = await prisma.course.findUnique({
      where: { slug: "fx-trading-course" }
    })

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: "FX Tiger Dojoトレード実践講座",
          description: "プロトレーダーへの道を歩むための実践的な講座です。厳選されたコンテンツで着実にスキルアップしていきましょう。",
          slug: "fx-trading-course",
          thumbnail: "/images/course-thumbnail.jpg",
          isPublished: true,
          price: 0
        }
      })
      console.log('✅ コース作成完了:', course.title)
    } else {
      console.log('✅ 既存コースを使用:', course.title)
    }

    // Create sample lessons with Vimeo videos
    const lessons = [
      {
        title: "サンプル動画１",
        description: "FXトレードの基礎知識とマインドセットを学びます。初心者の方でも安心して学べる内容です。",
        videoUrl: "https://player.vimeo.com/video/1115276237",
        duration: 1800, // 30 minutes
        orderIndex: 1,
        releaseType: "IMMEDIATE",
        courseId: course.id
      },
      {
        title: "サンプル動画２",
        description: "チャート分析の基本とテクニカル指標の使い方を詳しく解説します。",
        videoUrl: "https://player.vimeo.com/video/1115277774",
        duration: 2100, // 35 minutes
        orderIndex: 2,
        releaseType: "IMMEDIATE",
        courseId: course.id
      },
      {
        title: "サンプル動画３",
        description: "リスク管理とポジションサイジングの重要性について学びます。",
        videoUrl: "https://player.vimeo.com/video/1115278244",
        duration: 2400, // 40 minutes
        orderIndex: 3,
        releaseType: "DRIP",
        releaseDays: 30, // 1ヶ月後にリリース
        courseId: course.id
      },
      {
        title: "サンプル動画４",
        description: "実践的なエントリー戦略と利確・損切りのテクニックを解説します。",
        videoUrl: "https://player.vimeo.com/video/1115278388",
        duration: 2700, // 45 minutes
        orderIndex: 4,
        releaseType: "DRIP",
        releaseDays: 30, // 1ヶ月後にリリース
        courseId: course.id
      }
    ]

    for (const lessonData of lessons) {
      const lesson = await prisma.lesson.create({
        data: lessonData
      })
      console.log(`✅ レッスン作成完了: ${lesson.title}`)
    }

    console.log('🎉 すべてのサンプルデータの作成が完了しました！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()