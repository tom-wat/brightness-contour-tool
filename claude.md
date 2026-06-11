# Brightness Contour 開発ガイド

## 🎯 概要

画像の輝度値を地形図風の等高線で視覚化する画像解析 Web アプリケーション（PWA対応）。
等高線に加えて、OpenCV.js による画像フィルタ（メディアン／ガウシアン）と周波数分離（Frequency Separation）を組み合わせ、レイヤー方式で自由に合成表示できる。

## 🚀 クイックスタート

```bash
npm run dev         # 開発サーバー起動
npm run build       # プロダクションビルド（tsc -b && vite build）
npm run lint        # ESLint実行
npm run type-check  # 型チェック実行
npm run preview     # ビルド結果のプレビュー
```

注意: `postinstall` で `node_modules/@techstark/opencv-js/dist/opencv.js` を `public/opencv.js` にコピーする（`public/opencv.js` は .gitignore 対象）。OpenCV.js は `index.html` の `<script async>` で読み込み、PWA の runtime cache でキャッシュされる。

## 📁 プロジェクト構成

```
src/
├── types/
│   ├── ImageTypes.ts        # 画像・等高線設定（BrightnessData, ContourSettings 等）
│   ├── ImageFilterTypes.ts  # 画像フィルタ設定（median / gaussian）
│   ├── FrequencyTypes.ts    # 周波数分離設定・データ
│   └── UITypes.ts           # 表示レイヤー設定（DisplayLayers, DisplayOptions）
├── components/
│   ├── ImageUploader.tsx        # 画像アップロード（ドラッグ&ドロップ対応）
│   ├── ImageCanvas.tsx          # メイン描画キャンバス（ズーム・パンUI含む）
│   ├── ContourControls.tsx      # 等高線設定（左サイドバー）
│   ├── ImageFilterControls.tsx  # 画像フィルタ設定（左サイドバー）
│   ├── FrequencyControls.tsx    # 周波数分離設定（左サイドバー）
│   ├── DisplaySettings.tsx      # レイヤー表示切替＋エクスポート（右サイドバー）
│   ├── ExportControls.tsx       # エクスポートUI（DisplaySettings 内で使用）
│   └── MobileControlPanel.tsx   # モバイル用ボトムパネル（タブ切替）
├── hooks/
│   ├── useImageUpload.ts          # 画像アップロード処理・検証
│   ├── useBrightnessAnalysis.ts   # 輝度解析（brightnessMap 生成）
│   ├── useCanvasRenderer.ts       # 等高線検出・レイヤー合成・Canvas描画
│   ├── useImageFilter.ts          # 画像フィルタ（OpenCV.js: medianBlur / GaussianBlur）
│   ├── useFrequencySeparation.ts  # 周波数分離（低周波／高周波明・暗・合成）
│   ├── useZoomPan.ts              # ズーム・パン（マウス／タッチ・ピンチ対応）
│   ├── useImageExport.ts          # PNG / JPEG / WebP エクスポート
│   └── useLocalStorage.ts         # SettingsStorage（localStorage への設定永続化）
├── utils/
│   └── OpenCVProcessor.ts   # OpenCV.js のロード管理（シングルトン）と型定義
├── App.tsx                  # メインアプリ（状態管理・レイアウト）
└── main.tsx                 # エントリーポイント
```

## 🔧 技術スタック

- **React 18** + **TypeScript**（strict, `noUncheckedIndexedAccess` 有効）
- **Tailwind CSS**（スタイリング）
- **Vite 7** + **vite-plugin-pwa**（PWA・opencv.js の runtime caching）
- **HTML5 Canvas API**（画像処理・描画）
- **OpenCV.js**（@techstark/opencv-js — 画像フィルタ・周波数分離で使用）
- **ESLint**（flat config）

## 🖼️ 表示システム（レイヤー方式）

表示は `DisplayOptions`（`src/types/UITypes.ts`）によるレイヤーの ON/OFF 合成で行う：

| レイヤー | 内容 |
|---|---|
| `original` | 元画像 |
| `filtered` | 画像フィルタ適用後の画像（opacity でブレンド） |
| `contour` | 元画像の輝度等高線 |
| `filteredContour` | フィルタ後画像から生成した等高線 |
| `lowFrequency` | 周波数分離の低周波成分 |
| `highFrequencyBright` | 高周波・明成分（Linear Light 合成） |
| `highFrequencyDark` | 高周波・暗成分（Linear Light 合成） |
| `highFrequencyCombined` | 高周波・明暗合成 |

加えて `grayscaleMode`（全レイヤーをグレースケール化）がある。
合成処理は `useCanvasRenderer.renderWithLayers` に集約されている。
ベース画像（original / filtered）が無い場合は透明背景に等高線のみを描画する。

## 🎛️ UIレイアウト

- **デスクトップ（lg以上）**: 3パネル構成 — 左サイドバー（Contour / Image Filter / Frequency 設定）・中央（Canvas）・右サイドバー（レイヤー表示切替・エクスポート）
- **モバイル**: Canvas ＋ ボトムの `MobileControlPanel`（タブで各設定パネルを切替）
- 等高線設定の変更は 150ms デバウンスで再解析。画像フィルタ・周波数分離は Apply ボタンで明示実行

## 💾 設定の永続化

`SettingsStorage`（`src/hooks/useLocalStorage.ts`）が localStorage に保存：
等高線設定・表示オプション・画像フィルタ設定・周波数分離設定・エクスポート設定・周波数レイヤー一括トグル状態。
読み込み時の値検証は最小限（`getContourSettings` の欠損フィールド補完のみ）なので、設定のシェイプを変えるときはマイグレーションを追加すること。

## ⚡ 開発ルール

1. **型チェック必須**: 実装後は必ず `npm run type-check` と `npm run lint` を実行
2. **Reactパターン**:
   - カスタムフック活用（useBrightnessAnalysis, useImageFilter, useCanvasRenderer 等）
   - props の型定義必須
   - useEffect でのクリーンアップ実装
3. **メモリ管理**:
   - Canvas / ImageData の適切な破棄
   - OpenCV の Mat オブジェクトは必ず `delete()` する（try/finally パターン）
4. **レスポンシブ対応**: Tailwind CSS でモバイルファースト設計
5. **スタイリング規則**:
   - **NEVER use inline styles**（`style={{}}` は禁止）
   - Tailwind CSS utilities only

## 🎨 命名規則

- **型定義**: `BrightnessData`, `ContourSettings`, `FrequencySettings`
- **コンポーネント**: `ImageCanvas`, `ContourControls`, `DisplaySettings`
- **カスタムフック**: `useBrightnessAnalysis`, `useImageFilter`, `useCanvasRenderer`
- **関数・変数**: `camelCase`
- **定数**: `MAX_IMAGE_SIZE`, `DEFAULT_CONTOUR_LEVELS`

## 🔄 改善バックログ

- **パフォーマンス**: `renderWithLayers` は設定変更のたびにメインスレッドで全ピクセル走査を再実行する。中間結果のメモ化、Canvas の `drawImage` + `globalAlpha` / `globalCompositeOperation` によるGPU合成への置き換え、Web Worker 化が候補
- **重複統合**: `detectContours` と `detectContoursTransparent`（および対応する thinning / combine 関数）はほぼ同一実装なので統合可能
- **データ構造**: `brightnessMap: number[][]` を `Uint8Array` のフラット配列にすると速度・メモリが改善し、`!` アサーションも減らせる
- **デバッグログ**: `console.log` が多数残存（useCanvasRenderer, useImageFilter, App 等）。開発時のみのロガーに置き換えるか削除する
- **テスト**: テスト・CI が未整備。等高線検出や合成関数は純粋関数なので Vitest でのユニットテスト導入が容易
- **エラー通知**: エクスポート失敗等が console にしか出ない。ユーザー向けトースト等の通知UIが未実装

---

**詳細仕様**: `docs/requirements.md` 参照
