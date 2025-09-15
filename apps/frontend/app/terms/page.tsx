'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-8">利用規約</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第1条（適用）</h2>
            <p className="leading-relaxed">
              本規約は、FXトレード道場（以下「当サロン」といいます）が提供するプレミアム会員向け動画配信サイト（以下「本サイト」といいます）の利用条件を定めるものです。会員は、本規約に同意のうえ本サイトを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第2条（利用対象者）</h2>
            <p className="leading-relaxed mb-4">
              1. 本サイトは、当サロンのプレミアムプランに入会した会員のみが利用できます。
            </p>
            <p className="leading-relaxed">
              2. プレミアムプラン退会と同時に、本サイトへのログイン権限および動画の閲覧権限は失効します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第3条（禁止事項）</h2>
            <p className="leading-relaxed mb-4">会員は、本サイトの利用にあたり、以下の行為を行ってはなりません。</p>
            <ul className="list-decimal ml-6 space-y-1">
              <li>本サイトに掲載された動画・講習の録画、ダウンロード、スクリーンショット、その他複製・保存行為</li>
              <li>本サイトのコンテンツを第三者に共有、SNS等外部へ流出させる行為</li>
              <li>アカウントを第三者に貸与、譲渡、共有する行為</li>
              <li>本サイトで配信されるコンテンツを模倣し、類似の講習や動画を制作・販売・配信する行為</li>
              <li>本サイトで得た情報を第三者に発信・公開する行為</li>
              <li>法令または公序良俗に反する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第4条（違反時の措置）</h2>
            <p className="leading-relaxed mb-4">
              1. 会員が前条の禁止事項に違反した場合、当サロンは直ちに会員資格を停止・退会処分とし、本サイトへのアクセスを停止します。
            </p>
            <p className="leading-relaxed">
              2. 違反内容に応じて、当サロンは損害賠償請求、法的措置を講じる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第5条（利用料金と支払い）</h2>
            <p className="leading-relaxed mb-4">
              1. 本サイトの利用は、当サロンのプレミアムプランの会費に含まれます。
            </p>
            <p className="leading-relaxed mb-4">
              2. 会費の支払いが滞った場合、当サロンは会員資格を停止・退会処分とし、本サイトへのアクセスを停止します。
            </p>
            <p className="leading-relaxed">
              3. 支払い後の返金は、個別の事情により当サロンが認める場合を除き、原則として行いません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第6条（退会・再入会）</h2>
            <p className="leading-relaxed mb-4">
              1. 会員は、当サロンの定める手続により退会できます。
            </p>
            <p className="leading-relaxed">
              2. 原則として退会後の再入会は認めません。ただし、特別な事情により当サロンが認めた場合、一定期間の休止措置をとることがあります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第7条（知的財産権）</h2>
            <p className="leading-relaxed">
              本サイトで提供される全ての動画、講習、資料、画像、音声、テキストその他一切のコンテンツに関する著作権等の知的財産権は、当サロンまたは正当な権利者に帰属します。会員は、当サロンの事前の承諾なく、これらを複製、転載、配布、改変、販売、公衆送信等することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第8条（免責事項）</h2>
            <p className="leading-relaxed mb-4">
              1. 本サイトの利用により会員に生じた損害について、当サロンは一切の責任を負いません。
            </p>
            <p className="leading-relaxed">
              2. 本サイトの提供は、システム障害、天災地変、通信環境等により一時的に中断されることがあります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第9条（規約の変更）</h2>
            <p className="leading-relaxed">
              当サロンは、本規約を随時変更できるものとし、変更後の規約は本サイトに掲載した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第10条（準拠法・管轄）</h2>
            <p className="leading-relaxed">
              本規約は日本法を準拠法とし、本規約に関して生じた紛争については、当サロン所在地を管轄する裁判所を第一審の専属的合意管轄とします。
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