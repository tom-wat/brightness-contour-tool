// OpenCV.jsのグローバル型定義
interface OpenCVMat {
  delete(): void;
  data: Uint8Array;
  cols: number;
  rows: number;
  clone(): OpenCVMat;
  channels(): number;
  copyTo(dst: OpenCVMat): void;
}

interface OpenCVSize {
  width: number;
  height: number;
}

interface OpenCVPoint {
  x: number;
  y: number;
  delete(): void;
}

interface OpenCV {
  Mat: new (rows?: number, cols?: number, type?: number) => OpenCVMat;
  Size: new (width: number, height: number) => OpenCVSize;
  Point: new (x: number, y: number) => OpenCVPoint;
  CV_8UC4: number;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  COLOR_RGB2RGBA: number;
  MORPH_RECT: number;
  MORPH_ELLIPSE: number;
  MORPH_CROSS: number;
  MORPH_OPEN: number;
  MORPH_CLOSE: number;
  MORPH_GRADIENT: number;  
  MORPH_TOPHAT: number;
  MORPH_BLACKHAT: number;
  MORPH_ERODE: number;
  MORPH_DILATE: number;
  BORDER_CONSTANT: number;
  cvtColor(src: OpenCVMat, dst: OpenCVMat, code: number): void;
  Canny(src: OpenCVMat, dst: OpenCVMat, threshold1: number, threshold2: number, apertureSize?: number, L2gradient?: boolean): void;
  GaussianBlur(src: OpenCVMat, dst: OpenCVMat, ksize: OpenCVSize, sigmaX: number, sigmaY: number): void;
  morphologyEx(src: OpenCVMat, dst: OpenCVMat, op: number, kernel: OpenCVMat, anchor?: OpenCVPoint, iterations?: number, borderType?: number): void;
  getStructuringElement(shape: number, ksize: OpenCVSize): OpenCVMat;
  imshow(canvas: HTMLCanvasElement, mat: OpenCVMat): void;
  matFromImageData(imageData: ImageData): OpenCVMat;
  medianBlur(src: OpenCVMat, dst: OpenCVMat, ksize: number): void;
  bilateralFilter(src: OpenCVMat, dst: OpenCVMat, d: number, sigmaColor: number, sigmaSpace: number): void;
  fastNlMeansDenoising(src: OpenCVMat, dst: OpenCVMat, h: number, templateWindowSize: number, searchWindowSize: number): void;
  fastNlMeansDenoisingColored(src: OpenCVMat, dst: OpenCVMat, h: number, hColor: number, templateWindowSize: number, searchWindowSize: number): void;
  copyTo?: (dst: OpenCVMat) => void;
}

declare global {
  interface Window {
    cv: OpenCV;
  }
}

export interface OpenCVStatus {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export class OpenCVProcessor {
  private static instance: OpenCVProcessor;
  private status: OpenCVStatus = {
    isLoaded: false,
    isLoading: false,
    error: null,
  };
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): OpenCVProcessor {
    if (!OpenCVProcessor.instance) {
      OpenCVProcessor.instance = new OpenCVProcessor();
    }
    return OpenCVProcessor.instance;
  }

  getStatus(): OpenCVStatus {
    return { ...this.status };
  }

  async ensureLoaded(): Promise<void> {
    if (this.status.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadOpenCV();
    return this.loadPromise;
  }

  private async loadOpenCV(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.status.isLoading = true;
      this.status.error = null;

      // OpenCV.jsが既に読み込まれているかチェック
      if (window.cv && window.cv.Mat) {
        this.status.isLoaded = true;
        this.status.isLoading = false;
        resolve();
        return;
      }

      // OpenCV.jsの読み込み完了を待つ
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          this.status.isLoaded = true;
          this.status.isLoading = false;
          resolve();
        }
      }, 100);

      // タイムアウト処理（30秒）
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        this.status.isLoading = false;
        this.status.error = 'OpenCV.js loading timeout';
        reject(new Error('OpenCV.js loading timeout'));
      }, 30000);
    });
  }

  imageDataToMat(imageData: ImageData): OpenCVMat {
    if (!this.status.isLoaded) {
      throw new Error('OpenCV not loaded');
    }

    const { width, height, data } = imageData;
    const mat = new window.cv.Mat(height, width, window.cv.CV_8UC4);
    mat.data.set(data);
    return mat;
  }

  matToImageData(mat: OpenCVMat): ImageData {
    if (!this.status.isLoaded) {
      throw new Error('OpenCV not loaded');
    }

    const canvas = document.createElement('canvas');
    window.cv.imshow(canvas, mat);
    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  cannyEdgeDetection(
    imageData: ImageData,
    lowThreshold: number,
    highThreshold: number,
    apertureSize: number = 3,
    L2gradient: boolean = false
  ): ImageData {
    if (!this.status.isLoaded) {
      throw new Error('OpenCV not loaded');
    }

    const cv = window.cv;
    let src = null;
    let gray = null;
    let edges = null;

    try {
      // ImageDataをMatに変換
      src = this.imageDataToMat(imageData);
      
      // グレースケールに変換
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Cannyエッジ検出
      edges = new cv.Mat();
      cv.Canny(gray, edges, lowThreshold, highThreshold, apertureSize, L2gradient);
      
      // エッジデータを適切なRGBA形式に変換
      const edgesRGBA = new cv.Mat();
      cv.cvtColor(edges, edgesRGBA, cv.COLOR_GRAY2RGBA);
      
      // MatをImageDataに変換
      const canvas = document.createElement('canvas');
      canvas.width = edgesRGBA.cols;
      canvas.height = edgesRGBA.rows;
      cv.imshow(canvas, edgesRGBA);
      const ctx = canvas.getContext('2d')!;
      const resultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // エッジピクセルを白色(255,255,255)に設定し、透明度を調整
      const data = resultImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const edgeValue = data[i] ?? 0; // グレースケール値
        if (edgeValue > 0) {
          // エッジがある場合は白色
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          data[i + 3] = 255; // A (完全不透明)
        } else {
          // エッジがない場合は透明
          data[i] = 0;       // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
          data[i + 3] = 0;   // A (完全透明)
        }
      }
      
      // メモリ解放
      edgesRGBA.delete();
      
      return resultImageData;
      
    } catch (error) {
      throw new Error(`OpenCV Canny detection failed: ${error}`);
    } finally {
      // メモリ解放
      if (src) src.delete();
      if (gray) gray.delete();
      if (edges) edges.delete();
    }
  }

  gaussianBlur(
    imageData: ImageData,
    kernelSize: number = 5,
    sigmaX: number = 1.4,
    sigmaY: number = 0
  ): ImageData {
    if (!this.status.isLoaded) {
      throw new Error('OpenCV not loaded');
    }

    const cv = window.cv;
    let src = null;
    let dst = null;

    try {
      src = this.imageDataToMat(imageData);
      dst = new cv.Mat();
      
      const ksize = new cv.Size(kernelSize, kernelSize);
      cv.GaussianBlur(src, dst, ksize, sigmaX, sigmaY);
      
      const resultImageData = this.matToImageData(dst);
      return resultImageData;
      
    } catch (error) {
      throw new Error(`OpenCV Gaussian blur failed: ${error}`);
    } finally {
      if (src) src.delete();
      if (dst) dst.delete();
    }
  }

  morphologyOperations(
    imageData: ImageData,
    operation: 'MORPH_OPEN' | 'MORPH_CLOSE' | 'MORPH_ERODE' | 'MORPH_DILATE',
    kernelSize: number = 3
  ): ImageData {
    if (!this.status.isLoaded) {
      throw new Error('OpenCV not loaded');
    }

    const cv = window.cv;
    let src = null;
    let dst = null;
    let kernel = null;

    try {
      src = this.imageDataToMat(imageData);
      dst = new cv.Mat();
      
      kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(kernelSize, kernelSize)
      );
      
      const morphOp = cv[operation];
      cv.morphologyEx(src, dst, morphOp, kernel);
      
      const resultImageData = this.matToImageData(dst);
      return resultImageData;
      
    } catch (error) {
      throw new Error(`OpenCV morphology operation failed: ${error}`);
    } finally {
      if (src) src.delete();
      if (dst) dst.delete();
      if (kernel) kernel.delete();
    }
  }
}

// シングルトンインスタンスをエクスポート
export const openCVProcessor = OpenCVProcessor.getInstance();