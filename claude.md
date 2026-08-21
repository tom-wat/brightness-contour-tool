# Brightness Contour 開発ガイド

## 🎯 概要

画像の輝度値を地形図風の等高線で視覚化する画像解析 Web アプリケーション（PWA対応）。
等高線に加えて、OpenCV.js による画像フィルタ・ノイズ除去・周波数分離（Frequency Separation）を組み合わせ、レイヤー方式で自由に合成表示できる。

UI は `../tool-starter-template` / `../flow-finder` と同じ設計システム（Tailwind v4 ＋ shadcn/ui ＋ `AppShell` / `CollapsibleSection` / `LabeledSlider` / `ToggleChip`）を共有している。**UIを足すときはまず「UI 規約」を読むこと。**

## 🚀 クイックスタート

```bash
npm run dev         # 開発サーバー起動
npm run build       # プロダクションビルド（tsc -b && vite build）
npm run lint        # ESLint実行
npm run type-check  # 型チェック実行
npm run preview     # ビルド結果のプレビュー
```

注意: `postinstall` で `node_modules/@techstark/opencv-js/dist/opencv.js` を `public/opencv.js` にコピーする（`public/opencv.js` は .gitignore 対象）。OpenCV.js は `index.html` の `<script async>` で読み込み、PWA の runtime cache でキャッシュされる。

フォント（JetBrains Mono Variable）は `vite.config.ts` の `preloadFonts` プラグインが latin サブセットの `<link rel="preload">` をビルド時に注入し、workbox の `globPatterns` に `woff2` を含めてプリキャッシュする。**どちらか片方でも外すと PWA 起動時に FOIT が出る**ので消さないこと。

## 📁 プロジェクト構成

```
src/
├── types/
│   ├── ImageTypes.ts        # 画像・等高線設定（BrightnessData, ContourSettings 等）
│   ├── ImageFilterTypes.ts  # 画像フィルタ設定（median / gaussian / bilateral / guided）
│   ├── NoiseReductionTypes.ts # ノイズ除去設定（輝度/色 分離バイラテラル）
│   ├── FrequencyTypes.ts    # 周波数分離設定・データ
│   └── UITypes.ts           # 表示レイヤー設定（DisplayLayers, DisplayOptions）
├── components/
│   ├── ui/              # shadcn/ui（原則手で編集しない。下の React 18 の注意を参照）
│   ├── controls/        # 設定パネル用の複合部品（LabeledSlider / ToggleChip / ColorRow / ApplyButton / StatusNote）
│   ├── layout/          # AppShell / CollapsibleSection
│   ├── features/        # このツール固有のパネル
│   │   ├── ContourPanel.tsx        # 等高線設定
│   │   ├── ImageFilterPanel.tsx    # 画像フィルタ設定
│   │   ├── FrequencyPanel.tsx      # 周波数分離設定
│   │   ├── NoiseReductionPanel.tsx # ノイズ除去設定
│   │   ├── DisplayPanel.tsx        # レイヤー表示切替＋View オプション
│   │   └── ExportPanel.tsx         # エクスポート設定・実行
│   ├── ImageUploader.tsx    # 画像入力（D&D・クリック・クリップボード貼り付け）
│   └── ImageCanvas.tsx      # メイン描画キャンバス（ズーム・パンUI含む）
├── hooks/
│   ├── useImageUpload.ts          # 画像アップロード処理・検証
│   ├── useBrightnessAnalysis.ts   # 輝度解析（brightnessMap 生成）
│   ├── useCanvasRenderer.ts       # 等高線検出・レイヤー合成・Canvas描画
│   ├── useImageFilter.ts          # 画像フィルタ（OpenCV.js）
│   ├── useFrequencySeparation.ts  # 周波数分離（低周波／高周波明・暗・合成）
│   ├── useNoiseReduction.ts       # ノイズ除去（YCrCb分離バイラテラル＋Detail復元）
│   ├── useZoomPan.ts              # ズーム・パン（マウス／タッチ・ピンチ対応）
│   ├── useImageExport.ts          # PNG / JPEG / WebP エクスポート
│   └── useLocalStorage.ts         # SettingsStorage（localStorage への設定永続化）
├── lib/
│   ├── utils.ts             # cn()（clsx + tailwind-merge）
│   └── filter-labels.ts     # フィルタ手法の表示名（Image Filter と Frequency で共有）
├── utils/
│   ├── OpenCVProcessor.ts   # OpenCV.js のロード管理（シングルトン）と型定義
│   └── edgePreservingFilters.ts # guided filter 実装
├── App.tsx                  # メインアプリ（状態管理・レイアウト組み立て）
└── main.tsx                 # エントリーポイント
```

`@/*` は `src/*` のエイリアス（`vite.config.ts` と `tsconfig.json` の両方に定義）。新規コードは相対パスではなくこれを使う。

## 🔧 技術スタック

- **React 18** + **TypeScript**（strict, `noUncheckedIndexedAccess` 有効）
- **Tailwind CSS v4**（設定は `src/index.css` の CSS 変数。`tailwind.config.js` は無い）
- **shadcn/ui**（`src/components/ui/`。radix-lyra スタイル。`components.json` で設定）
- **アイコン**: @phosphor-icons/react ／ **トースト**: sonner
- **Vite 7** + **vite-plugin-pwa**（PWA・opencv.js の runtime caching）
- **HTML5 Canvas API**（画像処理・描画）
- **OpenCV.js**（@techstark/opencv-js — 画像フィルタ・周波数分離・ノイズ除去で使用）
- **ESLint**（flat config）

## 🖼️ 表示システム（レイヤー方式）

表示は `DisplayOptions`（`src/types/UITypes.ts`）によるレイヤーの ON/OFF 合成で行う：

| レイヤー | 内容 |
|---|---|
| `original` | 元画像 |
| `filtered` | 画像フィルタ適用後の画像（opacity でブレンド） |
| `denoised` | ノイズ除去後の画像（opacity でブレンド） |
| `contour` | 元画像の輝度等高線 |
| `filteredContour` | フィルタ後画像から生成した等高線 |
| `denoisedContour` | ノイズ除去後画像から生成した等高線 |
| `lowFrequency` | 周波数分離の低周波成分 |
| `highFrequencyBright` | 高周波・明成分（Linear Light 合成） |
| `highFrequencyDark` | 高周波・暗成分（Linear Light 合成） |
| `highFrequencyCombined` | 高周波・明暗合成 |

周波数レイヤーの 4 つは対等ではない（`useCanvasRenderer.ts` の Frequency Layers ブロック）:

- `lowFrequency` が**ベース**で、`highFrequencyCombined` / `highFrequencyBright` / `highFrequencyDark` はその上に Linear Light で乗る（Low が OFF なら通常合成でディテール単体表示）
- `Bright` + `Dark` は `Combined` の分解。**Combined と Bright/Dark を同時に ON にするとディテールが二重・三重にかかる**ので、UI 側でまとめて ON にするショートカットは置かない（以前あった "All Frequency Layers" トグルはこの理由と、実レイヤー状態と同期しない独立ステートだったことから 2026-08 に削除）

加えて `grayscaleMode`（全レイヤーをグレースケール化）がある。
合成処理は `useCanvasRenderer.renderWithLayers` に集約されている。
ベース画像（original / filtered）が無い場合は透明背景に等高線のみを描画する。

## 🎛️ UIレイアウト

レイアウトは `AppShell`（`src/components/layout/AppShell.tsx`）が枠を持つ。

- **デスクトップ（lg以上）**: ヘッダー ＋ 左サイドバー（Contour / Image Filter / Frequency Separation / Noise Reduction）・中央 Canvas・右サイドバー（Layers / View / Export）
- **モバイル**: Canvas ＋ 下部ツールバー。Controls / Display をそれぞれボトムシート（`ui/sheet`）で開く
- 左右パネルのグループはすべて `CollapsibleSection`。Contour と Layers / View / Export は既定で開き、重い処理のパネルは閉じておく
- 等高線設定の変更は 150ms デバウンスで再解析。画像フィルタ・周波数分離・ノイズ除去は Apply ボタンで明示実行
- パネルは画像が無くても表示し、`disabled` で操作を止める（何ができるツールかを先に見せる）

## 🧩 UI 規約 — 最重要

**目的: UIを毎回ゼロから組まない。以下の順で部品を使う。**

1. **`src/components/controls/` の複合部品を最優先で使う**
   - `LabeledSlider` — 数値スライダー行（ラベル＋値＋スライダー）。ラベルだけで意味が通らないときは `ariaLabel` を渡す
   - `ToggleChip` — レイヤー／オプションの ON/OFF ピル
   - `ApplyButton` — OpenCV 処理を走らせる全幅ボタン（処理中表示込み）
   - `StatusNote` — パネル内の 1 行ステータス（読み込み中・失敗理由）
   - `ColorRow` — 色選択行（現状未使用。色を扱うときはこれを使う）
2. **汎用UIは `src/components/ui/`（shadcn）を使う**。足りない部品は `npx shadcn@latest add <name>` で追加する。自作しない
3. レイアウトは必ず `AppShell` の枠内で組む
4. 設定パネル内のグループ分けは `CollapsibleSection` を使う
5. ツール固有のパネルは `src/components/features/` に置く

スタイル規則:

- **インラインstyle（`style={{}}`）禁止**。Tailwind ユーティリティのみ。
  ただし**ズーム・パンの transform など毎フレーム変わる値は ref 経由で `element.style` に代入する**（`ImageCanvas`）。JSX には書かない
- 色は Tailwind のセマンティックトークン（`bg-background`, `text-muted-foreground`, `border-border` 等）を使う。生の色クラス（`bg-gray-100`, `bg-blue-600` 等）は使わない
- UIテキストはすべて英語
- ミニマルデザイン: 控えめなボーダー、色数は最小限
- エラーは console だけでなく `toast.error()` でユーザーに通知する（`<Toaster />` は `App.tsx` に配置済み）

### React 18 と shadcn/ui

参考プロジェクト（flow-finder / tool-starter-template）は React 19 だが、このツールは React 18 のまま移行した。
そのため **`ui/button.tsx` だけは生成物から変更してある**: React 18 では関数コンポーネントが `ref` を prop で受け取れず、
`asChild` を使う radix のトリガー（`SheetTrigger` 等）が警告を出すため `forwardRef` でラップしている。
`ui/` を再生成・更新するときはこの差分を消さないこと。

`npm run lint` は `ui/button.tsx` と `ui/tabs.tsx` に react-refresh の warning を 2 件出す。これは shadcn 生成物由来の既存のもの。
**これ以外が出たら直す。**

## 💾 設定の永続化

`SettingsStorage`（`src/hooks/useLocalStorage.ts`）が localStorage に保存：
等高線設定・表示オプション・画像フィルタ設定・ノイズ除去設定・周波数分離設定・エクスポート設定。
表示オプションは App 初期化時にデフォルトとマージするため、レイヤー追加時も保存済み設定と互換。
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
5. **スタイリング規則**: 上の「UI 規約」に従う

## 🎨 命名規則

- **型定義**: `BrightnessData`, `ContourSettings`, `FrequencySettings`
- **コンポーネント**: `ImageCanvas`, `ContourPanel`, `DisplayPanel`（features は `*Panel`）
- **カスタムフック**: `useBrightnessAnalysis`, `useImageFilter`, `useCanvasRenderer`
- **関数・変数**: `camelCase`
- **定数**: `MAX_IMAGE_SIZE`, `DEFAULT_CONTOUR_LEVELS`

## 🔄 改善バックログ

- **データ構造**: `brightnessMap: number[][]` を `Uint8Array` のフラット配列にすると速度・メモリが改善し、`!` アサーションも減らせる
- **デバッグログ**: `console.log` が hooks / utils に残存（useImageFilter, useFrequencySeparation, OpenCVProcessor）。開発時のみのロガーに置き換えるか削除する
- **テスト**: テスト・CI が未整備。等高線検出や合成関数は純粋関数なので Vitest でのユニットテスト導入が容易
- **Web Worker 化**: 等高線検出・OpenCV 処理は依然メインスレッド実行。超高解像度画像向けには Worker / OffscreenCanvas への移行が候補

### 描画パイプラインの設計メモ（2026-06 改修済み）

`useCanvasRenderer` はピクセルループ合成ではなく Canvas API（`drawImage` + `globalAlpha` + 合成モード）で合成する。等高線検出・グレースケール変換・Linear Light 分解は `RenderCache`（WeakMap ベース）にキャッシュされ、入力が変わったときだけ再計算される。Linear Light 合成は overlay を明部/暗部成分に事前分解し `lighter` / `difference` で適用（`base + 2*(overlay-128)` と厳密一致）。レイヤー追加時はこの方式を踏襲すること。

---

**詳細仕様**: `docs/requirements.md` 参照
