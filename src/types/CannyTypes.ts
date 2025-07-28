export interface CannyParams {
  lowThreshold: number;
  highThreshold: number;
  apertureSize?: number;
  L2gradient?: boolean;
}

export interface EdgeDetectionResult {
  edges: ImageData;
  processingTime: number;
  parameters: CannyParams;
}

export interface OtsuResult {
  threshold: number;
  variance: number;
}

export interface ThresholdPair {
  lowThreshold: number;
  highThreshold: number;
}

export interface CannySettings {
  enabled: boolean;
  thresholdMode: 'manual' | 'auto' | 'adaptive';
  params: CannyParams;
  opacity: number;
  postProcessing: {
    thinning: boolean;
    shortEdgeRemoval: boolean;
    shortEdgeThreshold: number;
    edgeConnection: boolean;
    connectionDistance: number;
  };
  display: {
    edgeColor: string;
    edgeWidth: number;
    opacity: number;
  };
}

export const DEFAULT_CANNY_PARAMS: CannyParams = {
  lowThreshold: 50,
  highThreshold: 150,
  apertureSize: 3,
  L2gradient: false,
};

export const CANNY_THRESHOLD_RANGES = {
  lowMin: 50,
  lowMax: 150,
  highMin: 100,
  highMax: 300,
} as const;