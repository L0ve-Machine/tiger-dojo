import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { CourseService } from '../services/course.service'

const prisma = new PrismaClient()

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
        name: '山田太郎',
        role: 'STUDENT',
        age: 28,
        gender: 'MALE',
        tradingExperience: 'BEGINNER',
        discordName: 'yamada_fx',
        emailVerified: true,
        isActive: true
      }
    })

    console.log('✅ ユーザーを作成しました')

    // Create sample course
    const course = await prisma.course.create({
      data: {
        title: 'FX基礎講座 - プロトレーダーへの第一歩',
        description: 'FX取引の基礎から応用まで、段階的に学べる総合講座です。初心者の方でも安心して学習を進められるよう、分かりやすい解説と実践的な内容で構成されています。',
        slug: 'fx-basics-course',
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
        // thumbnail: Vimeo APIから自動取得
        duration: 2700, // 45 minutes
        orderIndex: 0,
        releaseType: 'IMMEDIATE'
      },
      {
        title: '第2回：チャートの読み方とテクニカル分析',
        description: 'ローソク足チャートの見方から基本的なテクニカル指標まで、チャート分析の基礎を学びます。',
        videoUrl: '1115277774', // サンプル動画２
        // thumbnail: Vimeo APIから自動取得
        duration: 3000, // 50 minutes
        orderIndex: 1,
        releaseType: 'IMMEDIATE'
      },
      // Month 1 - Available after 1 month (Next 2 videos)
      {
        title: '第3回：リスク管理とポジションサイジング',
        description: '資金管理の重要性と具体的な方法について学びます。安全に取引を続けるための必須知識です。',
        videoUrl: '1115278244', // サンプル動画３
        // thumbnail: Vimeo APIから自動取得
        duration: 2400, // 40 minutes
        orderIndex: 2,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第4回：実践的トレード戦略',
        description: 'これまでの知識を活かした実践的なトレード戦略について解説します。',
        videoUrl: '1115278388', // サンプル動画４
        // thumbnail: Vimeo APIから自動取得
        duration: 3300, // 55 minutes
        orderIndex: 3,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      // Month 2 - Available after 2 months (Next 2 videos)
      {
        title: '第5回：ファンダメンタルズ分析入門',
        description: '経済指標や金融政策が為替に与える影響について学びます。',
        videoUrl: '1115278714', // サンプル動画５
        // thumbnail: Vimeo APIから自動取得
        duration: 2800, // 47 minutes
        orderIndex: 4,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第6回：トレード心理学',
        description: 'メンタル管理の重要性と感情コントロールの手法について解説します。',
        videoUrl: '1115278714', // サンプル動画５（2ヶ月目の2本目も同じ動画を使用）
        // thumbnail: Vimeo APIから自動取得
        duration: 2500, // 42 minutes
        orderIndex: 5,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      // Month 3 - Available after 3 months (Next 2 videos)
      {
        title: '第7回：通貨ペアの特性と選び方',
        description: '主要通貨ペアの特徴と、自分に合った通貨ペアの選び方を学びます。',
        videoUrl: '1115278714', // プレースホルダー
        // thumbnail: Vimeo APIから自動取得
        duration: 2600, // 43 minutes
        orderIndex: 6,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      },
      {
        title: '第8回：エントリータイミングの判断',
        description: '最適なエントリーポイントを見極める実践的な手法を解説します。',
        videoUrl: '1115278714', // プレースホルダー
        // thumbnail: Vimeo APIから自動取得
        duration: 3100, // 52 minutes
        orderIndex: 7,
        releaseType: 'DRIP' // 月単位での開放（orderIndexベース）
      }
    ]

    const createdLessons = []
    for (let i = 0; i < lessons.length; i++) {
      const lessonData = lessons[i]
      
      try {
        const lesson = await CourseService.createLesson({
          courseId: course.id,
          title: lessonData.title,
          description: lessonData.description,
          videoUrl: lessonData.videoUrl,
          duration: lessonData.duration,
          orderIndex: lessonData.orderIndex,
          releaseType: lessonData.releaseType
          // thumbnail: Vimeo APIから自動取得される
        })

        createdLessons.push(lesson)
        console.log(`✅ レッスン作成: ${lessonData.title}`)
      } catch (error) {
        console.error(`❌ レッスン作成失敗: ${lessonData.title}`, error)
        // エラーが発生してもサムネイルなしで作成を続行
        const lesson = await prisma.lesson.create({
          data: {
            courseId: course.id,
            title: lessonData.title,
            description: lessonData.description,
            videoUrl: lessonData.videoUrl,
            duration: lessonData.duration,
            orderIndex: lessonData.orderIndex,
            releaseType: lessonData.releaseType
          }
        })
        createdLessons.push(lesson)
      }
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
        title: 'チャートパターン早見表',
        description: '主要なチャートパターンを視覚的にまとめた資料です',
        fileUrl: '/downloads/chart-patterns.pdf',
        fileType: 'PDF',
        fileSize: 1024 * 1024 * 3 // 3MB
      }
    })

    console.log('✅ 資料を作成しました')

    // Enroll student in the course
    await prisma.enrollment.create({
      data: {
        userId: studentUser.id,
        courseId: course.id
      }
    })

    // Create some progress for the student
    await prisma.progress.create({
      data: {
        userId: studentUser.id,
        lessonId: createdLessons[0].id,
        watchedSeconds: 1800, // 30 minutes watched
        completed: true,
        completedAt: new Date()
      }
    })

    await prisma.progress.create({
      data: {
        userId: studentUser.id,
        lessonId: createdLessons[1].id,
        watchedSeconds: 900, // 15 minutes watched
        completed: false
      }
    })

    console.log('✅ 受講登録と進捗を作成しました')

    // Create sample chat messages
    await prisma.chatMessage.create({
      data: {
        userId: instructorUser.id,
        lessonId: createdLessons[0].id,
        content: '本日の相場分析動画をアップしました。ドル円の重要なサポートラインについて解説しています。',
        type: 'TEXT'
      }
    })

    await prisma.chatMessage.create({
      data: {
        userId: studentUser.id,
        lessonId: createdLessons[0].id,
        content: 'ありがとうございます！RSIの使い方について質問があります。ダイバージェンスの見方を詳しく教えていただけますか？',
        type: 'QUESTION'
      }
    })

    await prisma.chatMessage.create({
      data: {
        userId: instructorUser.id,
        lessonId: createdLessons[0].id,
        content: '良い質問ですね！RSIのダイバージェンスは重要なシグナルです。明日のライブ配信で詳しく解説する予定ですが、簡単に説明すると...',
        type: 'ANSWER'
      }
    })

    console.log('✅ チャットメッセージを作成しました')

    console.log('\n🎉 シードデータの作成が完了しました！')
    console.log('\n📊 作成されたデータ:')
    console.log(`👥 ユーザー: ${await prisma.user.count()} 人`)
    console.log(`📚 コース: ${await prisma.course.count()} 個`)
    console.log(`🎬 レッスン: ${await prisma.lesson.count()} 個`)
    console.log(`📄 資料: ${await prisma.resource.count()} 個`)
    console.log(`✅ 受講登録: ${await prisma.enrollment.count()} 件`)
    console.log(`📈 進捗記録: ${await prisma.progress.count()} 件`)
    console.log(`💬 チャットメッセージ: ${await prisma.chatMessage.count()} 件`)

    console.log('\n🔑 テストユーザー情報:')
    console.log('管理者: admin@fx-tiger-dojo.com / password123!A')
    console.log('講師: instructor@fx-tiger-dojo.com / password123!A') 
    console.log('学生: student@fx-tiger-dojo.com / password123!A')

  } catch (error) {
    console.error('❌ シードエラー:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ シード実行エラー:', e)
    process.exit(1)
  })