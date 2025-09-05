import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Helper method to get Vimeo thumbnail
async function getVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    // Vimeo oEmbed APIを使用してサムネイルを取得
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`)
    
    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.thumbnail_url || null
  } catch (error) {
    console.error('Failed to fetch Vimeo thumbnail:', error)
    return null
  }
}

async function main() {
  console.log('🌱 データベースをシードしています...')

  try {
    // Clean existing data (optional - comment out if you want to keep existing data)
    await prisma.chatMessage.deleteMany({})
    await prisma.progress.deleteMany({})
    await prisma.enrollment.deleteMany({})
    await prisma.resource.deleteMany({})
    await prisma.lesson.deleteMany({})
    await prisma.course.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.user.deleteMany({})

    console.log('✅ 既存データをクリアしました')

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123!A', 12)

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fx-tiger-dojo.com',
        password: hashedPassword,
        name: 'システム管理者',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true
      }
    })

    const instructorUser = await prisma.user.create({
      data: {
        email: 'instructor@fx-tiger-dojo.com',
        password: hashedPassword,
        name: 'ASO講師',
        role: 'INSTRUCTOR',
        emailVerified: true,
        isActive: true
      }
    })

    const studentUser = await prisma.user.create({
      data: {
        email: 'student@fx-tiger-dojo.com',
        password: hashedPassword,
        name: '学習者',
        role: 'STUDENT',
        emailVerified: true,
        isActive: true
      }
    })

    console.log('✅ ユーザーを作成しました')

    // Create sample course
    const course = await prisma.course.create({
      data: {
        title: 'FXトレーディング基礎コース',
        description: 'FX取引の基礎から実践まで、プロトレーダーが教える本格的なFXコース。初心者から上級者まで対応した内容で、実践的なスキルを身につけることができます。',
        slug: 'fx-trading-basics',
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&h=360&fit=crop&crop=center',
        isPublished: true,
        price: 0
      }
    })

    console.log('✅ コースを作成しました')

    // Create lessons with monthly release schedule
    // Month 0: 2 videos, Month 1: +2 videos (total 4), Month 2: +2 videos (total 6), etc.
    const lessons = [
      // Month 0 - Available immediately (First 2 videos)
      {
        title: '第1回：FX取引の基礎知識',
        description: 'FX取引とは何か、基本的な仕組みや用語について学びます。初心者の方でも理解しやすいよう、図解を交えながら丁寧に解説します。',
        videoUrl: '1115276237', // サンプル動画１
        duration: 2700, // 45 minutes
        orderIndex: 0,
        releaseType: 'IMMEDIATE'
      },
      {
        title: '第2回：チャートの読み方とテクニカル分析',
        description: 'ローソク足チャートの見方から基本的なテクニカル指標まで、チャート分析の基礎を学びます。',
        videoUrl: '1115277774', // サンプル動画２
        duration: 3000, // 50 minutes
        orderIndex: 1,
        releaseType: 'IMMEDIATE'
      },
      // Month 1 - Available after 1 month (Next 2 videos)
      {
        title: '第3回：リスク管理とポジションサイジング',
        description: '資金管理の重要性と具体的な方法について学びます。安全に取引を続けるための必須知識です。',
        videoUrl: '1115278244', // サンプル動画３
        duration: 2400, // 40 minutes
        orderIndex: 2,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第4回：実践的トレード戦略',
        description: 'これまでの知識を活かした実践的なトレード戦略について解説します。',
        videoUrl: '1115278388', // サンプル動画４
        duration: 3300, // 55 minutes
        orderIndex: 3,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      // Month 2 - Available after 2 months (Next 2 videos)
      {
        title: '第5回：ファンダメンタルズ分析入門',
        description: '経済指標や金融政策が為替に与える影響について学びます。',
        videoUrl: '1115278714', // サンプル動画５
        duration: 2800, // 47 minutes
        orderIndex: 4,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第6回：トレード心理学',
        description: 'メンタル管理の重要性と感情コントロールの手法について解説します。',
        videoUrl: '1115278714', // サンプル動画５（2ヶ月目の2本目も同じ動画を使用）
        duration: 2500, // 42 minutes
        orderIndex: 5,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      // Month 3 - Available after 3 months (Next 2 videos)
      {
        title: '第7回：通貨ペアの特性と選び方',
        description: '主要通貨ペアの特徴と、自分に合った通貨ペアの選び方を学びます。',
        videoUrl: '1115278714', // プレースホルダー
        duration: 2600, // 43 minutes
        orderIndex: 6,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第8回：エントリータイミングの判断',
        description: '最適なエントリーポイントを見極める実践的な手法を解説します。',
        videoUrl: '1115278714', // プレースホルダー
        duration: 3100, // 52 minutes
        orderIndex: 7,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      }
    ]

    const createdLessons = []
    for (let i = 0; i < lessons.length; i++) {
      const lessonData = lessons[i]
      
      console.log(`📹 レッスン作成中: ${lessonData.title}`)
      
      // Vimeoサムネイルを取得
      let thumbnail: string | null = null
      try {
        console.log(`🔍 Vimeoサムネイル取得中: ${lessonData.videoUrl}`)
        thumbnail = await getVimeoThumbnail(lessonData.videoUrl)
        if (thumbnail) {
          console.log(`✅ サムネイル取得成功: ${thumbnail}`)
        } else {
          console.log(`⚠️ サムネイル取得失敗`)
        }
      } catch (error) {
        console.error(`❌ サムネイル取得エラー:`, error)
      }

      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lessonData.title,
          description: lessonData.description,
          videoUrl: lessonData.videoUrl,
          thumbnail,
          duration: lessonData.duration,
          orderIndex: lessonData.orderIndex,
          releaseType: lessonData.releaseType
        }
      })

      createdLessons.push(lesson)
      console.log(`✅ レッスン作成完了: ${lessonData.title}`)
    }

    console.log('✅ レッスンを作成しました')

    // Create sample resources
    await prisma.resource.create({
      data: {
        lessonId: createdLessons[0].id,
        title: 'FX用語集PDF',
        description: 'FX取引でよく使われる用語をまとめた資料です',
        fileUrl: '/downloads/fx-glossary.pdf',
        fileType: 'PDF',
        fileSize: 1024 * 1024 * 2 // 2MB
      }
    })

    await prisma.resource.create({
      data: {
        lessonId: createdLessons[1].id,
        title: 'チャート分析チートシート',
        description: '主要なテクニカル指標の使い方をまとめたチートシートです',
        fileUrl: '/downloads/chart-analysis-cheatsheet.pdf',
        fileType: 'PDF',
        fileSize: 1024 * 1024 * 3 // 3MB
      }
    })

    console.log('✅ 資料を作成しました')

    // Create sample enrollment for student
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentUser.id,
        courseId: course.id
      }
    })

    // Create sample progress for student
    await prisma.progress.create({
      data: {
        userId: studentUser.id,
        lessonId: createdLessons[0].id,
        watchedSeconds: 1350, // Half of the first lesson
        completed: false,
        lastWatchedAt: new Date()
      }
    })

    await prisma.progress.create({
      data: {
        userId: studentUser.id,
        lessonId: createdLessons[1].id,
        watchedSeconds: 3000, // Full second lesson
        completed: true,
        completedAt: new Date(),
        lastWatchedAt: new Date()
      }
    })

    console.log('✅ 受講登録と進捗を作成しました')

    console.log()
    console.log('🎉 シードデータの作成が完了しました！')
    console.log()
    console.log('📊 作成されたデータ:')
    console.log(`👥 ユーザー: 3 人`)
    console.log(`📚 コース: 1 個`)
    console.log(`🎬 レッスン: ${createdLessons.length} 個`)
    console.log(`📄 資料: 2 個`)
    console.log(`✅ 受講登録: 1 件`)
    console.log(`📈 進捗記録: 2 件`)
    console.log()
    console.log('🔑 テストユーザー情報:')
    console.log('管理者: admin@fx-tiger-dojo.com / password123!A')
    console.log('講師: instructor@fx-tiger-dojo.com / password123!A')
    console.log('学生: student@fx-tiger-dojo.com / password123!A')

  } catch (error) {
    console.error('❌ シードデータの作成中にエラーが発生しました:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()