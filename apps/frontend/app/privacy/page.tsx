'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          トップに戻る
        </Link>

        <h1 className="text-4xl font-bold mb-8">プライバシーポリシー</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. 基本方針</h2>
            <p className="leading-relaxed">
              FXトレード道場（以下「当サロン」）は、会員の個人情報を保護することを重要な責務と考え、以下の方針に基づき個人情報を取り扱います。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. 収集する情報</h2>
            <p className="leading-relaxed mb-4">
              当サロンは、以下の情報を収集します。
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>氏名、メールアドレス、Discord名、決済情報など会員登録に必要な情報</li>
              <li>動画閲覧履歴、利用状況に関する情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. 利用目的</h2>
            <p className="leading-relaxed mb-4">
              収集した個人情報は以下の目的で利用します。
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>会員管理（入退会、料金請求、アカウント管理）</li>
              <li>動画配信サービスの提供および改善</li>
              <li>サポート対応、連絡、案内</li>
              <li>法令に基づく対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. 第三者提供</h2>
            <p className="leading-relaxed mb-4">
              当サロンは、次の場合を除き、会員の同意なく個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>法令に基づく場合</li>
              <li>会員の生命・身体・財産を保護するために必要な場合</li>
              <li>サービス提供に必要な業務を委託する場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. 個人情報の管理</h2>
            <p className="leading-relaxed">
              当サロンは、個人情報の漏洩、滅失、改ざんを防止するため適切な管理を行います。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. 開示・訂正・削除</h2>
            <p className="leading-relaxed">
              会員から自己の個人情報に関する開示・訂正・削除の請求があった場合、速やかに対応します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. プライバシーポリシーの変更</h2>
            <p className="leading-relaxed">
              当サロンは、本プライバシーポリシーを必要に応じて改定します。改定後の内容は本サイトに掲載した時点で効力を生じます。
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-700">
            <p className="text-gray-400">
              制定日：2025年9月15日<br />
              最終更新日：2025年9月15日
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}