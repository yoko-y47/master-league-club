# Master League Club

サッカーゲーム「マスターリーグ」のクラブ運営データ（選手・試合・成績・移籍・タイトル等）を記録・閲覧する個人用Webアプリ。

## 技術構成

- フロントエンド: Vite + React + TypeScript + Tailwind CSS
- ルーティング: React Router (HashRouter)
- バックエンド: Supabase (PostgreSQL + Auth + RLS)
- 公開: GitHub Pages（`.github/workflows/deploy.yml`で`main`push時に自動デプロイ）

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # Supabaseの URL / anon key を設定
npm run dev
```

## ビルド

```bash
npm run build
npm run preview
```

## 開発フェーズ

進行中。詳細はプロジェクトの会話履歴・issueを参照。

1. プロジェクト初期構築（本フェーズ）
2. SupabaseのDB構築（テーブル・リレーション・RLS）
3. クラブ・シーズン管理
4. 選手管理
5. 試合管理
6. 選手成績・シーズン成績
7. 移籍・タイトル管理
8. Dashboard・統計表示
9. UI/UX改善・スマホ最適化
10. GitHub Pagesへの本番公開・動作確認
