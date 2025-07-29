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
│   ├── NoiseReductionTypes.ts  # ノイズ除去型
│   └── UITypes.ts      # UI・表示モード型
├── components/         # Reactコンポーネント
│   ├── ImageUploader.tsx      # 画像アップロード
│   ├── ImageCanvas.tsx        # メイン描画キャンバス
│   ├── ImageViewControls.tsx  # ズーム・パン操作UI
│   ├── ControlPanel.tsx       # 等高線設定パネル
│   ├── CannyControls.tsx      # Cannyエッジ検出設定
│   └── NoiseReductionControls.tsx  # ノイズ除去設定
├── hooks/              # カスタムフック
│   ├── useImageUpload.ts       # 画像アップロード処理
│   ├── useBrightnessAnalysis.ts # 輝度解析・等高線生成
│   ├── useCannyDetection.ts    # Cannyエッジ検出
│   ├── useNoiseReduction.ts    # ノイズ除去処理
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
├── ImageViewControls      # ズーム・パン操作UI
├── ImageCanvas            # メイン描画キャンバス
├── ControlPanel           # 等高線設定
├── CannyControls          # Cannyエッジ検出専用設定
└── NoiseReductionControls # ノイズ除去専用設定（Phase 4）
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
- `useNoiseReduction`: ノイズ除去処理（OpenCV.js統合）
- `useCanvasRenderer`: Canvas描画制御・レイヤー合成
- `useImageUpload`: 画像アップロード処理・検証

## 🚀 実装状況

### ✅ Phase 1完了 (MVP)
- [x] 画像アップロード機能（ドラッグ&ドロップ対応）
- [x] 輝度解析・等高線表示（Canvas API）
- [x] 基本表示モード5種類
- [x] ControlPanel（輝度レベル、透明度、ガウシアンブラー）

### ✅ Phase 2完了 (Cannyエッジ検出)
- [x] OpenCV.js統合（高精度Cannyエッジ検出）
- [x] Canny表示モード5種類（GRAYSCALE_WITH_CONTOUR_AND_CANNY追加）
- [x] CannyControlsコンポーネント（閾値調整・自動検出・透明度制御）
- [x] エッジ色制御（白/暗色モード切り替え）
- [x] リアルタイム処理状況表示

### ✅ Phase 3完了 (高度機能・UI向上)
- [x] **ズーム・パン機能**
  - useZoomPanカスタムフック実装
  - マウスドラッグによるパン操作
  - +/- ボタン、Fit、100%プリセット機能
  - 画像読み込み時自動フィット
  - Canvas中央配置・サイズ制限（70vh, 最大800px）
- [x] **エッジ後処理機能**
  - Zhang-Suenアルゴリズムによるエッジ細線化
  - 連結成分解析による短いエッジ除去（5-50px設定可能）
  - エンドポイント検出・Bresenham線描画によるエッジ連結（1-15px設定可能）
  - EdgeProcessingControlsコンポーネント（トグル・スライダーUI）
- [x] **画像エクスポート機能**
  - PNG/JPEG形式対応・品質調整（10-100%）
  - カスタムファイル名・自動ファイル名生成
  - メタデータ付きエクスポート（設定情報保存）
  - ExportControlsコンポーネント（統合UI）

### 🎨 UI/UX改善完了
- [x] **レイアウト再構築**
  - 3パネル構成：左サイドバー（操作）・中央（Canvas）・右サイドバー（設定・エクスポート）
  - ContourControls・CannyControls・EdgeProcessingControls分離
  - DisplaySettings右サイドバー統合
- [x] **カラーリング統一**
  - slate-系から無彩色gray-系に変更
  - 統一されたニュートラルデザイン
- [x] **スクロール最適化**
  - サイドバー独立スクロール
  - 画面全体スクロール無効化
  - 固定高さ制限（calc(100vh-73px)）

### 🔄 Phase 4予定 (ノイズ除去機能)
- [ ] **OpenCV.jsノイズ除去機能**
  - メディアンフィルタ（塩胡椒ノイズ除去）
  - バイラテラルフィルタ（エッジ保持ノイズ除去）
  - Non-Local Means Denoising（高精度ノイズ除去）
  - モルフォロジー演算（開閉処理）
  - NoiseReductionControlsコンポーネント（フィルタ選択・パラメータ調整UI）
- [ ] **ノイズ除去表示モード追加**
  - `DENOISED_ONLY`: ノイズ除去画像のみ
  - `COLOR_WITH_DENOISED_CONTOUR`: カラー画像＋ノイズ除去後等高線
  - `DENOISED_WITH_CANNY`: ノイズ除去画像＋Cannyエッジ
  - `ALL_WITH_DENOISING`: 全合成（ノイズ除去適用）
- [ ] **実装詳細**
  - useNoiseReductionカスタムフック（OpenCV.js統合）
  - フィルタパラメータ設定（カーネルサイズ、強度、反復回数）
  - プリセット機能（写真用、イラスト用、医療画像用）
  - リアルタイムプレビュー機能
  - ノイズ除去前後比較表示

### 🔄 Phase 5予定 (任意実装)
- [ ] プリセット管理システム
- [ ] ウォーターマーク機能
- [ ] バッチ処理機能

---

**詳細仕様**: `docs/requirements.md` 参照