import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDefaultChatRooms() {
  console.log('🔄 デフォルトチャットルームを作成しています...')

  const defaultRooms = [
    {
      title: 'General',
      slug: 'general',
      description: '一般的な雑談や質問のためのチャットルーム'
    },
    {
      title: 'Announcements',
      slug: 'announcements', 
      description: '重要なお知らせや発表のためのチャットルーム'
    },
    {
      title: 'Questions',
      slug: 'questions',
      description: '学習に関する質問や疑問のためのチャットルーム'
    },
    {
      title: 'Resources',
      slug: 'resources',
      description: '有益な資料やリンクの共有のためのチャットルーム'
    }
  ]

  for (const room of defaultRooms) {
    // Check if room already exists
    const existingRoom = await prisma.course.findUnique({
      where: { slug: room.slug }
    })

    if (!existingRoom) {
      await prisma.course.create({
        data: {
          title: room.title,
          slug: room.slug,
          description: room.description,
          isPublished: true
        }
      })
      console.log(`✅ チャットルーム「${room.title}」を作成しました`)
    } else {
      console.log(`⚠️  チャットルーム「${room.title}」は既に存在します`)
    }
  }

  console.log('✨ デフォルトチャットルームの作成が完了しました！')
}

createDefaultChatRooms()
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })