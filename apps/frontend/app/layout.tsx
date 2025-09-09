import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FXサロン「トレード道場」- 勝てる型を一緒に作るオンライン環境',
  description: '根拠ある先出し、添削フィードバック、Zoom相談で"勝てる型"を一緒に作るFXサロン。無料体験あり。',
  keywords: 'FX, トレード道場, FXサロン, 先出し, 添削, Zoom相談, Discord',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black">
          {children}
        </div>
      </body>
    </html>
  )
}