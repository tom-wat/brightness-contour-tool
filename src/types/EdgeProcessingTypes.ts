export interface EdgeProcessingSettings {
  enableThinning: boolean;
  enableShortEdgeRemoval: boolean;
  enableEdgeConnection: boolean;
  shortEdgeThreshold: number; // pixels
  connectionDistance: number; // pixels
}

export const DEFAULT_EDGE_PROCESSING_SETTINGS: EdgeProcessingSettings = {
  enableThinning: true,
  enableShortEdgeRemoval: false,
  enableEdgeConnection: false,
  shortEdgeThreshold: 10,
  connectionDistance: 3,
};

export interface EdgeProcessingResult {
  processedEdgeData: ImageData;
  processingStats: {
    originalEdgeCount: number;
    processedEdgeCount: number;
    removedShortEdges: number;
    connectedEdges: number;
  };
}