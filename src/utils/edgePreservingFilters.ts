// エッジ保持平滑化フィルタ（bilateral / guided）の共有実装。
// Image Filter と Frequency Separation の両方から利用する。
// いずれも OpenCV.js(window.cv) のロード済みを前提とし、入出力は OpenCV Mat。

type CV = Window['cv'];
// imshow の第2引数の型を Mat 型として流用（OpenCVProcessor の OpenCVMat 相当）
type CVMat = Parameters<CV['imshow']>[1];

// bilateralFilter は RGBA(4ch) を直接扱えないため RGB に変換してから処理する
export function bilateralFilterMat(
  cv: CV,
  src: CVMat,
  radius: number,
  sigmaColor: number,
  sigmaSpace: number
): CVMat {
  if (typeof cv.bilateralFilter !== 'function') {
    throw new Error('bilateralFilter function not available');
  }

  const rgb = new cv.Mat();
  const filtered = new cv.Mat();
  const dst = new cv.Mat();

  try {
    const d = Math.max(1, Math.round(radius)) * 2 + 1;
    const validSigmaColor = Math.max(1, Math.min(300, sigmaColor));
    const validSigmaSpace = Math.max(1, Math.min(300, sigmaSpace));

    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    cv.bilateralFilter(rgb, filtered, d, validSigmaColor, validSigmaSpace);
    cv.cvtColor(filtered, dst, cv.COLOR_RGB2RGBA);

    if (dst.rows <= 0 || dst.cols <= 0) {
      throw new Error('Bilateral filter produced invalid output');
    }
  } catch (error) {
    dst.delete();
    throw error;
  } finally {
    rgb.delete();
    filtered.delete();
  }

  return dst;
}

// Guided Filter（He et al. 2010）。bilateral に近いエッジ保持平滑化を box filter ベースで
// O(N)・半径非依存で実現する。box(平均)のみ OpenCV(WASM) に任せ、要素演算は JS で行う。
export function guidedFilterMat(
  cv: CV,
  src: CVMat,
  radius: number,
  strength: number
): CVMat {
  if (typeof cv.boxFilter !== 'function') {
    throw new Error('boxFilter function not available');
  }

  const w = src.cols;
  const h = src.rows;
  const N = w * h;
  const ksize = Math.max(1, Math.round(radius)) * 2 + 1;
  // 画素値を 0..1 に正規化して扱うため eps も 0..1 の分散スケール。strength を eps にマッピング
  const eps = Math.pow(Math.max(1, Math.min(100, strength)) / 100, 2) * 0.16;

  const anchor = new cv.Point(-1, -1);
  const kdim = new cv.Size(ksize, ksize);

  // 単一チャンネル(Float32, w×h)に box(平均)フィルタをかけて結果配列を返す
  const box = (input: Float32Array): Float32Array => {
    const m = new cv.Mat(h, w, cv.CV_32FC1);
    const out = new cv.Mat();
    try {
      m.data32F!.set(input);
      cv.boxFilter(m, out, -1, kdim, anchor, true, cv.BORDER_DEFAULT);
      return new Float32Array(out.data32F!);
    } finally {
      m.delete();
      out.delete();
    }
  };

  // I をガイド兼入力とする self-guided フィルタを 1 チャンネル分実行
  const guidedChannel = (I: Float32Array): Float32Array => {
    const meanI = box(I);
    const II = new Float32Array(N);
    for (let i = 0; i < N; i++) II[i] = I[i]! * I[i]!;
    const meanII = box(II);

    const a = new Float32Array(N);
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const varI = meanII[i]! - meanI[i]! * meanI[i]!;
      a[i] = varI / (varI + eps);
      b[i] = meanI[i]! - a[i]! * meanI[i]!;
    }
    const meanA = box(a);
    const meanB = box(b);

    const q = new Float32Array(N);
    for (let i = 0; i < N; i++) q[i] = meanA[i]! * I[i]! + meanB[i]!;
    return q;
  };

  const srcData = src.data; // RGBA Uint8
  const out = new Uint8ClampedArray(N * 4);

  // R/G/B を各自ガイドとして個別に平滑化、アルファは原画から保持
  const channel = new Float32Array(N);
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < N; i++) channel[i] = srcData[i * 4 + c]! / 255;
    const q = guidedChannel(channel);
    for (let i = 0; i < N; i++) out[i * 4 + c] = q[i]! * 255;
  }
  for (let i = 0; i < N; i++) out[i * 4 + 3] = srcData[i * 4 + 3]!;

  const dst = cv.matFromImageData(new ImageData(out, w, h));
  if (dst.rows <= 0 || dst.cols <= 0) {
    dst.delete();
    throw new Error('Guided filter produced invalid output');
  }
  return dst;
}
