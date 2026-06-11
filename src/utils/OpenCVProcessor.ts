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

interface OpenCV {
  Mat: new (rows?: number, cols?: number, type?: number) => OpenCVMat;
  Size: new (width: number, height: number) => OpenCVSize;
  GaussianBlur(src: OpenCVMat, dst: OpenCVMat, ksize: OpenCVSize, sigmaX: number, sigmaY: number): void;
  imshow(canvas: HTMLCanvasElement, mat: OpenCVMat): void;
  matFromImageData(imageData: ImageData): OpenCVMat;
  medianBlur(src: OpenCVMat, dst: OpenCVMat, ksize: number): void;
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

      console.log('🔄 Starting OpenCV.js loading process...');

      const timeoutId = setTimeout(() => {
        if (pollInterval !== undefined) clearInterval(pollInterval);
        console.error('❌ OpenCV.js loading timeout after 30 seconds');
        this.status.isLoading = false;
        this.status.error = 'OpenCV.js loading timeout after 30 seconds';
        reject(new Error('OpenCV.js loading timeout'));
      }, 30000);

      const onReady = () => {
        clearTimeout(timeoutId);
        if (pollInterval !== undefined) clearInterval(pollInterval);
        console.log('✅ OpenCV.js loaded successfully (onRuntimeInitialized)');
        this.status.isLoaded = true;
        this.status.isLoading = false;
        resolve();
      };

      // window.cv が現れるのを待ち、現れたら onRuntimeInitialized をフック
      // または Mat が既に利用可能ならそのまま完了とする
      const hookOrResolve = () => {
        if (window.cv.Mat) {
          // WASM 初期化済み
          onReady();
        } else {
          // WASM 初期化前: コールバックをフック（既存のコールバックを保持）
          const original = (window.cv as unknown as Record<string, unknown>)['onRuntimeInitialized'] as (() => void) | undefined;
          (window.cv as unknown as Record<string, unknown>)['onRuntimeInitialized'] = () => {
            if (original) original();
            onReady();
          };
          console.log('⏳ Hooked onRuntimeInitialized, waiting for WASM...');
        }
      };

      // window.cv が未登場の場合のみ、現れるまでポーリング
      let checkCount = 0;
      const pollInterval: ReturnType<typeof setInterval> | undefined = window.cv
        ? undefined
        : setInterval(() => {
            checkCount++;

            if (window.cv) {
              clearInterval(pollInterval);
              hookOrResolve();
              return;
            }

            if (checkCount % 50 === 0) {
              console.log(`⏳ Still waiting for window.cv... (${checkCount * 100}ms elapsed)`);
            }
          }, 100);

      // window.cv が既に存在する場合は即座にフック
      if (window.cv) {
        hookOrResolve();
      }
    });
  }

}

// シングルトンインスタンスをエクスポート
export const openCVProcessor = OpenCVProcessor.getInstance();