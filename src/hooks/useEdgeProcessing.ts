import { useCallback } from 'react';
import { EdgeProcessingSettings, EdgeProcessingResult } from '../types/EdgeProcessingTypes';

export const useEdgeProcessing = () => {
  
  // エッジ細線化処理
  const thinEdges = useCallback((imageData: ImageData): ImageData => {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    result.data.set(data);

    // Zhang-Suen アルゴリズムによる細線化
    let changed = true;
    const iterations = [];

    while (changed && iterations.length < 100) { // 無限ループ防止
      changed = false;
      const toRemove: number[] = [];

      // Pass 1: 条件チェック
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // エッジピクセルかチェック
          if (result.data[idx] === 0) continue; // 白ピクセルのみ処理
          
          // 8近傍の値を取得
          const neighbors = [
            (result.data[((y-1) * width + x) * 4] ?? 0) > 0 ? 1 : 0,     // N
            (result.data[((y-1) * width + x+1) * 4] ?? 0) > 0 ? 1 : 0,   // NE
            (result.data[(y * width + x+1) * 4] ?? 0) > 0 ? 1 : 0,       // E
            (result.data[((y+1) * width + x+1) * 4] ?? 0) > 0 ? 1 : 0,   // SE
            (result.data[((y+1) * width + x) * 4] ?? 0) > 0 ? 1 : 0,     // S
            (result.data[((y+1) * width + x-1) * 4] ?? 0) > 0 ? 1 : 0,   // SW
            (result.data[(y * width + x-1) * 4] ?? 0) > 0 ? 1 : 0,       // W
            (result.data[((y-1) * width + x-1) * 4] ?? 0) > 0 ? 1 : 0,   // NW
          ];

          // Zhang-Suen条件チェック
          const blackNeighbors = neighbors.reduce((sum, val) => sum + val, 0);
          if (blackNeighbors < 2 || blackNeighbors > 6) continue;

          let transitions = 0;
          for (let i = 0; i < 8; i++) {
            if (neighbors[i] === 0 && neighbors[(i + 1) % 8] === 1) {
              transitions++;
            }
          }
          if (transitions !== 1) continue;

          // Pass 1 specific conditions
          if ((neighbors[0]! * neighbors[2]! * neighbors[4]!) !== 0) continue;
          if ((neighbors[2]! * neighbors[4]! * neighbors[6]!) !== 0) continue;

          toRemove.push(idx);
        }
      }

      // ピクセル削除
      toRemove.forEach(idx => {
        result.data[idx] = 0;
        result.data[idx + 1] = 0;
        result.data[idx + 2] = 0;
        changed = true;
      });

      iterations.push(toRemove.length);
    }

    return result;
  }, []);

  // 短いエッジ除去
  const removeShortEdges = useCallback((
    imageData: ImageData, 
    threshold: number
  ): { result: ImageData; removedCount: number } => {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    result.data.set(data);
    
    const visited = new Array(width * height).fill(false);
    let removedCount = 0;

    const getNeighbors = (x: number, y: number): [number, number][] => {
      const neighbors: [number, number][] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            neighbors.push([nx, ny]);
          }
        }
      }
      return neighbors;
    };

    const dfs = (startX: number, startY: number): number => {
      const stack: [number, number][] = [[startX, startY]];
      const component: [number, number][] = [];
      
      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = y * width + x;
        
        if (visited[idx]) continue;
        visited[idx] = true;
        
        const pixelIdx = idx * 4;
        if ((result.data[pixelIdx] ?? 0) === 0) continue; // 白ピクセルでない
        
        component.push([x, y]);
        
        for (const [nx, ny] of getNeighbors(x, y)) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            stack.push([nx, ny]);
          }
        }
      }
      
      return component.length;
    };

    // 連結成分を見つけて短いものを削除
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        
        const pixelIdx = idx * 4;
        if ((result.data[pixelIdx] ?? 0) === 0) continue;
        
        const componentSize = dfs(x, y);
        if (componentSize < threshold) {
          // この連結成分を削除
          const stack: [number, number][] = [[x, y]];
          const toRemove = new Set<number>();
          
          while (stack.length > 0) {
            const [cx, cy] = stack.pop()!;
            const cIdx = cy * width + cx;
            if (toRemove.has(cIdx)) continue;
            
            const cPixelIdx = cIdx * 4;
            if ((result.data[cPixelIdx] ?? 0) === 0) continue;
            
            toRemove.add(cIdx);
            
            for (const [nx, ny] of getNeighbors(cx, cy)) {
              const nIdx = ny * width + nx;
              const nPixelIdx = nIdx * 4;
              if ((result.data[nPixelIdx] ?? 0) > 0 && !toRemove.has(nIdx)) {
                stack.push([nx, ny]);
              }
            }
          }
          
          toRemove.forEach(removeIdx => {
            const removePixelIdx = removeIdx * 4;
            result.data[removePixelIdx] = 0;
            result.data[removePixelIdx + 1] = 0;
            result.data[removePixelIdx + 2] = 0;
          });
          
          removedCount += toRemove.size;
        }
      }
    }

    return { result, removedCount };
  }, []);

  // エッジ連結処理
  const connectEdges = useCallback((
    imageData: ImageData, 
    maxDistance: number
  ): { result: ImageData; connectedCount: number } => {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    result.data.set(data);
    
    let connectedCount = 0;
    const endpoints: [number, number][] = [];

    // エンドポイント検出
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if ((result.data[idx] ?? 0) === 0) continue;

        let neighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if ((result.data[nIdx] ?? 0) > 0) neighborCount++;
          }
        }
        
        if (neighborCount === 1) {
          endpoints.push([x, y]);
        }
      }
    }

    // エンドポイント間の距離計算と連結
    for (let i = 0; i < endpoints.length; i++) {
      for (let j = i + 1; j < endpoints.length; j++) {
        const [x1, y1] = endpoints[i]!;
        const [x2, y2] = endpoints[j]!;
        
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (distance <= maxDistance) {
          // Bresenhamアルゴリズムで線を描画
          const dx = Math.abs(x2 - x1);
          const dy = Math.abs(y2 - y1);
          const sx = x1 < x2 ? 1 : -1;
          const sy = y1 < y2 ? 1 : -1;
          let err = dx - dy;
          
          let x = x1, y = y1;
          while (true) {
            const idx = (y * width + x) * 4;
            result.data[idx] = 255;
            result.data[idx + 1] = 255;
            result.data[idx + 2] = 255;
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
              err -= dy;
              x += sx;
            }
            if (e2 < dx) {
              err += dx;
              y += sy;
            }
          }
          connectedCount++;
        }
      }
    }

    return { result, connectedCount };
  }, []);

  const processEdges = useCallback((
    edgeData: ImageData,
    settings: EdgeProcessingSettings
  ): EdgeProcessingResult => {
    let result = edgeData;
    let removedShortEdges = 0;
    let connectedEdges = 0;
    
    const originalEdgeCount = countEdgePixels(edgeData);

    // エッジ細線化
    if (settings.enableThinning) {
      result = thinEdges(result);
    }

    // 短いエッジ除去
    if (settings.enableShortEdgeRemoval) {
      const removeResult = removeShortEdges(result, settings.shortEdgeThreshold);
      result = removeResult.result;
      removedShortEdges = removeResult.removedCount;
    }

    // エッジ連結
    if (settings.enableEdgeConnection) {
      const connectResult = connectEdges(result, settings.connectionDistance);
      result = connectResult.result;
      connectedEdges = connectResult.connectedCount;
    }

    const processedEdgeCount = countEdgePixels(result);

    return {
      processedEdgeData: result,
      processingStats: {
        originalEdgeCount,
        processedEdgeCount,
        removedShortEdges,
        connectedEdges,
      },
    };
  }, [thinEdges, removeShortEdges, connectEdges]);

  return {
    processEdges,
    thinEdges,
    removeShortEdges,
    connectEdges,
  };
};

// ヘルパー関数
function countEdgePixels(imageData: ImageData): number {
  let count = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if ((imageData.data[i] ?? 0) > 0) count++;
  }
  return count;
}