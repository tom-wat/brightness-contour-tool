# 輝度等高線＋Cannyエッジ検出アプリ開発ガイド

## 🎯 概要

画像の輝度値を地形図風の等高線で視覚化し、Cannyエッジ検出による輪郭抽出機能を組み合わせた高度な画像解析 Web アプリケーション

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
├── types/              # 型定義
│   ├── ImageTypes.ts   # 画像・等高線関連型
│   ├── CannyTypes.ts   # Cannyエッジ検出型
│   └── UITypes.ts      # UI・表示モード型
├── components/         # Reactコンポーネント
│   ├── ImageUploader.tsx      # 画像アップロード
│   ├── ImageCanvas.tsx        # メイン描画キャンバス
│   ├── ImageViewControls.tsx  # ズーム・パン操作UI
│   ├── ControlPanel.tsx       # 等高線設定パネル
│   └── CannyControls.tsx      # Cannyエッジ検出設定
├── hooks/              # カスタムフック
│   ├── useImageUpload.ts       # 画像アップロード処理
│   ├── useBrightnessAnalysis.ts # 輝度解析・等高線生成
│   ├── useCannyDetection.ts    # Cannyエッジ検出
│   └── useCanvasRenderer.ts    # Canvas描画制御
├── App.tsx             # メインアプリコンポーネント
└── main.tsx            # エントリーポイント
```

## 🔧 技術スタック

- **React 18** + **TypeScript**
- **Tailwind CSS** (スタイリング)
- **Vite** (開発・ビルドツール)
- **HTML5 Canvas API** (画像処理・描画)
- **ESLint + Prettier** (コード品質)
- **独自Cannyエッジ検出実装** (高速Canvas API版)

## ⚡ 開発ルール

1. **型チェック必須**: 実装後は必ず `npm run type-check` 実行
2. **段階的実装**: 小さなコンポーネント単位で完成させる
3. **Reactパターン**: 
   - カスタムフック活用（useBrightnessAnalysis, useCannyDetection等）
   - propsの型定義必須
   - useEffectでのクリーンアップ実装
4. **メモリ管理**: Canvas/ImageData の適切な破棄（useEffectのクリーンアップ）
5. **レスポンシブ対応**: Tailwind CSSでモバイルファースト設計
6. **進捗管理**: TodoWriteツールで実装ログを記録
   - 各コンポーネント完了時に `completed` マーク
   - 次の実装を `in_progress` で明示
   - 問題や追加タスクを動的追加
7. **スタイリング規則**: 
   - **NEVER use inline styles** (`style={{}}` は禁止)
   - Tailwind CSS utilities only
   - コンポーネント内部でのmargin/border設定禁止

## 🎨 命名規則

- **型定義**: `BrightnessData`, `ContourSettings`, `CannyParams`
- **コンポーネント**: `ImageUploader`, `ImageCanvas`, `CannyControls`
- **カスタムフック**: `useBrightnessAnalysis`, `useCannyDetection`, `useCanvasRenderer`
- **関数・変数**: `camelCase`
- **定数**: `MAX_IMAGE_SIZE`, `DEFAULT_CONTOUR_LEVELS`
- **CSS クラス**: Tailwind utilities使用

## 🎨 コンポーネント設計指針

### メインコンポーネント構成
```tsx
App
├── ImageUploader          # 画像アップロード（ドラッグ&ドロップ）
├── ImageViewControls      # ズーム・パン操作UI（将来実装）
├── ImageCanvas            # メイン描画キャンバス
├── ControlPanel           # 等高線設定（Basic/Cannyモード分離）
└── CannyControls          # Cannyエッジ検出専用設定
```

### 実装済み表示モード（9種類）
**Basic Modes:**
- `COLOR_ONLY`: 元画像のみ
- `GRAYSCALE_ONLY`: グレースケール画像のみ
- `CONTOUR_ONLY`: 等高線のみ
- `COLOR_WITH_CONTOUR`: カラー画像＋等高線
- `GRAYSCALE_WITH_CONTOUR`: グレースケール＋等高線

**Canny Edge Detection:**
- `CANNY_EDGE_ONLY`: Cannyエッジのみ（黒背景）
- `COLOR_WITH_CANNY`: カラー画像＋Cannyエッジ
- `CONTOUR_WITH_CANNY`: 等高線＋Cannyエッジ
- `COLOR_WITH_CONTOUR_AND_CANNY`: 複合表示（全合成）

### カスタムフック活用
- `useBrightnessAnalysis`: 輝度データ計算・等高線生成
- `useCannyDetection`: Cannyエッジ検出（独自実装）
- `useCanvasRenderer`: Canvas描画制御・レイヤー合成
- `useImageUpload`: 画像アップロード処理・検証

## 🚀 実装状況

### ✅ Phase 1完了 (MVP)
- [x] 画像アップロード機能（ドラッグ&ドロップ対応）
- [x] 輝度解析・等高線表示（Canvas API）
- [x] 基本表示モード5種類
- [x] ControlPanel（輝度レベル、透明度、ガウシアンブラー）

### ✅ Phase 2完了 (Cannyエッジ検出)
- [x] 独自Cannyエッジ検出実装（高速Canvas版）
- [x] Canny表示モード4種類追加
- [x] CannyControlsコンポーネント（閾値調整・自動検出）
- [x] ImageViewControlsコンポーネント（将来のズーム・パン用）
- [x] UI改善（モード分離表示、パディング調整）

### 🔄 Phase 3予定 (高精度処理・UI向上)
- [ ] ズーム・パン機能実装
- [ ] OpenCV.js統合（高精度モード）
- [ ] エッジ後処理機能
- [ ] 画像保存機能
- [ ] プリセット機能

---

**詳細仕様**: `docs/requirements.md` 参照