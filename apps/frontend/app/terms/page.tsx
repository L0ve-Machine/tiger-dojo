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
              本規約は、FXトレード道場（以下「当サービス」）が提供するオンライン学習サービスの利用条件を定めるものです。
              登録ユーザーの皆様（以下「ユーザー」）には、本規約に従って、本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第2条（利用登録）</h2>
            <p className="leading-relaxed mb-4">
              登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
            </p>
            <p className="leading-relaxed">
              当社は、以下のいずれかに該当する場合、利用登録の申請を承認しないことがあります：
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、当社が利用登録を相当でないと判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第3条（利用料金および支払方法）</h2>
            <p className="leading-relaxed">
              ユーザーは、本サービスの有料部分の対価として、当社が別途定め、ウェブサイトに表示する利用料金を、
              当社が指定する方法により支払うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第4条（禁止事項）</h2>
            <p className="leading-relaxed mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第5条（本サービスの提供の停止等）</h2>
            <p className="leading-relaxed">
              当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第6条（著作権）</h2>
            <p className="leading-relaxed">
              本サービスで提供される全てのコンテンツ（講習、テキスト、画像等）の著作権は当社に帰属します。
              ユーザーは、個人的な学習目的以外でこれらのコンテンツを使用、複製、配布することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第7条（免責事項）</h2>
            <p className="leading-relaxed">
              当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p className="leading-relaxed mt-4">
              投資に関する最終的な判断は、ユーザー自身の責任において行うものとし、当社は投資結果について一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第8条（サービス内容の変更等）</h2>
            <p className="leading-relaxed">
              当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第9条（利用規約の変更）</h2>
            <p className="leading-relaxed">
              当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第10条（準拠法・裁判管轄）</h2>
            <p className="leading-relaxed">
              本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-700">
            <p className="text-gray-400">
              制定日：2025年1月1日<br />
              最終更新日：2025年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}