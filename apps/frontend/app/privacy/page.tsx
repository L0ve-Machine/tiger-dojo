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
            <p className="leading-relaxed">
              FXトレード道場（以下「当サービス」）は、本ウェブサイト上で提供するサービスにおける、
              ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第1条（個人情報）</h2>
            <p className="leading-relaxed">
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、
              当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び
              容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報を指します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第2条（個人情報の収集方法）</h2>
            <p className="leading-relaxed">
              当サービスは、ユーザーが利用登録をする際に氏名、メールアドレス、Discord名などの個人情報をお尋ねすることがあります。
              また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録に関する情報を、
              当サービスの提携先（情報提供元、広告主、広告配信先などを含みます。以下「提携先」）などから収集することがあります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第3条（個人情報を収集・利用する目的）</h2>
            <p className="leading-relaxed mb-4">
              当サービスが個人情報を収集・利用する目的は、以下のとおりです：
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>当サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等の案内のメールを送付するため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
              <li>上記の利用目的に付随する目的</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第4条（利用目的の変更）</h2>
            <p className="leading-relaxed">
              当サービスは、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
              利用目的の変更を行った場合には、変更後の目的について、当サービス所定の方法により、ユーザーに通知し、
              または本ウェブサイト上に公表するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第5条（個人情報の第三者提供）</h2>
            <p className="leading-relaxed mb-4">
              当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません：
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              <li>予め次の事項を告知あるいは公表し、かつ当サービスが個人情報保護委員会に届出をしたとき</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第6条（個人情報の開示）</h2>
            <p className="leading-relaxed">
              当サービスは、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。
              ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、
              開示しない決定をした場合には、その旨を遅滞なく通知します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第7条（個人情報の訂正および削除）</h2>
            <p className="leading-relaxed">
              ユーザーは、当サービスの保有する自己の個人情報が誤った情報である場合には、
              当サービスが定める手続きにより、当サービスに対して個人情報の訂正、追加または削除（以下「訂正等」）を請求することができます。
            </p>
            <p className="leading-relaxed mt-4">
              当サービスは、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、
              遅滞なく、当該個人情報の訂正等を行うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第8条（個人情報の利用停止等）</h2>
            <p className="leading-relaxed">
              当サービスは、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、
              または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」）を求められた場合には、
              遅滞なく必要な調査を行います。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第9条（Cookie）</h2>
            <p className="leading-relaxed">
              当サービスは、ユーザーの利便性向上のため、Cookie を使用することがあります。
              Cookie は、ウェブサイトの運用に関連するサーバーから、ユーザーのブラウザに送信される情報で、
              ユーザーのコンピューターに記録されます。
            </p>
            <p className="leading-relaxed mt-4">
              ユーザーは Cookie の受け取りを拒否することができますが、その場合、当サービスの一部の機能が利用できなくなる可能性があります。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第10条（プライバシーポリシーの変更）</h2>
            <p className="leading-relaxed">
              本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
              当サービスが別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">第11条（お問い合わせ窓口）</h2>
            <p className="leading-relaxed">
              本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
            </p>
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <p>サービス名：FXトレード道場</p>
              <p>お問い合わせ先：麻生個人LINE</p>
              <p>URL：https://lin.ee/EzJAtsw</p>
            </div>
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