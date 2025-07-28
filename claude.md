# 輝度等高線表示アプリ開発ガイド

## 🎯 概要

画像の輝度値を地形図風の等高線で視覚化する Web アプリケーション

## 🚀 クイックスタート

```bash
npm run dev     # 開発サーバー起動
npm run build   # プロダクションビルド
npm run lint    # ESLint実行
npm run type-check  # 型チェック実行
```

## 📁 プロジェクト構成

```
src/
├── types/       # 型定義
├── core/        # メインロジック（輝度計算、等高線生成）
├── components/  # Reactコンポーネント
│   ├── ui/      # 基本UIコンポーネント
│   ├── canvas/  # Canvas関連コンポーネント
│   └── controls/ # 操作パネルコンポーネント
├── hooks/       # カスタムフック
├── utils/       # ユーティリティ関数
├── App.tsx      # メインアプリコンポーネント
└── main.tsx     # エントリーポイント
```

## 🔧 技術スタック

- **React 18** + **TypeScript**
- **Tailwind CSS** (スタイリング)
- **Vite** (開発・ビルドツール)
- **HTML5 Canvas API** (画像処理・描画)
- **ESLint + Prettier** (コード品質)

## ⚡ 開発ルール

1. **型チェック必須**: 実装後は必ず `npm run type-check` 実行
2. **段階的実装**: 小さなコンポーネント単位で完成させる
3. **Reactパターン**: 
   - カスタムフック活用（useCanvas, useBrightnessAnalysis等）
   - propsの型定義必須
   - useEffectでのクリーンアップ実装
4. **メモリ管理**: Canvas/ImageData の適切な破棄（useEffectのクリーンアップ）
5. **レスポンシブ対応**: Tailwind CSSでモバイルファースト設計
6. **進捗管理**: TodoWriteツールで実装ログを記録
   - 各コンポーネント完了時に `completed` マーク
   - 次の実装を `in_progress` で明示
   - 問題や追加タスクを動的追加

## 🎨 命名規則

- **型定義**: `BrightnessData`, `ContourSettings`
- **コンポーネント**: `ImageUploader`, `ContourCanvas`
- **カスタムフック**: `useBrightnessAnalysis`, `useCanvasRenderer`
- **関数・変数**: `camelCase`
- **定数**: `MAX_IMAGE_SIZE`, `DEFAULT_CONTOUR_LEVELS`
- **CSS クラス**: Tailwind utilities使用

## 🎨 コンポーネント設計指針

### メインコンポーネント構成
```tsx
App
├── ImageUploader     # 画像アップロード
├── ControlPanel      # 等高線設定パネル
├── ContourCanvas     # メイン描画エリア
└── StatusDisplay     # 処理状況表示
```

### カスタムフック活用
- `useBrightnessAnalysis`: 輝度データ計算
- `useCanvasRenderer`: Canvas描画制御
- `useImageUpload`: 画像アップロード処理
- `useContourSettings`: 等高線設定管理

---

**詳細設定**: `docs/` フォルダ参照