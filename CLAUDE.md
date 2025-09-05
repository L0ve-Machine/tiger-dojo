# Claude Code - FX Tiger Dojo プロジェクト重要情報

## ⚠️ 重要なログイン情報
**絶対に削除・変更しないこと**

### ユーザーアカウント
- **student@fx-tiger-dojo.com** / パスワード: `password123!A`
- **admin@fx-tiger-dojo.com** / パスワード: `password123!A`

## 📁 データベース情報
- **場所**: `apps/backend/prisma/dev.db`
- **接続文字列**: `file:./dev.db` (相対パス)
- **⚠️ データベースファイルを削除してはいけない**

## 🚀 開発サーバー起動
```bash
npm run dev  # プロジェクトルートから実行
```
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:5000

## 💳 PayPal決済リンク
- **スタンダードプラン (¥15,000)**: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ
- **プレミアムプラン (¥40,000)**: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6NX871965X4205206NAAKOJI

## 🔗 SNSリンク
- **YouTube**: https://youtube.com/@aso_trade_infx?si=Szeu_8dcrATZ--0U
- **LINE**: https://line.me/ti/g2/9Pr6jxLGQOdaKuKY5eDLAOa3-p8zU5Ht8N1laA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default
- **X (Twitter)**: https://twitter.com/ASO_TRADE_SC

## 🛠️ データベース復旧手順
もしデータベースが消えた場合:
```bash
cd apps/backend
npx tsx scripts/restore-users.ts
```

## 📝 プロジェクト構成
- 料金プラン: 2つ（スタンダード・プレミアム）
- 動画アクセス: 有料会員のみ
- 認証システム: JWT + Cookie
- データベース: SQLite (開発環境)

## ⚠️ 注意事項
1. **データベースファイルを削除しない**
2. **ユーザーアカウント情報を変更しない**
3. **PayPalリンクを変更する場合は事前確認**
4. **開発サーバー再起動時はDBの存在確認**

---
*このファイルはClaude Codeが参照する重要情報です。削除・変更しないでください。*