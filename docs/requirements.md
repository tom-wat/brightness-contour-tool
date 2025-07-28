# 輝度等高線＋ Canny エッジ検出 Web アプリケーション - 要件定義書

## 1. プロジェクト概要

画像の輝度値を解析して等高線表示し、さらに Canny エッジ検出による輪郭抽出を組み合わせた高度な画像解析 React Web アプリケーション。

## 2. 主要機能

### 2.1 画像入力機能

- **対応形式**: JPEG, PNG, GIF, WebP
- **ファイルサイズ**: 最大 10MB
- **画像サイズ**: 最大 4000×4000 ピクセル
- **入力方法**: ドラッグ&ドロップ、ファイル選択

### 2.2 輝度解析＋等高線機能

- **輝度計算**: Y = 0.299×R + 0.587×G + 0.114×B (ITU-R BT.601)
- **レイヤー分割**: 可変（1-64 分割、デフォルト 4 段階）
- **境界検出**: 隣接ピクセル間の輝度レイヤー差分検出
- **線設定**: 太さ 1-5px、透明度 50-100%、カラーパレット対応

### 2.3 Canny エッジ検出機能

- **アルゴリズム**: Canny エッジ検出アルゴリズム
- **閾値設定**: 下位閾値 50-150、上位閾値 100-300
- **設定モード**: 手動調整、自動調整（Otsu 法）
- **後処理**: エッジ細線化、短いエッジ除去、エッジ連結

### 2.4 表示モード

1. **元画像のみ** (COLOR_ONLY)
2. **グレースケール画像のみ** (GRAYSCALE_ONLY)
3. **等高線のみ** (CONTOUR_ONLY)
4. **カラー画像＋等高線** (COLOR_WITH_CONTOUR)
5. **グレースケール＋等高線** (GRAYSCALE_WITH_CONTOUR)
6. **Canny エッジのみ** (CANNY_EDGE_ONLY)
7. **カラー画像＋ Canny エッジ** (COLOR_WITH_CANNY)
8. **等高線＋ Canny エッジ** (CONTOUR_WITH_CANNY)
9. **複合表示** (COLOR_WITH_CONTOUR_AND_CANNY) ※高度

## 3. 技術アーキテクチャ

### 3.1 処理エンジン

```
処理モード：
├── 高速モード（Canvas API）
│   ├── 基本的な輝度解析
│   ├── シンプルな境界検出
│   └── 基本的なエッジ検出
└── 高精度モード（OpenCV.js）
    ├── 高度な前処理フィルター
    ├── 精密なCannyエッジ検出
    └── 高品質な後処理
```

### 3.2 React コンポーネント構成

```typescript
src/
├── types/
│   ├── ImageTypes.ts         // 画像関連の型定義
│   ├── CannyTypes.ts         // Cannyエッジ検出の型定義
│   └── UITypes.ts            // UI関連の型定義
├── core/
│   ├── ImageProcessor.ts     // 画像処理の抽象化
│   ├── CanvasProcessor.ts    // Canvas API実装
│   ├── OpenCVProcessor.ts    // OpenCV.js実装
│   ├── BrightnessAnalyzer.ts // 輝度解析
│   └── CannyDetector.ts      // Cannyエッジ検出
├── components/
│   ├── ImageUploader.tsx     // 画像アップロード
│   ├── ImageCanvas.tsx       // メイン画像表示
│   ├── ControlPanel.tsx      // 設定パネル
│   └── CannyControls.tsx     // Canny専用設定
├── hooks/
│   ├── useImageUpload.ts     // 画像アップロード
│   ├── useBrightnessAnalysis.ts // 輝度解析
│   ├── useCannyDetection.ts  // Cannyエッジ検出
│   └── useCanvasRenderer.ts  // Canvas描画制御
├── utils/
│   ├── colorPalette.ts       // カラーパレット
│   ├── settings.ts           // 設定管理
│   └── performance.ts        // パフォーマンス最適化
├── App.tsx                   // メインアプリコンポーネント
└── main.tsx                  // Reactエントリーポイント
```

## 4. ユーザーインターフェース

### 4.0 デザイン方針

**ミニマルスタイル** - Tailwind CSSでのシンプルで直感的なUI設計

```
デザイン原則：
├── 色彩：slate-50, slate-100, slate-900基調
├── レイアウト：Grid/Flexbox、余白重視
├── インタラクション：hover効果、transition-all duration-200
└── 操作性：大きめのクリック領域、明確な視覚フィードバック
```

### 4.1 基本設定パネル

```
輝度等高線設定：
├── 表示モード選択（9種類）
├── 輝度分割数（1-64、スライダー）
├── 線の太さ（1-5px、スライダー）
├── 透明度（50-100%、スライダー）
├── カラーパレット選択
└── ガウシアンブラー（0-10、スライダー）
```

### 4.2 Canny 設定パネル

```
Cannyエッジ検出設定：
├── エッジ検出有効/無効
├── 閾値モード選択
│   ├── 手動設定
│   ├── 自動設定（Otsu法）
│   └── 適応的設定
├── 手動閾値設定
│   ├── 下位閾値（50-150、スライダー）
│   └── 上位閾値（100-300、スライダー）
├── エッジ後処理
│   ├── エッジ細線化（ON/OFF）
│   ├── 短いエッジ除去（閾値10-100px）
│   ├── エッジ連結距離（1-10px）
│   └── 領域別密度制御（選択領域でのエッジ密度調整）
└── 表示設定
    ├── エッジ色（カスタマイズ）
    ├── エッジ幅（1-3px）
    └── 合成時透明度（0-100%）
```

## 5. 処理フロー

```
画像アップロード（useImageUpload）
  ↓
処理モード判定（高速/高精度）
  ↓
前処理（ガウシアンブラー等）
  ↓
並列処理
├── 輝度解析処理（useBrightnessAnalysis）    ├── Cannyエッジ検出処理（useCannyDetection）
│   ├── 輝度値計算                           │   ├── グレースケール変換
│   ├── レイヤー分割                         │   ├── 閾値設定（手動/自動）
│   ├── 境界検出                             │   ├── Cannyアルゴリズム実行
│   └── 等高線描画                           │   └── エッジ後処理
└─────────────────────────────────────────┘
  ↓
表示合成（useCanvasRenderer）
  ↓
最終結果表示
```

## 6. Canny エッジ検出詳細

### 6.1 アルゴリズム実装

```typescript
// 型定義
interface CannyParams {
  lowThreshold: number;
  highThreshold: number;
  apertureSize?: number;
  L2gradient?: boolean;
}

interface EdgeDetectionResult {
  edges: ImageData;
  processingTime: number;
  parameters: CannyParams;
}

// Canvas API版（高速モード）
function cannyEdgeDetection(
  imageData: ImageData,
  params: CannyParams
): EdgeDetectionResult {
  const startTime = performance.now();

  // 1. ガウシアンフィルター
  const blurred = gaussianBlur(imageData, 1.4);

  // 2. 勾配計算（Sobel）
  const gradient = calculateGradient(blurred);

  // 3. 非最大値抑制
  const suppressed = nonMaximumSuppression(gradient);

  // 4. ヒステリシス閾値処理
  const edges = hysteresisThresholding(
    suppressed,
    params.lowThreshold,
    params.highThreshold
  );

  return {
    edges,
    processingTime: performance.now() - startTime,
    parameters: params,
  };
}

// OpenCV.js版（高精度モード）
function cannyEdgeDetectionOpenCV(
  mat: any,
  params: CannyParams
): EdgeDetectionResult {
  const startTime = performance.now();

  cv.Canny(
    mat,
    mat,
    params.lowThreshold,
    params.highThreshold,
    params.apertureSize || 3,
    params.L2gradient || false
  );

  return {
    edges: matToImageData(mat),
    processingTime: performance.now() - startTime,
    parameters: params,
  };
}
```

### 6.2 自動閾値決定（Otsu 法）

```typescript
interface OtsuResult {
  threshold: number;
  variance: number;
}

interface ThresholdPair {
  lowThreshold: number;
  highThreshold: number;
}

function calculateOptimalThresholds(imageData: ImageData): ThresholdPair {
  const histogram = calculateHistogram(imageData);
  const otsuResult: OtsuResult = otsuMethod(histogram);

  return {
    lowThreshold: Math.round(otsuResult.threshold * 0.5),
    highThreshold: Math.round(otsuResult.threshold * 1.5),
  };
}

// 設定管理の型定義
interface AppSettings {
  displayMode: DisplayMode;
  brightnessLayers: number;
  lineThickness: number;
  transparency: number;
  cannyParams: CannyParams;
  processingMode: "fast" | "precise" | "auto";
}

enum DisplayMode {
  COLOR_ONLY = "COLOR_ONLY",
  GRAYSCALE_ONLY = "GRAYSCALE_ONLY",
  CONTOUR_ONLY = "CONTOUR_ONLY",
  COLOR_WITH_CONTOUR = "COLOR_WITH_CONTOUR",
  GRAYSCALE_WITH_CONTOUR = "GRAYSCALE_WITH_CONTOUR",
  CANNY_EDGE_ONLY = "CANNY_EDGE_ONLY",
  COLOR_WITH_CANNY = "COLOR_WITH_CANNY",
  CONTOUR_WITH_CANNY = "CONTOUR_WITH_CANNY",
  COLOR_WITH_CONTOUR_AND_CANNY = "COLOR_WITH_CONTOUR_AND_CANNY",
}
```

## 7. 性能要件

| 項目                 | 要求値     | 測定条件                     |
| -------------------- | ---------- | ---------------------------- |
| 初期表示時間         | 3 秒以内   | 4000×4000px 画像、高速モード |
| 等高線処理時間       | 5 秒以内   | 4000×4000px 画像             |
| Canny エッジ処理時間 | 3 秒以内   | 4000×4000px 画像、高速モード |
| 複合処理時間         | 8 秒以内   | 等高線＋ Canny、高精度モード |
| メモリ使用量         | 512MB 以下 | 最大サイズ画像処理時         |
| OpenCV.js 読み込み   | 10 秒以内  | 初回アクセス時               |

## 8. 実装優先順位・進捗状況

### ✅ Phase 1: 基本機能（MVP）- 完了

1. ✅ 画像アップロード機能（useImageUpload）- ドラッグ&ドロップ対応
2. ✅ Canvas API による輝度解析（useBrightnessAnalysis）
3. ✅ 基本的な等高線表示（useCanvasRenderer）
4. ✅ シンプルな Canny エッジ検出（useCannyDetection）- 独自実装
5. ✅ 基本表示モード（5 種類）- COLOR_ONLY, GRAYSCALE_ONLY, CONTOUR_ONLY, etc.

### ✅ Phase 2: Cannyエッジ検出機能 - 完了

1. ✅ 独自Cannyエッジ検出アルゴリズム実装
   - ガウシアンフィルター → Sobel勾配計算 → 非最大値抑制 → ヒステリシス閾値処理
2. ✅ 手動閾値調整機能（CannyControlsコンポーネント）
3. ✅ 自動閾値決定（Otsu 法）実装
4. ✅ Canny表示モード4種類追加
   - CANNY_EDGE_ONLY（黒背景対応）
   - COLOR_WITH_CANNY, CONTOUR_WITH_CANNY, COLOR_WITH_CONTOUR_AND_CANNY
5. ✅ UI改善（モード分離表示、ImageViewControlsコンポーネント準備）

### 🔄 Phase 3: 高精度処理・UI向上 - 次期実装予定

1. 🔄 ズーム・パン機能（ImageViewControlsに実装予定）
2. ⭕ OpenCV.js 統合（高精度モード）
3. ⭕ エッジ後処理機能（細線化、短いエッジ除去、エッジ連結）  
4. ⭕ 高精度モード実装
5. ⭕ カラーパレット機能

### 📋 Phase 4: ユーザビリティ向上 - 将来実装

1. ⭕ 画像保存機能（現在の表示状態でエクスポート）
2. ⭕ プリセット機能（設定保存・読み込み）
3. ⭕ パフォーマンス最適化
4. ⭕ レスポンシブ対応強化