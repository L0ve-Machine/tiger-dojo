# PayPalリンク変更ガイド（簡単版）

このガイドでは、PayPalの決済リンクを変更する方法を簡単に説明します。

## 🎯 現在のPayPalリンク

現在のシステムでは、以下のような直接リンクを使用しています：

```
スタンダードプラン: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ
プレミアムプラン: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6NX871965X4205206NAAKOJI
```

このリンクをクリックすると、ユーザーは直接PayPalの決済ページに移動して、定期支払いの申し込みができます。

---

## 🔄 リンク変更の手順（5ステップ）

### ステップ1: PayPal管理画面にログイン
- https://www.paypal.com/businessmanage/account/ にアクセス
- PayPal Business アカウントでログイン

### ステップ2: 新しい定期支払いプランを作成
1. 「商品とサービス」→「定期支払い」をクリック
2. 「プランを作成」をクリック
3. 以下を入力：
   - **プラン名**: 例「FXトレード道場 スタンダードプラン（新料金）」
   - **料金**: 新しい金額（例：¥18,000）
   - **請求サイクル**: 月次
4. 「プランを作成」をクリック

### ステップ3: 新しいリンクをコピー
1. 作成したプランをクリック
2. 「共有」または「リンクを取得」をクリック  
3. 表示されるURL全体をコピー
   - 例：`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-新しいID`

### ステップ4: プログラムファイルを更新
以下の3つのファイルで古いリンクを新しいリンクに置き換え：

1. **CLAUDE.md**
```markdown
# 変更前
- **スタンダードプラン (¥15,000)**: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ

# 変更後  
- **スタンダードプラン (¥18,000)**: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-新しいID
```

2. **apps/frontend/components/subscription/PricingPlans.tsx**
```tsx
// 変更前
paypalLink: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ'

// 変更後
paypalLink: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-新しいID'
```

### ステップ5: 古いプランを無効化
1. PayPal管理画面で古いプランを選択
2. 「プランを無効化」をクリック
3. これで新規申し込みを停止できます

---

## 💡 重要なポイント

### 📝 URLの構造
PayPalの定期支払いリンクは以下の構造になっています：
```
https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=プランID
```

**変更するのは「プランID」の部分だけ**です。

### ⚠️ 注意事項
1. **古いプランは無効化する**：新しいプランを作成したら、古いプランは必ず無効化
2. **全ファイルを更新する**：リンクが記載されているすべてのファイルを更新
3. **テストする**：変更後は必ずリンクが正しく動作するかテスト

### 🧪 テスト方法
1. ウェブサイトの「今すぐ申し込む」ボタンをクリック
2. PayPalの正しいページに移動することを確認
3. 表示される金額が新しい料金になっていることを確認
4. **実際に決済はしない**（テストの場合）

---

## 📞 困った時は

### よくある問題
- **リンクをクリックしてもPayPalページが開かない**
  → URLが正しくコピーされているか確認
  
- **古い金額が表示される**
  → 新しいプランのURLを使用しているか確認
  
- **「このプランは利用できません」と表示される**
  → プランが有効になっているかPayPal管理画面で確認

### 確認すべきファイル
リンクが記載されている可能性があるファイル：
- `CLAUDE.md`
- `apps/frontend/components/subscription/PricingPlans.tsx`
- `apps/frontend/app/page.tsx`（もしリンクが直接記載されている場合）

---

**最終更新**: 2025年9月17日  
**対象**: PayPalリンク変更作業