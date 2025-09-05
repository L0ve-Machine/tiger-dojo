# FX Tiger Dojo - 作業TODO

## 🔧 Phase 1 完了後の必要作業

### 1. データベースセットアップ
- [ ] PostgreSQLのインストール・起動確認
- [ ] データベース `fx_platform` の作成
- [ ] `.env` ファイルの `DATABASE_URL` を実際の接続文字列に更新
  ```
  DATABASE_URL="postgresql://postgres:password@localhost:5432/fx_platform"
  ```

### 2. 依存関係インストール
- [ ] ルートディレクトリで `npm install`
- [ ] `cd apps/frontend && npm install`
- [ ] `cd apps/backend && npm install`

### 3. JWT シークレット生成・設定
- [ ] JWT_ACCESS_SECRET の生成・設定
- [ ] JWT_REFRESH_SECRET の生成・設定
- [ ] 以下のコマンドで生成可能：
  ```bash
  openssl rand -base64 64
  ```

### 4. Prisma データベース初期化
- [ ] `cd apps/backend`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate dev --name init`
- [ ] `npx prisma studio` でデータベース確認（オプション）

### 5. 開発サーバー起動テスト
- [ ] `npm run dev` でフロントエンド・バックエンド同時起動
- [ ] http://localhost:3000 でフロントエンドアクセス確認
- [ ] http://localhost:5000/health でバックエンドヘルスチェック確認

### 6. 基本機能テスト
- [ ] 新規登録テスト（http://localhost:3000/auth/register）
- [ ] ログインテスト（http://localhost:3000/auth/login）
- [ ] ダッシュボード表示確認（http://localhost:3000/dashboard）
- [ ] ログアウト機能テスト

### 7. トラブルシューティング確認
- [ ] ポート競合の確認（3000, 5000番ポート）
- [ ] CORS設定の動作確認
- [ ] JWT トークンの発行・検証動作確認

---

## ✅ Phase 2 完了機能

### 🎬 動画配信機能
- [x] Vimeo API統合
- [x] 動画プレーヤーコンポーネント
- [x] コース・レッスン管理API
- [x] 段階的コンテンツ解放システム
- [x] 視聴進捗トラッキング
- [x] 動画視聴ページUI
- [x] レッスン詳細ページ
- [x] シードデータとテスト環境

### 📊 管理機能（実装済み）
- [x] 動画一覧・検索機能
- [x] 学習進捗表示
- [x] コンテンツ解放スケジュール管理

## ✅ Phase 3 完了機能

### 💬 リアルタイムチャット
- [x] Socket.ioサーバー設定
- [x] Discord風チャットUI
- [x] リアルタイムメッセージング
- [x] 講師・生徒間コミュニケーション
- [x] チャット履歴管理
- [x] タイピングインジケーター
- [x] オンラインステータス管理
- [x] レッスン毎のチャットルーム
- [x] メッセージタイプ（TEXT/QUESTION/ANSWER/ANNOUNCEMENT）
- [x] チャットコンポーネント統合

### 🛠️ 管理画面
- [ ] 管理者認証システム
- [ ] 動画アップロード機能
- [ ] ユーザー管理
- [ ] 統計ダッシュボード

---

## ⚠️ 注意事項

### セキュリティ
- 本番環境では必ずJWTシークレットを安全なランダム文字列に変更
- DATABASE_URLなどの機密情報は絶対にGitにコミットしない
- HTTPS環境でのみクッキー使用を推奨

### 開発Tips
- `npm run dev` で開発サーバーを起動すると、ファイル変更時に自動リロード
- Prisma Studio を使うとデータベースの中身をGUIで確認可能
- エラーログはブラウザのDevToolsとターミナル両方を確認

### よくある問題
1. **ポート使用中エラー**: `lsof -i :3000` でポート使用状況確認
2. **データベース接続エラー**: PostgreSQLサービス起動確認
3. **CORS エラー**: バックエンドのCORS設定とフロントエンドのAPI_URL確認

---

## 📞 サポート
問題が発生した場合は、エラーメッセージとともに以下の情報を確認：
- Node.js バージョン (`node -v`)
- PostgreSQL 起動状況 (`sudo service postgresql status`)
- 環境変数設定状況 (`.env` ファイルの存在確認)